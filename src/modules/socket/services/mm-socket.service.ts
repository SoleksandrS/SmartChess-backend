import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MainSocketService } from './main-socket.service';
import { ESocketEvent, IPairPlayers } from '../socket.types';
import { GamesService } from '../../games/games.service';
import { shufflePair } from 'src/utils/shufflePair';

@Injectable()
export class MMSocketService {
  private static queue: Map<number, Socket> = new Map();

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
  ) {}

  private async createGame({ p1, p2 }: IPairPlayers) {
    const players = shufflePair([p1.id, p2.id]);
    const game = await this.gamesService.create({
      whitePlayerId: players[0],
      blackPlayerId: players[1],
    });

    p1.socket.emit(ESocketEvent.MATCHMAKING_DONE, { gameId: game.id });
    p2.socket.emit(ESocketEvent.MATCHMAKING_DONE, { gameId: game.id });

    MMSocketService.queue.delete(p1.id);
    MMSocketService.queue.delete(p2.id);
  }

  async join(socket: Socket) {
    const userId = MainSocketService.getIdsList(socket.id);
    if (!userId) return;

    const storedSocket = MMSocketService.queue.get(userId);
    if (storedSocket && storedSocket.id !== socket.id) {
      storedSocket.emit(ESocketEvent.MATCHMAKING_LEAVE);
    }

    MMSocketService.queue.set(userId, socket);

    if (MMSocketService.queue.size < 2) return;

    const [[idP1, socketP1], [idP2, socketP2]] =
      MMSocketService.queue.entries();

    const p1 = { id: idP1, socket: socketP1 };
    const p2 = { id: idP2, socket: socketP2 };
    await this.createGame({ p1, p2 });
  }

  leave(socket: Socket) {
    const userId = MainSocketService.getIdsList(socket.id);
    if (!userId) return;

    MMSocketService.queue.delete(userId);
  }

  public static onDisconnect(socket: Socket) {
    const userId = MainSocketService.getIdsList(socket.id);
    if (!userId) return;

    const storedSocket = MMSocketService.queue.get(userId);
    if (!storedSocket) return;

    if (storedSocket.id === socket.id) MMSocketService.queue.delete(userId);
  }
}
