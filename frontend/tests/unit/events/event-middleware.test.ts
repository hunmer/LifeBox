/**
 * 事件中间件单元测试
 * 
 * 测试各种事件中间件的功能，包括日志记录、权限检查、
 * 频率限制、去重、数据转换等中间件。
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  loggingMiddleware,
  validationMiddleware,
  createPermissionMiddleware,
  createRateLimitMiddleware,
  createDeduplicationMiddleware,
  createDataTransformMiddleware,
  createAsyncEnhanceMiddleware,
  errorHandlingMiddleware,
  createPerformanceMiddleware,
  createStandardMiddleware,
} from '../../../src/lib/events/event-middleware';
import type { LifeBoxEvent } from '@lifebox/shared';

// Mock console for testing
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

global.console = mockConsole as any;

// Mock performance for testing
global.performance = {
  now: vi.fn(() => Date.now()),
} as any;

describe('事件中间件', () => {
  let mockEvent: LifeBoxEvent;
  let mockNext: Mock;

  beforeEach(() => {
    mockEvent = {
      id: 'test-event-1',
      type: 'test:event',
      data: { message: 'test' },
      source: 'test-plugin',
      timestamp: Date.now(),
      cancelled: false,
      propagation: true,
    };

    mockNext = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('loggingMiddleware', () => {
    it('should log event start and completion', async () => {
      await loggingMiddleware(mockEvent, mockNext);

      expect(mockConsole.log).toHaveBeenCalledTimes(2);
      expect(mockConsole.log).toHaveBeenNthCalledWith(
        1,
        '[Event] test:event started',
        expect.objectContaining({
          id: 'test-event-1',
          source: 'test-plugin',
        })
      );
      expect(mockConsole.log).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('[Event] test:event completed in'),
        expect.objectContaining({
          id: 'test-event-1',
          cancelled: false,
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validationMiddleware', () => {
    it('should pass valid events', async () => {
      await validationMiddleware(mockEvent, mockNext);

      expect(mockEvent.cancelled).toBe(false);
      expect(mockEvent.propagation).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should cancel events with missing required fields', async () => {
      const invalidEvent = { ...mockEvent, id: '' };

      await validationMiddleware(invalidEvent, mockNext);

      expect(invalidEvent.cancelled).toBe(true);
      expect(invalidEvent.propagation).toBe(false);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[Event] Invalid event structure',
        invalidEvent
      );
    });

    it('should cancel events with invalid type format', async () => {
      const invalidEvent = { ...mockEvent, type: 'invalid type with spaces!' };

      await validationMiddleware(invalidEvent, mockNext);

      expect(invalidEvent.cancelled).toBe(true);
      expect(invalidEvent.propagation).toBe(false);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[Event] Invalid event type format',
        'invalid type with spaces!'
      );
    });
  });

  describe('createPermissionMiddleware', () => {
    it('should allow events from authorized sources', async () => {
      const middleware = createPermissionMiddleware(['test-plugin', 'system']);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.cancelled).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block events from unauthorized sources', async () => {
      const middleware = createPermissionMiddleware(['system']);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.cancelled).toBe(true);
      expect(mockEvent.propagation).toBe(false);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[Event] Unauthorized event source',
        expect.objectContaining({
          source: 'test-plugin',
          allowedSources: ['system'],
        })
      );
    });

    it('should allow events matching type patterns', async () => {
      const middleware = createPermissionMiddleware([], ['test:*', 'system:*']);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.cancelled).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block events not matching type patterns', async () => {
      const middleware = createPermissionMiddleware([], ['system:*']);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.cancelled).toBe(true);
      expect(mockEvent.propagation).toBe(false);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should allow events within rate limit', async () => {
      const middleware = createRateLimitMiddleware(5, 1000);

      // 发送 3 个事件，应该都被允许
      for (let i = 0; i < 3; i++) {
        const event = { ...mockEvent, id: `event-${i}` };
        await middleware(event, mockNext);
        expect(event.cancelled).toBe(false);
      }

      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should block events exceeding rate limit', async () => {
      const middleware = createRateLimitMiddleware(2, 1000);

      // 发送 3 个事件，第 3 个应该被阻止
      for (let i = 0; i < 3; i++) {
        const event = { ...mockEvent, id: `event-${i}` };
        await middleware(event, mockNext);
        
        if (i < 2) {
          expect(event.cancelled).toBe(false);
        } else {
          expect(event.cancelled).toBe(true);
          expect(event.propagation).toBe(false);
        }
      }

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[Event] Rate limit exceeded',
        expect.objectContaining({
          source: 'test-plugin',
          type: 'test:event',
          count: 3,
          limit: 2,
        })
      );
    });
  });

  describe('createDeduplicationMiddleware', () => {
    it('should allow first occurrence of event', async () => {
      const middleware = createDeduplicationMiddleware(1000);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.cancelled).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block duplicate events within window', async () => {
      const middleware = createDeduplicationMiddleware(1000);

      // 第一个事件
      await middleware(mockEvent, mockNext);
      expect(mockEvent.cancelled).toBe(false);

      // 重复事件
      const duplicateEvent = { ...mockEvent, id: 'different-id' };
      await middleware(duplicateEvent, mockNext);

      expect(duplicateEvent.cancelled).toBe(true);
      expect(duplicateEvent.propagation).toBe(false);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith(
        '[Event] Duplicate event detected',
        expect.objectContaining({
          hash: expect.any(String),
          timeSinceLastEvent: expect.any(Number),
        })
      );
    });
  });

  describe('createDataTransformMiddleware', () => {
    it('should transform event data correctly', async () => {
      const transformer = (data: any) => ({
        ...data,
        transformed: true,
        timestamp: Date.now(),
      });

      const middleware = createDataTransformMiddleware(transformer);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.data).toMatchObject({
        message: 'test',
        transformed: true,
        timestamp: expect.any(Number),
      });
      expect(mockEvent.cancelled).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle transformation errors', async () => {
      const faultyTransformer = () => {
        throw new Error('Transformation failed');
      };

      const middleware = createDataTransformMiddleware(faultyTransformer);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.cancelled).toBe(true);
      expect(mockEvent.propagation).toBe(false);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[Event] Data transformation failed',
        expect.objectContaining({
          eventId: 'test-event-1',
          error: expect.any(Error),
        })
      );
    });
  });

  describe('createAsyncEnhanceMiddleware', () => {
    it('should enhance event data asynchronously', async () => {
      const enhancer = async (event: LifeBoxEvent) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { data: { ...event.data, enhanced: true } };
      };

      const middleware = createAsyncEnhanceMiddleware(enhancer);

      await middleware(mockEvent, mockNext);

      expect(mockEvent.data).toMatchObject({
        message: 'test',
        enhanced: true,
      });
      expect(mockEvent.cancelled).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle enhancement errors gracefully', async () => {
      const faultyEnhancer = async () => {
        throw new Error('Enhancement failed');
      };

      const middleware = createAsyncEnhanceMiddleware(faultyEnhancer);

      await middleware(mockEvent, mockNext);

      // 增强失败不应该取消事件
      expect(mockEvent.cancelled).toBe(false);
      expect(mockNext).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[Event] Async enhancement failed',
        expect.objectContaining({
          eventId: 'test-event-1',
          error: expect.any(Error),
        })
      );
    });
  });

  describe('errorHandlingMiddleware', () => {
    it('should handle next() errors', async () => {
      const errorNext = vi.fn(() => {
        throw new Error('Middleware error');
      });

      await errorHandlingMiddleware(mockEvent, errorNext);

      expect(errorNext).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[Event] Middleware error',
        expect.objectContaining({
          eventId: 'test-event-1',
          eventType: 'test:event',
          error: expect.any(Error),
        })
      );
    });

    it('should emit error events if LifeBoxAPI is available', async () => {
      const mockEmit = vi.fn();
      (global as any).window = {
        LifeBoxAPI: {
          events: {
            emit: mockEmit,
          },
        },
      };

      const errorNext = vi.fn(() => {
        throw new Error('Test error');
      });

      await errorHandlingMiddleware(mockEvent, errorNext);

      expect(mockEmit).toHaveBeenCalledWith(
        'system:middleware-error',
        expect.objectContaining({
          originalEventId: 'test-event-1',
          originalEventType: 'test:event',
          error: 'Test error',
          timestamp: expect.any(Number),
        })
      );

      delete (global as any).window;
    });
  });

  describe('createPerformanceMiddleware', () => {
    it('should warn about slow events', async () => {
      let performanceTime = 0;
      (global.performance.now as Mock).mockImplementation(() => performanceTime);

      const slowNext = vi.fn(async () => {
        performanceTime = 1500; // 模拟 1.5 秒的处理时间
      });

      const middleware = createPerformanceMiddleware(1000);

      await middleware(mockEvent, slowNext);

      expect(slowNext).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[Event] Slow event detected',
        expect.objectContaining({
          eventId: 'test-event-1',
          eventType: 'test:event',
          duration: '1500.00ms',
          threshold: '1000ms',
        })
      );
    });

    it('should emit performance events if LifeBoxAPI is available', async () => {
      const mockEmit = vi.fn();
      (global as any).window = {
        LifeBoxAPI: {
          events: {
            emit: mockEmit,
          },
        },
      };

      let performanceTime = 0;
      (global.performance.now as Mock).mockImplementation(() => performanceTime);

      const fastNext = vi.fn(() => {
        performanceTime = 100;
      });

      const middleware = createPerformanceMiddleware();

      await middleware(mockEvent, fastNext);

      expect(mockEmit).toHaveBeenCalledWith(
        'system:event-performance',
        expect.objectContaining({
          eventId: 'test-event-1',
          eventType: 'test:event',
          duration: 100,
          timestamp: expect.any(Number),
        })
      );

      delete (global as any).window;
    });
  });

  describe('createStandardMiddleware', () => {
    it('should create standard middleware stack', () => {
      const middlewares = createStandardMiddleware({
        enableLogging: true,
        enableValidation: true,
        enableErrorHandling: true,
        enablePerformanceMonitoring: true,
        rateLimit: 10,
        deduplicationWindow: 1000,
      });

      expect(middlewares).toHaveLength(5); // error, validation, rate limit, deduplication, performance
    });

    it('should respect disabled options', () => {
      const middlewares = createStandardMiddleware({
        enableLogging: false,
        enableValidation: false,
        enableErrorHandling: false,
        enablePerformanceMonitoring: false,
      });

      expect(middlewares).toHaveLength(0);
    });

    it('should include optional middlewares when configured', () => {
      const middlewares = createStandardMiddleware({
        rateLimit: 5,
        rateLimitWindow: 2000,
        deduplicationWindow: 1000,
      });

      expect(middlewares.length).toBeGreaterThan(3);
    });
  });
});