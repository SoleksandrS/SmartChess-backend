import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { constants, envs } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ ...constants.cors, origin: '*' });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');

  console.log('PORT =', envs.port);
  await app.listen(envs.port);
}
bootstrap();
