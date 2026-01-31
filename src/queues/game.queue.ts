import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EQueue } from 'src/core/enums';
import { queueCommands } from 'src/core/queues.config';
import { GamesService } from 'src/modules/games/games.service';
import { GameAnalysisService } from 'src/modules/game-analysis/game-analysis.service';

@Processor(EQueue.GAME)
export class GameQueue {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gameAnalysisService: GameAnalysisService,
  ) {}

  @Process(queueCommands[EQueue.GAME].makeAIMove)
  async handleMakeAIMove(job: Job<{ gameId: string }>) {
    try {
      await this.gamesService.makeAIMove(job.data.gameId);
    } catch (err) {
      const msg = `Something went wrong while making ai move for game "${job.data.gameId}"`;
      console.error(`[Game Queue] - Make AI Move: ${msg}`, err);
    }
  }

  @Process(queueCommands[EQueue.GAME].analyze)
  async handleAnalyze(job: Job<{ gameId: string }>) {
    try {
      const game = await this.gamesService.getGameForAnalyzing(job.data.gameId);
      await this.gameAnalysisService.analyzeGame(game);
    } catch (err) {
      const msg = `Something went wrong while analyzing game "${job.data.gameId}"`;
      console.error(`[Game Queue] - Analyze: ${msg}`, err);
    }
  }
}
