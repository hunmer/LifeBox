import { PluginStatus } from '@lifebox/shared';
import type {
  PluginManifest,
  PluginInfo,
  BasePlugin,
  PluginAPI
} from '@lifebox/shared';

/**
 * PluginLoader 类
 * 负责插件的动态加载、卸载和管理
 * 基于 Script 标签实现插件的运行时加载
 */
export class PluginLoader {
  private loadedPlugins = new Map<string, PluginInfo>();
  private pluginAPI: PluginAPI;

  constructor(pluginAPI?: PluginAPI) {
    this.pluginAPI = pluginAPI || this.createDefaultAPI();
  }

  /**
   * 加载插件
   * @param pluginPath 插件目录路径
   * @returns 插件信息
   */
  async loadPlugin(pluginPath: string): Promise<PluginInfo> {
    try {
      // 1. 加载插件清单
      const manifest = await this.loadManifest(pluginPath);

      // 2. 检查是否已加载
      if (this.loadedPlugins.has(manifest.id)) {
        console.warn(`Plugin ${manifest.id} already loaded`);
        return this.loadedPlugins.get(manifest.id)!;
      }

      // 3. 创建插件信息对象
      const pluginInfo: PluginInfo = {
        manifest,
        status: PluginStatus.LOADING,
        loadTime: Date.now()
      };

      this.loadedPlugins.set(manifest.id, pluginInfo);

      // 4. 加载样式文件（如果有）
      if (manifest.styles) {
        await this.loadPluginStyles(`${pluginPath}/${manifest.styles}`);
      }

      // 5. 加载插件脚本
      await this.loadPluginScript(`${pluginPath}/${manifest.entry}`, manifest);

      // 6. 创建插件实例并初始化
      const pluginClass = (window as any).LifeBoxPlugins?.[manifest.id];
      if (!pluginClass) {
        throw new Error(`Plugin ${manifest.id} did not register properly`);
      }

      const pluginInstance: BasePlugin = new pluginClass(this.pluginAPI, manifest);
      pluginInfo.instance = pluginInstance;
      pluginInfo.status = PluginStatus.LOADED;

      // 7. 调用插件的 onLoad 方法
      if (typeof pluginInstance.onLoad === 'function') {
        await pluginInstance.onLoad();
      }

      return pluginInfo;

    } catch (error) {
      throw new Error(`Failed to load plugin: ${(error as Error).message}`);
    }
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   * @returns 是否成功卸载
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const pluginInfo = this.loadedPlugins.get(pluginId);
    if (!pluginInfo) {
      return false;
    }

    try {
      // 1. 调用插件的 onUnload 方法
      if (pluginInfo.instance && typeof pluginInfo.instance.onUnload === 'function') {
        await pluginInfo.instance.onUnload();
      }

      // 2. 移除插件相关的 DOM 元素
      this.removePluginElements(pluginId);

      // 3. 从加载列表中移除
      this.loadedPlugins.delete(pluginId);

      // 4. 清理全局注册
      if ((window as any).LifeBoxPlugins?.[pluginId]) {
        delete (window as any).LifeBoxPlugins[pluginId];
      }

      return true;

    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * 获取已加载的插件列表
   * @returns 插件信息数组
   */
  getLoadedPlugins(): PluginInfo[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * 获取特定插件信息
   * @param pluginId 插件ID
   * @returns 插件信息或 undefined
   */
  getPluginInfo(pluginId: string): PluginInfo | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * 检查插件是否已加载
   * @param pluginId 插件ID
   * @returns 是否已加载
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }

  /**
   * 加载插件清单文件
   * @private
   */
  private async loadManifest(pluginPath: string): Promise<PluginManifest> {
    try {
      const response = await fetch(`${pluginPath}/manifest.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to load plugin manifest: ${(error as Error).message}`);
    }
  }

  /**
   * 加载插件样式文件
   * @private
   */
  private async loadPluginStyles(stylesPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = stylesPath;
      link.setAttribute('data-plugin', 'true');

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load styles: ${stylesPath}`));

      document.head.appendChild(link);
    });
  }

  /**
   * 加载插件脚本文件
   * @private
   */
  private async loadPluginScript(scriptPath: string, manifest: PluginManifest): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = scriptPath;
      script.defer = true;
      script.setAttribute('data-plugin', manifest.id);

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load plugin script: ${scriptPath}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * 移除插件相关的 DOM 元素
   * @private
   */
  private removePluginElements(pluginId: string): void {
    // 移除插件脚本
    const scripts = document.querySelectorAll(`script[data-plugin="${pluginId}"]`);
    scripts.forEach(script => script.remove());

    // 移除插件样式
    const styles = document.querySelectorAll(`link[data-plugin="${pluginId}"]`);
    styles.forEach(style => style.remove());

    // 移除插件容器
    const container = document.getElementById(`plugin-${pluginId}`);
    if (container) {
      container.remove();
    }
  }

  /**
   * 创建默认的插件 API
   * @private
   */
  private createDefaultAPI(): PluginAPI {
    // 这里返回一个基本的 API 实现
    // 在实际应用中，这些应该是真实的服务实例
    return {
      events: {
        on: () => {},
        off: () => {},
        emit: () => {},
        emitLifeBoxEvent: async () => ({ id: '', type: '', data: {}, source: '', timestamp: 0 }),
        cancelEvent: () => {},
        modifyEventData: () => {}
      },
      storage: {
        get: async () => null,
        set: async () => {},
        remove: async () => {},
        clear: async () => {},
        keys: async () => []
      },
      ui: {
        createContainer: () => document.createElement('div'),
        removeContainer: () => {},
        showNotification: () => {},
        showDialog: async () => {},
        addMenuItem: () => {},
        removeMenuItem: () => {}
      },
      http: {
        get: async () => ({}),
        post: async () => ({}),
        put: async () => ({}),
        delete: async () => ({})
      },
      config: {
        get: () => null,
        set: async () => {},
        getAll: () => ({}),
        reset: async () => {}
      },
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      }
    } as PluginAPI;
  }
}