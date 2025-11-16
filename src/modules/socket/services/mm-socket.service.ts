import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MainSocketService } from './main-socket.service';
import { ESocketEvent } from '../socket.types';
import { GamesService } from '../../games/games.service';
import { shufflePair } from 'src/utils/shufflePair';

@Injectable()
export class MMSocketService {
  private static queue: Map<number, string> = new Map();

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
  ) {}

  async join(socket: Socket) {
    const userId = MainSocketService.getIdsList(socket.id);
    if (!userId) return;

    MMSocketService.queue.set(userId, socket.id);

    if (MMSocketService.queue.size >= 2) {
      const [p1, p2] = MMSocketService.queue.entries();
      const players = shufflePair([p1[0], p2[0]]);
      const game = await this.gamesService.create({
        whitePlayerId: players[0],
        blackPlayerId: players[1],
      });

      const socketP1 = MainSocketService.getConnected(p1[0]).find(
        ({ id }) => id === p1[1],
      );
      const socketP2 = MainSocketService.getConnected(p2[0]).find(
        ({ id }) => id === p2[1],
      );

      socketP1?.emit(ESocketEvent.MATCHMAKING_DONE, { gameId: game.id });
      socketP2?.emit(ESocketEvent.MATCHMAKING_DONE, { gameId: game.id });

      MMSocketService.queue.delete(p1[0]);
      MMSocketService.queue.delete(p2[0]);
    }
  }

  leave(socket: Socket) {
    const userId = MainSocketService.getIdsList(socket.id);
    if (!userId) return;

    MMSocketService.queue.delete(userId);
  }

  public static onDisconnect(socket: Socket) {
    const userId = MainSocketService.getIdsList(socket.id);
    if (!userId) return;

    const socketId = MMSocketService.queue.get(userId);
    if (!socketId) return;

    if (socketId === socket.id) MMSocketService.queue.delete(userId);
  }
}
