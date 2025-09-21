/**
 * EventBus 单元测试
 * 
 * 测试事件总线的核心功能，包括事件发布订阅、中间件处理、
 * 事件取消和修改、统计信息等功能。
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { EventBus } from '../../../src/lib/events/event-bus';
import type { LifeBoxEvent, EventMiddleware } from '@lifebox/shared';

// Mock fetch for backend communication
global.fetch = vi.fn();

describe('EventBus', () => {
  let eventBus: EventBus;
  let mockHandler: Mock;
  let mockMiddleware: Mock;

  beforeEach(() => {
    eventBus = new EventBus({
      debug: false,
      enableHistory: true,
      maxHistorySize: 100,
      maxListeners: 50,
    });

    mockHandler = vi.fn();
    mockMiddleware = vi.fn();

    // Reset fetch mock
    (global.fetch as Mock).mockReset();
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    eventBus.destroy();
  });

  describe('基本事件发布订阅', () => {
    it('should emit and handle events correctly', async () => {
      // 注册事件监听器
      eventBus.onLifeBoxEvent({
        type: 'test:event',
        handler: mockHandler,
      });

      // 发送事件
      const event = await eventBus.emitLifeBoxEvent('test:event', { message: 'hello' });

      // 验证事件结构
      expect(event).toMatchObject({
        type: 'test:event',
        data: { message: 'hello' },
        source: 'system',
        cancelled: false,
        propagation: true,
      });

      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();

      // 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证处理器被调用
      expect(mockHandler).toHaveBeenCalledWith(event);
    });

    it('should handle multiple listeners for the same event', async () => {
      const mockHandler2 = vi.fn();

      eventBus.onLifeBoxEvent({
        type: 'test:multiple',
        handler: mockHandler,
      });

      eventBus.onLifeBoxEvent({
        type: 'test:multiple',
        handler: mockHandler2,
      });

      await eventBus.emitLifeBoxEvent('test:multiple', { test: true });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler2).toHaveBeenCalled();
    });

    it('should handle one-time listeners correctly', async () => {
      eventBus.onLifeBoxEvent({
        type: 'test:once',
        handler: mockHandler,
        once: true,
      });

      // 发送第一个事件
      await eventBus.emitLifeBoxEvent('test:once', { first: true });
      await new Promise(resolve => setTimeout(resolve, 0));

      // 发送第二个事件
      await eventBus.emitLifeBoxEvent('test:once', { second: true });
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证处理器只被调用一次
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('中间件功能', () => {
    it('should process middleware in order', async () => {
      const order: number[] = [];

      const middleware1: EventMiddleware = async (event, next) => {
        order.push(1);
        await next();
        order.push(4);
      };

      const middleware2: EventMiddleware = async (event, next) => {
        order.push(2);
        await next();
        order.push(3);
      };

      eventBus.use(middleware1);
      eventBus.use(middleware2);

      await eventBus.emitLifeBoxEvent('test:middleware', {});

      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('should allow middleware to modify event data', async () => {
      const modifyMiddleware: EventMiddleware = async (event, next) => {
        event.data.modified = true;
        await next();
      };

      eventBus.use(modifyMiddleware);
      eventBus.onLifeBoxEvent({
        type: 'test:modify',
        handler: mockHandler,
      });

      await eventBus.emitLifeBoxEvent('test:modify', { original: true });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { original: true, modified: true },
        })
      );
    });

    it('should allow middleware to cancel events', async () => {
      const cancelMiddleware: EventMiddleware = async (event, next) => {
        if (event.data.shouldCancel) {
          event.cancelled = true;
          event.propagation = false;
        }
        await next();
      };

      eventBus.use(cancelMiddleware);
      eventBus.onLifeBoxEvent({
        type: 'test:cancel',
        handler: mockHandler,
      });

      // 发送会被取消的事件
      await eventBus.emitLifeBoxEvent('test:cancel', { shouldCancel: true });
      await new Promise(resolve => setTimeout(resolve, 0));

      // 发送不会被取消的事件
      await eventBus.emitLifeBoxEvent('test:cancel', { shouldCancel: false });
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证只有未被取消的事件被处理
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('事件取消和修改', () => {
    it('should cancel events correctly', async () => {
      eventBus.onLifeBoxEvent({
        type: 'test:cancel-method',
        handler: mockHandler,
      });

      const event = await eventBus.emitLifeBoxEvent('test:cancel-method', {});
      eventBus.cancelEvent(event);

      expect(event.cancelled).toBe(true);
      expect(event.propagation).toBe(false);
    });

    it('should modify event data correctly', async () => {
      const event = await eventBus.emitLifeBoxEvent('test:modify-method', { original: true });

      eventBus.modifyEventData(event, { added: true, original: false });

      expect(event.data).toEqual({ original: false, added: true });
    });

    it('should stop event propagation correctly', async () => {
      const event = await eventBus.emitLifeBoxEvent('test:stop-propagation', {});

      eventBus.stopPropagation(event);

      expect(event.propagation).toBe(false);
      expect(event.cancelled).toBe(false);
    });
  });

  describe('过滤器和转换器', () => {
    it('should apply event filters correctly', async () => {
      // 添加过滤器，只允许特定类型的事件
      eventBus.addFilter((event) => event.type.startsWith('allowed:'));

      eventBus.onLifeBoxEvent({
        type: 'allowed:event',
        handler: mockHandler,
      });

      eventBus.onLifeBoxEvent({
        type: 'blocked:event',
        handler: mockHandler,
      });

      // 发送允许的事件
      await eventBus.emitLifeBoxEvent('allowed:event', {});
      await new Promise(resolve => setTimeout(resolve, 0));

      // 发送被阻止的事件
      await eventBus.emitLifeBoxEvent('blocked:event', {});
      await new Promise(resolve => setTimeout(resolve, 0));

      // 只有允许的事件应该被处理
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should apply event transformers correctly', async () => {
      // 添加转换器，为所有事件添加时间戳
      eventBus.addTransformer((event) => ({
        ...event,
        data: {
          ...event.data,
          transformedAt: Date.now(),
        },
      }));

      eventBus.onLifeBoxEvent({
        type: 'test:transform',
        handler: mockHandler,
      });

      await eventBus.emitLifeBoxEvent('test:transform', { original: true });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            original: true,
            transformedAt: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('统计信息', () => {
    it('should track event statistics correctly', async () => {
      // 发送多个事件
      await eventBus.emitLifeBoxEvent('type1', {});
      await eventBus.emitLifeBoxEvent('type1', {});
      await eventBus.emitLifeBoxEvent('type2', {});

      // 取消一个事件
      const cancelMiddleware: EventMiddleware = async (event, next) => {
        if (event.type === 'type3') {
          event.cancelled = true;
        }
        await next();
      };

      eventBus.use(cancelMiddleware);
      await eventBus.emitLifeBoxEvent('type3', {});

      const stats = eventBus.getStats();

      expect(stats.totalEvents).toBe(4);
      expect(stats.cancelledEvents).toBe(1);
      expect(stats.eventTypeCounts).toEqual({
        type1: 2,
        type2: 1,
        type3: 1,
      });
    });

    it('should reset statistics correctly', () => {
      eventBus.resetStats();

      const stats = eventBus.getStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.cancelledEvents).toBe(0);
      expect(stats.eventTypeCounts).toEqual({});
    });
  });

  describe('历史记录', () => {
    it('should maintain event history', async () => {
      await eventBus.emitLifeBoxEvent('history1', { data: 1 });
      await eventBus.emitLifeBoxEvent('history2', { data: 2 });
      await eventBus.emitLifeBoxEvent('history3', { data: 3 });

      const history = eventBus.getHistory();

      expect(history).toHaveLength(3);
      expect(history[0].type).toBe('history1');
      expect(history[1].type).toBe('history2');
      expect(history[2].type).toBe('history3');
    });

    it('should limit history size', async () => {
      const smallEventBus = new EventBus({
        enableHistory: true,
        maxHistorySize: 2,
      });

      await smallEventBus.emitLifeBoxEvent('event1', {});
      await smallEventBus.emitLifeBoxEvent('event2', {});
      await smallEventBus.emitLifeBoxEvent('event3', {});

      const history = smallEventBus.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('event2');
      expect(history[1].type).toBe('event3');

      smallEventBus.destroy();
    });

    it('should clear history correctly', async () => {
      await eventBus.emitLifeBoxEvent('test', {});
      
      expect(eventBus.getHistory()).toHaveLength(1);
      
      eventBus.clearHistory();
      
      expect(eventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('后端同步', () => {
    it('should send events to backend', async () => {
      await eventBus.emitLifeBoxEvent('backend:sync', { test: true });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/events',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );
    });

    it('should handle backend sync failures gracefully', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

      // 这不应该抛出错误
      await expect(
        eventBus.emitLifeBoxEvent('backend:fail', {})
      ).resolves.toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('should handle handler errors gracefully', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      eventBus.onLifeBoxEvent({
        type: 'test:error',
        handler: errorHandler,
      });

      // 这不应该抛出错误
      await expect(
        eventBus.emitLifeBoxEvent('test:error', {})
      ).resolves.toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle async handler errors gracefully', async () => {
      const asyncErrorHandler = vi.fn(async () => {
        throw new Error('Async handler error');
      });

      eventBus.onLifeBoxEvent({
        type: 'test:async-error',
        handler: asyncErrorHandler,
      });

      await expect(
        eventBus.emitLifeBoxEvent('test:async-error', {})
      ).resolves.toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(asyncErrorHandler).toHaveBeenCalled();
    });
  });

  describe('销毁和清理', () => {
    it('should destroy correctly', () => {
      eventBus.onLifeBoxEvent({
        type: 'test',
        handler: mockHandler,
      });

      eventBus.use(mockMiddleware);

      const initialStats = eventBus.getStats();
      expect(initialStats.activeListeners).toBeGreaterThan(0);

      eventBus.destroy();

      // 验证清理后的状态
      expect(eventBus.listenerCount('test')).toBe(0);
      expect(eventBus.getHistory()).toHaveLength(0);
      
      const finalStats = eventBus.getStats();
      expect(finalStats.totalEvents).toBe(0);
      expect(finalStats.cancelledEvents).toBe(0);
    });
  });
});