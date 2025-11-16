import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MMSocketService } from '../socket/services/mm-socket.service';

@Injectable()
export class CronJobsService {
  constructor(
    @Inject(MMSocketService)
    private readonly mmSocketService: MMSocketService,
  ) {}

  @Cron('*/10 * * * * *')
  async cronMatchmaking() {
    await this.mmSocketService.execute();
  }
}
