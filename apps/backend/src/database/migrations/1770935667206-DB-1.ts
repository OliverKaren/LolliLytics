import { MigrationInterface, QueryRunner } from "typeorm";

export class DB11770935667206 implements MigrationInterface {
    name = 'DB11770935667206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying NOT NULL, "passwordHash" character varying NOT NULL, "riotPuuid" character varying, "riotSummonerName" character varying, "riotRegion" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "matchId" character varying NOT NULL, "puuid" character varying NOT NULL, "championId" integer NOT NULL, "championName" character varying NOT NULL, "lane" character varying NOT NULL, "role" character varying NOT NULL, "win" boolean NOT NULL, "kills" integer NOT NULL, "deaths" integer NOT NULL, "assists" integer NOT NULL, "kda" double precision NOT NULL, "totalDamageDealt" integer NOT NULL, "totalDamageDealtToChampions" integer NOT NULL, "goldEarned" integer NOT NULL, "cs" integer NOT NULL, "csPerMinute" double precision NOT NULL, "visionScore" integer NOT NULL, "gameDuration" integer NOT NULL, "gameCreation" bigint NOT NULL, "patch" character varying, "tier" character varying, "rank" character varying, "rawData" jsonb, "fetchedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_00f0b0a807779364b0671ff5a35" UNIQUE ("matchId"), CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_71959193404c746ecc955a2f2f" ON "matches" ("puuid", "gameCreation") `);
        await queryRunner.query(`CREATE TABLE "champion_stats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "puuid" character varying NOT NULL, "championId" integer NOT NULL, "championName" character varying NOT NULL, "patch" character varying, "gamesPlayed" integer NOT NULL DEFAULT '0', "wins" integer NOT NULL DEFAULT '0', "winRate" double precision NOT NULL DEFAULT '0', "avgKda" double precision NOT NULL DEFAULT '0', "avgCsPerMinute" double precision NOT NULL DEFAULT '0', "avgDamageShare" double precision NOT NULL DEFAULT '0', "avgVisionScore" double precision NOT NULL DEFAULT '0', "isComfortPick" boolean NOT NULL DEFAULT false, "matchupWinRates" jsonb, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_29054364fb52b5f6a667e2f69d9" UNIQUE ("puuid", "championId", "patch"), CONSTRAINT "PK_ba8488496c7838a842f117e83b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fabec55fa51b012ef8d5c24dda" ON "champion_stats" ("puuid", "championId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fabec55fa51b012ef8d5c24dda"`);
        await queryRunner.query(`DROP TABLE "champion_stats"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71959193404c746ecc955a2f2f"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
