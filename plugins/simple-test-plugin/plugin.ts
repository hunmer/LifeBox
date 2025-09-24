// TypeScript版本的简单测试插件
// 这个文件展示如何用TypeScript编写插件（编译后生成plugin.js）

// 由于全局API设计时考虑了简化，这里可以使用any类型
declare const window: any;

interface LifeBoxAPI {
  React: any;
  components: {
    Button: any;
    [key: string]: any;
  };
  utils: {
    cn: any;
    [key: string]: any;
  };
  sidebar: {
    registerMenuItem: (item: any) => string;
    removeMenuItem: (id: string) => boolean;
    updateMenuItem: (id: string, updates: any) => boolean;
  };
  notifications: {
    show: (message: string, type?: string) => void;
    hide: (id?: string) => void;
  };
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, data?: any) => void;
  };
  logger: {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
  dom: {
    createElement: (tagName: string, attributes?: any, children?: any[]) => HTMLElement;
    findContainer: (id: string) => HTMLElement | null;
    renderReactComponent: (component: any, container: HTMLElement) => void;
    unmountReactComponent: (container: HTMLElement) => void;
  };
}

class TypeScriptTestPlugin {
  private pluginId = 'simple-test-plugin';
  private sidebarItemId: string | null = null;
  private isInitialized = false;
  private api: LifeBoxAPI;

  constructor() {
    // 获取全局API
    this.api = window.LifeBoxAPI;

    if (!this.api) {
      console.error('[TypeScript Test Plugin] LifeBoxAPI not available');
      return;
    }

    this.api.logger.info('TypeScriptTestPlugin initialized');
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // 注册侧边栏菜单项
      this.sidebarItemId = this.api.sidebar.registerMenuItem({
        label: 'TS测试插件',
        icon: '⚡',
        onClick: () => this.showPlugin()
      });

      // 监听事件
      this.api.events.on('ts-test:message', (event: any) => {
        this.api.logger.info('Received TypeScript test message:', event.detail);
        this.api.notifications.show(`TS插件收到: ${event.detail}`, 'info');
      });

      this.isInitialized = true;
      this.api.logger.info('TypeScript Plugin initialized successfully');

      // 自动显示插件
      this.showPlugin();

    } catch (error) {
      this.api.logger.error('Failed to initialize TypeScript plugin:', error);
    }
  }

  private showPlugin(): void {
    const container = this.api.dom.findContainer('plugin-root');
    if (!container) {
      this.api.logger.error('Plugin container not found');
      return;
    }

    // 清空容器
    container.innerHTML = '';

    const { React } = this.api;
    const { Button } = this.api.components;
    const { cn } = this.api.utils;

    // 创建功能更丰富的组件
    const TestComponent = React.createElement('div', {
      className: 'simple-test-plugin'
    }, [
      React.createElement('h3', { key: 'title' }, 'TypeScript 测试插件'),

      this.createInfoSection(),
      this.createButtonSection(),
      this.createAdvancedSection()
    ]);

    // 渲染组件
    this.api.dom.renderReactComponent(TestComponent, container);
  }

  private createInfoSection(): any {
    const { React } = this.api;

    return React.createElement('div', {
      key: 'info',
      className: 'info-box'
    }, [
      React.createElement('div', { key: 'status' }, [
        '状态: ',
        React.createElement('span', {
          className: this.api.utils.cn('status', this.isInitialized ? 'success' : 'error')
        }, this.isInitialized ? '已就绪' : '未初始化')
      ]),
      React.createElement('div', { key: 'type' }, '类型: TypeScript编写'),
      React.createElement('div', { key: 'sidebar' }, `侧边栏ID: ${this.sidebarItemId}`),
      React.createElement('div', { key: 'time' }, `当前时间: ${new Date().toLocaleString()}`)
    ]);
  }

  private createButtonSection(): any {
    const { React } = this.api;
    const { Button } = this.api.components;

    return React.createElement('div', {
      key: 'buttons',
      className: 'button-group'
    }, [
      React.createElement(Button, {
        key: 'notify-success',
        variant: 'default',
        onClick: () => this.api.notifications.show('TypeScript插件通知测试!', 'success')
      }, '成功通知'),

      React.createElement(Button, {
        key: 'notify-warning',
        variant: 'outline',
        onClick: () => this.api.notifications.show('这是警告消息', 'warning')
      }, '警告通知'),

      React.createElement(Button, {
        key: 'storage-advanced',
        variant: 'secondary',
        onClick: () => this.testAdvancedStorage()
      }, '高级存储测试'),

      React.createElement(Button, {
        key: 'event-emit',
        variant: 'ghost',
        onClick: () => {
          const message = `TypeScript插件消息: ${Date.now()}`;
          this.api.events.emit('ts-test:message', message);
        }
      }, '发送TS事件')
    ]);
  }

  private createAdvancedSection(): any {
    const { React } = this.api;
    const { Button } = this.api.components;

    return React.createElement('div', {
      key: 'advanced',
      style: { marginTop: '20px', padding: '16px', border: '1px dashed #ccc', borderRadius: '8px' }
    }, [
      React.createElement('h4', { key: 'title' }, '高级功能'),
      React.createElement('div', {
        key: 'advanced-buttons',
        className: 'button-group'
      }, [
        React.createElement(Button, {
          key: 'update-sidebar',
          size: 'sm',
          onClick: () => this.updateSidebarItem()
        }, '更新侧边栏'),

        React.createElement(Button, {
          key: 'clear-storage',
          variant: 'destructive',
          size: 'sm',
          onClick: () => this.clearAllStorage()
        }, '清空存储')
      ])
    ]);
  }

  private async testAdvancedStorage(): Promise<void> {
    try {
      const testData = {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        random: Math.random(),
        nested: {
          level1: {
            level2: 'deep value'
          }
        }
      };

      await this.api.storage.set('advanced-test-data', testData);
      const retrieved = await this.api.storage.get('advanced-test-data');

      this.api.logger.info('Advanced storage test:', { original: testData, retrieved });
      this.api.notifications.show(`存储测试成功，数据包含 ${Object.keys(testData).length} 个字段`, 'success');

    } catch (error) {
      this.api.logger.error('Advanced storage test failed:', error);
      this.api.notifications.show('存储测试失败', 'error');
    }
  }

  private updateSidebarItem(): void {
    if (!this.sidebarItemId) return;

    const updated = this.api.sidebar.updateMenuItem(this.sidebarItemId, {
      label: `TS插件 ${Math.floor(Math.random() * 100)}`,
      badge: Date.now() % 100
    });

    if (updated) {
      this.api.notifications.show('侧边栏项目已更新', 'success');
    } else {
      this.api.notifications.show('更新失败', 'error');
    }
  }

  private async clearAllStorage(): Promise<void> {
    try {
      await this.api.storage.clear();
      this.api.notifications.show('所有插件存储已清空', 'warning');
    } catch (error) {
      this.api.logger.error('Failed to clear storage:', error);
      this.api.notifications.show('清空存储失败', 'error');
    }
  }

  public destroy(): void {
    if (this.sidebarItemId) {
      this.api.sidebar.removeMenuItem(this.sidebarItemId);
    }

    const container = this.api.dom.findContainer('plugin-root');
    if (container) {
      this.api.dom.unmountReactComponent(container);
    }

    this.api.logger.info('TypeScript Plugin destroyed');
  }
}

// 导出给编译器
export default TypeScriptTestPlugin;