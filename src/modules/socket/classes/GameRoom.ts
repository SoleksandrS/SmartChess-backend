import { Socket } from 'socket.io';
import { EChessSide } from 'src/types/chess.types';
import { ESocketEvent } from '../socket.types';

export class GameRoom {
  id: string;
  white: Socket[] = [];
  black: Socket[] = [];

  constructor(id: string) {
    this.id = id;
  }

  addPlayer(side: EChessSide, socket: Socket) {
    if (side === EChessSide.WHITE) this.white.push(socket);
    else this.black.push(socket);
  }

  removePlayer(socket: Socket) {
    this.white = this.white.filter((obj) => obj.id !== socket.id);
    this.black = this.black.filter((obj) => obj.id !== socket.id);
  }

  broadcast<T>(event: ESocketEvent, data: T) {
    const sockets = [...this.white, ...this.black];
    sockets.forEach((socket) => socket.emit(event, data));
  }

  sendToOpponent<T>(sender: Socket, event: ESocketEvent, data: T) {
    const isWhite = this.white.map(({ id }) => id).includes(sender.id);
    const isBlack = this.black.map(({ id }) => id).includes(sender.id);

    if (isWhite) this.black.forEach((socket) => socket.emit(event, data));
    else if (isBlack) this.white.forEach((socket) => socket.emit(event, data));
  }

  get isEmpty() {
    return !this.white.length && !this.black.length;
  }
}
