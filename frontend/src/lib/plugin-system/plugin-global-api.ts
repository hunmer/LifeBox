import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/app-store';

/**
 * 全局插件API对象
 * 暴露给插件使用的所有工具和组件
 */
export interface LifeBoxPluginAPI {
  // React 相关
  React: typeof React;

  // shadcn UI 组件
  components: {
    Button: typeof Button;
    Dialog: typeof Dialog;
  };

  // 工具函数
  utils: {
    cn: typeof cn;
    buttonVariants: typeof buttonVariants;
  };

  // 存储管理
  stores: {
    useAppStore: typeof useAppStore;
  };

  // 侧边栏管理
  sidebar: {
    registerMenuItem: (item: SidebarMenuItem) => string;
    removeMenuItem: (id: string) => boolean;
    updateMenuItem: (id: string, updates: Partial<SidebarMenuItem>) => boolean;
  };

  // 通知系统
  notifications: {
    show: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    hide: (id?: string) => void;
  };

  // 事件系统
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, data?: any) => void;
  };

  // 存储API
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };

  // HTTP API
  http: {
    get: (url: string, options?: RequestInit) => Promise<Response>;
    post: (url: string, data?: any, options?: RequestInit) => Promise<Response>;
    put: (url: string, data?: any, options?: RequestInit) => Promise<Response>;
    delete: (url: string, options?: RequestInit) => Promise<Response>;
  };

  // 日志系统
  logger: {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };

  // DOM 操作工具
  dom: {
    createElement: <K extends keyof HTMLElementTagNameMap>(
      tagName: K,
      attributes?: Record<string, string>,
      children?: (HTMLElement | string)[]
    ) => HTMLElementTagNameMap[K];
    findContainer: (id: string) => HTMLElement | null;
    renderReactComponent: (component: React.ReactElement, container: HTMLElement) => void;
    unmountReactComponent: (container: HTMLElement) => void;
  };

  // TypeScript 支持（设置为 any 以降低开发复杂度）
  types: {
    [key: string]: any;
  };
}

export interface SidebarMenuItem {
  id?: string;
  label: string;
  icon?: string;
  path?: string;
  onClick?: () => void;
  children?: SidebarMenuItem[];
  badge?: string | number;
  disabled?: boolean;
}

/**
 * 创建全局插件API实例
 */
export function createPluginAPI(): LifeBoxPluginAPI {
  // 侧边栏项目存储
  const sidebarItems = new Map<string, SidebarMenuItem>();
  let sidebarItemCounter = 0;

  // 生成唯一ID
  const generateId = () => `plugin-item-${++sidebarItemCounter}-${Date.now()}`;

  // React组件渲染管理
  const reactRoots = new Map<HTMLElement, any>();

  return {
    React,

    components: {
      Button,
      Dialog,
    },

    utils: {
      cn,
      buttonVariants,
    },

    stores: {
      useAppStore,
    },

    sidebar: {
      registerMenuItem: (item: SidebarMenuItem): string => {
        const id = item.id || generateId();
        const menuItem = { ...item, id };
        sidebarItems.set(id, menuItem);

        // 触发侧边栏更新事件
        window.dispatchEvent(new CustomEvent('lifebox:sidebar:update', {
          detail: { action: 'add', item: menuItem }
        }));

        return id;
      },

      removeMenuItem: (id: string): boolean => {
        if (sidebarItems.has(id)) {
          sidebarItems.delete(id);
          window.dispatchEvent(new CustomEvent('lifebox:sidebar:update', {
            detail: { action: 'remove', id }
          }));
          return true;
        }
        return false;
      },

      updateMenuItem: (id: string, updates: Partial<SidebarMenuItem>): boolean => {
        const item = sidebarItems.get(id);
        if (item) {
          const updatedItem = { ...item, ...updates, id };
          sidebarItems.set(id, updatedItem);
          window.dispatchEvent(new CustomEvent('lifebox:sidebar:update', {
            detail: { action: 'update', item: updatedItem }
          }));
          return true;
        }
        return false;
      },
    },

    notifications: {
      show: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        window.dispatchEvent(new CustomEvent('lifebox:notification:show', {
          detail: { message, type, id: `notification-${Date.now()}` }
        }));
      },

      hide: (id?: string) => {
        window.dispatchEvent(new CustomEvent('lifebox:notification:hide', {
          detail: { id }
        }));
      },
    },

    events: {
      on: (event: string, handler: Function) => {
        window.addEventListener(`lifebox:${event}`, handler as EventListener);
      },

      off: (event: string, handler: Function) => {
        window.removeEventListener(`lifebox:${event}`, handler as EventListener);
      },

      emit: (event: string, data?: any) => {
        window.dispatchEvent(new CustomEvent(`lifebox:${event}`, {
          detail: data
        }));
      },
    },

    storage: {
      get: async (key: string) => {
        try {
          const value = localStorage.getItem(`lifebox:plugin:${key}`);
          return value ? JSON.parse(value) : null;
        } catch {
          return null;
        }
      },

      set: async (key: string, value: any) => {
        try {
          localStorage.setItem(`lifebox:plugin:${key}`, JSON.stringify(value));
        } catch (error) {
          console.error('Plugin storage set error:', error);
        }
      },

      remove: async (key: string) => {
        localStorage.removeItem(`lifebox:plugin:${key}`);
      },

      clear: async () => {
        const keys = Object.keys(localStorage).filter(key =>
          key.startsWith('lifebox:plugin:')
        );
        keys.forEach(key => localStorage.removeItem(key));
      },
    },

    http: {
      get: async (url: string, options?: RequestInit) => {
        return fetch(url, { ...options, method: 'GET' });
      },

      post: async (url: string, data?: any, options?: RequestInit) => {
        return fetch(url, {
          ...options,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
        });
      },

      put: async (url: string, data?: any, options?: RequestInit) => {
        return fetch(url, {
          ...options,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
        });
      },

      delete: async (url: string, options?: RequestInit) => {
        return fetch(url, { ...options, method: 'DELETE' });
      },
    },

    logger: {
      debug: (...args: any[]) => {
        console.debug('[Plugin]', ...args);
      },

      info: (...args: any[]) => {
        console.info('[Plugin]', ...args);
      },

      warn: (...args: any[]) => {
        console.warn('[Plugin]', ...args);
      },

      error: (...args: any[]) => {
        console.error('[Plugin]', ...args);
      },
    },

    dom: {
      createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        attributes?: Record<string, string>,
        children?: (HTMLElement | string)[]
      ): HTMLElementTagNameMap[K] => {
        const element = document.createElement(tagName);

        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
          });
        }

        if (children) {
          children.forEach(child => {
            if (typeof child === 'string') {
              element.appendChild(document.createTextNode(child));
            } else {
              element.appendChild(child);
            }
          });
        }

        return element;
      },

      findContainer: (id: string) => {
        return document.getElementById(id);
      },

      renderReactComponent: (component: React.ReactElement, container: HTMLElement) => {
        // 使用动态导入来避免打包时的依赖问题
        import('react-dom/client').then(({ createRoot }) => {
          if (reactRoots.has(container)) {
            reactRoots.get(container).render(component);
          } else {
            const root = createRoot(container);
            root.render(component);
            reactRoots.set(container, root);
          }
        }).catch(error => {
          console.error('Failed to render React component:', error);
        });
      },

      unmountReactComponent: (container: HTMLElement) => {
        const root = reactRoots.get(container);
        if (root) {
          root.unmount();
          reactRoots.delete(container);
        }
      },
    },

    types: {
      // 这里可以添加任何类型定义，设置为 any 以简化使用
    } as any,
  };
}

/**
 * 全局API单例
 */
let globalAPI: LifeBoxPluginAPI | null = null;

/**
 * 获取全局API实例
 */
export function getPluginAPI(): LifeBoxPluginAPI {
  if (!globalAPI) {
    globalAPI = createPluginAPI();
  }
  return globalAPI;
}

/**
 * 设置全局API到window对象
 */
export function setupGlobalAPI(): void {
  const api = getPluginAPI();

  // 暴露到全局
  (window as any).LifeBoxAPI = api;

  // 为了兼容性，也可以暴露一些常用的快捷方式
  (window as any).LifeBox = {
    API: api,
    React: React,
    Components: api.components,
    Utils: api.utils,
  };

  console.log('[LifeBox] 插件全局API已就绪');
}