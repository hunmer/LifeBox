/**
 * LifeBox 插件系统类型定义
 * 
 * 定义了插件系统的核心类型，包括插件清单、插件接口、
 * 插件API、存储接口等，支持基于Script标签的插件加载。
 */

import type { LifeBoxEvent, EventHandler } from './events';

/**
 * 插件清单配置
 */
export interface PluginManifest {
  /** 插件唯一标识符 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 插件入口文件路径 */
  entry: string;
  /** 插件样式文件路径（可选） */
  styles?: string;
  /** 插件图标路径（可选） */
  icon?: string;
  /** 插件所需权限列表 */
  permissions: PluginPermission[];
  /** 插件作者信息 */
  author?: string;
  /** 插件主页URL */
  homepage?: string;
  /** 插件最小系统版本要求 */
  minSystemVersion?: string;
  /** 插件依赖项 */
  dependencies?: PluginDependency[];
  /** 插件配置项 */
  config?: PluginConfigSchema;
}

/**
 * 插件权限枚举
 */
export enum PluginPermission {
  /** HTTP请求权限 */
  HTTP_REQUEST = 'http:request',
  /** 本地存储权限 */
  LOCAL_STORAGE = 'storage:local',
  /** 会话存储权限 */
  SESSION_STORAGE = 'storage:session',
  /** 文件系统读取权限 */
  FILE_READ = 'file:read',
  /** 文件系统写入权限 */
  FILE_WRITE = 'file:write',
  /** 事件监听权限 */
  EVENT_LISTEN = 'events:listen',
  /** 事件发送权限 */
  EVENT_EMIT = 'events:emit',
  /** UI操作权限 */
  UI_MANIPULATE = 'ui:manipulate',
  /** 系统通知权限 */
  NOTIFICATION = 'system:notification',
}

/**
 * 插件依赖项
 */
export interface PluginDependency {
  /** 依赖插件ID */
  pluginId: string;
  /** 依赖版本要求 */
  version: string;
  /** 是否为可选依赖 */
  optional?: boolean;
}

/**
 * 插件配置项模式
 */
export interface PluginConfigSchema {
  /** 配置项定义 */
  properties: Record<string, PluginConfigProperty>;
  /** 必需的配置项 */
  required?: string[];
}

/**
 * 插件配置属性
 */
export interface PluginConfigProperty {
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** 属性标题 */
  title?: string;
  /** 属性描述 */
  description?: string;
  /** 默认值 */
  default?: any;
  /** 枚举值（仅适用于字符串类型） */
  enum?: string[];
  /** 最小值（仅适用于数字类型） */
  minimum?: number;
  /** 最大值（仅适用于数字类型） */
  maximum?: number;
}

/**
 * 插件状态枚举
 */
export enum PluginStatus {
  /** 未安装 */
  NOT_INSTALLED = 'not_installed',
  /** 已安装 */
  INSTALLED = 'installed',
  /** 正在加载 */
  LOADING = 'loading',
  /** 已加载 */
  LOADED = 'loaded',
  /** 已激活 */
  ACTIVE = 'active',
  /** 已停用 */
  INACTIVE = 'inactive',
  /** 出错 */
  ERROR = 'error',
}

/**
 * 插件信息
 */
export interface PluginInfo {
  /** 插件清单 */
  manifest: PluginManifest;
  /** 插件状态 */
  status: PluginStatus;
  /** 插件实例 */
  instance?: BasePlugin;
  /** 错误信息（如果有） */
  error?: Error;
  /** 加载时间 */
  loadTime?: number;
  /** 最后激活时间 */
  lastActiveTime?: number;
}

/**
 * 事件总线接口
 */
export interface EventBus {
  /** 监听事件 */
  on(eventType: string, handler: EventHandler): void;
  /** 移除事件监听 */
  off(eventType: string, handler: EventHandler): void;
  /** 发送事件 */
  emit(eventType: string, data: any): void;
  /** 发送LifeBox事件 */
  emitLifeBoxEvent(type: string, data: any, source?: string): Promise<LifeBoxEvent>;
  /** 取消事件 */
  cancelEvent(event: LifeBoxEvent): void;
  /** 修改事件数据 */
  modifyEventData(event: LifeBoxEvent, newData: any): void;
}

/**
 * 插件API接口
 */
export interface PluginAPI {
  /** 事件总线 */
  events: EventBus;
  /** 存储接口 */
  storage: PluginStorage;
  /** UI管理器 */
  ui: UIManager;
  /** HTTP客户端 */
  http: HTTPClient;
  /** 配置管理器 */
  config: ConfigManager;
  /** 日志记录器 */
  logger: Logger;
}

/**
 * 插件存储接口
 */
export interface PluginStorage {
  /** 获取存储值 */
  get(key: string): Promise<any>;
  /** 设置存储值 */
  set(key: string, value: any): Promise<void>;
  /** 删除存储值 */
  remove(key: string): Promise<void>;
  /** 清空所有存储 */
  clear(): Promise<void>;
  /** 获取所有键 */
  keys(): Promise<string[]>;
}

/**
 * UI管理器接口
 */
export interface UIManager {
  /** 创建容器元素 */
  createContainer(id: string): HTMLElement;
  /** 移除容器元素 */
  removeContainer(id: string): void;
  /** 显示通知 */
  showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
  /** 显示对话框 */
  showDialog(config: DialogConfig): Promise<any>;
  /** 添加菜单项 */
  addMenuItem(item: MenuItem): void;
  /** 移除菜单项 */
  removeMenuItem(id: string): void;
}

/**
 * HTTP客户端接口
 */
export interface HTTPClient {
  /** GET请求 */
  get(url: string, config?: RequestConfig): Promise<any>;
  /** POST请求 */
  post(url: string, data?: any, config?: RequestConfig): Promise<any>;
  /** PUT请求 */
  put(url: string, data?: any, config?: RequestConfig): Promise<any>;
  /** DELETE请求 */
  delete(url: string, config?: RequestConfig): Promise<any>;
}

/**
 * 配置管理器接口
 */
export interface ConfigManager {
  /** 获取配置值 */
  get(key: string): any;
  /** 设置配置值 */
  set(key: string, value: any): Promise<void>;
  /** 获取所有配置 */
  getAll(): Record<string, any>;
  /** 重置为默认配置 */
  reset(): Promise<void>;
}

/**
 * 日志记录器接口
 */
export interface Logger {
  /** 调试日志 */
  debug(message: string, ...args: any[]): void;
  /** 信息日志 */
  info(message: string, ...args: any[]): void;
  /** 警告日志 */
  warn(message: string, ...args: any[]): void;
  /** 错误日志 */
  error(message: string, ...args: any[]): void;
}

/**
 * 对话框配置
 */
export interface DialogConfig {
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 按钮配置 */
  buttons?: DialogButton[];
  /** 是否可关闭 */
  closable?: boolean;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
}

/**
 * 对话框按钮
 */
export interface DialogButton {
  /** 按钮文本 */
  text: string;
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'danger';
  /** 点击处理器 */
  onClick?: () => void | Promise<void>;
}

/**
 * 菜单项
 */
export interface MenuItem {
  /** 菜单项ID */
  id: string;
  /** 菜单项标题 */
  title: string;
  /** 菜单项图标 */
  icon?: string;
  /** 点击处理器 */
  onClick?: () => void;
  /** 子菜单项 */
  children?: MenuItem[];
  /** 是否分隔符 */
  separator?: boolean;
}

/**
 * 请求配置
 */
export interface RequestConfig {
  /** 请求头 */
  headers?: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 响应类型 */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

/**
 * 插件基础类抽象接口
 */
export abstract class BasePlugin {
  /** 插件API */
  protected api: PluginAPI;
  /** 插件容器 */
  protected container: HTMLElement | null = null;
  /** 插件清单 */
  protected manifest: PluginManifest;

  constructor(api: PluginAPI, manifest: PluginManifest) {
    this.api = api;
    this.manifest = manifest;
  }

  /** 插件加载时调用 */
  abstract onLoad(): void | Promise<void>;

  /** 插件卸载时调用 */
  abstract onUnload(): void | Promise<void>;

  /** 插件激活时调用 */
  onActivate?(): void | Promise<void>;

  /** 插件停用时调用 */
  onDeactivate?(): void | Promise<void>;

  /** 获取插件ID */
  getId(): string {
    return this.manifest.id;
  }

  /** 获取插件名称 */
  getName(): string {
    return this.manifest.name;
  }

  /** 获取插件版本 */
  getVersion(): string {
    return this.manifest.version;
  }
}