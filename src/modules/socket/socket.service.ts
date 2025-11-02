import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ESocketEvent } from './socket.types';

@Injectable()
export class SocketService {
  private static connectedClients: Map<number, Socket[]> = new Map();

  addSocketToList(id: number, socket: Socket): void {
    const sockets = SocketService.connectedClients.get(id);
    SocketService.connectedClients.set(id, [...(sockets || []), socket]);
  }

  removeSocketFromList(id: number, socket: Socket): void {
    const sockets = SocketService.connectedClients.get(id);
    const filtered = (sockets || []).filter((exist) => exist.id !== socket.id);
    SocketService.connectedClients.set(id, filtered);
  }

  handleConnection(id: number, socket: Socket): void {
    this.addSocketToList(id, socket);

    socket.on(ESocketEvent.DISCONNECT, () => {
      this.removeSocketFromList(id, socket);
    });
  }

  sendMessage<T>(id: number, event: ESocketEvent, data: T) {
    const sockets = SocketService.connectedClients.get(id);
    (sockets || []).forEach((socket) => socket.emit(event, data));
  }

  sendGameUpdate<T>(id: number, data: T) {
    this.sendMessage(id, ESocketEvent.UPDATE_GAME, data);
  }
}
