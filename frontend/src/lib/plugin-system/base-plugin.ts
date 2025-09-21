import type { PluginAPI, PluginManifest } from '@lifebox/shared';

/**
 * BasePlugin 抽象基类
 * 为所有插件提供基础功能和 API 访问
 * 插件开发者需要继承此类并实现必要的生命周期方法
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

  // 抽象生命周期方法 - 子类必须实现
  /** 插件加载时调用 */
  abstract onLoad(): void | Promise<void>;
  /** 插件卸载时调用 */
  abstract onUnload(): void | Promise<void>;

  // 可选生命周期方法
  /** 插件激活时调用 */
  onActivate?(): void | Promise<void>;
  /** 插件停用时调用 */
  onDeactivate?(): void | Promise<void>;

  // 插件元数据方法
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

  /** 获取插件描述 */
  getDescription(): string {
    return this.manifest.description;
  }

  /** 获取插件清单 */
  getManifest(): PluginManifest {
    return this.manifest;
  }

  // UI 管理方法
  /**
   * 创建插件容器
   * @param id 容器ID后缀
   * @returns 创建的容器元素
   */
  protected createContainer(id: string): HTMLElement {
    const container = document.createElement('div');
    container.id = `plugin-${id}`;
    container.className = 'plugin-container';
    container.setAttribute('data-plugin-id', this.manifest.id);
    
    // 尝试添加到插件根容器
    const pluginRoot = document.getElementById('plugin-root');
    if (pluginRoot) {
      pluginRoot.appendChild(container);
    } else {
      // 如果没有插件根容器，添加到 body
      document.body.appendChild(container);
    }
    
    this.container = container;
    return container;
  }

  /**
   * 移除插件容器
   */
  protected removeContainer(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  /**
   * 获取插件容器
   * @returns 插件容器元素或null
   */
  protected getContainer(): HTMLElement | null {
    return this.container;
  }

  // 事件系统方法
  /**
   * 发送事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  protected emit(eventType: string, data: any): void {
    this.api.events.emit(eventType, data);
  }

  /**
   * 监听事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  protected on(eventType: string, handler: Function): void {
    this.api.events.on(eventType, handler as any);
  }

  /**
   * 移除事件监听
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  protected off(eventType: string, handler: Function): void {
    this.api.events.off(eventType, handler as any);
  }

  /**
   * 发送 LifeBox 事件
   * @param type 事件类型
   * @param data 事件数据
   * @param source 事件源（默认为插件ID）
   */
  protected async emitLifeBoxEvent(type: string, data: any, source?: string): Promise<any> {
    return this.api.events.emitLifeBoxEvent(type, data, source || this.manifest.id);
  }

  // 存储系统方法
  /**
   * 获取存储值
   * @param key 存储键
   * @returns 存储值
   */
  protected async getStorage(key: string): Promise<any> {
    return this.api.storage.get(key);
  }

  /**
   * 设置存储值
   * @param key 存储键
   * @param value 存储值
   */
  protected async setStorage(key: string, value: any): Promise<void> {
    return this.api.storage.set(key, value);
  }

  /**
   * 删除存储值
   * @param key 存储键
   */
  protected async removeStorage(key: string): Promise<void> {
    return this.api.storage.remove(key);
  }

  /**
   * 清空所有存储
   */
  protected async clearStorage(): Promise<void> {
    return this.api.storage.clear();
  }

  // HTTP 请求方法
  /**
   * GET 请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  protected async httpGet(url: string, config?: any): Promise<any> {
    return this.api.http.get(url, config);
  }

  /**
   * POST 请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  protected async httpPost(url: string, data?: any, config?: any): Promise<any> {
    return this.api.http.post(url, data, config);
  }

  /**
   * PUT 请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  protected async httpPut(url: string, data?: any, config?: any): Promise<any> {
    return this.api.http.put(url, data, config);
  }

  /**
   * DELETE 请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  protected async httpDelete(url: string, config?: any): Promise<any> {
    return this.api.http.delete(url, config);
  }

  // UI 辅助方法
  /**
   * 显示通知
   * @param message 通知消息
   * @param type 通知类型
   */
  protected showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void {
    this.api.ui.showNotification(message, type);
  }

  /**
   * 显示对话框
   * @param config 对话框配置
   * @returns 对话框结果
   */
  protected async showDialog(config: any): Promise<any> {
    return this.api.ui.showDialog(config);
  }

  // 配置管理方法
  /**
   * 获取配置值
   * @param key 配置键
   * @returns 配置值
   */
  protected getConfig(key: string): any {
    return this.api.config.get(key);
  }

  /**
   * 设置配置值
   * @param key 配置键
   * @param value 配置值
   */
  protected async setConfig(key: string, value: any): Promise<void> {
    return this.api.config.set(key, value);
  }

  /**
   * 获取所有配置
   * @returns 配置对象
   */
  protected getAllConfig(): Record<string, any> {
    return this.api.config.getAll();
  }

  // 日志记录方法
  /**
   * 记录调试日志
   * @param message 日志消息
   * @param args 附加参数
   */
  protected debug(message: string, ...args: any[]): void {
    this.api.logger.debug(`[${this.manifest.id}] ${message}`, ...args);
  }

  /**
   * 记录信息日志
   * @param message 日志消息
   * @param args 附加参数
   */
  protected info(message: string, ...args: any[]): void {
    this.api.logger.info(`[${this.manifest.id}] ${message}`, ...args);
  }

  /**
   * 记录警告日志
   * @param message 日志消息
   * @param args 附加参数
   */
  protected warn(message: string, ...args: any[]): void {
    this.api.logger.warn(`[${this.manifest.id}] ${message}`, ...args);
  }

  /**
   * 记录错误日志
   * @param message 日志消息
   * @param args 附加参数
   */
  protected error(message: string, ...args: any[]): void {
    this.api.logger.error(`[${this.manifest.id}] ${message}`, ...args);
  }

  // 权限检查方法
  /**
   * 检查是否有特定权限
   * @param permission 权限名称
   * @returns 是否有权限
   */
  protected hasPermission(permission: string): boolean {
    return this.manifest.permissions.includes(permission as any);
  }

  /**
   * 断言权限，如果没有权限则抛出错误
   * @param permission 权限名称
   * @param errorMessage 错误消息
   */
  protected assertPermission(permission: string, errorMessage?: string): void {
    if (!this.hasPermission(permission)) {
      throw new Error(errorMessage || `Plugin ${this.manifest.id} does not have permission: ${permission}`);
    }
  }
}