/**
 * BaseService 使用示例
 * 演示如何使用基础服务类创建自定义服务
 */

import { Express } from 'express';
import { BaseService } from '../services/base.service.js';
import { HTTPRouterService } from '../services/http-router.service.js';
import { WebSocketMessageHandlerManager } from '../websocket/websocket-message-handler.js';
import { ChatService } from '../services/chat.service.js';

/**
 * 初始化和使用服务的示例函数
 */
export async function demonstrateBaseServiceUsage(
  app: Express,
  httpRouter: HTTPRouterService,
  wsHandlerManager: WebSocketMessageHandlerManager
) {
  console.log('\n🎯 BaseService 使用演示开始...\n');

  // 1. 创建 ChatService 实例
  console.log('📝 步骤 1: 创建 ChatService 实例');
  const chatService = new ChatService(app, httpRouter, wsHandlerManager);

  // 2. 设置服务
  console.log('📝 步骤 2: 设置服务 (注册路由和WebSocket处理器)');
  try {
    await chatService.setup();
    console.log('✅ ChatService 设置成功');
  } catch (error) {
    console.error('❌ ChatService 设置失败:', error);
    return;
  }

  // 3. 检查服务状态
  console.log('📝 步骤 3: 检查服务状态');
  console.log('🔍 服务是否已设置:', chatService.isServiceSetup());
  console.log('🔍 注册信息:', JSON.stringify(chatService.getRegistration(), null, 2));

  // 4. 显示已注册的路由
  console.log('📝 步骤 4: 显示已注册的路由');
  console.log('🛣️ 已注册的路由前缀:', httpRouter.getRegisteredPrefixes());

  // 5. 显示已注册的WebSocket处理器
  console.log('📝 步骤 5: 显示已注册的WebSocket处理器');
  console.log('🔌 已注册的WebSocket消息类型:', wsHandlerManager.getRegisteredTypes());

  // 6. 演示服务功能
  console.log('📝 步骤 6: 演示服务功能');
  console.log('💡 现在你可以通过以下方式测试服务:');
  console.log('   HTTP API:');
  console.log('   - GET  /api/chat/messages    - 获取消息列表');
  console.log('   - POST /api/chat/messages    - 发送新消息 (需要认证)');
  console.log('   - GET  /api/chat/channels    - 获取频道列表');
  console.log('');
  console.log('   WebSocket 消息:');
  console.log('   - chat_send_message         - 发送消息');
  console.log('   - chat_get_messages         - 获取消息');

  // 7. 演示服务卸载 (注释掉，避免实际卸载)
  /*
  console.log('📝 步骤 7: 卸载服务');
  try {
    await chatService.uninstall();
    console.log('✅ ChatService 卸载成功');
  } catch (error) {
    console.error('❌ ChatService 卸载失败:', error);
  }
  */

  console.log('\n🎉 BaseService 使用演示完成!\n');
}

/**
 * 创建自定义服务的示例
 */
export class ExampleCustomService extends BaseService {
  constructor(
    app: Express,
    httpRouter: HTTPRouterService,
    wsHandlerManager: WebSocketMessageHandlerManager
  ) {
    super(app, httpRouter, wsHandlerManager, {
      name: 'example',
      http_router: '/example/',
      http_api: [
        {
          url: 'ping',
          method: 'GET',
          callback: async () => ({
            code: 200,
            json: { message: 'pong', timestamp: new Date().toISOString() }
          })
        },
        {
          url: 'echo',
          method: 'POST',
          callback: async (context) => ({
            code: 200,
            json: {
              message: 'Echo response',
              receivedData: context.data,
              timestamp: new Date().toISOString()
            }
          })
        }
      ],
      websocket_handlers: {
        ping: async (data) => {
          console.log('📡 WebSocket ping received:', data);
          return { message: 'pong', data, timestamp: new Date().toISOString() };
        },
        echo: async (data) => {
          console.log('📡 WebSocket echo received:', data);
          return { message: 'echo', data, timestamp: new Date().toISOString() };
        }
      }
    });
  }

  protected async onBeforeSetup(): Promise<void> {
    console.log('🔧 ExampleCustomService: 准备设置...');
  }

  protected async onAfterSetup(): Promise<void> {
    console.log('🎉 ExampleCustomService: 设置完成!');
  }

  protected async onBeforeUninstall(): Promise<void> {
    console.log('🧹 ExampleCustomService: 准备卸载...');
  }

  protected async onAfterUninstall(): Promise<void> {
    console.log('👋 ExampleCustomService: 卸载完成!');
  }
}

// 如果直接运行此文件，执行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('⚠️ 此文件需要在应用上下文中运行，请通过 app.ts 加载');
}