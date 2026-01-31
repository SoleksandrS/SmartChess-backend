import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as _ from 'lodash';
import { constants } from 'src/config';
import { EQueue } from 'src/core/enums';
import { queueCommands } from 'src/core/queues.config';
import { EChessResult, EChessSide } from 'src/types/chess.types';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { ChessEngineService } from 'src/shared/chess-engine/chess-engine.service';
import { UsersService } from '../users/users.service';
import { GameSocketService } from '../socket/services/game-socket.service';
import { EPageGamesStatus, GetMyGamesDto } from './dto/get-my-games.dto';
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
    @InjectQueue(EQueue.GAME)
    private readonly gameQueue: Queue,
    @Inject(ChessEngineService)
    private chessEngineService: ChessEngineService,
    @Inject(UsersService)
    private usersService: UsersService,
    @Inject(forwardRef(() => GameSocketService))
    private gameSocketService: GameSocketService,
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

  async findMy(query: GetMyGamesDto, email: string) {
    const { page, limit, status } = query;

    try {
      const user = await this.usersService.findWithWhere({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const qb = this.gameRepo
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
        );

      switch (status) {
        case EPageGamesStatus.ACTIVE:
          qb.andWhere(`game.result IS NULL`);
          break;
        case EPageGamesStatus.DRAW:
          qb.andWhere(`game.result = :result`, { result: EChessResult.DRAW });
          break;
        case EPageGamesStatus.WIN:
          qb.andWhere(
            `(game.whitePlayerId = :userId AND game.turn = '${EChessSide.WHITE}' AND game.result = :result) OR (game.blackPlayerId = :userId AND game.turn = '${EChessSide.BLACK}' AND game.result = :result)`,
            { userId: user.id, result: EChessResult.CHECKMATE },
          );
          break;
        case EPageGamesStatus.LOSE:
          qb.andWhere(
            `(game.whitePlayerId = :userId AND game.turn = '${EChessSide.BLACK}' AND game.result = :result) OR (game.blackPlayerId = :userId AND game.turn = '${EChessSide.WHITE}' AND game.result = :result)`,
            { userId: user.id, result: EChessResult.CHECKMATE },
          );
          break;
      }

      qb.skip((page - 1) * limit).take(limit);

      const [data, total] = await qb.getManyAndCount();
      const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
      return { data, meta };
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

  async getAdvice(id: string, email: string) {
    if (!isUUID(id))
      throw new HttpException('Invalid UUID format', HttpStatus.BAD_REQUEST);

    try {
      const user = await this.usersService.findWithWhere({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      let game = await this.gameRepo.findOneBy({ id });
      if (!game)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      if (game.whitePlayerId !== user.id && game.blackPlayerId !== user.id)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);

      const result = await this.chessEngineService.getAdvice(game.fen);

      return result;
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

    try {
      const user = await this.usersService.findWithWhere({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      let game = await this.gameRepo.findOneBy({ id });
      if (!game)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      if (game.whitePlayerId !== user.id && game.blackPlayerId !== user.id)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);

      const res1 = await this.makeMove(game, move);
      game = { ...game, ...res1.values };

      const isAIMove = this.checkIsAITurn(game);
      if (isAIMove && !game.result) {
        this.gameQueue.add(queueCommands[EQueue.GAME].makeAIMove, {
          gameId: game.id,
        });
      }

      return true;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async makeAIMove(id: string) {
    let game = await this.gameRepo.findOneBy({ id });
    if (!game) throw new HttpException('Game not found', HttpStatus.NOT_FOUND);

    const isAIMove = this.checkIsAITurn(game);
    if (!isAIMove || game.result)
      throw new HttpException('It`s not AI`s turn now', HttpStatus.CONFLICT);

    const move = await this.chessEngineService.getBestMove(game.fen);
    await this.makeMove(game, move);
  }

  async makeMove(game: Game, move: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
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

      await qr.commitTransaction();

      if (result) {
        this.gameQueue.add(queueCommands[EQueue.GAME].analyze, {
          gameId: game.id,
        });
      }

      const body = {
        values: { fen, moveNumber, turn, result },
        move: _.pick(entity, ['number', 'side', 'move', 'fenAfter']),
      };
      this.gameSocketService.update(game.id, body);

      return body;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
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
