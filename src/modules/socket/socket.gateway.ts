import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ESocketEvent } from './socket.types';
import { MainSocketService } from './services/main-socket.service';
import { GameSocketService } from './services/game-socket.service';
import { MMSocketService } from './services/mm-socket.service';

@WebSocketGateway({ cors: true })
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(MainSocketService)
    private readonly mainService: MainSocketService,
    @Inject(GameSocketService)
    private readonly gameService: GameSocketService,
    @Inject(MMSocketService)
    private readonly mmService: MMSocketService,
  ) {}

  @SubscribeMessage(ESocketEvent.MAIN_CONNECT)
  handleConnect(
    @MessageBody() body: { id: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.mainService.handleConnection(body.id, client);
  }

  @SubscribeMessage(ESocketEvent.GAME_JOIN)
  handleJoin(
    @MessageBody() body: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.gameService.join(body.gameId, client);
  }

  @SubscribeMessage(ESocketEvent.MATCHMAKING_JOIN)
  handleMatchmakingJoin(@ConnectedSocket() client: Socket) {
    this.mmService.join(client);
  }

  @SubscribeMessage(ESocketEvent.MATCHMAKING_LEAVE)
  handleMatchmakingLeave(@ConnectedSocket() client: Socket) {
    this.mmService.leave(client);
  }
}
