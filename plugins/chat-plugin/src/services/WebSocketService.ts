import type { WebSocketMessage, ChatConfig } from '../types';

export class WebSocketService {
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers = new Map<string, Function[]>();

  constructor(private config: ChatConfig) {}

  async connect(): Promise<void> {
    const { serverUrl } = this.config;

    if (this.websocket) {
      this.websocket.close();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('连接到聊天服务器:', serverUrl);

        this.websocket = new WebSocket(serverUrl);

        this.websocket.onopen = () => {
          console.log('WebSocket连接已建立');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('解析服务器消息失败:', error);
          }
        };

        this.websocket.onclose = (event) => {
          console.log('WebSocket连接关闭:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected', { code: event.code, reason: event.reason });

          // 如果不是主动关闭，尝试重连
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('连接服务器失败:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, '插件关闭');
      this.websocket = null;
    }
    this.isConnected = false;
  }

  send(data: WebSocketMessage): void {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(data));
    } else {
      console.error('无法发送消息：未连接到服务器');
      this.emit('sendError', '未连接到服务器');
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`事件处理器执行失败 [${event}]:`, error);
        }
      });
    }
  }

  private handleMessage(data: WebSocketMessage): void {
    console.log('收到服务器消息:', data);
    this.emit('message', data);
    this.emit(`message:${data.type}`, data);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连`);
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    });

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('重连失败:', error);
      });
    }, delay);
  }
}