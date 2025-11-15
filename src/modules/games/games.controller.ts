import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { IRequest } from 'src/core/interfaces';
import { GamesService } from './games.service';
import { GetMyGamesDto } from './dto/get-my-games.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly service: GamesService) {}

  @Get('my')
  findMy(@Req() req: IRequest, @Query() query: GetMyGamesDto) {
    return this.service.findMy(query, req.user.email);
  }

  @Get(':id')
  findOne(@Req() req: IRequest, @Param('id') id: string) {
    return this.service.findOne(id, req.user.email);
  }

  @Throttle({ default: { limit: 1, ttl: 10000 } })
  @Get(':id/advice')
  getAdvice(@Req() req: IRequest, @Param('id') id: string) {
    return this.service.getAdvice(id, req.user.email);
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
  makeMove(
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() { move }: MakeMoveDto,
  ) {
    return this.service.complexMakeMove(id, move, req.user.email);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
