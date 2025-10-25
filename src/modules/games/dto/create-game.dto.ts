import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  whitePlayerId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  blackPlayerId?: number;
}
