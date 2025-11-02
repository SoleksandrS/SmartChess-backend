import { forwardRef, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [forwardRef(() => GamesModule)],
  providers: [SocketGateway, SocketService],
  exports: [SocketService],
})
export class SocketModule {}
