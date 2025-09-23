import { Express } from 'express';
import { HTTPRouterService } from './http-router.service.js';
import { WebSocketMessageHandlerManager } from '../websocket/websocket-message-handler.js';
import {
  BaseServiceConfig,
  HttpApiDefinition,
  WebSocketHandlers,
  ServiceRegistration,
  RouteDefinition,
  RouteCallback,
  RouteContext,
  MiddlewareFunction,
  WebSocketHandlerConfig
} from '@lifebox/shared';

/**
 * 基础服务类
 * 提供通用的服务注册和卸载功能，包括 HTTP 路由和 WebSocket 处理器
 */
export abstract class BaseService {
  protected app: Express;
  protected httpRouter: HTTPRouterService;
  protected wsHandlerManager: WebSocketMessageHandlerManager;
  private isSetup: boolean = false;
  private registration: ServiceRegistration | null = null;

  public readonly name: string;
  public readonly http_router: string;
  public readonly http_api: HttpApiDefinition[];
  public readonly websocket_handlers: WebSocketHandlers;

  constructor(
    app: Express,
    httpRouter: HTTPRouterService,
    wsHandlerManager: WebSocketMessageHandlerManager,
    config: BaseServiceConfig
  ) {
    this.app = app;
    this.httpRouter = httpRouter;
    this.wsHandlerManager = wsHandlerManager;
    this.name = config.name;
    this.http_router = config.http_router;
    this.http_api = config.http_api;
    this.websocket_handlers = config.websocket_handlers;
  }

  /**
   * 通用注册方法
   * 注册 HTTP 路由和 WebSocket 处理器
   */
  public async setup(): Promise<void> {
    if (this.isSetup) {
      console.warn(`⚠️ Service ${this.name} is already setup`);
      return;
    }

    try {
      console.log(`🚀 Setting up service: ${this.name}`);

      // 调用子类的前置设置钩子
      await this.onBeforeSetup();

      // 注册 HTTP 路由
      const httpRegistration = this.setupHttpRoutes();

      // 注册 WebSocket 处理器
      const wsRegistration = this.setupWebSocketHandlers();

      // 保存注册信息
      this.registration = {
        httpPrefix: this.http_router.replace(/^\/+|\/+$/g, ''),
        httpRoutes: httpRegistration.routes,
        httpMiddleware: httpRegistration.middleware,
        websocketHandlers: wsRegistration
      };

      // 调用子类的后置设置钩子
      await this.onAfterSetup();

      this.isSetup = true;
      console.log(`✅ Service ${this.name} setup completed`);
    } catch (error) {
      console.error(`❌ Failed to setup service ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * 通用卸载方法
   * 移除已注册的 HTTP 路由和 WebSocket 处理器
   */
  public async uninstall(): Promise<void> {
    if (!this.isSetup || !this.registration) {
      console.warn(`⚠️ Service ${this.name} is not setup or already uninstalled`);
      return;
    }

    try {
      console.log(`🗑️ Uninstalling service: ${this.name}`);

      // 调用子类的前置卸载钩子
      await this.onBeforeUninstall();

      // 卸载 HTTP 路由
      this.httpRouter.unregister(this.registration.httpPrefix);

      // 卸载 WebSocket 处理器
      this.registration.websocketHandlers.forEach(handlerConfig => {
        this.wsHandlerManager.unregister(handlerConfig.type, handlerConfig.handler);
      });

      // 调用子类的后置卸载钩子
      await this.onAfterUninstall();

      this.registration = null;
      this.isSetup = false;
      console.log(`✅ Service ${this.name} uninstalled successfully`);
    } catch (error) {
      console.error(`❌ Failed to uninstall service ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * 检查服务是否已设置
   */
  public isServiceSetup(): boolean {
    return this.isSetup;
  }

  /**
   * 获取服务注册信息
   */
  public getRegistration(): ServiceRegistration | null {
    return this.registration;
  }

  /**
   * 设置 HTTP 路由
   */
  private setupHttpRoutes(): { routes: RouteDefinition[], middleware?: MiddlewareFunction[] } {
    const routes: RouteDefinition[] = this.http_api.map(apiDef => ({
      url: apiDef.url,
      method: apiDef.method as any,
      callback: this.createRouteCallback(apiDef)
    }));

    // 获取中间件（子类可以重写 getHttpMiddleware 方法）
    const middleware = this.getHttpMiddleware();

    // 注册到 HTTP 路由服务
    this.httpRouter.register(
      this.http_router.replace(/^\/+|\/+$/g, ''),
      middleware,
      routes
    );

    return { routes, middleware };
  }

  /**
   * 设置 WebSocket 处理器
   */
  private setupWebSocketHandlers(): WebSocketHandlerConfig[] {
    const handlerConfigs: WebSocketHandlerConfig[] = [];

    Object.entries(this.websocket_handlers).forEach(([handlerName, handlerFunc]) => {
      const config: WebSocketHandlerConfig = {
        type: `${this.name}_${handlerName}`,
        handler: async (data: any, message?: any) => {
          try {
            return await handlerFunc(data);
          } catch (error) {
            console.error(`❌ Error in WebSocket handler ${handlerName} for service ${this.name}:`, error);
            throw error;
          }
        },
        priority: this.getWebSocketHandlerPriority(handlerName)
      };

      this.wsHandlerManager.register(config);
      handlerConfigs.push(config);
    });

    return handlerConfigs;
  }

  /**
   * 创建路由回调函数
   */
  private createRouteCallback(apiDef: HttpApiDefinition): RouteCallback {
    return async (context: RouteContext) => {
      try {
        // 如果需要认证，这里可以添加认证逻辑
        if (apiDef.options?.auth) {
          await this.authenticateRequest(context);
        }

        // 调用原始回调函数
        const result = await apiDef.callback(context);

        // 确保返回符合 RouteResponse 格式的对象
        if (typeof result === 'object' && result !== null) {
          return result;
        }

        return { code: 200, json: result };
      } catch (error) {
        console.error(`❌ Error in HTTP handler ${apiDef.url} for service ${this.name}:`, error);
        return {
          code: 500,
          json: {
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        };
      }
    };
  }

  /**
   * 子类可重写的钩子方法
   */
  protected async onBeforeSetup(): Promise<void> {
    // 子类可以重写此方法来添加设置前的逻辑
  }

  protected async onAfterSetup(): Promise<void> {
    // 子类可以重写此方法来添加设置后的逻辑
  }

  protected async onBeforeUninstall(): Promise<void> {
    // 子类可以重写此方法来添加卸载前的逻辑
  }

  protected async onAfterUninstall(): Promise<void> {
    // 子类可以重写此方法来添加卸载后的逻辑
  }

  /**
   * 获取 HTTP 中间件
   * 子类可以重写此方法来提供自定义中间件
   */
  protected getHttpMiddleware(): MiddlewareFunction[] {
    return [];
  }

  /**
   * 获取 WebSocket 处理器优先级
   * 子类可以重写此方法来自定义优先级
   */
  protected getWebSocketHandlerPriority(handlerName: string): number {
    return 0;
  }

  /**
   * 请求认证方法
   * 子类可以重写此方法来实现具体的认证逻辑
   */
  protected async authenticateRequest(context: RouteContext): Promise<void> {
    // 默认认证逻辑，子类可以重写
    const authHeader = context.headers.authorization;
    if (!authHeader) {
      throw new Error('Authentication required');
    }
    // 这里可以添加具体的认证逻辑
  }
}