import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EChessResult, EChessSide } from 'src/types/chess.types';
import { User } from 'src/modules/users/entities/user.entity';
import { GameMove } from './game-move.entity';

@Entity('games')
export class Game {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', nullable: false })
  fen: string;

  @Column({ type: 'enum', enum: EChessSide, nullable: false })
  turn: EChessSide;

  @Column({ type: 'enum', enum: EChessResult, nullable: true })
  result: EChessResult;

  @ManyToOne(() => User, (entity) => entity.id)
  @JoinColumn({ name: 'whitePlayerId' })
  whitePlayer: User;
  @Column()
  whitePlayerId: number;

  @ManyToOne(() => User, (entity) => entity.id)
  @JoinColumn({ name: 'blackPlayerId' })
  blackPlayer: User;
  @Column()
  blackPlayerId: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @OneToMany(() => GameMove, (entity) => entity.game)
  moves: GameMove[];
}
