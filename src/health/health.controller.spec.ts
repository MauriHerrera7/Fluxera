import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('should return the application health status', async () => {
    const controller = new HealthController(
      {
        check: async () => ({
          status: 'ok',
          info: {
            application: { status: 'up' },
            database: { status: 'up' },
            redis: { status: 'up' },
          },
        }),
      } as any,
      {
        pingCheck: async () => ({
          database: { status: 'up' },
        }),
      } as any,
      {
        client: Promise.resolve({
          ping: async () => 'PONG',
        }),
      } as any,
    );

    await expect(controller.getHealth()).resolves.toMatchObject({
      status: 'ok',
      info: {
        application: { status: 'up' },
        database: { status: 'up' },
        redis: { status: 'up' },
      },
    });
  });
});
