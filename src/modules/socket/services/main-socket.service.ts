import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameSocketService } from './game-socket.service';
import { MMSocketService } from './mm-socket.service';
import { ESocketEvent } from '../socket.types';

@Injectable()
export class MainSocketService {
  private static connectedClients: Map<number, Socket[]> = new Map();
  private static idsList: Map<string, number> = new Map();

  constructor() {}

  addSocketToList(id: number, socket: Socket): void {
    const sockets = MainSocketService.connectedClients.get(id);
    MainSocketService.connectedClients.set(id, [...(sockets || []), socket]);
    MainSocketService.idsList.set(socket.id, id);
  }

  removeSocketFromList(id: number, socket: Socket): void {
    const sockets = MainSocketService.connectedClients.get(id);
    const filtered = (sockets || []).filter((exist) => exist.id !== socket.id);
    MainSocketService.connectedClients.set(id, filtered);
    MainSocketService.idsList.delete(socket.id);
  }

  handleConnection(id: number, socket: Socket): void {
    this.addSocketToList(id, socket);

    socket.on(ESocketEvent.DISCONNECT, () => {
      MMSocketService.onDisconnect(socket);
      GameSocketService.onDisconnect(socket);
      this.removeSocketFromList(id, socket);
    });

    socket.emit(ESocketEvent.MAIN_CONNECT, true);
  }

  sendMessage<T>(id: number, event: ESocketEvent, data: T) {
    const sockets = MainSocketService.connectedClients.get(id);
    (sockets || []).forEach((socket) => socket.emit(event, data));
  }

  public static getConnected(id: number) {
    return MainSocketService.connectedClients.get(id) || [];
  }

  public static getIdsList(socketId: string) {
    return MainSocketService.idsList.get(socketId);
  }
}
