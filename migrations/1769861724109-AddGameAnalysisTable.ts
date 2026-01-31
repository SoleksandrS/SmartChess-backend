import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const tableGameAnalysis = 'game-analysis';
const tableGames = 'games';
const enumChessSide = 'chess_side_enum';

export class AddGameAnalysisTable1769861724109 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.createTable(
      new Table({
        name: tableGameAnalysis,
        columns: [
          {
            name: 'gameId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'side',
            type: enumChessSide,
            isPrimary: true,
          },
          {
            name: 'analysis',
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
      tableGameAnalysis,
      new TableForeignKey({
        columnNames: ['gameId'],
        referencedTableName: tableGames,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable(tableGameAnalysis);
  }
}
