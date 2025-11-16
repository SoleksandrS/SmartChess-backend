import { forwardRef, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MainSocketService } from './services/main-socket.service';
import { GameSocketService } from './services/game-socket.service';
import { MMSocketService } from './services/mm-socket.service';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [forwardRef(() => GamesModule)],
  providers: [
    SocketGateway,
    MainSocketService,
    GameSocketService,
    MMSocketService,
  ],
  exports: [GameSocketService, MMSocketService],
})
export class SocketModule {}
