/**
 * LifeBox 前端事件总线实现
 * 
 * 基于 EventEmitter 实现的事件总线，支持事件发布订阅、中间件处理、
 * 事件取消和修改、与后端的事件同步，为插件系统提供统一的事件通信机制。
 */

import { EventEmitter } from 'events';
import type {
  LifeBoxEvent,
  EventMiddleware,
  EventListenerConfig,
  EventBusConfig,
  EventStats,
  EventFactory,
  EventFilter,
  EventTransformer
} from '@lifebox/shared';

export class EventBus extends EventEmitter {
  private middlewares: EventMiddleware[] = [];
  private eventCounter = 0;
  private eventHistory: LifeBoxEvent[] = [];
  private config: Required<EventBusConfig>;
  private stats: EventStats;
  private eventFilters: EventFilter[] = [];
  private eventTransformers: EventTransformer[] = [];

  constructor(config: EventBusConfig = {}) {
    super();
    
    this.config = {
      maxListeners: config.maxListeners ?? 100,
      enableHistory: config.enableHistory ?? true,
      maxHistorySize: config.maxHistorySize ?? 1000,
      debug: config.debug ?? false,
    };

    this.stats = {
      totalEvents: 0,
      cancelledEvents: 0,
      activeListeners: 0,
      eventTypeCounts: {},
    };

    this.setMaxListeners(this.config.maxListeners);
    
    if (this.config.debug) {
      this.enableDebugMode();
    }
  }

  /**
   * 注册事件中间件
   */
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
    this.log('Middleware registered', { middlewareCount: this.middlewares.length });
  }

  /**
   * 添加事件过滤器
   */
  addFilter(filter: EventFilter): void {
    this.eventFilters.push(filter);
  }

  /**
   * 添加事件转换器
   */
  addTransformer(transformer: EventTransformer): void {
    this.eventTransformers.push(transformer);
  }

  /**
   * 发送 LifeBox 事件
   */
  async emitLifeBoxEvent(type: string, data: any, source: string = 'system'): Promise<LifeBoxEvent> {
    const event: LifeBoxEvent = this.createEvent(type, data, source);

    try {
      // 应用事件过滤器
      const shouldProcess = this.eventFilters.every(filter => filter(event));
      if (!shouldProcess) {
        this.log('Event filtered out', { eventId: event.id, type: event.type });
        return event;
      }

      // 应用事件转换器
      let transformedEvent = event;
      for (const transformer of this.eventTransformers) {
        transformedEvent = transformer(transformedEvent);
      }

      // 通过中间件处理事件
      await this.processMiddlewares(transformedEvent);

      // 如果事件没有被取消，则继续传播
      if (!transformedEvent.cancelled && transformedEvent.propagation) {
        this.emit(transformedEvent.type, transformedEvent);
        
        // 发送到后端
        await this.sendToBackend(transformedEvent);
      }

      // 更新统计信息
      this.updateStats(transformedEvent);

      // 添加到历史记录
      this.addToHistory(transformedEvent);

      this.log('Event emitted', { 
        eventId: transformedEvent.id, 
        type: transformedEvent.type, 
        cancelled: transformedEvent.cancelled 
      });

      return transformedEvent;
    } catch (error) {
      this.log('Error emitting event', { error, eventId: event.id });
      throw error;
    }
  }

  /**
   * 监听事件（支持配置）
   */
  onLifeBoxEvent(config: EventListenerConfig): void {
    const { type, handler, priority = 0, once = false } = config;

    const wrappedHandler = (event: LifeBoxEvent) => {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch(error => {
            this.log('Event handler error', { error, eventType: type });
          });
        }
      } catch (error) {
        this.log('Event handler error', { error, eventType: type });
      }
    };

    if (once) {
      this.once(type, wrappedHandler);
    } else {
      this.on(type, wrappedHandler);
    }

    this.stats.activeListeners++;
    this.log('Event listener registered', { type, priority, once });
  }

  /**
   * 取消事件
   */
  cancelEvent(event: LifeBoxEvent): void {
    event.cancelled = true;
    event.propagation = false;
    this.log('Event cancelled', { eventId: event.id, type: event.type });
  }

  /**
   * 修改事件数据
   */
  modifyEventData(event: LifeBoxEvent, newData: any): void {
    event.data = { ...event.data, ...newData };
    this.log('Event data modified', { eventId: event.id, type: event.type });
  }

  /**
   * 停止事件传播
   */
  stopPropagation(event: LifeBoxEvent): void {
    event.propagation = false;
    this.log('Event propagation stopped', { eventId: event.id, type: event.type });
  }

  /**
   * 获取事件统计信息
   */
  getStats(): EventStats {
    return { ...this.stats };
  }

  /**
   * 获取事件历史
   */
  getHistory(limit?: number): LifeBoxEvent[] {
    const history = [...this.eventHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * 清除事件历史
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.log('Event history cleared');
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalEvents: 0,
      cancelledEvents: 0,
      activeListeners: this.listenerCount('*'),
      eventTypeCounts: {},
    };
    this.log('Statistics reset');
  }

  /**
   * 销毁事件总线
   */
  destroy(): void {
    this.removeAllListeners();
    this.middlewares = [];
    this.eventFilters = [];
    this.eventTransformers = [];
    this.clearHistory();
    this.resetStats();
    this.log('EventBus destroyed');
  }

  /**
   * 创建事件工厂函数
   */
  createEventFactory(): EventFactory {
    return (type: string, data: any, source: string = 'system') => {
      return this.createEvent(type, data, source);
    };
  }

  /**
   * 处理中间件
   */
  private async processMiddlewares(event: LifeBoxEvent): Promise<void> {
    let middlewareIndex = 0;

    const next = async (): Promise<void> => {
      if (middlewareIndex >= this.middlewares.length) {
        return;
      }

      const middleware = this.middlewares[middlewareIndex++];
      await middleware(event, next);
    };

    await next();
  }

  /**
   * 创建事件对象
   */
  private createEvent(type: string, data: any, source: string): LifeBoxEvent {
    return {
      id: `event_${++this.eventCounter}_${Date.now()}`,
      type,
      data,
      source,
      timestamp: Date.now(),
      cancelled: false,
      propagation: true,
    };
  }

  /**
   * 发送事件到后端
   */
  private async sendToBackend(event: LifeBoxEvent): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Backend sync failed: ${response.status}`);
      }

      this.log('Event sent to backend', { eventId: event.id });
    } catch (error) {
      this.log('Failed to send event to backend', { error, eventId: event.id });
      // 不抛出错误，保持前端事件系统的可用性
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(event: LifeBoxEvent): void {
    this.stats.totalEvents++;
    
    if (event.cancelled) {
      this.stats.cancelledEvents++;
    }

    this.stats.eventTypeCounts[event.type] = 
      (this.stats.eventTypeCounts[event.type] || 0) + 1;
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(event: LifeBoxEvent): void {
    if (!this.config.enableHistory) {
      return;
    }

    this.eventHistory.push(event);

    // 限制历史记录大小
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxHistorySize);
    }
  }

  /**
   * 启用调试模式
   */
  private enableDebugMode(): void {
    this.on('newListener', (event, _listener) => {
      this.log('New listener added', { event });
    });

    this.on('removeListener', (event, _listener) => {
      this.log('Listener removed', { event });
    });
  }

  /**
   * 日志输出
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[EventBus] ${message}`, data || '');
    }
  }
}

// 创建默认的全局事件总线实例
export const globalEventBus = new EventBus({
  debug: process.env.NODE_ENV === 'development',
  enableHistory: true,
  maxHistorySize: 1000,
  maxListeners: 200,
});

// 导出类型
export type { 
  LifeBoxEvent, 
  EventHandler, 
  EventMiddleware, 
  EventListenerConfig,
  EventBusConfig,
  EventStats 
} from '@lifebox/shared';