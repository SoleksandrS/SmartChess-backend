import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import axios from 'axios';
import { regexBestMove, StockfishAnalysis } from './chess-engine.types';

@Injectable()
export class ChessEngineService {
  constructor() {}

  makeMove(gameFen: string, move: string) {
    const chess = new Chess(gameFen);
    const result = chess.move(move);
    if (!result) throw new Error('Invalid move');
    return chess.fen();
  }

  checkGameStatus(gameFen: string) {
    const chess = new Chess(gameFen);
    if (chess.isCheckmate()) return 'checkmate';
    if (chess.isDraw()) return 'draw';
    return null;
  }

  async getBestMove(gameFen: string) {
    const url = `https://stockfish.online/api/s/v2.php?fen=${gameFen}&depth=15`;
    const { data } = await axios.get<StockfishAnalysis>(url);
    const [_, bestmove, ponder] = data.bestmove.match(regexBestMove);

    return bestmove;
  }
}
