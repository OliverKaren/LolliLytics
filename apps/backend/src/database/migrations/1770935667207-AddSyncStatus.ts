import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyncStatus1770935667207 implements MigrationInterface {
  name = 'AddSyncStatus1770935667207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sync_status" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "puuid" character varying NOT NULL,
        "state" character varying NOT NULL DEFAULT 'idle',
        "totalMatchesSynced" integer NOT NULL DEFAULT '0',
        "lastSyncAddedCount" integer NOT NULL DEFAULT '0',
        "lastSyncedAt" TIMESTAMP,
        "latestMatchId" character varying,
        "lastError" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_sync_status_puuid" UNIQUE ("puuid"),
        CONSTRAINT "PK_sync_status" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sync_status_userId" ON "sync_status" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_sync_status_userId"`);
    await queryRunner.query(`DROP TABLE "sync_status"`);
  }
}
