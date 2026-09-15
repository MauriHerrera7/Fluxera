import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventIdempotencyAndLifecycle1757930000000 implements MigrationInterface {
  name = 'AddEventIdempotencyAndLifecycle1757930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "event_idempotency_keys" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" character varying(255) NOT NULL,
        "event_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_idempotency_keys" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_idempotency_keys_key" UNIQUE ("key"),
        CONSTRAINT "UQ_event_idempotency_keys_event_id" UNIQUE ("event_id"),
        CONSTRAINT "FK_event_idempotency_keys_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "event_idempotency_keys";
    `);
  }
}
