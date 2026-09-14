# Fluxera

Fluxera is a NestJS backend project focused on event processing workflows.

## What it does

The project currently provides the foundation for an event-driven backend:

- create events
- list events
- fetch one event by id
- update events partially
- delete events
- validate incoming requests with DTOs and ValidationPipe
- keep the application architecture separated into Controller, Service, Repository, and persistence abstraction

## Current architecture

Request
→ Controller
→ Service
→ Repository
→ in-memory event store

## Stack

- NestJS
- TypeScript
- class-validator
- @nestjs/mapped-types
- PostgreSQL-ready TypeORM configuration
- Vitest for unit tests

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Start PostgreSQL locally or with Docker:
   ```bash
   docker compose up -d
   ```
4. Run the app:
   ```bash
   npm run start:dev
   ```

## Environment variables

See [.env.example](.env.example) for the defaults used by the project.

## Event endpoints

### POST /events
Create an event.

Request body:
```json
{
  "type": "user.created",
  "data": {
    "userId": "123"
  }
}
```

### GET /events
List all events.

### GET /events/:id
Fetch a single event by id.

### PATCH /events/:id
Partially update an event. Only fields sent in the request are changed.

### DELETE /events/:id
Delete an event by id.

## Validation

Global validation is enabled in [src/main.ts](src/main.ts) with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

This ensures incoming payloads are validated and unknown properties are rejected.

## Test commands

```bash
npm test -- --run
npm run build
```

## Notes

This project is still in the transition from in-memory storage to a real persistence layer. The current architecture is deliberately kept simple and professional, and it is ready to evolve toward PostgreSQL-backed event lifecycle management.
