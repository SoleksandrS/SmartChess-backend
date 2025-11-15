import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { envs } from 'src/config';

@Injectable()
export class GoogleGenaiService implements OnModuleInit {
  private ai: GoogleGenAI;

  constructor() {}

  onModuleInit() {
    this.ai = new GoogleGenAI({ apiKey: envs.genai.apiKey });
  }

  async sendRequest(prompt: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  }
}
