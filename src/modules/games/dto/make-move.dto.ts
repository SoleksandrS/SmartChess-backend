import { IsNotEmpty, IsString } from 'class-validator';

export class MakeMoveDto {
  @IsNotEmpty()
  @IsString()
  move: string;
}
