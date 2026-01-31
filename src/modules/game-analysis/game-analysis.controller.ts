import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { IRequest } from 'src/core/interfaces';
import { GameAnalysisService } from './game-analysis.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('game-analysis')
export class GameAnalysisController {
  constructor(private readonly service: GameAnalysisService) {}

  @Get(':id')
  findOne(@Req() req: IRequest, @Param('id') id: string) {
    return this.service.findOne(id, req.user.email);
  }
}
