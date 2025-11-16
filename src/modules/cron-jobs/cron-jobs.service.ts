import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CronJobsService {
  constructor() {}

  @Cron('*/10 * * * * *')
  cronJob1() {
    console.log('[Cron Job #1]');
  }
}
