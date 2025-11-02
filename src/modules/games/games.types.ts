import { Game } from './entities/game.entity';

export type TGameCheckAITurn = Pick<Game, 'turn' | 'whitePlayerId' | 'blackPlayerId'>
