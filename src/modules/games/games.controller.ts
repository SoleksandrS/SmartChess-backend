import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: CreateGameDto) {
    return this.service.create(body);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Put(':id/move')
  makeMove(@Param('id') id: string, @Body() { move }: MakeMoveDto) {
    return this.service.complexMakeMove(id, move);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
