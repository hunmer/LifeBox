/**
 * LifeBox 前端事件类型扩展
 * 
 * 定义前端特有的事件类型和工具函数，包括 UI 事件、
 * 插件事件、系统事件等的具体类型定义。
 */

import type { LifeBoxEvent, EventFactory } from '@lifebox/shared';

/**
 * 前端特有的事件类型枚举
 */
export enum FrontendEventTypes {
  // UI 事件
  UI_THEME_CHANGED = 'ui:theme-changed',
  UI_LAYOUT_CHANGED = 'ui:layout-changed',
  UI_SIDEBAR_TOGGLED = 'ui:sidebar-toggled',
  UI_MODAL_OPENED = 'ui:modal-opened',
  UI_MODAL_CLOSED = 'ui:modal-closed',
  UI_TAB_SWITCHED = 'ui:tab-switched',
  UI_WINDOW_RESIZED = 'ui:window-resized',

  // 插件事件
  PLUGIN_INIT_REQUESTED = 'plugin:init-requested',
  PLUGIN_CONFIG_CHANGED = 'plugin:config-changed',
  PLUGIN_ERROR_OCCURRED = 'plugin:error-occurred',
  PLUGIN_MESSAGE_RECEIVED = 'plugin:message-received',

  // 导航事件
  NAVIGATION_ROUTE_CHANGED = 'navigation:route-changed',
  NAVIGATION_BACK = 'navigation:back',
  NAVIGATION_FORWARD = 'navigation:forward',

  // 存储事件
  STORAGE_DATA_CHANGED = 'storage:data-changed',
  STORAGE_QUOTA_WARNING = 'storage:quota-warning',
  STORAGE_ERROR = 'storage:error',

  // 网络事件
  NETWORK_ONLINE = 'network:online',
  NETWORK_OFFLINE = 'network:offline',
  NETWORK_REQUEST_STARTED = 'network:request-started',
  NETWORK_REQUEST_COMPLETED = 'network:request-completed',
  NETWORK_REQUEST_FAILED = 'network:request-failed',

  // 用户交互事件
  USER_ACTION_PERFORMED = 'user:action-performed',
  USER_PREFERENCE_CHANGED = 'user:preference-changed',
  USER_SESSION_STARTED = 'user:session-started',
  USER_SESSION_ENDED = 'user:session-ended',
}

/**
 * UI 事件数据类型
 */
export interface UIEventData {
  theme?: {
    mode: 'light' | 'dark' | 'auto';
    primaryColor?: string;
  };
  layout?: {
    sidebarVisible: boolean;
    sidebarWidth: number;
    mainContentWidth: number;
  };
  modal?: {
    id: string;
    title: string;
    size?: 'small' | 'medium' | 'large' | 'fullscreen';
  };
  tab?: {
    previousTabId: string;
    currentTabId: string;
  };
  window?: {
    width: number;
    height: number;
    fullscreen: boolean;
  };
}

/**
 * 插件事件数据类型
 */
export interface PluginEventData {
  pluginId: string;
  pluginName?: string;
  version?: string;
  config?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  message?: {
    type: string;
    payload: any;
    from?: string;
    to?: string;
  };
}

/**
 * 导航事件数据类型
 */
export interface NavigationEventData {
  route: {
    path: string;
    params?: Record<string, string>;
    query?: Record<string, string>;
    hash?: string;
  };
  previous?: {
    path: string;
    params?: Record<string, string>;
    query?: Record<string, string>;
  };
  direction?: 'forward' | 'back' | 'replace';
}

/**
 * 存储事件数据类型
 */
export interface StorageEventData {
  key: string;
  value?: any;
  previousValue?: any;
  storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';
  quota?: {
    used: number;
    total: number;
    percentage: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * 网络事件数据类型
 */
export interface NetworkEventData {
  online?: boolean;
  request?: {
    id: string;
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    startTime: number;
    endTime?: number;
    duration?: number;
  };
  response?: {
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    data?: any;
  };
  error?: {
    message: string;
    code?: string;
    type: 'network' | 'timeout' | 'abort' | 'parse';
  };
}

/**
 * 用户交互事件数据类型
 */
export interface UserEventData {
  action?: {
    type: string;
    target: string;
    details?: Record<string, any>;
    timestamp: number;
  };
  preference?: {
    key: string;
    value: any;
    previousValue?: any;
  };
  session?: {
    id: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
    activityCount?: number;
  };
}

/**
 * 类型化的事件创建工具函数
 */
export class TypedEventFactory {
  private eventFactory: EventFactory;

  constructor(eventFactory: EventFactory) {
    this.eventFactory = eventFactory;
  }

  /**
   * 创建 UI 事件
   */
  createUIEvent(type: FrontendEventTypes, data: UIEventData, source: string = 'ui'): LifeBoxEvent {
    return this.eventFactory(type, data, source);
  }

  /**
   * 创建插件事件
   */
  createPluginEvent(type: FrontendEventTypes, data: PluginEventData, source: string = 'plugin'): LifeBoxEvent {
    return this.eventFactory(type, data, source);
  }

  /**
   * 创建导航事件
   */
  createNavigationEvent(type: FrontendEventTypes, data: NavigationEventData, source: string = 'navigation'): LifeBoxEvent {
    return this.eventFactory(type, data, source);
  }

  /**
   * 创建存储事件
   */
  createStorageEvent(type: FrontendEventTypes, data: StorageEventData, source: string = 'storage'): LifeBoxEvent {
    return this.eventFactory(type, data, source);
  }

  /**
   * 创建网络事件
   */
  createNetworkEvent(type: FrontendEventTypes, data: NetworkEventData, source: string = 'network'): LifeBoxEvent {
    return this.eventFactory(type, data, source);
  }

  /**
   * 创建用户事件
   */
  createUserEvent(type: FrontendEventTypes, data: UserEventData, source: string = 'user'): LifeBoxEvent {
    return this.eventFactory(type, data, source);
  }
}

/**
 * 事件类型验证器
 */
export class EventTypeValidator {
  /**
   * 验证 UI 事件数据
   */
  static validateUIEventData(data: any): data is UIEventData {
    if (!data || typeof data !== 'object') return false;
    
    // 验证主题数据
    if (data.theme) {
      if (!['light', 'dark', 'auto'].includes(data.theme.mode)) {
        return false;
      }
    }

    // 验证布局数据
    if (data.layout) {
      if (typeof data.layout.sidebarVisible !== 'boolean' ||
          typeof data.layout.sidebarWidth !== 'number' ||
          typeof data.layout.mainContentWidth !== 'number') {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证插件事件数据
   */
  static validatePluginEventData(data: any): data is PluginEventData {
    if (!data || typeof data !== 'object') return false;
    
    if (typeof data.pluginId !== 'string' || data.pluginId.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * 验证导航事件数据
   */
  static validateNavigationEventData(data: any): data is NavigationEventData {
    if (!data || typeof data !== 'object') return false;
    
    if (!data.route || typeof data.route.path !== 'string') {
      return false;
    }

    return true;
  }
}

/**
 * 事件类型守卫函数
 */
export const isUIEvent = (event: LifeBoxEvent): event is LifeBoxEvent & { data: UIEventData } => {
  return event.type.startsWith('ui:') && EventTypeValidator.validateUIEventData(event.data);
};

export const isPluginEvent = (event: LifeBoxEvent): event is LifeBoxEvent & { data: PluginEventData } => {
  return event.type.startsWith('plugin:') && EventTypeValidator.validatePluginEventData(event.data);
};

export const isNavigationEvent = (event: LifeBoxEvent): event is LifeBoxEvent & { data: NavigationEventData } => {
  return event.type.startsWith('navigation:') && EventTypeValidator.validateNavigationEventData(event.data);
};

/**
 * 常用事件创建快捷函数
 */
export const createQuickEvents = (eventFactory: EventFactory) => {
  const typedFactory = new TypedEventFactory(eventFactory);

  return {
    // UI 快捷事件
    themeChanged: (mode: 'light' | 'dark' | 'auto', primaryColor?: string) =>
      typedFactory.createUIEvent(FrontendEventTypes.UI_THEME_CHANGED, {
        theme: { mode, primaryColor }
      }),

    modalOpened: (id: string, title: string, size?: 'small' | 'medium' | 'large' | 'fullscreen') =>
      typedFactory.createUIEvent(FrontendEventTypes.UI_MODAL_OPENED, {
        modal: { id, title, size }
      }),

    modalClosed: (id: string) =>
      typedFactory.createUIEvent(FrontendEventTypes.UI_MODAL_CLOSED, {
        modal: { id, title: '' }
      }),

    // 插件快捷事件
    pluginError: (pluginId: string, error: Error) =>
      typedFactory.createPluginEvent(FrontendEventTypes.PLUGIN_ERROR_OCCURRED, {
        pluginId,
        error: {
          message: error.message,
          stack: error.stack,
        }
      }),

    // 导航快捷事件
    routeChanged: (path: string, params?: Record<string, string>, query?: Record<string, string>) =>
      typedFactory.createNavigationEvent(FrontendEventTypes.NAVIGATION_ROUTE_CHANGED, {
        route: { path, params, query }
      }),

    // 用户交互快捷事件
    userAction: (type: string, target: string, details?: Record<string, any>) =>
      typedFactory.createUserEvent(FrontendEventTypes.USER_ACTION_PERFORMED, {
        action: {
          type,
          target,
          details,
          timestamp: Date.now(),
        }
      }),
  };
};