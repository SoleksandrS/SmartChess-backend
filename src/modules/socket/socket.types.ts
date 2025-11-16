import { Socket } from 'socket.io';

export enum ESocketEvent {
  MAIN_CONNECT = 'main-connect',
  DISCONNECT = 'disconnect',
  GAME_JOIN = 'game:join',
  GAME_UPDATE = 'game:update',
  MATCHMAKING_JOIN = 'matchmaking:join',
  MATCHMAKING_LEAVE = 'matchmaking:leave',
  MATCHMAKING_DONE = 'matchmaking:done',
}

export interface IPlayerData {
  id: number;
  socket: Socket;
}

export interface IPairPlayers {
  p1: IPlayerData;
  p2: IPlayerData;
}
