import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ESocketEvent } from './socket.types';
import { GamesService } from '../games/games.service';
import { GameRoom } from './classes/GameRoom';
import { shufflePair } from 'src/utils/shufflePair';

@Injectable()
export class SocketService {
  private static connectedClients: Map<number, Socket[]> = new Map();
  private static gameRooms: Map<string, GameRoom> = new Map();
  private static idsList: Map<string, number> = new Map();
  private static matchmakingQueue: Map<number, string> = new Map();

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
      this.removeFromGameRooms(socket);
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

    let gameRoom = SocketService.gameRooms.get(gameId);

    if (!gameRoom) {
      const game = await this.gamesService.findOneSimple(gameId);
      gameRoom = new GameRoom(game);
      SocketService.gameRooms.set(gameId, gameRoom);
    }

    gameRoom.addPlayer(userId, socket);
  }

  sendGameUpdate<T>(gameId: string, data: T) {
    try {
      const gameRoom = SocketService.gameRooms.get(gameId);
      if (gameRoom) gameRoom.broadcast(ESocketEvent.UPDATE_GAME, data);
    } catch (error) {
      console.error('[Socket Service] sendGameUpdate', error);
    }
  }

  private removeFromGameRooms(socket: Socket) {
    for (const [id, gameRoom] of SocketService.gameRooms.entries()) {
      gameRoom.removePlayer(socket);
      if (gameRoom.isEmpty) SocketService.gameRooms.delete(id);
    }
  }

  async matchmakingJoin(id: number, socket: Socket) {
    SocketService.matchmakingQueue.set(id, socket.id);

    if (SocketService.matchmakingQueue.size >= 2) {
      const [p1, p2] = SocketService.matchmakingQueue.entries();
      const players = shufflePair([p1[0], p2[0]]);
      const game = await this.gamesService.create({
        whitePlayerId: players[0],
        blackPlayerId: players[1],
      });

      const socketP1 = (SocketService.connectedClients.get(p1[0]) || []).find(
        ({ id }) => id === p1[1],
      );
      const socketP2 = (SocketService.connectedClients.get(p2[0]) || []).find(
        ({ id }) => id === p2[1],
      );

      socketP1?.emit(ESocketEvent.DONE_MATCHMAKING, { gameId: game.id });
      socketP2?.emit(ESocketEvent.DONE_MATCHMAKING, { gameId: game.id });

      SocketService.matchmakingQueue.delete(p1[0]);
      SocketService.matchmakingQueue.delete(p2[0]);
    }
  }

  matchmakingLeave(id: number) {
    SocketService.matchmakingQueue.delete(id);
  }
}
