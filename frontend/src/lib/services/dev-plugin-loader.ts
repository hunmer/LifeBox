/**
 * 开发版插件自动发现和加载服务
 * 用于在开发环境中自动扫描和加载本地插件
 */

import { PluginLoader } from '@/lib/plugin-system/plugin-loader';
import { PluginManager } from '@/lib/plugin-system/plugin-manager';

export interface DevPluginConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  entry: string;
  styles?: string;
  autoload?: boolean;
  environment?: 'development' | 'production' | 'both';
  [key: string]: any;
}

export class DevPluginLoader {
  private pluginManager: PluginManager;
  private loadedDevPlugins = new Set<string>();
  private basePath = '/plugins'; // 开发插件的基础路径

  constructor(pluginManager?: PluginManager) {
    this.pluginManager = pluginManager || new PluginManager();
  }

  /**
   * 自动发现和加载所有开发版插件
   */
  async autoLoadDevPlugins(): Promise<void> {
    try {
      console.log('[DevPluginLoader] 开始自动发现开发版插件...');

      // 获取所有开发插件目录
      const pluginDirs = await this.discoverPluginDirectories();

      for (const pluginDir of pluginDirs) {
        try {
          await this.loadDevPlugin(pluginDir);
        } catch (error) {
          console.error(`[DevPluginLoader] 加载插件 ${pluginDir} 失败:`, error);
        }
      }

      console.log(`[DevPluginLoader] 完成插件自动加载，成功加载 ${this.loadedDevPlugins.size} 个插件`);
    } catch (error) {
      console.error('[DevPluginLoader] 自动加载插件失败:', error);
    }
  }

  /**
   * 发现插件目录
   * 在开发环境中，我们会扫描预定义的插件目录列表
   */
  private async discoverPluginDirectories(): Promise<string[]> {
    // 开发环境中预定义的插件目录
    const knownPluginDirs = [
      'simple-test-plugin',
      'chat-plugin'
      // 可以添加更多已知的插件目录
    ];

    const validPluginDirs: string[] = [];

    for (const dir of knownPluginDirs) {
      try {
        const manifestUrl = `${this.basePath}/${dir}/manifest.json`;
        const response = await fetch(manifestUrl);

        if (response.ok) {
          const manifest = await response.json();

          // 检查是否应该在开发环境中加载
          if (this.shouldLoadInCurrentEnvironment(manifest)) {
            validPluginDirs.push(dir);
            console.log(`[DevPluginLoader] 发现插件: ${manifest.name} (${dir})`);
          }
        }
      } catch (error) {
        // 插件不存在或无法加载，跳过
        console.debug(`[DevPluginLoader] 跳过目录 ${dir}:`, error);
      }
    }

    return validPluginDirs;
  }

  /**
   * 检查插件是否应该在当前环境中加载
   */
  private shouldLoadInCurrentEnvironment(manifest: DevPluginConfig): boolean {
    const { environment = 'both', autoload = false } = manifest;

    // 只加载标记为自动加载的插件
    if (!autoload) {
      return false;
    }

    // 检查环境匹配
    if (environment === 'development' || environment === 'both') {
      return true;
    }

    return false;
  }

  /**
   * 加载单个开发版插件
   */
  async loadDevPlugin(pluginDir: string): Promise<void> {
    try {
      const pluginPath = `${this.basePath}/${pluginDir}`;
      const manifestUrl = `${pluginPath}/manifest.json`;

      // 加载manifest
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`无法加载manifest: ${response.status} ${response.statusText}`);
      }

      const manifest: DevPluginConfig = await response.json();

      // 检查是否已经加载
      if (this.loadedDevPlugins.has(manifest.id)) {
        console.log(`[DevPluginLoader] 插件 ${manifest.id} 已加载，跳过`);
        return;
      }

      // 检查环境
      if (!this.shouldLoadInCurrentEnvironment(manifest)) {
        console.log(`[DevPluginLoader] 插件 ${manifest.id} 不适用于当前环境，跳过`);
        return;
      }

      console.log(`[DevPluginLoader] 正在加载插件: ${manifest.name}`);

      // 使用插件管理器加载插件
      await this.pluginManager.installPlugin(pluginPath);
      await this.pluginManager.enablePlugin(manifest.id);

      this.loadedDevPlugins.add(manifest.id);
      console.log(`[DevPluginLoader] 成功加载插件: ${manifest.name}`);

      // 发送插件加载事件
      this.emitPluginLoadedEvent(manifest);

    } catch (error) {
      console.error(`[DevPluginLoader] 加载插件 ${pluginDir} 失败:`, error);
      throw error;
    }
  }

  /**
   * 卸载开发版插件
   */
  async unloadDevPlugin(pluginId: string): Promise<boolean> {
    try {
      const success = await this.pluginManager.uninstallPlugin(pluginId);
      if (success) {
        this.loadedDevPlugins.delete(pluginId);
        console.log(`[DevPluginLoader] 成功卸载插件: ${pluginId}`);
      }
      return success;
    } catch (error) {
      console.error(`[DevPluginLoader] 卸载插件 ${pluginId} 失败:`, error);
      return false;
    }
  }

  /**
   * 重新加载插件
   */
  async reloadDevPlugin(pluginId: string): Promise<boolean> {
    try {
      // 先卸载再加载
      await this.unloadDevPlugin(pluginId);

      // 找到对应的目录
      const pluginDir = await this.findPluginDirectory(pluginId);
      if (pluginDir) {
        await this.loadDevPlugin(pluginDir);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[DevPluginLoader] 重新加载插件 ${pluginId} 失败:`, error);
      return false;
    }
  }

  /**
   * 查找插件目录
   */
  private async findPluginDirectory(pluginId: string): Promise<string | null> {
    const pluginDirs = await this.discoverPluginDirectories();

    for (const dir of pluginDirs) {
      try {
        const manifestUrl = `${this.basePath}/${dir}/manifest.json`;
        const response = await fetch(manifestUrl);

        if (response.ok) {
          const manifest = await response.json();
          if (manifest.id === pluginId) {
            return dir;
          }
        }
      } catch (error) {
        // 跳过
      }
    }

    return null;
  }

  /**
   * 获取已加载的开发版插件列表
   */
  getLoadedDevPlugins(): string[] {
    return Array.from(this.loadedDevPlugins);
  }

  /**
   * 获取插件统计信息
   */
  getStats(): { loaded: number; available: number } {
    return {
      loaded: this.loadedDevPlugins.size,
      available: 0 // 需要异步获取，这里先返回0
    };
  }

  /**
   * 发送插件加载事件
   */
  private emitPluginLoadedEvent(manifest: DevPluginConfig): void {
    window.dispatchEvent(new CustomEvent('lifebox:dev-plugin:loaded', {
      detail: { plugin: manifest }
    }));
  }

  /**
   * 清理所有开发版插件
   */
  async cleanup(): Promise<void> {
    const pluginIds = Array.from(this.loadedDevPlugins);

    for (const pluginId of pluginIds) {
      try {
        await this.unloadDevPlugin(pluginId);
      } catch (error) {
        console.error(`[DevPluginLoader] 清理插件 ${pluginId} 失败:`, error);
      }
    }

    this.loadedDevPlugins.clear();
    console.log('[DevPluginLoader] 已清理所有开发版插件');
  }
}

// 全局开发插件加载器实例
let globalDevPluginLoader: DevPluginLoader | null = null;

/**
 * 获取全局开发插件加载器实例
 */
export function getDevPluginLoader(): DevPluginLoader {
  if (!globalDevPluginLoader) {
    globalDevPluginLoader = new DevPluginLoader();
  }
  return globalDevPluginLoader;
}

/**
 * 初始化开发插件自动加载
 */
export async function initDevPluginAutoLoad(): Promise<void> {
  try {
    const loader = getDevPluginLoader();
    await loader.autoLoadDevPlugins();
  } catch (error) {
    console.error('[DevPluginLoader] 初始化自动加载失败:', error);
  }
}