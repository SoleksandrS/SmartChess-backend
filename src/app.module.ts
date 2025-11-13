import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { envs } from './config';
import { SocketModule } from './modules/socket/socket.module';
import { HeartbeatModule } from './modules/heartbeat/heartbeat.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GamesModule } from './modules/games/games.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    BullModule.forRoot({
      redis: { host: envs.redis.host, port: envs.redis.port },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    SocketModule,
    HeartbeatModule,
    AuthModule,
    UsersModule,
    GamesModule,
  ],
})
export class AppModule {}
