import { Module } from '@nestjs/common';
import { ChessEngineService } from './chess-engine.service';
import { GoogleGenaiModule } from '../google-genai/google-genai.module';

@Module({
  imports: [GoogleGenaiModule],
  providers: [ChessEngineService],
  exports: [ChessEngineService],
})
export class ChessEngineModule {}
