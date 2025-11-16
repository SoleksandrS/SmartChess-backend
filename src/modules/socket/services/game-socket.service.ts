import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MainSocketService } from './main-socket.service';
import { ESocketEvent } from '../socket.types';
import { GamesService } from '../../games/games.service';
import { GameRoom } from '../classes/GameRoom';

@Injectable()
export class GameSocketService {
  private static rooms: Map<string, GameRoom> = new Map();

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
  ) {}

  async join(gameId: string, socket: Socket) {
    const userId = MainSocketService.getIdsList(socket.id);
    if (!userId) return;

    let gameRoom = GameSocketService.rooms.get(gameId);

    if (!gameRoom) {
      const game = await this.gamesService.findOneSimple(gameId);
      gameRoom = new GameRoom(game);
      GameSocketService.rooms.set(gameId, gameRoom);
    }

    gameRoom.addPlayer(userId, socket);
  }

  update<T>(gameId: string, data: T) {
    try {
      const gameRoom = GameSocketService.rooms.get(gameId);
      if (!gameRoom) return;

      gameRoom.broadcast(ESocketEvent.UPDATE_GAME, data);
    } catch (error) {
      console.error('[Socket Service] sendGameUpdate', error);
    }
  }

  public static onDisconnect(socket: Socket) {
    for (const [id, gameRoom] of GameSocketService.rooms.entries()) {
      gameRoom.removePlayer(socket);
      if (gameRoom.isEmpty) GameSocketService.rooms.delete(id);
    }
  }
}
