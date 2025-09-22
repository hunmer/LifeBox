import type {
  SourcePluginInfo,
  PluginSearchFilter,
} from '@lifebox/shared';

export interface PluginRepository {
  plugins: any[];
  categories: any[];
  metadata: {
    version: string;
    lastUpdated: number;
    totalPlugins: number;
    totalDownloads: number;
    averageRating: number;
  };
}

export interface PaginatedPluginResult {
  plugins: SourcePluginInfo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 静态插件数据服务
 * 从本地JSON文件读取插件数据，实现前端搜索、过滤和排序
 */
export class StaticPluginService {
  private static instance: StaticPluginService;
  private pluginData: PluginRepository | null = null;

  static getInstance(): StaticPluginService {
    if (!StaticPluginService.instance) {
      StaticPluginService.instance = new StaticPluginService();
    }
    return StaticPluginService.instance;
  }

  /**
   * 从静态JSON文件加载插件数据
   */
  private async loadPluginData(): Promise<PluginRepository> {
    if (this.pluginData) {
      return this.pluginData;
    }

    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
      const response = await fetch(`${backendUrl}/public/plugins-repository.json`);
      if (!response.ok) {
        throw new Error(`Failed to load plugin data: ${response.status}`);
      }
      this.pluginData = await response.json();
      return this.pluginData!;
    } catch (error) {
      console.error('Failed to load plugin repository data:', error);
      // 返回空数据结构作为回退
      const fallbackData: PluginRepository = {
        plugins: [],
        categories: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: Date.now(),
          totalPlugins: 0,
          totalDownloads: 0,
          averageRating: 0
        }
      };
      this.pluginData = fallbackData;
      return fallbackData;
    }
  }

  /**
   * 前端过滤和排序插件
   */
  private filterAndSortPlugins(plugins: any[], filters?: PluginSearchFilter): any[] {
    let filteredPlugins = [...plugins];

    // 文本搜索
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      filteredPlugins = filteredPlugins.filter(plugin =>
        plugin.name.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.tags.some((tag: string) => tag.toLowerCase().includes(query)) ||
        plugin.author.toLowerCase().includes(query)
      );
    }

    // 分类过滤
    if (filters?.category) {
      filteredPlugins = filteredPlugins.filter(plugin => plugin.category === filters.category);
    }

    // 排序
    const sortBy = filters?.sortBy || 'downloads';
    const sortOrder = filters?.sortOrder || 'desc';

    filteredPlugins.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'updated':
          aValue = a.lastUpdated || 0;
          bValue = b.lastUpdated || 0;
          break;
        case 'downloads':
        default:
          aValue = a.downloads || 0;
          bValue = b.downloads || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredPlugins;
  }

  /**
   * 前端分页处理
   */
  private paginatePlugins(plugins: any[], page?: number, pageSize?: number): PaginatedPluginResult {
    const currentPage = page || 1;
    const currentPageSize = pageSize || 20;
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    const paginatedPlugins = plugins.slice(startIndex, endIndex);

    return {
      plugins: paginatedPlugins,
      total: plugins.length,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: Math.ceil(plugins.length / currentPageSize)
    };
  }

  /**
   * 检查插件是否已安装
   */
  private isPluginInstalled(_pluginId: string): boolean {
    // TODO: 检查插件管理器中是否已安装此插件
    return false;
  }

  /**
   * 获取已安装插件的版本
   */
  private getInstalledPluginVersion(_pluginId: string): string | undefined {
    // TODO: 从插件管理器获取已安装插件的版本
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
   * 获取插件列表
   */
  async getPlugins(filters?: PluginSearchFilter): Promise<SourcePluginInfo[]> {
    try {
      const data = await this.loadPluginData();
      let plugins = data.plugins || [];

      // 标记已安装的插件
      plugins = plugins.map((plugin: any) => ({
        ...plugin,
        isInstalled: this.isPluginInstalled(plugin.id),
        installedVersion: this.getInstalledPluginVersion(plugin.id),
        hasUpdate: this.hasPluginUpdate(plugin.id, plugin.version),
      }));

      // 应用过滤和排序
      const filteredPlugins = this.filterAndSortPlugins(plugins, filters);

      // 如果需要分页，应用分页
      if (filters?.page || filters?.pageSize) {
        const paginatedResult = this.paginatePlugins(filteredPlugins, filters.page, filters.pageSize);
        return paginatedResult.plugins;
      }

      return filteredPlugins;
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      return [];
    }
  }

  /**
   * 获取分页的插件列表
   */
  async getPluginsWithPagination(filters?: PluginSearchFilter): Promise<PaginatedPluginResult> {
    try {
      const data = await this.loadPluginData();
      let plugins = data.plugins || [];

      // 标记已安装的插件
      plugins = plugins.map((plugin: any) => ({
        ...plugin,
        isInstalled: this.isPluginInstalled(plugin.id),
        installedVersion: this.getInstalledPluginVersion(plugin.id),
        hasUpdate: this.hasPluginUpdate(plugin.id, plugin.version),
      }));

      // 应用过滤和排序
      const filteredPlugins = this.filterAndSortPlugins(plugins, filters);

      // 应用分页
      return this.paginatePlugins(filteredPlugins, filters?.page, filters?.pageSize);
    } catch (error) {
      console.error('Failed to fetch plugins with pagination:', error);
      return {
        plugins: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      };
    }
  }

  /**
   * 搜索插件
   */
  async searchPlugins(query: string, filters?: Omit<PluginSearchFilter, 'query'>): Promise<SourcePluginInfo[]> {
    return this.getPlugins({ ...filters, query });
  }

  /**
   * 获取推荐插件
   */
  async getFeaturedPlugins(limit: number = 6): Promise<SourcePluginInfo[]> {
    try {
      const data = await this.loadPluginData();
      const plugins = data.plugins || [];

      const featuredPlugins = plugins
        .filter((plugin: any) => plugin.featured)
        .map((plugin: any) => ({
          ...plugin,
          isInstalled: this.isPluginInstalled(plugin.id),
          installedVersion: this.getInstalledPluginVersion(plugin.id),
          hasUpdate: this.hasPluginUpdate(plugin.id, plugin.version),
        }))
        .slice(0, limit);

      return featuredPlugins;
    } catch (error) {
      console.error('Failed to get featured plugins:', error);
      return [];
    }
  }

  /**
   * 获取插件分类
   */
  async getCategories(): Promise<any[]> {
    try {
      const data = await this.loadPluginData();
      return data.categories || [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      // 如果数据不可用，返回默认分类
      return [
        { id: 'communication', name: '通信交流', icon: '💬', description: '聊天、通信和社交相关插件' },
        { id: 'productivity', name: '效率工具', icon: '⚡', description: '提升工作效率的工具和应用' },
        { id: 'utility', name: '实用工具', icon: '🔧', description: '日常实用工具和小应用' },
        { id: 'entertainment', name: '娱乐休闲', icon: '🎮', description: '娱乐、游戏和休闲相关插件' },
        { id: 'development', name: '开发工具', icon: '👨‍💻', description: '编程和开发相关工具' }
      ];
    }
  }

  /**
   * 获取插件统计信息
   */
  async getPluginStats(): Promise<any> {
    try {
      const data = await this.loadPluginData();
      const plugins = data.plugins || [];

      const totalDownloads = plugins.reduce((sum: number, plugin: any) => sum + (plugin.downloads || 0), 0);
      const averageRating = plugins.reduce((sum: number, plugin: any) => sum + (plugin.rating || 0), 0) / (plugins.length || 1);

      const categoryStats = plugins.reduce((stats: any, plugin: any) => {
        stats[plugin.category] = (stats[plugin.category] || 0) + 1;
        return stats;
      }, {});

      return {
        totalPlugins: plugins.length,
        totalDownloads,
        averageRating: Math.round(averageRating * 10) / 10,
        categoryStats,
        lastUpdated: data.metadata?.lastUpdated || Date.now()
      };
    } catch (error) {
      console.error('Failed to get plugin stats:', error);
      return {
        totalPlugins: 0,
        totalDownloads: 0,
        averageRating: 0,
        categoryStats: {},
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * 根据ID获取特定插件
   */
  async getPluginById(pluginId: string): Promise<SourcePluginInfo | null> {
    try {
      const data = await this.loadPluginData();
      const plugin = data.plugins.find((p: any) => p.id === pluginId);

      if (!plugin) {
        return null;
      }

      return {
        ...plugin,
        isInstalled: this.isPluginInstalled(plugin.id),
        installedVersion: this.getInstalledPluginVersion(plugin.id),
        hasUpdate: this.hasPluginUpdate(plugin.id, plugin.version),
      };
    } catch (error) {
      console.error('Failed to get plugin by id:', error);
      return null;
    }
  }

  /**
   * 刷新插件数据缓存
   */
  async refreshData(): Promise<void> {
    this.pluginData = null;
    await this.loadPluginData();
  }
}