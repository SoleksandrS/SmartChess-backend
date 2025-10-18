import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: CreateGameDto) {
    return this.service.create(body);
  }

  @Post(':id/restore')
  restore(@Param('id') id: number) {
    return this.service.restore(id);
  }

  @Put(':id/move')
  makeMove(@Param('id') id: number, @Body() body: MakeMoveDto) {
    return this.service.makeMove(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
