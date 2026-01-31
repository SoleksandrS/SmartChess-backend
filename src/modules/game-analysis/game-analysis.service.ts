import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { GameAnalysis } from './entities/game-analysis.entity';
import { Game } from '../games/entities/game.entity';
import { TShortGameMove } from '../games/entities/game-move.entity';
import { EChessSide } from 'src/types/chess.types';
import { ChessEngineService } from 'src/shared/chess-engine/chess-engine.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class GameAnalysisService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(GameAnalysis)
    private analysisRepo: Repository<GameAnalysis>,
    @Inject(ChessEngineService)
    private chessEngineService: ChessEngineService,
    @Inject(UsersService)
    private usersService: UsersService,
  ) {}

  async findOne(id: string, email: string) {
    if (!isUUID(id))
      throw new HttpException('Invalid UUID format', HttpStatus.BAD_REQUEST);

    try {
      const user = await this.usersService.findWithWhere({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const entity = await this.analysisRepo
        .createQueryBuilder('analysis')
        .leftJoin('analysis.game', 'game')
        .where('game.id = :id', { id })
        .andWhere(
          '(game.whitePlayerId = :userId OR game.blackPlayerId = :userId)',
          { userId: user.id },
        )
        .getOne();
      if (!entity?.analysis)
        throw new HttpException(
          'Game analysis not found',
          HttpStatus.NOT_FOUND,
        );

      return entity.analysis;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async analyzeGame(game: Game) {
    try {
      const sides: EChessSide[] = [];
      if (game.whitePlayerId) sides.push(EChessSide.WHITE);
      if (game.blackPlayerId) sides.push(EChessSide.BLACK);
      if (!sides.length) return;

      const moves = game.moves.map((obj) =>
        _.pick(obj, ['side', 'number', 'move']),
      );
      for (const side of sides) {
        await this.generateAnalysis(game.id, side, moves);
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateAnalysis(
    gameId: string,
    side: EChessSide,
    moves: TShortGameMove[],
  ) {
    try {
      const result = await this.analysisRepo.findOneBy({ gameId, side });
      if (result)
        throw new HttpException(
          `Game analysis was already generated for "${side}" player in game "${gameId}"`,
          HttpStatus.CONFLICT,
        );

      const analysis = await this.chessEngineService.getAnalysis(side, moves);
      await this.analysisRepo.save({ gameId, side, analysis });
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
