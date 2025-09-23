import {
  WSMessage,
  WebSocketMessageHandler,
  WebSocketHandlerConfig,
  WebSocketState,
  WebSocketClientConfig,
  WebSocketMessageTypes,
  ConnectionMessageData
} from '@lifebox/shared';

/**
 * WebSocket 客户端消息处理器管理类
 */
class WebSocketMessageHandlerManager {
  private handlers = new Map<string, WebSocketMessageHandler[]>();
  private handlerConfigs = new Map<string, WebSocketHandlerConfig[]>();

  /**
   * 注册消息处理器
   */
  register<T = any>(config: WebSocketHandlerConfig<T>): void {
    const { type, handler, priority = 0 } = config;

    const existingHandlers = this.handlers.get(type) || [];
    const existingConfigs = this.handlerConfigs.get(type) || [];

    existingHandlers.push(handler as WebSocketMessageHandler);
    existingConfigs.push(config);

    // 按优先级排序
    const sortedConfigs = existingConfigs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const sortedHandlers = sortedConfigs.map(config => config.handler);

    this.handlers.set(type, sortedHandlers);
    this.handlerConfigs.set(type, sortedConfigs);

    console.log(`📝 Registered WebSocket handler for type: ${type} (priority: ${priority})`);
  }

  /**
   * 注销消息处理器
   */
  unregister(type: string, handler?: WebSocketMessageHandler): void {
    if (!handler) {
      this.handlers.delete(type);
      this.handlerConfigs.delete(type);
      console.log(`🗑️ Unregistered all WebSocket handlers for type: ${type}`);
      return;
    }

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
   * 处理消息
   */
  async handleMessage(message: WSMessage): Promise<void> {
    const handlers = this.handlers.get(message.type);

    if (!handlers || handlers.length === 0) {
      console.warn(`⚠️ No handlers registered for message type: ${message.type}`);
      return;
    }

    console.log(`📨 Processing message type: ${message.type} with ${handlers.length} handler(s)`);

    for (const handler of handlers) {
      try {
        await handler(message.data, message);
      } catch (error) {
        console.error(`❌ Error in WebSocket handler for type ${message.type}:`, error);
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
   * 清除所有处理器
   */
  clear(): void {
    this.handlers.clear();
    this.handlerConfigs.clear();
    console.log('🧹 Cleared all WebSocket handlers');
  }
}

/**
 * WebSocket 客户端类
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private messageHandlerManager = new WebSocketMessageHandlerManager();
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private clientId: string | null = null;

  // 状态变化监听器
  private stateListeners = new Set<(state: WebSocketState) => void>();

  constructor(config: WebSocketClientConfig) {
    this.config = {
      reconnect: {
        enabled: true,
        interval: 3000,
        maxAttempts: 5,
        ...config.reconnect
      },
      heartbeat: {
        enabled: true,
        interval: 30000,
        ...config.heartbeat
      },
      ...config
    };

    this.setupDefaultHandlers();
  }

  /**
   * 连接到WebSocket服务器
   */
  async connect(): Promise<void> {
    if (this.state === WebSocketState.CONNECTING || this.state === WebSocketState.CONNECTED) {
      console.warn('WebSocket is already connecting or connected');
      return;
    }

    this.setState(WebSocketState.CONNECTING);

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      console.log(`🔌 Connecting to WebSocket server: ${this.config.url}`);

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.setState(WebSocketState.ERROR);
      this.scheduleReconnect();
    }
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    this.clearTimers();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState(WebSocketState.DISCONNECTED);
    console.log('🔌 WebSocket disconnected');
  }

  /**
   * 发送消息
   */
  send<T = any>(type: string, data: T): void {
    if (this.state !== WebSocketState.CONNECTED) {
      console.warn('Cannot send message: WebSocket is not connected');
      return;
    }

    const message: WSMessage<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    };

    try {
      this.ws!.send(JSON.stringify(message));
      console.log(`📤 Sent message: ${type}`);
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
    }
  }

  /**
   * 注册消息处理器
   */
  register = this.messageHandlerManager.register.bind(this.messageHandlerManager);

  /**
   * 注销消息处理器
   */
  unregister = this.messageHandlerManager.unregister.bind(this.messageHandlerManager);

  /**
   * 订阅事件类型
   */
  subscribe(eventTypes: string[]): void {
    this.send(WebSocketMessageTypes.SUBSCRIBE, { eventTypes });
  }

  /**
   * 取消订阅事件类型
   */
  unsubscribe(eventTypes: string[]): void {
    this.send(WebSocketMessageTypes.UNSUBSCRIBE, { eventTypes });
  }

  /**
   * 添加状态变化监听器
   */
  onStateChange(listener: (state: WebSocketState) => void): () => void {
    this.stateListeners.add(listener);
    // 返回取消监听的函数
    return () => this.stateListeners.delete(listener);
  }

  /**
   * 获取当前状态
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * 获取客户端ID
   */
  getClientId(): string | null {
    return this.clientId;
  }

  /**
   * 处理WebSocket连接打开
   */
  private handleOpen(): void {
    console.log('🎉 WebSocket connection established');
    this.setState(WebSocketState.CONNECTED);
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  /**
   * 处理WebSocket消息
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      const message: WSMessage = JSON.parse(event.data);
      console.log(`📨 Received message: ${message.type}`);

      await this.messageHandlerManager.handleMessage(message);
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
    }
  }

  /**
   * 处理WebSocket连接关闭
   */
  private handleClose(): void {
    console.log('🔌 WebSocket connection closed');
    this.setState(WebSocketState.DISCONNECTED);
    this.clearTimers();
    this.scheduleReconnect();
  }

  /**
   * 处理WebSocket错误
   */
  private handleError(error: Event): void {
    console.error('❌ WebSocket error:', error);
    this.setState(WebSocketState.ERROR);
    this.scheduleReconnect();
  }

  /**
   * 设置状态并通知监听器
   */
  private setState(newState: WebSocketState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateListeners.forEach(listener => {
        try {
          listener(newState);
        } catch (error) {
          console.error('❌ Error in state change listener:', error);
        }
      });
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (!this.config.reconnect?.enabled) {
      return;
    }

    if (this.reconnectAttempts >= this.config.reconnect.maxAttempts) {
      console.error('❌ Maximum reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.reconnect.maxAttempts} in ${this.config.reconnect.interval}ms`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, this.config.reconnect.interval);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeat?.enabled) {
      return;
    }

    this.heartbeatTimer = window.setInterval(() => {
      this.send(WebSocketMessageTypes.PING, { timestamp: new Date().toISOString() });
    }, this.config.heartbeat.interval);
  }

  /**
   * 清除定时器
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 设置默认消息处理器
   */
  private setupDefaultHandlers(): void {
    // 连接确认处理器
    this.register({
      type: WebSocketMessageTypes.CONNECTION,
      handler: (data: ConnectionMessageData) => {
        this.clientId = data.clientId;
        console.log(`✅ Connected with client ID: ${data.clientId}`);
      },
      priority: 1000
    });

    // Pong 响应处理器
    this.register({
      type: WebSocketMessageTypes.PONG,
      handler: () => {
        console.log('💓 Received pong from server');
      },
      priority: 1000
    });

    // 错误消息处理器
    this.register({
      type: WebSocketMessageTypes.ERROR,
      handler: (data: { message: string; code?: string }) => {
        console.error(`❌ Server error: ${data.message} (${data.code || 'UNKNOWN'})`);
      },
      priority: 1000
    });
  }

  /**
   * 生成唯一消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    this.disconnect();
    this.messageHandlerManager.clear();
    this.stateListeners.clear();
    console.log('🧹 WebSocket client destroyed');
  }
}

// 创建默认的WebSocket客户端实例
let defaultClient: WebSocketClient | null = null;

/**
 * 获取默认WebSocket客户端实例
 */
export function getWebSocketClient(): WebSocketClient {
  if (!defaultClient) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    defaultClient = new WebSocketClient({ url: wsUrl });
  }
  return defaultClient;
}

/**
 * 初始化WebSocket连接
 */
export async function initWebSocket(): Promise<WebSocketClient> {
  const client = getWebSocketClient();
  await client.connect();
  return client;
}

/**
 * 便捷方法：注册消息处理器
 */
export function registerWebSocketHandler<T = any>(config: WebSocketHandlerConfig<T>): void {
  getWebSocketClient().register(config);
}

/**
 * 便捷方法：注销消息处理器
 */
export function unregisterWebSocketHandler(type: string, handler?: WebSocketMessageHandler): void {
  getWebSocketClient().unregister(type, handler);
}

/**
 * 便捷方法：发送WebSocket消息
 */
export function sendWebSocketMessage<T = any>(type: string, data: T): void {
  getWebSocketClient().send(type, data);
}