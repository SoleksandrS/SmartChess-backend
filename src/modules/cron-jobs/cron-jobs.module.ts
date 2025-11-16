import { Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [SocketModule],
  providers: [CronJobsService],
})
export class CronJobsModule {}
