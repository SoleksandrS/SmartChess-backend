import { Inject, Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import axios from 'axios';
import { GoogleGenaiService } from '../google-genai/google-genai.service';
import { EChessResult } from 'src/types/chess.types';
import { regexBestMove, StockfishAnalysis } from './chess-engine.types';

@Injectable()
export class ChessEngineService {
  constructor(
    @Inject(GoogleGenaiService)
    private readonly googleGenaiService: GoogleGenaiService,
  ) {}

  makeMove(gameFen: string, move: string) {
    const chess = new Chess(gameFen);
    const result = chess.move(move);
    if (!result) throw new Error('Invalid move');
    return chess.fen();
  }

  checkGameStatus(gameFen: string) {
    const chess = new Chess(gameFen);
    if (chess.isCheckmate()) return EChessResult.CHECKMATE;
    if (chess.isDraw()) return EChessResult.DRAW;
    return null;
  }

  async getBestMove(gameFen: string) {
    const url = `https://stockfish.online/api/s/v2.php?fen=${gameFen}&depth=15`;
    const { data } = await axios.get<StockfishAnalysis>(url);
    const [_, bestmove, ponder] = data.bestmove.match(regexBestMove);

    return bestmove;
  }

  async getAdvice(fen: string) {
    const move = await this.getBestMove(fen);

    const prompt = `
      You are an AI chess assistant. Analyze the given chess position and the selected move.

      Position (FEN): ${fen}
      Move: ${move}

      Task:
      - Explain in 1–2 concise sentences why this move is strategically or tactically useful.
      - The explanation must start **exactly** with: "This move ...".
      - Do NOT mention that you are an AI model.
      - Focus only on chess reasoning (e.g., improving activity, creating threats, defending, gaining tempo, etc.).

      Return only the explanation sentence(s).`;
    const reason = await this.googleGenaiService.sendRequest(prompt);

    return { move, reason };
  }
}
