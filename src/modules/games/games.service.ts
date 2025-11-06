import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { constants } from 'src/config';
import { EChessSide } from 'src/types/chess.types';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { ChessEngineService } from 'src/shared/chess-engine/chess-engine.service';
import { UsersService } from '../users/users.service';
import { SocketService } from '../socket/socket.service';
import { CreateGameDto } from './dto/create-game.dto';
import { TGameCheckAITurn } from './games.types';

@Injectable()
export class GamesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Game)
    private gameRepo: Repository<Game>,
    @InjectRepository(GameMove)
    private moveRepo: Repository<GameMove>,
    @Inject(ChessEngineService)
    private chessEngineService: ChessEngineService,
    @Inject(UsersService)
    private usersService: UsersService,
    @Inject(forwardRef(() => SocketService))
    private socketService: SocketService,
  ) {}

  private getInitBody<T>(body: T) {
    return { ...body, fen: constants.chess.initFen };
  }

  private switchSide(side: EChessSide) {
    return side === EChessSide.WHITE ? EChessSide.BLACK : EChessSide.WHITE;
  }

  private checkIsAITurn({
    turn,
    whitePlayerId,
    blackPlayerId,
  }: TGameCheckAITurn) {
    if (turn === EChessSide.WHITE && !whitePlayerId) return true;
    if (turn === EChessSide.BLACK && !blackPlayerId) return true;
    return false;
  }

  private async getPlayer(id: number) {
    const player = await this.usersService.findWithWhere({ id });
    if (!player)
      throw new HttpException('Player not found', HttpStatus.NOT_FOUND);
    return player;
  }

  async findMy(email: string) {
    try {
      const user = await this.usersService.findWithWhere({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const games = await this.gameRepo
        .createQueryBuilder('game')
        .select([
          'game.id',
          'game.moveNumber',
          'game.turn',
          'game.result',
          'game.whitePlayerId',
          'game.blackPlayerId',
          'game.createdAt',
        ])
        .leftJoin(
          'game.whitePlayer',
          'whitePlayer',
          'game.whitePlayerId IS NOT NULL',
        )
        .addSelect(['whitePlayer.username'])
        .leftJoin(
          'game.blackPlayer',
          'blackPlayer',
          'game.blackPlayerId IS NOT NULL',
        )
        .addSelect(['blackPlayer.username'])
        .where(
          '(game.whitePlayerId = :userId OR game.blackPlayerId = :userId)',
          { userId: user.id },
        )
        .getMany();

      return games;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  findOneSimple(id: string) {
    return this.gameRepo
      .createQueryBuilder('game')
      .select(['game.id', 'game.whitePlayerId', 'game.blackPlayerId'])
      .where('game.id = :id', { id })
      .getOne();
  }

  async findOne(id: string, email: string) {
    if (!isUUID(id))
      throw new HttpException('Invalid UUID format', HttpStatus.BAD_REQUEST);

    try {
      const user = await this.usersService.findWithWhere({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const game = await this.gameRepo
        .createQueryBuilder('game')
        .leftJoin('game.moves', 'move')
        .addSelect(['move.number', 'move.side', 'move.move', 'move.fenAfter'])
        .leftJoin(
          'game.whitePlayer',
          'whitePlayer',
          'game.whitePlayerId IS NOT NULL',
        )
        .addSelect(['whitePlayer.username'])
        .leftJoin(
          'game.blackPlayer',
          'blackPlayer',
          'game.blackPlayerId IS NOT NULL',
        )
        .addSelect(['blackPlayer.username'])
        .where('game.id = :id', { id })
        .andWhere(
          '(game.whitePlayerId = :userId OR game.blackPlayerId = :userId)',
          { userId: user.id },
        )
        .addOrderBy('move.number', 'DESC')
        .addOrderBy('move.side', 'DESC')
        .getOne();
      if (!game)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);

      return game;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(body: CreateGameDto) {
    try {
      if (!body.whitePlayerId && !body.blackPlayerId) {
        const msg = 'Game cannot be created without any player';
        throw new HttpException(msg, HttpStatus.CONFLICT);
      }
      if (body.whitePlayerId) await this.getPlayer(body.whitePlayerId);
      if (body.blackPlayerId) await this.getPlayer(body.blackPlayerId);

      const res = await this.gameRepo.save(this.getInitBody(body));
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async complexMakeMove(id: string, move: string, email: string) {
    if (!isUUID(id))
      throw new HttpException('Invalid UUID format', HttpStatus.BAD_REQUEST);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const user = await this.usersService.findWithWhere({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      let game = await this.gameRepo.findOneBy({ id });
      if (!game)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      if (game.whitePlayerId !== user.id && game.blackPlayerId !== user.id)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);

      const moves: GameMove[] = [];

      const res1 = await this.makeMove(game, move, qr);
      game = { ...game, ...res1.values };
      moves.unshift(res1.move);

      const isAIMove = this.checkIsAITurn(game);
      if (isAIMove && !game.result) {
        const res2 = await this.makeAIMove(game, qr);
        game = { ...game, ...res2.values };
        moves.unshift(res2.move);
      }

      await qr.commitTransaction();

      const body = {
        values: {
          fen: game.fen,
          moveNumber: game.moveNumber,
          turn: game.turn,
          result: game.result,
        },
        moves: moves.map((obj) => ({
          number: obj.number,
          side: obj.side,
          move: obj.move,
          fenAfter: obj.fenAfter,
        })),
      };

      this.socketService.sendGameUpdate(id, body);

      return true;
    } catch (err) {
      await qr.rollbackTransaction();
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await qr.release();
    }
  }

  async makeAIMove(game: Game, qr: QueryRunner) {
    const move = await this.chessEngineService.getBestMove(game.fen);
    return this.makeMove(game, move, qr);
  }

  async makeMove(game: Game, move: string, qr: QueryRunner) {
    const fen = this.chessEngineService.makeMove(game.fen, move);
    const result = this.chessEngineService.checkGameStatus(fen);

    const turn = !result ? this.switchSide(game.turn) : game.turn;
    let moveNumber = game.moveNumber;
    if (turn === EChessSide.WHITE && game.turn === EChessSide.BLACK)
      moveNumber += 1;

    const body1 = { fen, moveNumber, turn, result };
    await qr.manager.update(Game, game.id, body1);

    const body2 = {
      gameId: game.id,
      number: game.moveNumber,
      side: game.turn,
      move,
      fenAfter: fen,
    };
    const entity = this.moveRepo.create(body2);
    await qr.manager.save(entity);

    return { values: { fen, moveNumber, turn, result }, move: entity };
  }

  async delete(id: string) {
    if (!isUUID(id))
      throw new HttpException('Invalid UUID format', HttpStatus.BAD_REQUEST);

    try {
      const res = await this.gameRepo.softDelete(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restore(id: string) {
    if (!isUUID(id))
      throw new HttpException('Invalid UUID format', HttpStatus.BAD_REQUEST);

    try {
      const res = await this.gameRepo.restore(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
