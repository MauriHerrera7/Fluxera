import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

const hasDatabaseRuntime = Boolean(process.env.DATABASE_HOST);

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

  it('/events (POST)', async () => {
    if (!hasDatabaseRuntime) {
      return;
    }

    await request(app.getHttpServer())
      .post('/events')
      .send({
        type: 'user.created',
        data: { userId: '123' },
      })
      .expect(201);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
