import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EGameSide } from 'src/types/chess.types';

export class MakeMoveDto {
  @IsNotEmpty()
  @IsEnum(EGameSide)
  turn: EGameSide;

  @IsNotEmpty()
  @IsString()
  move: string;
}
