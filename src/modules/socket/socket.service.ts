import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ESocketEvent } from './socket.types';

@Injectable()
export class SocketService {
  private static connectedClients: Map<number, Socket> = new Map();

  handleConnection(id: number, socket: Socket): void {
    SocketService.connectedClients.set(id, socket);

    socket.on(ESocketEvent.DISCONNECT, () => {
      SocketService.connectedClients.delete(id);
    });
  }

  sendMessage(id: number, event: ESocketEvent, data: any) {
    const socket = SocketService.connectedClients.get(id);
    if (socket) socket.emit(event, data);
  }
}
