import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ESocketEvent } from './socket.types';
import { SocketService } from './socket.service';

@WebSocketGateway()
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  constructor(private socketService: SocketService) {}

  @SubscribeMessage(ESocketEvent.MAIN_CONNECT)
  handleConnect(
    @MessageBody() body: { id: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.socketService.handleConnection(body.id, client);
  }
}
