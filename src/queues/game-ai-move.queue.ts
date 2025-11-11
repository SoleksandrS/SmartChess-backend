import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EQueue } from 'src/core/enums';
import { GamesService } from 'src/modules/games/games.service';

@Processor(EQueue.GAME_AI_MOVE)
export class GameAIMoveQueue {
  constructor(private readonly gamesService: GamesService) {}

  @Process('make-move')
  async handleSendEmail(job: Job<{ gameId: string }>) {
    console.log('Make move for game', job.data);
  }
}
