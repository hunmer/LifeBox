// 简单测试插件 - 展示如何使用全局API
(function() {
  'use strict';

  // 等待全局API加载完成
  if (!window.LifeBoxAPI) {
    console.error('[Simple Test Plugin] LifeBoxAPI not available');
    return;
  }

  const { React, components, utils, sidebar, notifications, storage, events, logger, dom } = window.LifeBoxAPI;
  const { Button } = components;
  const { cn } = utils;

  class SimpleTestPlugin {
    constructor() {
      this.pluginId = 'simple-test-plugin';
      this.sidebarItemId = null;
      this.isInitialized = false;

      logger.info('SimpleTestPlugin initialized');
      this.init();
    }

    async init() {
      try {
        // 注册侧边栏菜单项
        this.sidebarItemId = sidebar.registerMenuItem({
          label: '测试插件',
          icon: '🧪',
          onClick: () => this.showPlugin()
        });

        // 监听事件
        events.on('test:message', (event) => {
          logger.info('Received test message:', event.detail);
          notifications.show(`收到测试消息: ${event.detail}`, 'info');
        });

        this.isInitialized = true;
        logger.info('Plugin initialized successfully');

        // 初始化后自动显示插件
        this.showPlugin();

      } catch (error) {
        logger.error('Failed to initialize plugin:', error);
      }
    }

    showPlugin() {
      const container = dom.findContainer('plugin-root');
      if (!container) {
        logger.error('Plugin container not found');
        return;
      }

      // 清空容器
      container.innerHTML = '';

      // 创建React组件
      const TestComponent = React.createElement('div', {
        className: 'simple-test-plugin'
      }, [
        React.createElement('h3', { key: 'title' }, '简单测试插件'),

        React.createElement('div', {
          key: 'info',
          className: 'info-box'
        }, [
          React.createElement('div', { key: 'status' }, [
            '状态: ',
            React.createElement('span', {
              className: cn('status', this.isInitialized ? 'success' : 'error')
            }, this.isInitialized ? '已就绪' : '未初始化')
          ]),
          React.createElement('div', { key: 'sidebar' }, `侧边栏项目ID: ${this.sidebarItemId}`),
          React.createElement('div', { key: 'time' }, `当前时间: ${new Date().toLocaleString()}`)
        ]),

        React.createElement('div', {
          key: 'buttons',
          className: 'button-group'
        }, [
          React.createElement(Button, {
            key: 'notify',
            variant: 'default',
            onClick: () => {
              notifications.show('这是一条测试通知!', 'success');
            }
          }, '显示通知'),

          React.createElement(Button, {
            key: 'storage-test',
            variant: 'outline',
            onClick: async () => {
              const testData = { timestamp: Date.now(), message: 'Hello LifeBox!' };
              await storage.set('test-data', testData);
              const retrieved = await storage.get('test-data');
              notifications.show(`存储测试完成: ${JSON.stringify(retrieved)}`, 'info');
            }
          }, '测试存储'),

          React.createElement(Button, {
            key: 'event-test',
            variant: 'secondary',
            onClick: () => {
              events.emit('test:message', `来自插件的消息 ${Date.now()}`);
            }
          }, '发送事件'),

          React.createElement(Button, {
            key: 'create-button',
            variant: 'ghost',
            onClick: () => this.createDynamicButton()
          }, '创建动态按钮'),

          React.createElement(Button, {
            key: 'remove-sidebar',
            variant: 'destructive',
            size: 'sm',
            onClick: () => {
              if (this.sidebarItemId) {
                sidebar.removeMenuItem(this.sidebarItemId);
                notifications.show('侧边栏项目已移除', 'warning');
                this.sidebarItemId = null;
              }
            }
          }, '移除侧边栏')
        ])
      ]);

      // 渲染React组件
      dom.renderReactComponent(TestComponent, container);
    }

    createDynamicButton() {
      const container = dom.findContainer('plugin-root');
      if (!container) return;

      // 使用原生DOM API创建一个动态按钮
      const dynamicButton = dom.createElement('button', {
        class: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ml-3',
        type: 'button'
      }, ['动态创建的按钮']);

      let clickCount = 0;
      dynamicButton.addEventListener('click', () => {
        clickCount++;
        notifications.show(`动态按钮被点击了 ${clickCount} 次`, 'info');

        if (clickCount >= 3) {
          dynamicButton.remove();
          notifications.show('动态按钮已移除', 'warning');
        }
      });

      // 找到按钮组并添加
      const buttonGroup = container.querySelector('.button-group');
      if (buttonGroup) {
        buttonGroup.appendChild(dynamicButton);
      }
    }

    destroy() {
      // 清理资源
      if (this.sidebarItemId) {
        sidebar.removeMenuItem(this.sidebarItemId);
      }

      const container = dom.findContainer('plugin-root');
      if (container) {
        dom.unmountReactComponent(container);
      }

      logger.info('Plugin destroyed');
    }
  }

  // 插件实例
  let pluginInstance = null;

  // 注册插件到全局
  if (!window.LifeBoxPlugins) {
    window.LifeBoxPlugins = {};
  }

  window.LifeBoxPlugins['simple-test-plugin'] = SimpleTestPlugin;

  // 自动创建实例（用于独立测试）
  if (window.LifeBoxAPI && !pluginInstance) {
    pluginInstance = new SimpleTestPlugin();

    // 为了调试方便，将实例暴露到全局
    window.SimpleTestPlugin = pluginInstance;
  }

  logger.info('Simple Test Plugin loaded successfully');

})();