export interface StockfishAnalysis {
  success: boolean;
  evaluation: number | null;   // centipawn evaluation, can be null if mate is found
  mate: number | null;         // number of moves to mate, null if no mate
  bestmove: string;            // e.g., "bestmove b7b6 ponder f3e5"
  continuation: string;        // long sequence of moves as string
}

export const regexBestMove = /^bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/;

export enum EChessResult {
  DRAW = 'draw',
  CHECKMATE = 'checkmate',
}
