import { WebSocketServer, WebSocket } from 'ws';
import { messageHandlerManager } from './websocket-message-handler.js';
import {
  WSMessage,
  WebSocketMessageTypes,
  ConnectionMessageData,
  ErrorMessageData
} from '@lifebox/shared';
import { eventBus } from '@/events/event-bus.js';

interface ExtendedWebSocket extends WebSocket {
  id?: string;
  isAlive?: boolean;
  subscriptions?: Set<string>;
  metadata?: Record<string, any>;
}

/**
 * 增强的 WebSocket 服务器
 * 支持自定义消息处理器注册和JSON消息路由
 */
export class EnhancedWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Set<ExtendedWebSocket>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.setupDefaultHandlers();
    this.startHeartbeat();

    console.log(`🚀 Enhanced WebSocket server started on port ${port}`);
  }

  /**
   * 设置服务器事件监听器
   */
  private setupServer(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('close', () => {
      this.cleanup();
    });
  }

  /**
   * 处理新的WebSocket连接
   */
  private handleConnection(ws: ExtendedWebSocket, req: any): void {
    // 初始化客户端
    ws.id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    ws.isAlive = true;
    ws.subscriptions = new Set(['*']);
    ws.metadata = {
      connectedAt: new Date().toISOString(),
      remoteAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    this.clients.add(ws);

    console.log(`🔌 New WebSocket connection: ${ws.id} from ${req.socket.remoteAddress}`);

    // 发送连接确认消息
    this.sendToClient(ws, {
      type: WebSocketMessageTypes.CONNECTION,
      data: {
        clientId: ws.id,
        timestamp: new Date().toISOString(),
        message: 'Connected to LifeBox Enhanced WebSocket server'
      } as ConnectionMessageData,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    });

    // 设置事件监听器
    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('close', () => this.handleDisconnection(ws));
    ws.on('error', (error) => this.handleError(ws, error));

    // 触发连接事件
    eventBus.emitEvent('websocket.client.connected', {
      clientId: ws.id,
      metadata: ws.metadata
    }, 'websocket');
  }

  /**
   * 处理WebSocket消息
   */
  private async handleMessage(ws: ExtendedWebSocket, data: any): Promise<void> {
    try {
      const rawMessage = data.toString();
      const message: WSMessage = JSON.parse(rawMessage);

      // 验证消息格式
      if (!message.type || typeof message.type !== 'string') {
        throw new Error('Invalid message format: missing or invalid type');
      }

      // 添加消息元数据
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }
      if (!message.id) {
        message.id = this.generateMessageId();
      }

      console.log(`📨 Received message from ${ws.id}: ${message.type}`);

      // 使用消息处理器管理器处理消息
      await messageHandlerManager.handleMessage(ws, message);

    } catch (error) {
      console.error(`❌ Error processing message from ${ws.id}:`, error);

      this.sendToClient(ws, {
        type: WebSocketMessageTypes.ERROR,
        data: {
          message: error instanceof Error ? error.message : 'Message processing error',
          code: 'MESSAGE_PROCESSING_ERROR'
        } as ErrorMessageData,
        timestamp: new Date().toISOString(),
        id: this.generateMessageId()
      });
    }
  }

  /**
   * 处理客户端断开连接
   */
  private handleDisconnection(ws: ExtendedWebSocket): void {
    console.log(`🔌 Client ${ws.id} disconnected`);

    this.clients.delete(ws);

    // 触发断开连接事件
    eventBus.emitEvent('websocket.client.disconnected', {
      clientId: ws.id
    }, 'websocket');
  }

  /**
   * 处理WebSocket错误
   */
  private handleError(ws: ExtendedWebSocket, error: Error): void {
    console.error(`❌ WebSocket error for client ${ws.id}:`, error);

    this.clients.delete(ws);

    // 触发错误事件
    eventBus.emitEvent('websocket.client.error', {
      clientId: ws.id,
      error: error.message
    }, 'websocket');
  }

  /**
   * 设置默认消息处理器
   */
  private setupDefaultHandlers(): void {
    // 心跳处理器
    messageHandlerManager.register({
      type: WebSocketMessageTypes.PING,
      handler: (data, message) => {
        const ws = this.findClientById(message.id || '');
        if (ws) {
          this.sendToClient(ws, {
            type: WebSocketMessageTypes.PONG,
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString(),
            id: this.generateMessageId()
          });
        }
      },
      priority: 1000
    });

    // 订阅处理器
    messageHandlerManager.register({
      type: WebSocketMessageTypes.SUBSCRIBE,
      handler: (data: { eventTypes: string[] }, message) => {
        const ws = this.findClientById(message.id || '');
        if (ws && data.eventTypes && Array.isArray(data.eventTypes)) {
          ws.subscriptions = new Set(data.eventTypes);
          this.sendToClient(ws, {
            type: 'subscribed',
            data: { eventTypes: data.eventTypes },
            timestamp: new Date().toISOString(),
            id: this.generateMessageId()
          });
        }
      },
      priority: 100
    });

    // 取消订阅处理器
    messageHandlerManager.register({
      type: WebSocketMessageTypes.UNSUBSCRIBE,
      handler: (data: { eventTypes: string[] }, message) => {
        const ws = this.findClientById(message.id || '');
        if (ws && data.eventTypes && Array.isArray(data.eventTypes)) {
          data.eventTypes.forEach(eventType => {
            ws.subscriptions?.delete(eventType);
          });
          this.sendToClient(ws, {
            type: 'unsubscribed',
            data: { eventTypes: data.eventTypes },
            timestamp: new Date().toISOString(),
            id: this.generateMessageId()
          });
        }
      },
      priority: 100
    });
  }

  /**
   * 向指定客户端发送消息
   */
  public sendToClient(ws: ExtendedWebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 向指定客户端ID发送消息
   */
  public sendToClientById(clientId: string, message: WSMessage): boolean {
    const client = this.findClientById(clientId);
    if (client) {
      this.sendToClient(client, message);
      return true;
    }
    return false;
  }

  /**
   * 广播消息给所有客户端
   */
  public broadcast(message: WSMessage, excludeClientId?: string): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.id !== excludeClientId) {
        client.send(messageStr);
      }
    });
  }

  /**
   * 根据订阅广播事件
   */
  public broadcastEvent(eventType: string, data: any): void {
    const message: WSMessage = {
      type: WebSocketMessageTypes.EVENT,
      data: { eventType, data },
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        const isSubscribed = client.subscriptions?.has('*') ||
                            client.subscriptions?.has(eventType);
        if (isSubscribed) {
          client.send(messageStr);
        }
      }
    });
  }

  /**
   * 获取消息处理器管理器（用于外部注册处理器）
   */
  public getMessageHandlerManager() {
    return messageHandlerManager;
  }

  /**
   * 注册消息处理器的便捷方法
   */
  public registerHandler = messageHandlerManager.register.bind(messageHandlerManager);

  /**
   * 注销消息处理器的便捷方法
   */
  public unregisterHandler = messageHandlerManager.unregister.bind(messageHandlerManager);

  /**
   * 根据客户端ID查找客户端
   */
  private findClientById(clientId: string): ExtendedWebSocket | undefined {
    for (const client of this.clients) {
      if (client.id === clientId) {
        return client;
      }
    }
    return undefined;
  }

  /**
   * 生成唯一消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach(client => {
        if (!client.isAlive) {
          console.log(`💀 Terminating dead connection: ${client.id}`);
          this.clients.delete(client);
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
  }

  /**
   * 获取连接的客户端信息
   */
  public getConnectedClients(): Array<{ id: string; metadata: Record<string, any> }> {
    return Array.from(this.clients).map(client => ({
      id: client.id!,
      metadata: client.metadata || {}
    }));
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clients.clear();
    messageHandlerManager.clear();
    console.log('🧹 Enhanced WebSocket server cleaned up');
  }

  /**
   * 关闭服务器
   */
  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.cleanup();
      this.wss.close(() => {
        console.log('🔒 Enhanced WebSocket server closed');
        resolve();
      });
    });
  }

  /**
   * 获取原始WebSocket服务器实例
   */
  public getWebSocketServer(): WebSocketServer {
    return this.wss;
  }
}