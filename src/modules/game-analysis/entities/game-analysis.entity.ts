import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { EChessSide } from 'src/types/chess.types';
import { Game } from 'src/modules/games/entities/game.entity';

@Entity('game-analysis')
export class GameAnalysis {
  @ManyToOne(() => Game, (entity) => entity.id)
  @JoinColumn({ name: 'gameId' })
  game: Game;
  @PrimaryColumn({ type: 'uuid' })
  gameId: string;

  @PrimaryColumn({ type: 'enum', enum: EChessSide, nullable: false })
  side: EChessSide;

  @Column({ type: 'varchar', nullable: false })
  analysis: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
