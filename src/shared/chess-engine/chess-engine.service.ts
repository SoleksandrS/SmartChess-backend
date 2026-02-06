import { Inject, Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import { GoogleGenaiService } from '../google-genai/google-genai.service';
import { EChessResult, EChessSide } from 'src/types/chess.types';
import { TShortGameMove } from 'src/modules/games/entities/game-move.entity';
import { apiStockfish } from 'src/api/stockfish.api';

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

  async getBestMove(fen: string) {
    const path = `/chess/bestmove?fen=${fen}`;
    const { data } = await apiStockfish.get<string>(path);
    return data;
  }

  async getAdvice(fen: string) {
    const move = await this.getBestMove(fen);
    if (!move) throw new Error('Something went wrong while compute best move');

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

  async getAnalysis(side: EChessSide, moves: TShortGameMove[]) {
    const prompt = `
      You are an AI chess assistant. Analyze the following chess game from the perspective of the given side.

      Side to analyze: ${side}  // "w" - white or "b" - black

      Moves:
      Each move is represented as (side, moveNumber, move). Example: { side: 'w', number: 10, move: 'g1f3' }

      Move list:
      ${moves}

      Task:
      - Analyze the game **from the perspective of the given side**, using **second-person language**.
      - Refer to the analyzed player as **"you"** and the other player as **"your opponent"**.
      - Clearly describe:
        - Your strongest demonstrated skills (e.g. opening understanding, tactical awareness, positional play, endgame technique).
        - Your weakest areas or recurring mistakes, supported by examples from the game.
      - Base all conclusions strictly on the moves played.
      - Do NOT restate the move list.
      - Do NOT mention colors (White/Black) in the analysis.
      - Do NOT mention that you are an AI model.

      Conclusion:
      - End the analysis with **one short sentence** giving practical advice on how the given side can improve their game.

      Style:
      - 1 short paragraph for strengths
      - 1 short paragraph for weaknesses
      - 1 final advice sentence
      - Instructional, personal, and constructive tone
      - No emojis, no bullet points

      Return only the analysis text.`;

    const analysis = await this.googleGenaiService.sendRequest(prompt);

    return analysis;
  }
}
