import type {
  PluginSource,
  SourcePluginInfo,
  PluginSourceResponse,
  PluginSearchFilter,
  PluginInstallOptions,
  PluginInfo
} from '@lifebox/shared';

/**
 * 插件源服务
 * 负责与插件源进行通信，获取插件列表、安装插件等
 */
export class PluginSourceService {
  private static instance: PluginSourceService;

  static getInstance(): PluginSourceService {
    if (!PluginSourceService.instance) {
      PluginSourceService.instance = new PluginSourceService();
    }
    return PluginSourceService.instance;
  }

  /**
   * 获取插件源的插件列表
   */
  async fetchPluginsFromSource(
    source: PluginSource,
    filters?: PluginSearchFilter
  ): Promise<SourcePluginInfo[]> {
    try {
      const url = new URL(source.url);

      // 添加查询参数
      if (filters?.query) {
        url.searchParams.set('q', filters.query);
      }
      if (filters?.category) {
        url.searchParams.set('category', filters.category);
      }
      if (filters?.sortBy) {
        url.searchParams.set('sort', filters.sortBy);
      }
      if (filters?.sortOrder) {
        url.searchParams.set('order', filters.sortOrder);
      }
      if (filters?.page) {
        url.searchParams.set('page', filters.page.toString());
      }
      if (filters?.pageSize) {
        url.searchParams.set('limit', filters.pageSize.toString());
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // 添加认证信息
      if (source.auth) {
        switch (source.auth.type) {
          case 'basic':
            if (source.auth.username && source.auth.password) {
              headers['Authorization'] = `Basic ${btoa(`${source.auth.username}:${source.auth.password}`)}`;
            }
            break;
          case 'token':
            if (source.auth.token) {
              headers['Authorization'] = `Bearer ${source.auth.token}`;
            }
            break;
          case 'api_key':
            if (source.auth.apiKey) {
              headers['X-API-Key'] = source.auth.apiKey;
            }
            break;
        }

        // 添加自定义请求头
        if (source.auth.headers) {
          Object.assign(headers, source.auth.headers);
        }
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PluginSourceResponse = await response.json();

      // 标记已安装的插件
      const plugins = data.plugins.map(plugin => ({
        ...plugin,
        isInstalled: this.isPluginInstalled(plugin.id),
        installedVersion: this.getInstalledPluginVersion(plugin.id),
        hasUpdate: this.hasPluginUpdate(plugin.id, plugin.version),
      }));

      return plugins;
    } catch (error) {
      console.error(`Failed to fetch plugins from source ${source.name}:`, error);
      throw error;
    }
  }

  /**
   * 从URL下载插件
   */
  async downloadPlugin(downloadUrl: string, source: PluginSource): Promise<Blob> {
    try {
      const headers: Record<string, string> = {};

      // 添加认证信息
      if (source.auth) {
        switch (source.auth.type) {
          case 'basic':
            if (source.auth.username && source.auth.password) {
              headers['Authorization'] = `Basic ${btoa(`${source.auth.username}:${source.auth.password}`)}`;
            }
            break;
          case 'token':
            if (source.auth.token) {
              headers['Authorization'] = `Bearer ${source.auth.token}`;
            }
            break;
          case 'api_key':
            if (source.auth.apiKey) {
              headers['X-API-Key'] = source.auth.apiKey;
            }
            break;
        }
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download plugin:', error);
      throw error;
    }
  }

  /**
   * 安装插件
   */
  async installPlugin(
    plugin: SourcePluginInfo,
    source: PluginSource,
    options: PluginInstallOptions = {}
  ): Promise<PluginInfo> {
    try {
      options.onProgress?.(0, '开始下载插件...');

      // 1. 下载插件
      const pluginBlob = await this.downloadPlugin(plugin.downloadUrl, source);
      options.onProgress?.(30, '下载完成，正在解析...');

      // 2. 解析插件包（这里简化处理，实际需要解压zip等格式）
      const pluginContent = await this.parsePluginBlob(pluginBlob);
      options.onProgress?.(60, '解析完成，正在安装...');

      // 3. 验证插件
      await this.validatePlugin(pluginContent, plugin);
      options.onProgress?.(80, '验证完成，正在注册插件...');

      // 4. 调用插件管理器安装
      const pluginInfo = await this.registerPlugin(pluginContent, options);
      options.onProgress?.(100, '安装完成');

      options.onComplete?.(pluginInfo);
      return pluginInfo;

    } catch (error) {
      console.error('Failed to install plugin:', error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      // TODO: 调用插件管理器的卸载方法
      // const pluginManager = getPluginManager();
      // return await pluginManager.uninstallPlugin(pluginId);

      // 临时实现
      console.log('Uninstalling plugin:', pluginId);
      return true;
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
      return false;
    }
  }

  /**
   * 检查插件是否已安装
   */
  private isPluginInstalled(_pluginId: string): boolean {
    // TODO: 检查插件管理器中是否已安装此插件
    // const pluginManager = getPluginManager();
    // return pluginManager.isPluginInstalled(pluginId);

    // 临时实现
    return false;
  }

  /**
   * 获取已安装插件的版本
   */
  private getInstalledPluginVersion(_pluginId: string): string | undefined {
    // TODO: 从插件管理器获取已安装插件的版本
    // const pluginManager = getPluginManager();
    // const pluginInfo = pluginManager.getPluginInfo(pluginId);
    // return pluginInfo?.manifest.version;

    return undefined;
  }

  /**
   * 检查插件是否有更新
   */
  private hasPluginUpdate(pluginId: string, latestVersion: string): boolean {
    const installedVersion = this.getInstalledPluginVersion(pluginId);
    if (!installedVersion) return false;

    // 简单的版本比较（实际应用中应该使用 semver）
    return this.compareVersions(latestVersion, installedVersion) > 0;
  }

  /**
   * 比较版本号
   */
  private compareVersions(version1: string, version2: string): number {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  /**
   * 解析插件包
   */
  private async parsePluginBlob(blob: Blob): Promise<any> {
    // TODO: 实现插件包解析逻辑
    // 通常需要解压zip文件，读取manifest.json等

    // 临时实现：假设插件包是JSON格式
    const text = await blob.text();
    try {
      return JSON.parse(text);
    } catch {
      // 如果不是JSON，返回blob的URL用于script标签加载
      return {
        type: 'script',
        url: URL.createObjectURL(blob)
      };
    }
  }

  /**
   * 验证插件
   */
  private async validatePlugin(_pluginContent: any, expectedInfo: SourcePluginInfo): Promise<void> {
    // TODO: 实现插件验证逻辑
    // 1. 验证manifest.json格式
    // 2. 检查权限声明
    // 3. 验证数字签名（如果有）
    // 4. 安全性扫描等

    console.log('Validating plugin:', expectedInfo.name);
  }

  /**
   * 注册插件到系统
   */
  private async registerPlugin(_pluginContent: any, options: PluginInstallOptions): Promise<PluginInfo> {
    // TODO: 调用插件管理器注册插件
    // const pluginManager = getPluginManager();
    // return await pluginManager.installPlugin(pluginContent);

    // 临时实现
    const mockPluginInfo: PluginInfo = {
      manifest: {
        id: `plugin_${Date.now()}`,
        name: 'Mock Plugin',
        version: '1.0.0',
        description: 'A mock plugin for testing',
        entry: 'index.js',
        permissions: [],
      },
      status: 'loaded' as any,
      loadTime: Date.now(),
    };

    if (options.autoEnable) {
      // TODO: 自动启用插件
      mockPluginInfo.status = 'active' as any;
    }

    return mockPluginInfo;
  }

  /**
   * 从后端API获取插件列表
   */
  async fetchPluginsFromBackend(filters?: PluginSearchFilter): Promise<SourcePluginInfo[]> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const url = new URL(`${baseUrl}/api/plugins/repository`);

      // 添加查询参数
      if (filters?.query) {
        url.searchParams.set('q', filters.query);
      }
      if (filters?.category) {
        url.searchParams.set('category', filters.category);
      }
      if (filters?.sortBy) {
        url.searchParams.set('sort', filters.sortBy);
      }
      if (filters?.sortOrder) {
        url.searchParams.set('order', filters.sortOrder);
      }
      if (filters?.page) {
        url.searchParams.set('page', filters.page.toString());
      }
      if (filters?.pageSize) {
        url.searchParams.set('limit', filters.pageSize.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PluginSourceResponse = await response.json();
      return data.plugins;
    } catch (error) {
      console.error('Failed to fetch plugins from backend:', error);
      return [];
    }
  }

  /**
   * 搜索插件（使用后端API）
   */
  async searchPluginsFromBackend(query: string, filters?: Omit<PluginSearchFilter, 'query'>): Promise<SourcePluginInfo[]> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const url = new URL(`${baseUrl}/api/plugins/search`);

      url.searchParams.set('q', query);
      if (filters?.category) {
        url.searchParams.set('category', filters.category);
      }
      if (filters?.sortBy) {
        url.searchParams.set('sort', filters.sortBy);
      }
      if (filters?.sortOrder) {
        url.searchParams.set('order', filters.sortOrder);
      }
      if (filters?.page) {
        url.searchParams.set('page', filters.page.toString());
      }
      if (filters?.pageSize) {
        url.searchParams.set('limit', filters.pageSize.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PluginSourceResponse = await response.json();
      return data.plugins;
    } catch (error) {
      console.error('Failed to search plugins from backend:', error);
      return []
    }
  }

  /**
   * 获取推荐插件（使用后端API）
   */
  async getFeaturedPluginsFromBackend(limit: number = 6): Promise<SourcePluginInfo[]> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const url = new URL(`${baseUrl}/api/plugins/featured`);
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plugins || [];
    } catch (error) {
      console.error('Failed to get featured plugins from backend:', error);
      return [];
    }
  }

  /**
   * 获取插件分类（使用后端API）
   */
  async getCategoriesFromBackend(): Promise<string[]> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/plugins/categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Failed to get categories from backend:', error);
      // 如果后端不可用，返回默认分类
      return ['communication', 'productivity', 'utility', 'entertainment', 'development'];
    }
  }
}