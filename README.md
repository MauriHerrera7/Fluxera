# Fluxera

Fluxera is a NestJS backend for PostgreSQL-backed event processing.

## Stack

- NestJS and TypeScript
- PostgreSQL with TypeORM
- Redis with BullMQ
- class-validator
- Vitest

## Structure

```text
src/
   app.module.ts
   main.ts
   database/migrations/
   events/
      events.module.ts
      events.controller.ts
      events.service.ts
      event-queue.service.ts
      dto/
      entities/
      enums/
      repositories/
      processors/
      *.spec.ts
   users/
   notifications/
test/
   app.e2e-spec.ts
```

Events keeps its controller, service, DTOs, entities, lifecycle enum, repository, queue service, processor, and unit tests together. Database migrations remain separate from the domain in `src/database/migrations`.

## Local setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Copy `.env.example` to `.env` and adjust credentials if needed.

3. Start PostgreSQL and Redis:

    ```bash
    docker compose up -d
    ```

4. Apply migrations:

    ```bash
    npm run migration:run
    ```

5. Start Fluxera:

    ```bash
    npm run start:dev
    ```

The application uses PostgreSQL from `DATABASE_HOST` and Redis from `REDIS_HOST` and `REDIS_PORT`. The default Redis queue is `events`.

## Event processing

`POST /events` requires an `Idempotency-Key` header and returns `202 Accepted`. The request body uses the `data` property:

```json
{
   "type": "user.created",
   "data": {
      "userId": "123"
   }
}
```

The flow is:

```text
Controller -> EventsService -> EventRepository -> PostgreSQL
                                     |
                                     v
                              BullMQ queue
                                     |
                                     v
                           EventProcessor -> PostgreSQL
```

Only a newly created event enqueues a job. A repeated request with the same idempotency key reuses the PostgreSQL event and does not enqueue another job. PostgreSQL is the source of truth for both events and idempotency keys.

## Lifecycle and retries

Normal processing follows:

```text
PENDING -> PROCESSING -> PROCESSED
                               -> FAILED
```

Retries use BullMQ with three attempts and exponential backoff. A failed retry re-enters the existing lifecycle through `FAILED -> PROCESSING`; after the final failed attempt, the event remains `FAILED` and BullMQ marks the job as failed.

The controlled failure path is available with `data.shouldFail: true` or the `event.failed` event type.

## API endpoints

- `POST /events` creates and queues an event.
- `GET /events` lists events.
- `GET /events/:id` fetches one event.
- `PATCH /events/:id` partially updates an event.
- `PATCH /events/:id/status` applies a valid lifecycle transition.
- `DELETE /events/:id` removes an event.

Global validation uses `whitelist`, `forbidNonWhitelisted`, and `transform` in `src/main.ts`.

## Tests and verification

```bash
npm test -- --run
npm run test:e2e
npm run build
npm run migration:run
```

Docker checks:

```bash
docker compose config

```

The E2E suite requires PostgreSQL and Redis to be available.
npm test -- --run
