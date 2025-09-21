import type { UIManager, DialogConfig, MenuItem } from '@lifebox/shared';

/**
 * PluginUIManager 实现
 * 为插件提供 UI 管理功能，包括容器创建、通知、对话框等
 */
export class PluginUIManager implements UIManager {
  private containers = new Map<string, HTMLElement>();
  private menuItems = new Map<string, MenuItem>();
  private notificationContainer: HTMLElement | null = null;

  constructor() {
    this.initializeNotificationContainer();
  }

  /**
   * 创建容器元素
   * @param id 容器ID
   * @returns 创建的容器元素
   */
  createContainer(id: string): HTMLElement {
    // 如果容器已存在，返回现有容器
    if (this.containers.has(id)) {
      return this.containers.get(id)!;
    }

    const container = document.createElement('div');
    container.id = `plugin-container-${id}`;
    container.className = 'plugin-container';
    container.setAttribute('data-container-id', id);

    // 尝试添加到插件根容器
    const pluginRoot = document.getElementById('plugin-root');
    if (pluginRoot) {
      pluginRoot.appendChild(container);
    } else {
      // 如果没有插件根容器，添加到 body
      document.body.appendChild(container);
    }

    this.containers.set(id, container);
    return container;
  }

  /**
   * 移除容器元素
   * @param id 容器ID
   */
  removeContainer(id: string): void {
    const container = this.containers.get(id);
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      this.containers.delete(id);
    }
  }

  /**
   * 获取容器元素
   * @param id 容器ID
   * @returns 容器元素或 undefined
   */
  getContainer(id: string): HTMLElement | undefined {
    return this.containers.get(id);
  }

  /**
   * 显示通知
   * @param message 通知消息
   * @param type 通知类型
   */
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const notification = this.createNotificationElement(message, type);
    
    if (this.notificationContainer) {
      this.notificationContainer.appendChild(notification);
    }

    // 自动移除通知
    setTimeout(() => {
      this.removeNotification(notification);
    }, 5000);
  }

  /**
   * 显示对话框
   * @param config 对话框配置
   * @returns 对话框结果的 Promise
   */
  async showDialog(config: DialogConfig): Promise<any> {
    return new Promise((resolve) => {
      const dialog = this.createDialogElement(config, resolve);
      document.body.appendChild(dialog);
    });
  }

  /**
   * 添加菜单项
   * @param item 菜单项
   */
  addMenuItem(item: MenuItem): void {
    this.menuItems.set(item.id, item);
    this.renderMenuItem(item);
  }

  /**
   * 移除菜单项
   * @param id 菜单项ID
   */
  removeMenuItem(id: string): void {
    this.menuItems.delete(id);
    const menuElement = document.querySelector(`[data-menu-item-id="${id}"]`);
    if (menuElement && menuElement.parentNode) {
      menuElement.parentNode.removeChild(menuElement);
    }
  }

  /**
   * 获取所有菜单项
   * @returns 菜单项数组
   */
  getMenuItems(): MenuItem[] {
    return Array.from(this.menuItems.values());
  }

  /**
   * 显示加载状态
   * @param containerId 容器ID
   * @param message 加载消息
   */
  showLoading(containerId: string, message: string = 'Loading...'): void {
    const container = this.getContainer(containerId);
    if (container) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'plugin-loading';
      loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
      `;
      
      container.appendChild(loadingElement);
    }
  }

  /**
   * 隐藏加载状态
   * @param containerId 容器ID
   */
  hideLoading(containerId: string): void {
    const container = this.getContainer(containerId);
    if (container) {
      const loadingElement = container.querySelector('.plugin-loading');
      if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
      }
    }
  }

  /**
   * 创建通知容器
   * @private
   */
  private initializeNotificationContainer(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.notificationContainer = document.getElementById('notification-container');
    
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notification-container';
      this.notificationContainer.className = 'notification-container';
      this.notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      
      document.body.appendChild(this.notificationContainer);
    }
  }

  /**
   * 创建通知元素
   * @private
   */
  private createNotificationElement(message: string, type: string): HTMLElement {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
    `;

    notification.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${message}</span>
        <span style="margin-left: 12px; font-weight: bold;">&times;</span>
      </div>
    `;

    // 点击关闭
    notification.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    return notification;
  }

  /**
   * 获取通知颜色
   * @private
   */
  private getNotificationColor(type: string): string {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'info':
      default: return '#2196F3';
    }
  }

  /**
   * 移除通知
   * @private
   */
  private removeNotification(notification: HTMLElement): void {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  /**
   * 创建对话框元素
   * @private
   */
  private createDialogElement(config: DialogConfig, resolve: (value: any) => void): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      max-width: ${config.width || 500}px;
      max-height: ${config.height || 400}px;
      padding: 0;
      animation: fadeInScale 0.3s ease-out;
    `;

    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('h3');
    title.textContent = config.title;
    title.style.margin = '0';

    header.appendChild(title);

    if (config.closable !== false) {
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
      `;
      
      closeButton.addEventListener('click', () => {
        this.closeDialog(overlay, resolve, null);
      });
      
      header.appendChild(closeButton);
    }

    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.style.cssText = `
      padding: 20px;
      max-height: 300px;
      overflow-y: auto;
    `;
    content.innerHTML = config.content;

    const footer = document.createElement('div');
    footer.className = 'dialog-footer';
    footer.style.cssText = `
      padding: 16px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    `;

    // 添加按钮
    const buttons = config.buttons || [{ text: 'OK', type: 'primary' }];
    buttons.forEach((button, index) => {
      const btn = document.createElement('button');
      btn.textContent = button.text;
      btn.className = `dialog-button dialog-button-${button.type || 'secondary'}`;
      btn.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        background: ${button.type === 'primary' ? '#2196F3' : 
                    button.type === 'danger' ? '#F44336' : '#ccc'};
        color: ${button.type === 'secondary' ? '#333' : 'white'};
      `;

      btn.addEventListener('click', async () => {
        if (button.onClick) {
          await button.onClick();
        }
        this.closeDialog(overlay, resolve, index);
      });

      footer.appendChild(btn);
    });

    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && config.closable !== false) {
        this.closeDialog(overlay, resolve, null);
      }
    });

    return overlay;
  }

  /**
   * 关闭对话框
   * @private
   */
  private closeDialog(overlay: HTMLElement, resolve: (value: any) => void, result: any): void {
    overlay.style.animation = 'fadeOutScale 0.3s ease-in';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      resolve(result);
    }, 300);
  }

  /**
   * 渲染菜单项
   * @private
   */
  private renderMenuItem(item: MenuItem): void {
    // 这里的实现取决于应用的菜单结构
    // 简化实现，实际应用中可能需要与特定的菜单系统集成
    console.log(`[UIManager] Menu item added: ${item.title}`);
  }
}