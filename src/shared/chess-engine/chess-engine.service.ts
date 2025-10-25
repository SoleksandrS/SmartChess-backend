import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';

@Injectable()
export class ChessEngineService {
  constructor() {}

  makeMove(fen: string, move: string) {
    const chess = new Chess(fen);
    const result = chess.move(move);
    if (!result) throw new Error('Invalid move');
    return chess.fen();
  }
}
