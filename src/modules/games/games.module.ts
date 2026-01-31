import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { EQueue } from 'src/core/enums';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GameQueue } from 'src/queues/game.queue';
import { ChessEngineModule } from 'src/shared/chess-engine/chess-engine.module';
import { GameAnalysisModule } from '../game-analysis/game-analysis.module';
import { UsersModule } from '../users/users.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GameMove]),
    BullModule.registerQueue({ name: EQueue.GAME }),
    ChessEngineModule,
    GameAnalysisModule,
    UsersModule,
    forwardRef(() => SocketModule),
  ],
  controllers: [GamesController],
  providers: [GamesService, GameQueue],
  exports: [GamesService],
})
export class GamesModule {}
