import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { constants } from 'src/config';
import { EGameSide } from 'src/types/chess.types';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { ChessEngineService } from 'src/shared/chess-engine/chess-engine.service';
import { UsersService } from '../users/users.service';
import { CreateGameDto } from './dto/create-game.dto';
import { IGameCountMoves, TGameCheckAITurn } from './games.types';

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
  ) {}

  private getInitBody<T>(body: T) {
    return { ...body, fen: constants.chess.initFen, turn: EGameSide.WHITE };
  }

  private switchSide(side: EGameSide) {
    return side === EGameSide.WHITE ? EGameSide.BLACK : EGameSide.WHITE;
  }

  private checkIsAITurn({
    turn,
    whitePlayerId,
    blackPlayerId,
  }: TGameCheckAITurn) {
    if (turn === EGameSide.WHITE && !whitePlayerId) return true;
    if (turn === EGameSide.BLACK && !blackPlayerId) return true;
    return false;
  }

  private async getPlayer(id: number) {
    const player = await this.usersService.findWithWhere({ id });
    if (!player)
      throw new HttpException('Player not found', HttpStatus.NOT_FOUND);
    return player;
  }

  private async getGameCountMoves(id: string): Promise<IGameCountMoves> {
    const params = { where: { id }, relations: ['moves'] };
    const game = await this.gameRepo.findOne(params);
    if (!game) throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    return { ...game, moves: game.moves.length };
  }

  async findOne(id: string) {
    try {
      const res = await this.gameRepo.findOneBy({ id });
      return res;
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

      const res = await this.gameRepo.insert(this.getInitBody(body));
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async complexMakeMove(id: string, move: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      let game = await this.getGameCountMoves(id);

      const res1 = await this.makeMove(game, move, qr);
      game = { ...game, ...res1 };

      const isAIMove = this.checkIsAITurn(game);
      if (isAIMove && !game.result) {
        const res2 = await this.makeAIMove(game, qr);
        game = { ...game, ...res2 };
      }

      await qr.commitTransaction();

      return { fen: game.fen, turn: game.turn, result: game.result };
    } catch (err) {
      await qr.rollbackTransaction();
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await qr.release();
    }
  }

  async makeAIMove(game: IGameCountMoves, qr: QueryRunner) {
    const move = await this.chessEngineService.getBestMove(game.fen);
    return this.makeMove(game, move, qr);
  }

  async makeMove(game: IGameCountMoves, move: string, qr: QueryRunner) {
    const fen = this.chessEngineService.makeMove(game.fen, move);
    const result = this.chessEngineService.checkGameStatus(fen);

    const turn = !result ? this.switchSide(game.turn as EGameSide) : game.turn;
    const body1 = { fen, turn, result };
    await qr.manager.update(Game, game.id, body1);

    const moveNumber = game.moves + 1;
    const body2 = { gameId: game.id, moveNumber, turn: game.turn, move };
    const entity = this.moveRepo.create(body2);
    await qr.manager.save(entity);

    return { fen, turn, result, moves: moveNumber };
  }

  async delete(id: string) {
    try {
      const res = await this.gameRepo.softDelete(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restore(id: string) {
    try {
      const res = await this.gameRepo.restore(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
