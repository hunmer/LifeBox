/**
 * LifeBox 事件中间件集合
 * 
 * 提供常用的事件中间件实现，包括日志记录、权限检查、
 * 事件验证、频率限制等功能。
 */

import type { LifeBoxEvent, EventMiddleware } from '@lifebox/shared';

/**
 * 日志记录中间件
 */
export const loggingMiddleware: EventMiddleware = async (event: LifeBoxEvent, next: () => void) => {
  const startTime = performance.now();
  
  console.log(`[Event] ${event.type} started`, {
    id: event.id,
    source: event.source,
    timestamp: new Date(event.timestamp).toISOString(),
  });

  await next();

  const duration = performance.now() - startTime;
  console.log(`[Event] ${event.type} completed in ${duration.toFixed(2)}ms`, {
    id: event.id,
    cancelled: event.cancelled,
  });
};

/**
 * 事件验证中间件
 */
export const validationMiddleware: EventMiddleware = async (event: LifeBoxEvent, next: () => void) => {
  // 基本验证
  if (!event.id || !event.type || !event.source) {
    console.error('[Event] Invalid event structure', event);
    event.cancelled = true;
    event.propagation = false;
    return;
  }

  // 检查事件类型格式
  if (!/^[a-zA-Z0-9-_:]+$/.test(event.type)) {
    console.error('[Event] Invalid event type format', event.type);
    event.cancelled = true;
    event.propagation = false;
    return;
  }

  await next();
};

/**
 * 权限检查中间件工厂
 */
export const createPermissionMiddleware = (
  allowedSources: string[] = [],
  allowedEventTypes: string[] = []
): EventMiddleware => {
  return async (event: LifeBoxEvent, next: () => void) => {
    // 检查事件源权限
    if (allowedSources.length > 0 && !allowedSources.includes(event.source)) {
      console.warn('[Event] Unauthorized event source', {
        source: event.source,
        allowedSources,
      });
      event.cancelled = true;
      event.propagation = false;
      return;
    }

    // 检查事件类型权限
    if (allowedEventTypes.length > 0) {
      const isAllowed = allowedEventTypes.some(pattern => {
        // 支持通配符匹配
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(event.type);
      });

      if (!isAllowed) {
        console.warn('[Event] Unauthorized event type', {
          type: event.type,
          allowedEventTypes,
        });
        event.cancelled = true;
        event.propagation = false;
        return;
      }
    }

    await next();
  };
};

/**
 * 频率限制中间件工厂
 */
export const createRateLimitMiddleware = (
  maxEventsPerSecond: number = 100,
  windowSizeMs: number = 1000
): EventMiddleware => {
  const eventCounts: Map<string, { count: number; windowStart: number }> = new Map();

  return async (event: LifeBoxEvent, next: () => void) => {
    const now = Date.now();
    const key = `${event.source}:${event.type}`;
    const existing = eventCounts.get(key);

    if (!existing || (now - existing.windowStart) >= windowSizeMs) {
      // 新窗口或第一次记录
      eventCounts.set(key, { count: 1, windowStart: now });
    } else {
      // 在当前窗口内
      existing.count++;
      
      if (existing.count > maxEventsPerSecond) {
        console.warn('[Event] Rate limit exceeded', {
          source: event.source,
          type: event.type,
          count: existing.count,
          limit: maxEventsPerSecond,
        });
        event.cancelled = true;
        event.propagation = false;
        return;
      }
    }

    await next();
  };
};

/**
 * 事件去重中间件
 */
export const createDeduplicationMiddleware = (
  windowSizeMs: number = 5000
): EventMiddleware => {
  const eventHashes: Map<string, number> = new Map();

  const createEventHash = (event: LifeBoxEvent): string => {
    return `${event.type}:${event.source}:${JSON.stringify(event.data)}`;
  };

  return async (event: LifeBoxEvent, next: () => void) => {
    const hash = createEventHash(event);
    const now = Date.now();
    const lastTime = eventHashes.get(hash);

    if (lastTime && (now - lastTime) < windowSizeMs) {
      console.debug('[Event] Duplicate event detected', {
        hash,
        timeSinceLastEvent: now - lastTime,
      });
      event.cancelled = true;
      event.propagation = false;
      return;
    }

    eventHashes.set(hash, now);

    // 清理过期的哈希
    for (const [key, timestamp] of eventHashes.entries()) {
      if (now - timestamp > windowSizeMs) {
        eventHashes.delete(key);
      }
    }

    await next();
  };
};

/**
 * 数据转换中间件工厂
 */
export const createDataTransformMiddleware = (
  transformer: (data: any) => any
): EventMiddleware => {
  return async (event: LifeBoxEvent, next: () => void) => {
    try {
      event.data = transformer(event.data);
    } catch (error) {
      console.error('[Event] Data transformation failed', {
        eventId: event.id,
        error,
      });
      event.cancelled = true;
      event.propagation = false;
      return;
    }

    await next();
  };
};

/**
 * 异步数据增强中间件工厂
 */
export const createAsyncEnhanceMiddleware = (
  enhancer: (event: LifeBoxEvent) => Promise<Partial<LifeBoxEvent>>
): EventMiddleware => {
  return async (event: LifeBoxEvent, next: () => void) => {
    try {
      const enhancements = await enhancer(event);
      Object.assign(event, enhancements);
    } catch (error) {
      console.error('[Event] Async enhancement failed', {
        eventId: event.id,
        error,
      });
      // 增强失败不取消事件，只记录错误
    }

    await next();
  };
};

/**
 * 错误处理中间件
 */
export const errorHandlingMiddleware: EventMiddleware = async (event: LifeBoxEvent, next: () => void) => {
  try {
    await next();
  } catch (error) {
    console.error('[Event] Middleware error', {
      eventId: event.id,
      eventType: event.type,
      error,
    });
    
    // 发送错误事件
    // 注意：这里需要避免无限循环，所以使用直接的 emit
    if (typeof window !== 'undefined' && (window as any).LifeBoxAPI?.events) {
      (window as any).LifeBoxAPI.events.emit('system:middleware-error', {
        originalEventId: event.id,
        originalEventType: event.type,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  }
};

/**
 * 性能监控中间件
 */
export const createPerformanceMiddleware = (
  slowEventThresholdMs: number = 1000
): EventMiddleware => {
  return async (event: LifeBoxEvent, next: () => void) => {
    const startTime = performance.now();
    
    await next();
    
    const duration = performance.now() - startTime;
    
    if (duration > slowEventThresholdMs) {
      console.warn('[Event] Slow event detected', {
        eventId: event.id,
        eventType: event.type,
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${slowEventThresholdMs}ms`,
      });
    }

    // 记录性能指标
    if (typeof window !== 'undefined' && (window as any).LifeBoxAPI?.events) {
      (window as any).LifeBoxAPI.events.emit('system:event-performance', {
        eventId: event.id,
        eventType: event.type,
        duration,
        timestamp: Date.now(),
      });
    }
  };
};

/**
 * 常用中间件组合
 */
export const createStandardMiddleware = (options: {
  enableLogging?: boolean;
  enableValidation?: boolean;
  enableErrorHandling?: boolean;
  enablePerformanceMonitoring?: boolean;
  performanceThreshold?: number;
  rateLimit?: number;
  rateLimitWindow?: number;
  deduplicationWindow?: number;
} = {}): EventMiddleware[] => {
  const middlewares: EventMiddleware[] = [];

  if (options.enableErrorHandling !== false) {
    middlewares.push(errorHandlingMiddleware);
  }

  if (options.enableValidation !== false) {
    middlewares.push(validationMiddleware);
  }

  if (options.rateLimit) {
    middlewares.push(createRateLimitMiddleware(
      options.rateLimit,
      options.rateLimitWindow
    ));
  }

  if (options.deduplicationWindow) {
    middlewares.push(createDeduplicationMiddleware(options.deduplicationWindow));
  }

  if (options.enablePerformanceMonitoring !== false) {
    middlewares.push(createPerformanceMiddleware(
      options.performanceThreshold || 1000
    ));
  }

  if (options.enableLogging !== false && process.env.NODE_ENV === 'development') {
    middlewares.push(loggingMiddleware);
  }

  return middlewares;
};