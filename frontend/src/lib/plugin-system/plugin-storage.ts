import type { PluginStorage } from '../../../../shared/src/types/plugin';

/**
 * PluginStorage 实现
 * 为插件提供持久化存储功能
 * 支持 localStorage 和 sessionStorage，带有命名空间隔离
 */
export class BrowserPluginStorage implements PluginStorage {
  private pluginId: string;
  private storageType: 'local' | 'session';
  private prefix: string;

  constructor(pluginId: string, storageType: 'local' | 'session' = 'local') {
    this.pluginId = pluginId;
    this.storageType = storageType;
    this.prefix = `lifebox_plugin_${pluginId}_`;
  }

  /**
   * 获取存储值
   * @param key 存储键
   * @returns 存储值
   */
  async get(key: string): Promise<any> {
    try {
      const storage = this.getStorage();
      const fullKey = this.getFullKey(key);
      const value = storage.getItem(fullKey);
      
      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error(`[PluginStorage] Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置存储值
   * @param key 存储键
   * @param value 存储值
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const storage = this.getStorage();
      const fullKey = this.getFullKey(key);
      const serializedValue = JSON.stringify(value);
      
      storage.setItem(fullKey, serializedValue);
    } catch (error) {
      console.error(`[PluginStorage] Failed to set ${key}:`, error);
      throw new Error(`Failed to store data: ${(error as Error).message}`);
    }
  }

  /**
   * 删除存储值
   * @param key 存储键
   */
  async remove(key: string): Promise<void> {
    try {
      const storage = this.getStorage();
      const fullKey = this.getFullKey(key);
      storage.removeItem(fullKey);
    } catch (error) {
      console.error(`[PluginStorage] Failed to remove ${key}:`, error);
      throw new Error(`Failed to remove data: ${(error as Error).message}`);
    }
  }

  /**
   * 清空所有存储
   */
  async clear(): Promise<void> {
    try {
      const storage = this.getStorage();
      const keys = await this.keys();
      
      for (const key of keys) {
        const fullKey = this.getFullKey(key);
        storage.removeItem(fullKey);
      }
    } catch (error) {
      console.error(`[PluginStorage] Failed to clear storage:`, error);
      throw new Error(`Failed to clear storage: ${(error as Error).message}`);
    }
  }

  /**
   * 获取所有键
   * @returns 键数组
   */
  async keys(): Promise<string[]> {
    try {
      const storage = this.getStorage();
      const keys: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      
      return keys;
    } catch (error) {
      console.error(`[PluginStorage] Failed to get keys:`, error);
      return [];
    }
  }

  /**
   * 检查键是否存在
   * @param key 存储键
   * @returns 是否存在
   */
  async has(key: string): Promise<boolean> {
    try {
      const storage = this.getStorage();
      const fullKey = this.getFullKey(key);
      return storage.getItem(fullKey) !== null;
    } catch (error) {
      console.error(`[PluginStorage] Failed to check ${key}:`, error);
      return false;
    }
  }

  /**
   * 获取存储大小（估算）
   * @returns 存储大小（字节）
   */
  async size(): Promise<number> {
    try {
      const storage = this.getStorage();
      let totalSize = 0;
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = storage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      
      return totalSize * 2; // 每个字符通常占用 2 字节
    } catch (error) {
      console.error(`[PluginStorage] Failed to calculate size:`, error);
      return 0;
    }
  }

  /**
   * 获取所有数据
   * @returns 数据对象
   */
  async getAll(): Promise<Record<string, any>> {
    try {
      const keys = await this.keys();
      const data: Record<string, any> = {};
      
      for (const key of keys) {
        data[key] = await this.get(key);
      }
      
      return data;
    } catch (error) {
      console.error(`[PluginStorage] Failed to get all data:`, error);
      return {};
    }
  }

  /**
   * 批量设置数据
   * @param data 数据对象
   */
  async setAll(data: Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(data)) {
        await this.set(key, value);
      }
    } catch (error) {
      console.error(`[PluginStorage] Failed to set all data:`, error);
      throw new Error(`Failed to store data: ${(error as Error).message}`);
    }
  }

  /**
   * 导出数据为 JSON
   * @returns JSON 字符串
   */
  async export(): Promise<string> {
    try {
      const data = await this.getAll();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error(`[PluginStorage] Failed to export data:`, error);
      throw new Error(`Failed to export data: ${(error as Error).message}`);
    }
  }

  /**
   * 从 JSON 导入数据
   * @param jsonData JSON 字符串
   * @param merge 是否合并（默认为覆盖）
   */
  async import(jsonData: string, merge: boolean = false): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!merge) {
        await this.clear();
      }
      
      await this.setAll(data);
    } catch (error) {
      console.error(`[PluginStorage] Failed to import data:`, error);
      throw new Error(`Failed to import data: ${(error as Error).message}`);
    }
  }

  /**
   * 获取存储对象
   * @private
   */
  private getStorage(): Storage {
    if (typeof window === 'undefined') {
      throw new Error('Storage is not available in non-browser environment');
    }

    return this.storageType === 'local' ? window.localStorage : window.sessionStorage;
  }

  /**
   * 获取完整的存储键
   * @private
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 切换存储类型
   * @param storageType 存储类型
   */
  switchStorageType(storageType: 'local' | 'session'): void {
    this.storageType = storageType;
  }

  /**
   * 获取插件 ID
   * @returns 插件 ID
   */
  getPluginId(): string {
    return this.pluginId;
  }

  /**
   * 获取存储类型
   * @returns 存储类型
   */
  getStorageType(): 'local' | 'session' {
    return this.storageType;
  }
}

/**
 * 内存存储实现（用于测试或特殊场景）
 */
export class MemoryPluginStorage implements PluginStorage {
  private data = new Map<string, any>();
  private pluginId: string;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  async get(key: string): Promise<any> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async has(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async size(): Promise<number> {
    return this.data.size;
  }

  async getAll(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.data.entries()) {
      result[key] = value;
    }
    return result;
  }

  getPluginId(): string {
    return this.pluginId;
  }
}