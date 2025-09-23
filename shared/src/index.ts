/**
 * LifeBox 共享模块主入口
 * 
 * 导出所有共享的类型定义、常量和工具函数，
 * 供前端和后端项目使用。
 */

// 导出事件相关类型
export * from './types/events';

// 导出插件系统类型
export * from './types/plugin';

// 导出API接口类型
export * from './types/api';

// 导出聊天功能类型
export * from './types/chat';

// 导出WebSocket通信类型
export * from './types/websocket';

// 导出HTTP路由器类型
export * from './types/http-router';

// 导出基础服务类型
export * from './types/base-service';

// 导出常量定义
export * from './constants/index';


// 枚举重新导出
export {
  SystemEventTypes,
  PluginEventNamespaces,
  EventPriority,
} from './types/events';

export {
  PluginPermission,
  PluginStatus,
} from './types/plugin';

export {
  ApiStatusCode,
  HttpMethod,
  WebSocketStatus,
} from './types/api';

export {
  ChannelType,
  MessageType,
  UserStatus,
  UserRole,
  ChannelMemberRole,
} from './types/chat';

export {
  WebSocketState,
  WebSocketMessageTypes,
} from './types/websocket';