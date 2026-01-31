import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { GameAnalysis } from './entities/game-analysis.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class GameAnalysisService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(GameAnalysis)
    private analysisRepo: Repository<GameAnalysis>,
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

      const analysis = await this.analysisRepo
        .createQueryBuilder('analysis')
        .leftJoin('analysis.game', 'game')
        .where('game.id = :id', { id })
        .andWhere(
          '(game.whitePlayerId = :userId OR game.blackPlayerId = :userId)',
          { userId: user.id },
        )
        .getOne();
      if (!analysis)
        throw new HttpException(
          'Game analysis not found',
          HttpStatus.NOT_FOUND,
        );

      return analysis;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
