import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  fen: string;

  @Column({ type: 'varchar', nullable: false })
  turn: string;

  @Column({ type: 'varchar', nullable: true })
  result: string;

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
}
