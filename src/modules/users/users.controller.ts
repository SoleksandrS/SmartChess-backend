import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { UsersService } from './users.service';
import { QueryGetAllUsersDto } from './dto/query-get-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll(@Query() params: QueryGetAllUsersDto) {
    return this.service.findAll(params);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: number) {
    return this.service.restore(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: UpdateUserDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
