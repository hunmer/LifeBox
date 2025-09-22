import path from 'path';
import fs from 'fs/promises';
import type {
  SourcePluginInfo,
  PluginSourceResponse,
  PluginSearchFilter,
  RepositoryStats
} from '@lifebox/shared';

interface PluginDownloadInfo {
  type: 'local' | 'external';
  path?: string;
  url?: string;
}

interface PluginRepositoryConfig {
  plugins: SourcePluginInfo[];
  categories: string[];
  lastUpdated: number;
}

/**
 * 插件仓库服务
 * 管理插件仓库的数据和文件服务
 */
export class PluginRepositoryService {
  private configPath: string;
  private pluginsDirectory: string;
  private config: PluginRepositoryConfig | null = null;

  constructor() {
    this.configPath = path.join(process.cwd(), 'data', 'plugin-repository.json');
    this.pluginsDirectory = path.join(process.cwd(), 'data', 'plugins');
    this.initializeRepository();
  }

  /**
   * 初始化插件仓库
   */
  private async initializeRepository(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.mkdir(this.pluginsDirectory, { recursive: true });

      // 加载或创建配置
      await this.loadOrCreateConfig();
    } catch (error) {
      console.error('Failed to initialize plugin repository:', error);
    }
  }

  /**
   * 加载或创建配置文件
   */
  private async loadOrCreateConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      // 如果配置文件不存在，创建默认配置
      console.log('Creating default plugin repository configuration');
      this.config = await this.createDefaultConfig();
      await this.saveConfig();
    }
  }

  /**
   * 创建默认配置
   */
  private async createDefaultConfig(): Promise<PluginRepositoryConfig> {
    return {
      plugins: [
      ],
      categories: [
      ],
      lastUpdated: Date.now()
    };
  }

  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) return;

    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save plugin repository config:', error);
    }
  }

  /**
   * 获取插件列表
   */
  async getPlugins(filters: PluginSearchFilter = {}): Promise<PluginSourceResponse> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    let plugins = [...(this.config?.plugins || [])];

    // 应用筛选
    if (filters.query) {
      const query = filters.query.toLowerCase();
      plugins = plugins.filter(plugin =>
        plugin.name.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.category) {
      plugins = plugins.filter(plugin => plugin.category === filters.category);
    }

    // 排序
    const sortBy = filters.sortBy || 'downloads';
    const sortOrder = filters.sortOrder || 'desc';

    plugins.sort((a, b) => {
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
          aValue = a.lastUpdated;
          bValue = b.lastUpdated;
          break;
        case 'downloads':
        default:
          aValue = a.downloads;
          bValue = b.downloads;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 分页
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPlugins = plugins.slice(startIndex, endIndex);

    return {
      plugins: paginatedPlugins,
      total: plugins.length,
      page,
      pageSize,
      totalPages: Math.ceil(plugins.length / pageSize)
    };
  }

  /**
   * 根据ID获取插件
   */
  async getPluginById(pluginId: string): Promise<SourcePluginInfo | null> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    return this.config?.plugins.find(plugin => plugin.id === pluginId) || null;
  }

  /**
   * 搜索插件
   */
  async searchPlugins(filters: PluginSearchFilter): Promise<PluginSourceResponse> {
    return this.getPlugins(filters);
  }

  /**
   * 获取推荐插件
   */
  async getFeaturedPlugins(limit: number = 6): Promise<SourcePluginInfo[]> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    const featuredPlugins = this.config?.plugins.filter(plugin => plugin.featured) || [];
    return featuredPlugins.slice(0, limit);
  }

  /**
   * 获取分类列表
   */
  async getCategories(): Promise<string[]> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    return this.config?.categories || [];
  }

  /**
   * 获取仓库统计信息
   */
  async getRepositoryStats(): Promise<RepositoryStats> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    const plugins = this.config?.plugins || [];
    const totalDownloads = plugins.reduce((sum, plugin) => sum + plugin.downloads, 0);
    const averageRating = plugins.reduce((sum, plugin) => sum + (plugin.rating || 0), 0) / plugins.length;

    const categoryStats = plugins.reduce((stats, plugin) => {
      stats[plugin.category] = (stats[plugin.category] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      totalPlugins: plugins.length,
      totalDownloads,
      averageRating: Math.round(averageRating * 10) / 10,
      categoryStats,
      lastUpdated: this.config?.lastUpdated || Date.now()
    };
  }

  /**
   * 获取插件下载信息
   */
  async getPluginDownload(pluginId: string, version?: string): Promise<PluginDownloadInfo | null> {
    const plugin = await this.getPluginById(pluginId);
    if (!plugin) return null;

    // 检查本地文件是否存在
    const pluginDir = path.join(this.pluginsDirectory, pluginId);
    const zipFilePath = path.join(pluginDir, `${pluginId}.zip`);

    try {
      await fs.access(zipFilePath);
      return {
        type: 'local',
        path: zipFilePath
      };
    } catch {
      // 本地文件不存在，返回外部URL
      return {
        type: 'external',
        url: plugin.downloadUrl
      };
    }
  }

  /**
   * 添加插件到仓库
   */
  async addPlugin(plugin: SourcePluginInfo): Promise<void> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    if (!this.config) return;

    // 检查插件是否已存在
    const existingIndex = this.config.plugins.findIndex(p => p.id === plugin.id);

    if (existingIndex >= 0) {
      // 更新现有插件
      this.config.plugins[existingIndex] = plugin;
    } else {
      // 添加新插件
      this.config.plugins.push(plugin);
    }

    this.config.lastUpdated = Date.now();
    await this.saveConfig();
  }

  /**
   * 移除插件
   */
  async removePlugin(pluginId: string): Promise<boolean> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    if (!this.config) return false;

    const initialLength = this.config.plugins.length;
    this.config.plugins = this.config.plugins.filter(plugin => plugin.id !== pluginId);

    if (this.config.plugins.length < initialLength) {
      this.config.lastUpdated = Date.now();
      await this.saveConfig();
      return true;
    }

    return false;
  }

  /**
   * 更新插件信息
   */
  async updatePlugin(pluginId: string, updates: Partial<SourcePluginInfo>): Promise<boolean> {
    if (!this.config) {
      await this.loadOrCreateConfig();
    }

    if (!this.config) return false;

    const pluginIndex = this.config.plugins.findIndex(plugin => plugin.id === pluginId);

    if (pluginIndex >= 0) {
      this.config.plugins[pluginIndex] = {
        ...this.config.plugins[pluginIndex],
        ...updates,
        lastUpdated: Date.now()
      };

      this.config.lastUpdated = Date.now();
      await this.saveConfig();
      return true;
    }

    return false;
  }
}

// 创建单例实例
export const pluginRepositoryService = new PluginRepositoryService();