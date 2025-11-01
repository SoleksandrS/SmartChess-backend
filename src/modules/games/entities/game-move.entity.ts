import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { EChessSide } from 'src/types/chess.types';
import { Game } from './game.entity';

@Entity('game-moves')
export class GameMove {
  @ManyToOne(() => Game, (entity) => entity.id)
  @JoinColumn({ name: 'gameId' })
  game: Game;
  @PrimaryColumn({ type: 'uuid' })
  gameId: string;

  @PrimaryColumn()
  number: number;

  @Column({ type: 'enum', enum: EChessSide, nullable: false })
  side: EChessSide;

  @Column({ type: 'varchar', nullable: false })
  move: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
