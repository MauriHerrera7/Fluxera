import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should generate a password hash', async () => {
    const hash = await service.hashPassword('StrongPass123!');

    expect(hash).not.toBe('StrongPass123!');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should compare a correct password', async () => {
    const hash = await service.hashPassword('StrongPass123!');

    await expect(service.comparePassword('StrongPass123!', hash)).resolves.toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await service.hashPassword('StrongPass123!');

    await expect(service.comparePassword('WrongPass123!', hash)).resolves.toBe(false);
  });
});
