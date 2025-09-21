/**
 * LifeBox Plugin System
 * 
 * 这是 LifeBox 插件系统的主入口文件，导出所有核心组件和接口
 * 插件开发者可以通过这个模块访问插件系统的所有功能
 */

// 核心类
export { PluginLoader } from './plugin-loader';
export { BasePlugin } from './base-plugin';
export { PluginManager } from './plugin-manager';

// API 和服务
export { 
  createPluginAPI, 
  PluginAPIManager, 
  initializeGlobalPluginAPI 
} from './plugin-api';

export { EventBus } from '../events/event-bus';
export { APIClient, APIError } from '../api/client';
export { BrowserPluginStorage, MemoryPluginStorage } from './plugin-storage';
export { PluginUIManager } from './plugin-ui-manager';

// React 组件
export { 
  PluginContainer, 
  PluginManagerPanel 
} from '../../components/plugin/plugin-container';

// 类型定义（重新导出 shared 中的类型）
export type {
  // 插件相关类型
  PluginManifest,
  PluginInfo,
  PluginStatus,
  PluginPermission,
  PluginDependency,
  PluginConfigSchema,
  PluginConfigProperty,
  
  // API 相关类型
  PluginAPI,
  EventBus as IEventBus,
  PluginStorage,
  UIManager,
  HTTPClient,
  ConfigManager,
  Logger,
  
  // UI 相关类型
  DialogConfig,
  DialogButton,
  MenuItem,
  RequestConfig
} from '../../../../shared/src/types/plugin';

export type {
  // 事件相关类型
  LifeBoxEvent,
  EventHandler,
  EventMiddleware,
  EventListenerConfig,
  EventBusConfig,
  EventStats,
  SystemEventTypes,
  PluginEventNamespaces,
  EventPriority,
  EventFactory,
  EventFilter,
  EventTransformer
} from '../../../../shared/src/types/events';

/**
 * 插件系统版本
 */
export const PLUGIN_SYSTEM_VERSION = '1.0.0';

/**
 * 插件系统配置
 */
export interface PluginSystemConfig {
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 插件根目录 */
  pluginRoot?: string;
  /** 最大插件数量 */
  maxPlugins?: number;
  /** 默认存储类型 */
  defaultStorageType?: 'local' | 'session';
  /** API 基础 URL */
  apiBaseURL?: string;
  /** 是否启用权限检查 */
  enablePermissionCheck?: boolean;
}

/**
 * 默认插件系统配置
 */
export const DEFAULT_PLUGIN_SYSTEM_CONFIG: PluginSystemConfig = {
  debug: false,
  pluginRoot: '/plugins',
  maxPlugins: 50,
  defaultStorageType: 'local',
  apiBaseURL: 'http://localhost:3001/api',
  enablePermissionCheck: true
};

/**
 * 插件系统初始化器
 */
export class PluginSystem {
  private config: PluginSystemConfig;
  private manager: PluginManager;
  private apiManager: PluginAPIManager;
  private initialized = false;

  constructor(config: Partial<PluginSystemConfig> = {}) {
    this.config = { ...DEFAULT_PLUGIN_SYSTEM_CONFIG, ...config };
    this.manager = new PluginManager();
    this.apiManager = PluginAPIManager.getInstance();
  }

  /**
   * 初始化插件系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 初始化全局 API
    initializeGlobalPluginAPI();

    // 配置 HTTP 客户端
    if (this.config.apiBaseURL) {
      this.apiManager.configureHTTPClient(this.config.apiBaseURL);
    }

    this.initialized = true;

    if (this.config.debug) {
      console.info('[PluginSystem] Initialized with config:', this.config);
    }
  }

  /**
   * 安装插件
   */
  async installPlugin(pluginPath: string): Promise<PluginInfo> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.manager.installPlugin(pluginPath);
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    return this.manager.uninstallPlugin(pluginId);
  }

  /**
   * 启用插件
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    return this.manager.enablePlugin(pluginId);
  }

  /**
   * 禁用插件
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    return this.manager.disablePlugin(pluginId);
  }

  /**
   * 获取插件管理器
   */
  getManager(): PluginManager {
    return this.manager;
  }

  /**
   * 获取 API 管理器
   */
  getAPIManager(): PluginAPIManager {
    return this.apiManager;
  }

  /**
   * 获取已安装的插件
   */
  getInstalledPlugins(): PluginInfo[] {
    return this.manager.getInstalledPlugins();
  }

  /**
   * 获取插件统计信息
   */
  getStatistics() {
    return {
      plugins: this.manager.getPluginStatistics(),
      api: this.apiManager.getStats()
    };
  }

  /**
   * 清理插件系统
   */
  cleanup(): void {
    this.apiManager.cleanup();
    this.initialized = false;
  }
}

/**
 * 创建插件系统实例
 */
export function createPluginSystem(config?: Partial<PluginSystemConfig>): PluginSystem {
  return new PluginSystem(config);
}

/**
 * 默认插件系统实例
 */
export const defaultPluginSystem = createPluginSystem();