import { MigrationInterface, QueryRunner } from 'typeorm';
import { EChessResult, EChessSide } from 'src/types/chess.types';

const enumChessSide = 'chess_side_enum';
const enumChessResult = 'chess_result_enum';

export class AddTypes1760799060000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      `CREATE TYPE "${enumChessSide}" AS ENUM ('${EChessSide.WHITE}', '${EChessSide.BLACK}')`,
    );
    await qr.query(
      `CREATE TYPE "${enumChessResult}" AS ENUM ('${EChessResult.DRAW}', '${EChessResult.CHECKMATE}')`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TYPE "${enumChessSide}"`);
    await qr.query(`DROP TYPE "${enumChessResult}"`);
  }
}
