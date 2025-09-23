import { Express } from 'express';
import { BaseService } from './base.service.js';
import { HTTPRouterService } from './http-router.service.js';
import { WebSocketMessageHandlerManager } from '../websocket/websocket-message-handler.js';
import { RouteContext } from '@lifebox/shared';

/**
 * 聊天服务示例
 * 演示如何继承 BaseService 来创建具体的服务
 */
export class ChatService extends BaseService {
  constructor(
    app: Express,
    httpRouter: HTTPRouterService,
    wsHandlerManager: WebSocketMessageHandlerManager
  ) {
    super(app, httpRouter, wsHandlerManager, {
      name: 'chat',
      http_router: '/chat/',
      http_api: [
        {
          url: 'messages',
          method: 'GET',
          callback: async (context: RouteContext) => {
            return {
              code: 200,
              json: {
                messages: await this.getMessages(context.query),
                timestamp: new Date().toISOString()
              }
            };
          },
          options: { auth: false }
        },
        {
          url: 'messages',
          method: 'POST',
          callback: async (context: RouteContext) => {
            const result = await this.sendMessage(context.data);
            return {
              code: 201,
              json: result
            };
          },
          options: { auth: true }
        },
        {
          url: 'channels',
          method: 'GET',
          callback: async (context: RouteContext) => {
            return {
              code: 200,
              json: await this.getChannels()
            };
          }
        }
      ],
      websocket_handlers: {
        send_message: async (data: any) => {
          console.log('📨 WebSocket: Sending message', data);
          return await this.handleSendMessage(data);
        },
        get_messages: async (data: any) => {
          console.log('📨 WebSocket: Getting messages', data);
          return await this.handleGetMessages(data);
        }
      }
    });
  }

  /**
   * 重写钩子方法来添加自定义逻辑
   */
  protected async onBeforeSetup(): Promise<void> {
    console.log('🔧 ChatService: Initializing chat database connections...');
    // 这里可以初始化数据库连接、缓存等
  }

  protected async onAfterSetup(): Promise<void> {
    console.log('🎉 ChatService: Ready to handle chat requests!');
  }

  protected async onBeforeUninstall(): Promise<void> {
    console.log('🧹 ChatService: Cleaning up resources...');
    // 这里可以清理资源、关闭连接等
  }

  protected async onAfterUninstall(): Promise<void> {
    console.log('👋 ChatService: Successfully uninstalled');
  }

  /**
   * 重写认证方法
   */
  protected async authenticateRequest(context: RouteContext): Promise<void> {
    const authHeader = context.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authentication token');
    }

    // 这里添加具体的 JWT 验证逻辑
    const token = authHeader.substring(7);
    if (token !== 'valid-token') {
      throw new Error('Invalid token');
    }
  }

  /**
   * 业务逻辑方法
   */
  private async getMessages(query: any): Promise<any[]> {
    // 模拟获取消息
    return [
      {
        id: 1,
        content: 'Hello World',
        sender: 'user1',
        timestamp: new Date().toISOString(),
        channelId: query.channelId || 'general'
      }
    ];
  }

  private async sendMessage(messageData: any): Promise<any> {
    // 模拟发送消息
    const message = {
      id: Date.now(),
      content: messageData.content,
      sender: messageData.sender || 'anonymous',
      timestamp: new Date().toISOString(),
      channelId: messageData.channelId || 'general'
    };

    console.log('💬 Message sent:', message);
    return { message, success: true };
  }

  private async getChannels(): Promise<any[]> {
    // 模拟获取频道列表
    return [
      { id: 'general', name: 'General', description: 'General discussion' },
      { id: 'random', name: 'Random', description: 'Random chatter' }
    ];
  }

  private async handleSendMessage(data: any): Promise<any> {
    return await this.sendMessage(data);
  }

  private async handleGetMessages(data: any): Promise<any> {
    return await this.getMessages(data);
  }
}