import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../dto/pagination.dto';

export enum EPageGamesStatus {
  ACTIVE = 'active',
  WIN = 'win',
  LOSE = 'lose',
  DRAW = 'draw',
}

export class GetMyGamesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(EPageGamesStatus, {
    message: `Status must be one of: ${Object.values(EPageGamesStatus).join(', ')}`,
  })
  status?: EPageGamesStatus;
}
