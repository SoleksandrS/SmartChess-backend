import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MainSocketService } from './main-socket.service';
import { ESocketEvent } from '../socket.types';
import { GamesService } from '../../games/games.service';
import { shufflePair } from 'src/utils/shufflePair';

@Injectable()
export class MMSocketService {
  private static queue: Map<number, Socket> = new Map();

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
  ) {}

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

    const players = shufflePair([idP1, idP2]);
    const game = await this.gamesService.create({
      whitePlayerId: players[0],
      blackPlayerId: players[1],
    });

    socketP1.emit(ESocketEvent.MATCHMAKING_DONE, { gameId: game.id });
    socketP2.emit(ESocketEvent.MATCHMAKING_DONE, { gameId: game.id });

    MMSocketService.queue.delete(idP1);
    MMSocketService.queue.delete(idP2);
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
