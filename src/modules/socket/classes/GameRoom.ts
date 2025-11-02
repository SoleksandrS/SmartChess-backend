import { Socket } from 'socket.io';
import { ESocketEvent } from '../socket.types';
import { Game } from 'src/modules/games/entities/game.entity';

export class GameRoom {
  id: string;
  white: number | null = null;
  black: number | null = null;
  whiteSockets: Socket[] = [];
  blackSockets: Socket[] = [];

  constructor({ id, whitePlayerId, blackPlayerId }: Game) {
    this.id = id;
    this.white = whitePlayerId;
    this.black = blackPlayerId;
  }

  addPlayer(id: number, socket: Socket) {
    if (this.white === id) this.whiteSockets.push(socket);
    else if (this.black === id) this.blackSockets.push(socket);
  }

  removePlayer(socket: Socket) {
    this.whiteSockets = this.whiteSockets.filter((obj) => obj.id !== socket.id);
    this.blackSockets = this.blackSockets.filter((obj) => obj.id !== socket.id);
  }

  broadcast<T>(event: ESocketEvent, data: T) {
    const sockets = [...this.whiteSockets, ...this.blackSockets];
    sockets.forEach((socket) => socket.emit(event, data));
  }

  sendToOpponent<T>(sender: Socket, event: ESocketEvent, data: T) {
    const isWhite = this.whiteSockets.map(({ id }) => id).includes(sender.id);
    const isBlack = this.blackSockets.map(({ id }) => id).includes(sender.id);

    if (isWhite)
      this.blackSockets.forEach((socket) => socket.emit(event, data));
    else if (isBlack)
      this.whiteSockets.forEach((socket) => socket.emit(event, data));
  }

  get isEmpty() {
    return !this.whiteSockets.length && !this.blackSockets.length;
  }
}
