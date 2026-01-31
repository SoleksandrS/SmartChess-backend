import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EQueue } from 'src/core/enums';
import { queueCommands } from 'src/core/queues.config';
import { GamesService } from 'src/modules/games/games.service';

@Processor(EQueue.GAME)
export class GameQueue {
  constructor(private readonly gamesService: GamesService) {}

  @Process(queueCommands[EQueue.GAME].makeAIMove)
  async handleSendEmail(job: Job<{ gameId: string }>) {
    try {
      await this.gamesService.makeAIMove(job.data.gameId);
    } catch (err) {
      const msg = `error occurred with game #${job.data.gameId}:`;
      console.log(`[GameAIMove Queue] ${msg}`, err);
    }
  }
}
