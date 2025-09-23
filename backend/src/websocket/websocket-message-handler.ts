import { WSMessage, WebSocketMessageHandler, WebSocketHandlerConfig } from '@lifebox/shared';
import { WebSocket } from 'ws';

/**
 * WebSocket 消息处理器管理类
 * 提供注册、注销和路由消息处理器的功能
 */
export class WebSocketMessageHandlerManager {
  private handlers = new Map<string, WebSocketMessageHandler[]>();
  private handlerConfigs = new Map<string, WebSocketHandlerConfig[]>();

  /**
   * 注册消息处理器
   * @param config 处理器配置
   */
  register<T = any>(config: WebSocketHandlerConfig<T>): void {
    const { type, handler, priority = 0 } = config;

    // 获取现有处理器列表
    const existingHandlers = this.handlers.get(type) || [];
    const existingConfigs = this.handlerConfigs.get(type) || [];

    // 添加新的处理器和配置
    existingHandlers.push(handler as WebSocketMessageHandler);
    existingConfigs.push(config);

    // 按优先级排序（优先级高的在前）
    const sortedConfigs = existingConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const sortedHandlers = sortedConfigs.map(config => config.handler);

    // 更新存储
    this.handlers.set(type, sortedHandlers);
    this.handlerConfigs.set(type, sortedConfigs);

    console.log(`📝 Registered WebSocket handler for type: ${type} (priority: ${priority})`);
  }

  /**
   * 注销消息处理器
   * @param type 消息类型
   * @param handler 要注销的处理器函数（可选，不提供则注销该类型的所有处理器）
   */
  unregister(type: string, handler?: WebSocketMessageHandler): void {
    if (!handler) {
      // 注销该类型的所有处理器
      this.handlers.delete(type);
      this.handlerConfigs.delete(type);
      console.log(`🗑️ Unregistered all WebSocket handlers for type: ${type}`);
      return;
    }

    // 注销特定的处理器
    const existingHandlers = this.handlers.get(type) || [];
    const existingConfigs = this.handlerConfigs.get(type) || [];

    const handlerIndex = existingHandlers.indexOf(handler);
    if (handlerIndex > -1) {
      existingHandlers.splice(handlerIndex, 1);
      existingConfigs.splice(handlerIndex, 1);

      if (existingHandlers.length === 0) {
        this.handlers.delete(type);
        this.handlerConfigs.delete(type);
      } else {
        this.handlers.set(type, existingHandlers);
        this.handlerConfigs.set(type, existingConfigs);
      }

      console.log(`🗑️ Unregistered WebSocket handler for type: ${type}`);
    }
  }

  /**
   * 处理WebSocket消息
   * @param ws WebSocket连接
   * @param message 消息对象
   */
  async handleMessage(ws: WebSocket, message: WSMessage): Promise<void> {
    const handlers = this.handlers.get(message.type);

    if (!handlers || handlers.length === 0) {
      console.warn(`⚠️ No handlers registered for message type: ${message.type}`);
      return;
    }

    console.log(`📨 Processing message type: ${message.type} with ${handlers.length} handler(s)`);

    // 按优先级顺序执行所有处理器
    for (const handler of handlers) {
      try {
        await handler(message.data, message);
      } catch (error) {
        console.error(`❌ Error in WebSocket handler for type ${message.type}:`, error);

        // 发送错误消息给客户端
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Handler error',
              code: 'HANDLER_ERROR',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }

  /**
   * 获取已注册的消息类型列表
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 获取指定类型的处理器数量
   */
  getHandlerCount(type: string): number {
    return this.handlers.get(type)?.length || 0;
  }

  /**
   * 清除所有处理器
   */
  clear(): void {
    this.handlers.clear();
    this.handlerConfigs.clear();
    console.log('🧹 Cleared all WebSocket handlers');
  }
}

// 导出单例实例
export const messageHandlerManager = new WebSocketMessageHandlerManager();