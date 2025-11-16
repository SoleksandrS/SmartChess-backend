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

  @SubscribeMessage(ESocketEvent.JOIN_TO_GAME)
  handleJoin(
    @MessageBody() body: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.gameService.join(body.gameId, client);
  }

  @SubscribeMessage(ESocketEvent.JOIN_TO_MATCHMAKING)
  handleMatchmakingJoin(@ConnectedSocket() client: Socket) {
    this.mmService.join(client);
  }

  @SubscribeMessage(ESocketEvent.LEAVE_FROM_MATCHMAKING)
  handleMatchmakingLeave(@ConnectedSocket() client: Socket) {
    this.mmService.leave(client);
  }
}
