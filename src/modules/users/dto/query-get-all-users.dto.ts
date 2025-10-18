import { IsOptional, IsString } from 'class-validator';

export class QueryGetAllUsersDto {
  @IsOptional()
  @IsString()
  username?: string;
}
