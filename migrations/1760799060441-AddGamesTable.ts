import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const tableGames = 'games';
const tableUsers = 'users';
const enumChessSide = 'chess_side_enum';
const enumChessResult = 'chess_result_enum';

export class AddGamesTable1760799060441 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`CREATE TYPE "${enumChessSide}" AS ENUM ('w', 'b')`);
    await qr.query(`CREATE TYPE "${enumChessResult}" AS ENUM ('draw', 'checkmate')`);

    await qr.createTable(
      new Table({
        name: tableGames,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'fen',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'turn',
            type: enumChessSide,
            isNullable: false,
            default: 'w',
          },
          {
            name: 'result',
            type: enumChessResult,
            isNullable: true,
            default: null,
          },
          {
            name: 'whitePlayerId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'blackPlayerId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await qr.createForeignKeys(tableGames, [
      new TableForeignKey({
        columnNames: ['whitePlayerId'],
        referencedTableName: tableUsers,
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['blackPlayerId'],
        referencedTableName: tableUsers,
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.dropTable(tableGames);
    await qr.query(`DROP TYPE "${enumChessSide}"`);
    await qr.query(`DROP TYPE "${enumChessResult}"`);
  }
}
