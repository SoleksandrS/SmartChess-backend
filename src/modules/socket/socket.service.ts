import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ESocketEvent } from './socket.types';
import { GamesService } from '../games/games.service';
import { GameRoom } from './classes/GameRoom';

@Injectable()
export class SocketService {
  private static connectedClients: Map<number, Socket[]> = new Map();
  private static rooms: Map<string, GameRoom> = new Map();
  private static idsList: Map<string, number> = new Map();

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
  ) {}

  addSocketToList(id: number, socket: Socket): void {
    const sockets = SocketService.connectedClients.get(id);
    SocketService.connectedClients.set(id, [...(sockets || []), socket]);
    SocketService.idsList.set(socket.id, id);
  }

  removeSocketFromList(id: number, socket: Socket): void {
    const sockets = SocketService.connectedClients.get(id);
    const filtered = (sockets || []).filter((exist) => exist.id !== socket.id);
    SocketService.connectedClients.set(id, filtered);
    SocketService.idsList.delete(socket.id);
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

  async joinToGame(gameId: string, socket: Socket) {
    const userId = SocketService.idsList.get(socket.id);
    if (!userId) return;

    let room = SocketService.rooms.get(gameId);

    if (!room) {
      const game = await this.gamesService.findOneSimple(gameId);
      room = new GameRoom(game);
      SocketService.rooms.set(gameId, room);
    }

    room.addPlayer(userId, socket);
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
