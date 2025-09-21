import { PluginLoader } from './plugin-loader';
import type { 
  PluginInfo, 
  PluginStatus, 
  PluginManifest 
} from '@lifebox/shared';

/**
 * PluginManager 类
 * 提供插件的高级管理功能，包括安装、卸载、启用、禁用等
 * 建立在 PluginLoader 之上，提供更丰富的插件生命周期管理
 */
export class PluginManager {
  private pluginLoader: PluginLoader;
  private pluginStates = new Map<string, PluginStatus>();

  constructor(pluginLoader?: PluginLoader) {
    this.pluginLoader = pluginLoader || new PluginLoader();
  }

  /**
   * 安装插件
   * @param pluginPath 插件路径
   * @returns 插件信息
   */
  async installPlugin(pluginPath: string): Promise<PluginInfo> {
    try {
      // 1. 使用 PluginLoader 加载插件
      const pluginInfo = await this.pluginLoader.loadPlugin(pluginPath);

      // 2. 验证插件清单
      this.validatePluginManifest(pluginInfo.manifest);

      // 3. 更新插件状态
      this.pluginStates.set(pluginInfo.manifest.id, pluginInfo.status);

      return pluginInfo;
    } catch (error) {
      throw new Error(`Failed to install plugin: ${(error as Error).message}`);
    }
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   * @returns 是否成功卸载
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      // 1. 先禁用插件
      await this.disablePlugin(pluginId);

      // 2. 使用 PluginLoader 卸载插件
      const success = await this.pluginLoader.unloadPlugin(pluginId);

      // 3. 更新状态
      if (success) {
        this.pluginStates.delete(pluginId);
      }

      return success;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   * @returns 是否成功启用
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    try {
      const pluginInfo = this.pluginLoader.getPluginInfo(pluginId);
      if (!pluginInfo) {
        return false;
      }

      // 如果插件已经激活，直接返回成功
      if (pluginInfo.status === PluginStatus.ACTIVE) {
        return true;
      }

      // 调用插件的 onActivate 方法（如果存在）
      if (pluginInfo.instance && typeof pluginInfo.instance.onActivate === 'function') {
        await pluginInfo.instance.onActivate();
      }

      // 更新状态
      pluginInfo.status = PluginStatus.ACTIVE;
      pluginInfo.lastActiveTime = Date.now();
      this.pluginStates.set(pluginId, PluginStatus.ACTIVE);

      return true;
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   * @returns 是否成功禁用
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    try {
      const pluginInfo = this.pluginLoader.getPluginInfo(pluginId);
      if (!pluginInfo) {
        return false;
      }

      // 如果插件已经停用，直接返回成功
      if (pluginInfo.status === PluginStatus.INACTIVE) {
        return true;
      }

      // 调用插件的 onDeactivate 方法（如果存在）
      if (pluginInfo.instance && typeof pluginInfo.instance.onDeactivate === 'function') {
        await pluginInfo.instance.onDeactivate();
      }

      // 更新状态
      pluginInfo.status = PluginStatus.INACTIVE;
      this.pluginStates.set(pluginId, PluginStatus.INACTIVE);

      return true;
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * 重新加载插件
   * @param pluginId 插件ID
   * @returns 是否成功重新加载
   */
  async reloadPlugin(pluginId: string): Promise<boolean> {
    try {
      const pluginInfo = this.pluginLoader.getPluginInfo(pluginId);
      if (!pluginInfo) {
        return false;
      }

      // 获取插件路径（需要从某处存储或推断）
      const pluginPath = this.getPluginPath(pluginId);
      if (!pluginPath) {
        throw new Error(`Cannot determine path for plugin ${pluginId}`);
      }

      // 1. 卸载当前插件
      await this.uninstallPlugin(pluginId);

      // 2. 重新安装插件
      await this.installPlugin(pluginPath);

      // 3. 如果之前是激活状态，重新激活
      const previousState = this.pluginStates.get(pluginId);
      if (previousState === PluginStatus.ACTIVE) {
        await this.enablePlugin(pluginId);
      }

      return true;
    } catch (error) {
      console.error(`Failed to reload plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * 获取已安装的插件列表
   * @returns 插件信息数组
   */
  getInstalledPlugins(): PluginInfo[] {
    return this.pluginLoader.getLoadedPlugins();
  }

  /**
   * 获取特定插件信息
   * @param pluginId 插件ID
   * @returns 插件信息或 undefined
   */
  getPluginInfo(pluginId: string): PluginInfo | undefined {
    return this.pluginLoader.getPluginInfo(pluginId);
  }

  /**
   * 检查插件是否已安装
   * @param pluginId 插件ID
   * @returns 是否已安装
   */
  isPluginInstalled(pluginId: string): boolean {
    return this.pluginLoader.isPluginLoaded(pluginId);
  }

  /**
   * 检查插件是否已启用
   * @param pluginId 插件ID
   * @returns 是否已启用
   */
  isPluginEnabled(pluginId: string): boolean {
    const pluginInfo = this.getPluginInfo(pluginId);
    return pluginInfo?.status === PluginStatus.ACTIVE;
  }

  /**
   * 获取插件状态
   * @param pluginId 插件ID
   * @returns 插件状态
   */
  getPluginStatus(pluginId: string): PluginStatus | undefined {
    const pluginInfo = this.getPluginInfo(pluginId);
    return pluginInfo?.status;
  }

  /**
   * 按状态筛选插件
   * @param status 插件状态
   * @returns 匹配状态的插件数组
   */
  getPluginsByStatus(status: PluginStatus): PluginInfo[] {
    return this.getInstalledPlugins().filter(plugin => plugin.status === status);
  }

  /**
   * 获取活跃插件列表
   * @returns 活跃插件数组
   */
  getActivePlugins(): PluginInfo[] {
    return this.getPluginsByStatus(PluginStatus.ACTIVE);
  }

  /**
   * 获取非活跃插件列表
   * @returns 非活跃插件数组
   */
  getInactivePlugins(): PluginInfo[] {
    return this.getPluginsByStatus(PluginStatus.INACTIVE);
  }

  /**
   * 批量启用插件
   * @param pluginIds 插件ID数组
   * @returns 成功启用的插件ID数组
   */
  async enablePlugins(pluginIds: string[]): Promise<string[]> {
    const successfulIds: string[] = [];
    
    for (const pluginId of pluginIds) {
      try {
        const success = await this.enablePlugin(pluginId);
        if (success) {
          successfulIds.push(pluginId);
        }
      } catch (error) {
        console.error(`Failed to enable plugin ${pluginId}:`, error);
      }
    }
    
    return successfulIds;
  }

  /**
   * 批量禁用插件
   * @param pluginIds 插件ID数组
   * @returns 成功禁用的插件ID数组
   */
  async disablePlugins(pluginIds: string[]): Promise<string[]> {
    const successfulIds: string[] = [];
    
    for (const pluginId of pluginIds) {
      try {
        const success = await this.disablePlugin(pluginId);
        if (success) {
          successfulIds.push(pluginId);
        }
      } catch (error) {
        console.error(`Failed to disable plugin ${pluginId}:`, error);
      }
    }
    
    return successfulIds;
  }

  /**
   * 启用所有插件
   * @returns 成功启用的插件ID数组
   */
  async enableAllPlugins(): Promise<string[]> {
    const pluginIds = this.getInstalledPlugins().map(plugin => plugin.manifest.id);
    return this.enablePlugins(pluginIds);
  }

  /**
   * 禁用所有插件
   * @returns 成功禁用的插件ID数组
   */
  async disableAllPlugins(): Promise<string[]> {
    const pluginIds = this.getActivePlugins().map(plugin => plugin.manifest.id);
    return this.disablePlugins(pluginIds);
  }

  /**
   * 获取插件统计信息
   * @returns 统计信息对象
   */
  getPluginStatistics(): {
    total: number;
    active: number;
    inactive: number;
    error: number;
  } {
    const plugins = this.getInstalledPlugins();
    
    return {
      total: plugins.length,
      active: plugins.filter(p => p.status === PluginStatus.ACTIVE).length,
      inactive: plugins.filter(p => p.status === PluginStatus.INACTIVE).length,
      error: plugins.filter(p => p.status === PluginStatus.ERROR).length,
    };
  }

  /**
   * 验证插件清单
   * @private
   */
  private validatePluginManifest(manifest: PluginManifest): void {
    if (!manifest.id || manifest.id.trim() === '') {
      throw new Error('Invalid plugin manifest: missing or empty id');
    }
    
    if (!manifest.name || manifest.name.trim() === '') {
      throw new Error('Invalid plugin manifest: missing or empty name');
    }
    
    if (!manifest.version || manifest.version.trim() === '') {
      throw new Error('Invalid plugin manifest: missing or empty version');
    }
    
    if (!manifest.entry || manifest.entry.trim() === '') {
      throw new Error('Invalid plugin manifest: missing or empty entry');
    }
    
    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Invalid plugin manifest: permissions must be an array');
    }
  }

  /**
   * 获取插件路径（简化实现，实际应用中可能需要更复杂的路径管理）
   * @private
   */
  private getPluginPath(pluginId: string): string | null {
    // 这里是一个简化的实现
    // 实际应用中可能需要维护一个插件ID到路径的映射
    return `/plugins/${pluginId}`;
  }
}