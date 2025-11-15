import { Module } from '@nestjs/common';
import { GoogleGenaiService } from './google-genai.service';

@Module({
  providers: [GoogleGenaiService],
  exports: [GoogleGenaiService],
})
export class GoogleGenaiModule {}
