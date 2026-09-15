import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

const hasDatabaseRuntime = Boolean(process.env.DATABASE_HOST);

const waitForEventStatus = async (
  app: INestApplication<App>,
  eventId: string,
  expectedStatus: string,
): Promise<void> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await request(app.getHttpServer()).get(`/events/${eventId}`).expect(200);

    if (response.body.status === expectedStatus) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Event ${eventId} did not reach status ${expectedStatus}`);
};

describe('Events API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    if (!hasDatabaseRuntime) {
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/events (GET)', async () => {
    if (!hasDatabaseRuntime) {
      return;
    }

    await request(app.getHttpServer()).get('/events').expect(200);
  });

  it('/events (POST) requires idempotency key', async () => {
    if (!hasDatabaseRuntime) {
      return;
    }

    await request(app.getHttpServer())
      .post('/events')
      .send({
        type: 'user.created',
        data: { userId: '123' },
      })
      .expect(400);
  });

  it('/events (POST) accepts creation asynchronously', async () => {
    if (!hasDatabaseRuntime) {
      return;
    }

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Idempotency-Key', 'accepted-flow-key')
      .send({
        type: 'user.created',
        data: { userId: '123' },
      })
      .expect(202);

    expect(created.body.data.status).toBe('PENDING');
    expect(created.body.data.id).toBeTruthy();
  });

  it('creates a single event for the same idempotency key', async () => {
    if (!hasDatabaseRuntime) {
      return;
    }

    const payload = {
      type: 'user.created',
      data: { userId: '123' },
    };

    const first = await request(app.getHttpServer())
      .post('/events')
      .set('Idempotency-Key', 'e2e-key-1')
      .send(payload)
      .expect(202);

    const second = await request(app.getHttpServer())
      .post('/events')
      .set('Idempotency-Key', 'e2e-key-1')
      .send(payload)
      .expect(202);

    expect(second.body.data.id).toBe(first.body.data.id);

    const list = await request(app.getHttpServer()).get('/events').expect(200);
    const matching = list.body.filter((event: { id: string }) => event.id === first.body.data.id);
    expect(matching).toHaveLength(1);
  });

  it('updates status through the lifecycle endpoint', async () => {
    if (!hasDatabaseRuntime) {
      return;
    }

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Idempotency-Key', 'e2e-status-1')
      .send({
        type: 'order.created',
        data: { orderId: 'abc' },
      })
      .expect(202);

    await waitForEventStatus(app, created.body.data.id, 'PROCESSED');

    await request(app.getHttpServer())
      .patch(`/events/${created.body.data.id}/status`)
      .send({ status: 'FAILED' })
      .expect(400);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
