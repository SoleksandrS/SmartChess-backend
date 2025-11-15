import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Game } from './entities/game.entity';
import { GameMove } from './entities/game-move.entity';
import { EQueue } from 'src/core/enums';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GameAIMoveQueue } from 'src/queues/game-ai-move.queue';
import { ChessEngineModule } from 'src/shared/chess-engine/chess-engine.module';
import { UsersModule } from '../users/users.module';
import { SocketModule } from '../socket/socket.module';
import { GoogleGenaiModule } from 'src/shared/google-genai/google-genai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GameMove]),
    BullModule.registerQueue({ name: EQueue.GAME_AI_MOVE }),
    ChessEngineModule,
    GoogleGenaiModule,
    UsersModule,
    forwardRef(() => SocketModule),
  ],
  controllers: [GamesController],
  providers: [GamesService, GameAIMoveQueue],
  exports: [GamesService],
})
export class GamesModule {}
