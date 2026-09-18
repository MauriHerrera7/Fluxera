import { ArgumentsHost, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter.js';

describe('GlobalExceptionFilter', () => {
  it('should normalize HTTP exceptions to a consistent payload', () => {
    const filter = new GlobalExceptionFilter();
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/events/missing' }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new NotFoundException('Event not found'), host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Event not found',
        error: 'Not Found',
        path: '/events/missing',
      }),
    );
  });

  it('should expose a generic message for unexpected errors', () => {
    const filter = new GlobalExceptionFilter();
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/events' }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('database password exposed'), host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/events',
      }),
    );
  });
});
