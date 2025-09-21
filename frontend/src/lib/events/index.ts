/**
 * LifeBox 前端事件系统导出模块
 * 
 * 统一导出事件系统的所有组件，包括事件总线、中间件、
 * 类型定义和工具函数。
 */

// 核心事件总线
export { EventBus, globalEventBus } from './event-bus';

// 事件中间件
export {
  loggingMiddleware,
  validationMiddleware,
  errorHandlingMiddleware,
  createPermissionMiddleware,
  createRateLimitMiddleware,
  createDeduplicationMiddleware,
  createDataTransformMiddleware,
  createAsyncEnhanceMiddleware,
  createPerformanceMiddleware,
  createStandardMiddleware,
} from './event-middleware';

// 前端事件类型
export {
  FrontendEventTypes,
  TypedEventFactory,
  EventTypeValidator,
  isUIEvent,
  isPluginEvent,
  isNavigationEvent,
  createQuickEvents,
} from './event-types';

// 类型导出
export type {
  UIEventData,
  PluginEventData,
  NavigationEventData,
  StorageEventData,
  NetworkEventData,
  UserEventData,
} from './event-types';

// 重新导出共享类型
export type {
  LifeBoxEvent,
  EventHandler,
  EventMiddleware,
  EventListenerConfig,
  EventBusConfig,
  EventStats,
  EventFactory,
  EventFilter,
  EventTransformer,
} from '@lifebox/shared';