import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ESocketEvent } from './socket.types';
import { GameRoom } from './classes/GameRoom';
import { EChessSide } from 'src/types/chess.types';

@Injectable()
export class SocketService {
  private static connectedClients: Map<number, Socket[]> = new Map();
  private static rooms: Map<string, GameRoom> = new Map();

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
      this.removeFromRooms(socket);
    });

    socket.emit(ESocketEvent.MAIN_CONNECT, true);
  }

  sendMessage<T>(id: number, event: ESocketEvent, data: T) {
    const sockets = SocketService.connectedClients.get(id);
    (sockets || []).forEach((socket) => socket.emit(event, data));
  }

  joinToGame(gameId: string, side: EChessSide, socket: Socket) {
    let room = SocketService.rooms.get(gameId);

    if (!room) {
      room = new GameRoom(gameId);
      SocketService.rooms.set(gameId, room);
    }

    room.addPlayer(side, socket);
  }

  sendGameUpdate<T>(gameId: string, data: T) {
    try {
      const room = SocketService.rooms.get(gameId);
      if (room) room.broadcast(ESocketEvent.UPDATE_GAME, data);
    } catch (error) {
      console.error('[Socket Service] sendGameUpdate', error);
    }
  }

  private removeFromRooms(socket: Socket) {
    for (const [id, room] of SocketService.rooms.entries()) {
      room.removePlayer(socket);
      if (room.isEmpty) SocketService.rooms.delete(id);
    }
  }
}
