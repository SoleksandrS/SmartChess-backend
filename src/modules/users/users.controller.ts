import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { QueryGetAllUsersDto } from './dto/query-get-all-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.service.create(body);
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
