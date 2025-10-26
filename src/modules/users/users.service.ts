import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { QueryGetAllUsersDto } from './dto/query-get-all-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findWithWhere(where: FindOptionsWhere<User>) {
    return this.userRepo.findOneBy(where);
  }

  async findAll(params: QueryGetAllUsersDto) {
    const { username } = params;

    try {
      const qb = this.userRepo
        .createQueryBuilder('entity')
        .withDeleted();

      if (username) {
        const str = `%${username}%`;
        qb.andWhere('(user.username ILIKE :username)', { username: str });
      }

      const res = await qb.getMany();
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      const res = await this.userRepo.findOneBy({ id });
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(body: CreateUserDto) {
    try {
      const res = await this.userRepo.insert(body);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, body: UpdateUserDto) {
    try {
      const res = await this.userRepo.update(id, body);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(id: number) {
    try {
      const res = await this.userRepo.softDelete(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restore(id: number) {
    try {
      const res = await this.userRepo.restore(id);
      return res;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
