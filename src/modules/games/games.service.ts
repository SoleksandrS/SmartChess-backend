import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { constants } from 'src/config';
import { EGameSide } from 'src/types/chess.types';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GamesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Game)
    private gameRepo: Repository<Game>,
    @InjectRepository(GameMove)
    private moveRepo: Repository<GameMove>,
  ) {}

  private getInitBody<T>(body: T) {
    return { ...body, fen: constants.chess.initFen, turn: EGameSide.WHITE };
  }

  async findOne(id: number) {
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
      const res = await this.gameRepo.insert(this.getInitBody(body));
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async makeMove(id: number, turn: EGameSide, move: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const params = { where: { id }, relations: ['moves'] };
      const game = await qr.manager.findOne(Game, params);
      if (!game)
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);

      const fen = game.fen;
      const nextTurn =
        turn === EGameSide.WHITE ? EGameSide.BLACK : EGameSide.WHITE;

      const body1 = { fen, turn: nextTurn };
      await qr.manager.update(Game, id, body1);

      const moveNumber = game.moves.length + 1;
      const body2 = { gameId: game.id, moveNumber, turn, move };
      const entity = this.moveRepo.create(body2);
      await qr.manager.save(entity);

      await qr.commitTransaction();

      return true;
    } catch (err) {
      await qr.rollbackTransaction();
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await qr.release();
    }
  }

  async delete(id: number) {
    try {
      const res = await this.gameRepo.softDelete(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restore(id: number) {
    try {
      const res = await this.gameRepo.restore(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
