import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { ChessEngineModule } from 'src/shared/chess-engine/chess-engine.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GameMove]),
    ChessEngineModule,
    UsersModule,
  ],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
