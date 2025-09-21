import { EventBus } from '../events/event-bus';
import { APIClient } from '../api/client';
import { BrowserPluginStorage } from './plugin-storage';
import { PluginUIManager } from './plugin-ui-manager';
import type { 
  PluginAPI, 
  ConfigManager, 
  Logger 
} from '../../../../shared/src/types/plugin';

/**
 * 配置管理器实现
 */
class PluginConfigManager implements ConfigManager {
  private config = new Map<string, any>();
  private pluginId: string;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
    this.loadConfig();
  }

  get(key: string): any {
    return this.config.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.config.set(key, value);
    await this.saveConfig();
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.config.entries()) {
      result[key] = value;
    }
    return result;
  }

  async reset(): Promise<void> {
    this.config.clear();
    await this.saveConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      const storage = new BrowserPluginStorage(this.pluginId);
      const configData = await storage.get('__config__');
      if (configData) {
        for (const [key, value] of Object.entries(configData)) {
          this.config.set(key, value);
        }
      }
    } catch (error) {
      console.warn(`[ConfigManager] Failed to load config for ${this.pluginId}:`, error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const storage = new BrowserPluginStorage(this.pluginId);
      await storage.set('__config__', this.getAll());
    } catch (error) {
      console.error(`[ConfigManager] Failed to save config for ${this.pluginId}:`, error);
    }
  }
}

/**
 * 日志记录器实现
 */
class PluginLogger implements Logger {
  private pluginId: string;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  debug(message: string, ...args: any[]): void {
    console.debug(`[${this.pluginId}] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(`[${this.pluginId}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.pluginId}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.pluginId}] ${message}`, ...args);
  }
}

/**
 * 创建插件 API 实例
 * @param pluginId 插件ID
 * @param options 可选配置
 * @returns 插件 API 实例
 */
export function createPluginAPI(
  pluginId: string, 
  options: {
    eventBus?: EventBus;
    httpClient?: APIClient;
    uiManager?: PluginUIManager;
    storageType?: 'local' | 'session';
  } = {}
): PluginAPI {
  
  const eventBus = options.eventBus || new EventBus();
  const httpClient = options.httpClient || new APIClient();
  const uiManager = options.uiManager || new PluginUIManager();
  const storage = new BrowserPluginStorage(pluginId, options.storageType || 'local');
  const config = new PluginConfigManager(pluginId);
  const logger = new PluginLogger(pluginId);

  return {
    events: eventBus,
    storage,
    ui: uiManager,
    http: httpClient,
    config,
    logger
  };
}

/**
 * 全局插件 API 管理器
 */
export class PluginAPIManager {
  private static instance: PluginAPIManager;
  private apis = new Map<string, PluginAPI>();
  private globalEventBus: EventBus;
  private globalUIManager: PluginUIManager;
  private globalHTTPClient: APIClient;

  private constructor() {
    this.globalEventBus = new EventBus();
    this.globalUIManager = new PluginUIManager();
    this.globalHTTPClient = new APIClient();
  }

  static getInstance(): PluginAPIManager {
    if (!PluginAPIManager.instance) {
      PluginAPIManager.instance = new PluginAPIManager();
    }
    return PluginAPIManager.instance;
  }

  /**
   * 为插件创建 API 实例
   * @param pluginId 插件ID
   * @param options 可选配置
   * @returns 插件 API 实例
   */
  createAPI(pluginId: string, options: {
    shareEventBus?: boolean;
    shareUIManager?: boolean;
    shareHTTPClient?: boolean;
    storageType?: 'local' | 'session';
  } = {}): PluginAPI {
    
    if (this.apis.has(pluginId)) {
      return this.apis.get(pluginId)!;
    }

    const api = createPluginAPI(pluginId, {
      eventBus: options.shareEventBus !== false ? this.globalEventBus : undefined,
      uiManager: options.shareUIManager !== false ? this.globalUIManager : undefined,
      httpClient: options.shareHTTPClient !== false ? this.globalHTTPClient : undefined,
      storageType: options.storageType
    });

    this.apis.set(pluginId, api);
    return api;
  }

  /**
   * 获取插件 API
   * @param pluginId 插件ID
   * @returns 插件 API 实例或 undefined
   */
  getAPI(pluginId: string): PluginAPI | undefined {
    return this.apis.get(pluginId);
  }

  /**
   * 移除插件 API
   * @param pluginId 插件ID
   */
  removeAPI(pluginId: string): void {
    this.apis.delete(pluginId);
  }

  /**
   * 获取全局事件总线
   * @returns 全局事件总线
   */
  getGlobalEventBus(): EventBus {
    return this.globalEventBus;
  }

  /**
   * 获取全局 UI 管理器
   * @returns 全局 UI 管理器
   */
  getGlobalUIManager(): PluginUIManager {
    return this.globalUIManager;
  }

  /**
   * 获取全局 HTTP 客户端
   * @returns 全局 HTTP 客户端
   */
  getGlobalHTTPClient(): APIClient {
    return this.globalHTTPClient;
  }

  /**
   * 配置全局 HTTP 客户端
   * @param baseURL 基础 URL
   * @param headers 默认请求头
   */
  configureHTTPClient(baseURL?: string, headers?: Record<string, string>): void {
    if (baseURL) {
      this.globalHTTPClient.setBaseURL(baseURL);
    }
    if (headers) {
      this.globalHTTPClient.setDefaultHeaders(headers);
    }
  }

  /**
   * 清理所有 API 实例
   */
  cleanup(): void {
    this.apis.clear();
    this.globalEventBus.removeAllListeners();
  }

  /**
   * 获取 API 统计信息
   * @returns 统计信息
   */
  getStats(): {
    totalAPIs: number;
    activePlugins: string[];
    eventStats: any;
  } {
    return {
      totalAPIs: this.apis.size,
      activePlugins: Array.from(this.apis.keys()),
      eventStats: this.globalEventBus.getStats()
    };
  }
}

/**
 * 初始化全局插件 API
 * 将插件 API 注入到全局 window 对象中，供插件使用
 */
export function initializeGlobalPluginAPI(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const apiManager = PluginAPIManager.getInstance();

  // 创建全局 LifeBoxAPI 对象
  (window as any).LifeBoxAPI = {
    // 创建插件 API
    createAPI: (pluginId: string, options?: any) => apiManager.createAPI(pluginId, options),
    
    // 获取全局服务
    eventBus: apiManager.getGlobalEventBus(),
    ui: apiManager.getGlobalUIManager(),
    http: apiManager.getGlobalHTTPClient(),
    
    // 基础插件类（从 shared 导入）
    BasePlugin: null, // 这里需要在实际使用时设置
    
    // 工具函数
    utils: {
      createStorage: (pluginId: string, type?: 'local' | 'session') => 
        new BrowserPluginStorage(pluginId, type),
      createLogger: (pluginId: string) => new PluginLogger(pluginId),
      createConfig: (pluginId: string) => new PluginConfigManager(pluginId),
    }
  };

  // 创建全局插件注册表
  if (!(window as any).LifeBoxPlugins) {
    (window as any).LifeBoxPlugins = {};
  }

  console.info('[LifeBox] Global Plugin API initialized');
}

// 默认导出 API 管理器实例
export default PluginAPIManager.getInstance();