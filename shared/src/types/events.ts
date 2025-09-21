/**
 * LifeBox 事件系统类型定义
 * 
 * 定义了 LifeBox 应用中事件系统的核心类型，包括事件接口、
 * 处理器接口、中间件接口等，支持事件的取消、修改和传播控制。
 */

export interface LifeBoxEvent {
  /** 事件唯一标识符 */
  id: string;
  /** 事件类型 */
  type: string;
  /** 事件携带的数据 */
  data: any;
  /** 事件源（插件ID或系统标识） */
  source: string;
  /** 事件创建时间戳 */
  timestamp: number;
  /** 是否被取消 */
  cancelled?: boolean;
  /** 是否继续传播 */
  propagation?: boolean;
}

/**
 * 事件处理器函数接口
 */
export interface EventHandler {
  (event: LifeBoxEvent): void | Promise<void>;
}

/**
 * 事件中间件接口
 * 中间件可以在事件传播过程中拦截、修改或取消事件
 */
export interface EventMiddleware {
  (event: LifeBoxEvent, next: () => void): void | Promise<void>;
}

/**
 * 事件监听器配置
 */
export interface EventListenerConfig {
  /** 事件类型 */
  type: string;
  /** 处理器函数 */
  handler: EventHandler;
  /** 监听器优先级（数值越大优先级越高） */
  priority?: number;
  /** 是否只监听一次 */
  once?: boolean;
}

/**
 * 事件总线配置
 */
export interface EventBusConfig {
  /** 最大监听器数量 */
  maxListeners?: number;
  /** 是否启用事件历史记录 */
  enableHistory?: boolean;
  /** 历史记录最大数量 */
  maxHistorySize?: number;
  /** 是否启用调试模式 */
  debug?: boolean;
}

/**
 * 事件统计信息
 */
export interface EventStats {
  /** 总事件数 */
  totalEvents: number;
  /** 已取消事件数 */
  cancelledEvents: number;
  /** 活跃监听器数 */
  activeListeners: number;
  /** 事件类型统计 */
  eventTypeCounts: Record<string, number>;
}

/**
 * 系统预定义事件类型
 */
export enum SystemEventTypes {
  /** 应用启动 */
  APP_STARTED = 'system:app-started',
  /** 应用关闭 */
  APP_CLOSING = 'system:app-closing',
  /** 插件加载 */
  PLUGIN_LOADED = 'system:plugin-loaded',
  /** 插件卸载 */
  PLUGIN_UNLOADED = 'system:plugin-unloaded',
  /** 用户登录 */
  USER_LOGIN = 'system:user-login',
  /** 用户登出 */
  USER_LOGOUT = 'system:user-logout',
  /** 错误发生 */
  ERROR_OCCURRED = 'system:error-occurred',
}

/**
 * 插件事件命名空间
 */
export enum PluginEventNamespaces {
  /** 聊天插件事件 */
  CHAT = 'chat',
  /** 文件管理插件事件 */
  FILE = 'file',
  /** 笔记插件事件 */
  NOTE = 'note',
  /** 任务管理插件事件 */
  TASK = 'task',
}

/**
 * 事件优先级枚举
 */
export enum EventPriority {
  /** 低优先级 */
  LOW = 0,
  /** 普通优先级 */
  NORMAL = 100,
  /** 高优先级 */
  HIGH = 200,
  /** 关键优先级 */
  CRITICAL = 300,
}

/**
 * 创建事件的工厂函数类型
 */
export type EventFactory<T = any> = (
  type: string,
  data: T,
  source?: string
) => LifeBoxEvent;

/**
 * 事件过滤器函数类型
 */
export type EventFilter = (event: LifeBoxEvent) => boolean;

/**
 * 事件转换器函数类型
 */
export type EventTransformer = (event: LifeBoxEvent) => LifeBoxEvent;