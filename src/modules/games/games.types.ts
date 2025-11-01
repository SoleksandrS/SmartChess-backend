import { Game } from './entities/game.entity';

export interface IGameCountMoves extends Omit<Game, 'moves'> {
  moves: number;
}

export type TGameCheckAITurn = Pick<Game, 'turn' | 'whitePlayerId' | 'blackPlayerId'>
