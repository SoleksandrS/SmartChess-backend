import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameAnalysis } from './entities/game-analysis.entity';
import { GameAnalysisService } from './game-analysis.service';
import { GameAnalysisController } from './game-analysis.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameAnalysis]), UsersModule],
  controllers: [GameAnalysisController],
  providers: [GameAnalysisService],
  exports: [GameAnalysisService],
})
export class GameAnalysisModule {}
