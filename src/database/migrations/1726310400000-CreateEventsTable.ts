import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventsTable1726310400000 implements MigrationInterface {
  name = 'CreateEventsTable1726310400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE event_status AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" character varying(255) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" event_status NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "events";
      DROP TYPE IF EXISTS event_status;`);
  }
}
