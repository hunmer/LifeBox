import { RouteDefinition, MiddlewareFunction } from './http-router';
import { WebSocketHandlerConfig } from './websocket';

export interface HttpApiDefinition {
  url: string;
  method: string;
  callback: Function;
  options?: {
    auth?: boolean;
    [key: string]: any;
  };
}

export interface WebSocketHandlers {
  [handlerName: string]: (data: any) => any;
}

export interface BaseServiceConfig {
  name: string;
  http_router: string;
  http_api: HttpApiDefinition[];
  websocket_handlers: WebSocketHandlers;
}

export interface ServiceRegistration {
  httpPrefix: string;
  httpRoutes: RouteDefinition[];
  httpMiddleware?: MiddlewareFunction[];
  websocketHandlers: WebSocketHandlerConfig[];
}