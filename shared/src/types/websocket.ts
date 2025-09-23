/**
 * WebSocket 通信类型定义
 *
 * 定义了前后端 WebSocket 通信的消息格式和处理器接口
 */

/**
 * WebSocket 消息基础格式
 */
export interface WSMessage<T = any> {
  /** 消息类型 */
  type: string;
  /** 消息数据 */
  data: T;
  /** 消息时间戳 */
  timestamp?: string;
  /** 消息ID */
  id?: string;
}

/**
 * WebSocket 消息处理器函数接口
 */
export interface WebSocketMessageHandler<T = any> {
  (data: T, message: WSMessage<T>): void | Promise<void>;
}

/**
 * WebSocket 消息处理器注册配置
 */
export interface WebSocketHandlerConfig<T = any> {
  /** 消息类型 */
  type: string;
  /** 处理器函数 */
  handler: WebSocketMessageHandler<T>;
  /** 处理器优先级（数值越大优先级越高） */
  priority?: number;
}

/**
 * WebSocket 连接状态
 */
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * WebSocket 客户端配置
 */
export interface WebSocketClientConfig {
  /** WebSocket 服务器地址 */
  url: string;
  /** 重连配置 */
  reconnect?: {
    /** 是否启用自动重连 */
    enabled: boolean;
    /** 重连间隔（毫秒） */
    interval: number;
    /** 最大重连次数 */
    maxAttempts: number;
  };
  /** 心跳配置 */
  heartbeat?: {
    /** 是否启用心跳 */
    enabled: boolean;
    /** 心跳间隔（毫秒） */
    interval: number;
  };
}

/**
 * 系统预定义的 WebSocket 消息类型
 */
export enum WebSocketMessageTypes {
  /** 连接确认 */
  CONNECTION = 'connection',
  /** 断开连接 */
  DISCONNECT = 'disconnect',
  /** 心跳检测 */
  PING = 'ping',
  /** 心跳响应 */
  PONG = 'pong',
  /** 错误消息 */
  ERROR = 'error',
  /** 事件消息 */
  EVENT = 'event',
  /** 订阅消息 */
  SUBSCRIBE = 'subscribe',
  /** 取消订阅 */
  UNSUBSCRIBE = 'unsubscribe',
  /** 广播消息 */
  BROADCAST = 'broadcast',
  /** 聊天消息 */
  CHAT_MESSAGE = 'chat.message',
}

/**
 * 连接消息数据
 */
export interface ConnectionMessageData {
  /** 客户端ID */
  clientId: string;
  /** 连接时间 */
  timestamp: string;
  /** 欢迎消息 */
  message?: string;
}

/**
 * 错误消息数据
 */
export interface ErrorMessageData {
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code?: string;
  /** 错误详情 */
  details?: any;
}

/**
 * 事件消息数据
 */
export interface EventMessageData {
  /** 事件类型 */
  eventType: string;
  /** 事件数据 */
  data: any;
  /** 事件元数据 */
  metadata?: any;
}

/**
 * 订阅消息数据
 */
export interface SubscribeMessageData {
  /** 要订阅的事件类型列表 */
  eventTypes: string[];
}

/**
 * 广播消息数据
 */
export interface BroadcastMessageData {
  /** 消息来源 */
  from: string;
  /** 广播的数据 */
  data: any;
  /** 目标客户端（可选，不指定则广播给所有客户端） */
  target?: string;
}