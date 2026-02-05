import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameAnalysis } from './entities/game-analysis.entity';
import { GameAnalysisService } from './game-analysis.service';
import { GameAnalysisController } from './game-analysis.controller';
import { ChessEngineModule } from 'src/shared/chess-engine/chess-engine.module';
import { UsersModule } from '../users/users.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameAnalysis]),
    ChessEngineModule,
    UsersModule,
    forwardRef(() => SocketModule),
  ],
  controllers: [GameAnalysisController],
  providers: [GameAnalysisService],
  exports: [GameAnalysisService],
})
export class GameAnalysisModule {}
