import { IsInt, IsPositive } from 'class-validator';

export class CreateGameDto {
  @IsInt()
  @IsPositive()
  whitePlayerId: number;

  @IsInt()
  @IsPositive()
  blackPlayerId: number;
}
