import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Game, GameMove])],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
