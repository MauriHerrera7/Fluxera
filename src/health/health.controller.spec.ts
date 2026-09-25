import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('should return liveness status', async () => {
    const controller = new HealthController(
      {
        check: async (indicators) => {
          const results = await Promise.all(indicators.map(ind => ind()));
          return { status: 'ok', info: Object.assign({}, ...results) };
        },
      } as any,
      {} as any,
    );

    await expect(controller.getLiveness()).resolves.toMatchObject({
      status: 'ok',
      info: {
        application: { status: 'up' },
      },
    });
  });

  it('should return readiness status', async () => {
    const controller = new HealthController(
      {
        check: async () => ({
          status: 'ok',
          info: {
            database: { status: 'up' },
            redis: { status: 'up' },
          },
        }),
      } as any,
      {} as any,
    );

    await expect(controller.getReadiness()).resolves.toMatchObject({
      status: 'ok',
      info: {
        database: { status: 'up' },
        redis: { status: 'up' },
      },
    });
  });
});

