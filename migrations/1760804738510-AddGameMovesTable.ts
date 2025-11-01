import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const tableGameMoves = 'game-moves';
const tableGames = 'games';
const enumChessSide = 'chess_side_enum';

export class AddGameMovesTable1760804738510 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.createTable(
      new Table({
        name: tableGameMoves,
        columns: [
          {
            name: 'gameId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'moveNumber',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'turn',
            type: enumChessSide,
            isNullable: false,
          },
          {
            name: 'move',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await qr.createForeignKey(
      tableGameMoves,
      new TableForeignKey({
        columnNames: ['gameId'],
        referencedTableName: tableGames,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable(tableGameMoves);
  }
}
