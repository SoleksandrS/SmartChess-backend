import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity('game-moves')
export class GameMove {
  @ManyToOne(() => Game, (entity) => entity.id)
  @JoinColumn({ name: 'gameId' })
  game: Game;
  @PrimaryColumn({ type: 'uuid' })
  gameId: number;

  @PrimaryColumn()
  moveNumber: number;

  @Column({ type: 'varchar', nullable: false })
  turn: string;

  @Column({ type: 'varchar', nullable: false })
  move: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
