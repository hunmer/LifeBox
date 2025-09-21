# 📋 **lifebox** - 最终架构设计方案

## 🎯 项目概述

**lifebox** 是一款跨平台「全能纪录」应用，采用 **Tauri 前端 + Node.js 后端** 分离架构，支持强大的插件系统和事件驱动开发。

**核心特点**:
- 🔧 **前后端分离**: Tauri (纯前端) + Node.js 独立后端
- 🧩 **Script 插件系统**: 基于 HTML script 标签的简单插件加载
- 📡 **Events 事件框架**: 支持事件传递、取消、修改的完整事件系统
- 🧪 **TDD 测试驱动**: 测试先行的开发模式
- 💬 **频道聊天插件**: 第一个完整的示例插件

## 🏗️ 项目结构

```
lifebox/
├── README.md
├── package.json                    # 根目录工作空间配置
├── frontend/                       # Tauri 前端应用
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── components.json            # shadcn/ui 配置
│   ├── src-tauri/                 # Tauri 配置（最小化）
│   │   ├── Cargo.toml
│   │   ├── tauri.conf.json
│   │   ├── src/
│   │   │   ├── main.rs            # 最小 Tauri 主进程
│   │   │   └── lib.rs
│   │   └── icons/
│   ├── src/                       # 前端源码
│   │   ├── main.tsx               # React 应用入口
│   │   ├── App.tsx
│   │   ├── components/            # UI 组件
│   │   │   ├── ui/               # shadcn/ui 基础组件
│   │   │   ├── layout/           # 布局组件
│   │   │   └── plugin/           # 插件相关组件
│   │   ├── lib/                  # 前端核心库
│   │   │   ├── plugin-system/    # 插件系统
│   │   │   │   ├── plugin-loader.ts
│   │   │   │   ├── plugin-manager.ts
│   │   │   │   └── base-plugin.ts
│   │   │   ├── events/           # 事件系统
│   │   │   │   ├── event-bus.ts
│   │   │   │   └── event-types.ts
│   │   │   ├── api/              # API 客户端
│   │   │   │   └── client.ts
│   │   │   ├── stores/           # 状态管理 (Zustand)
│   │   │   │   └── app-store.ts
│   │   │   └── utils/            # 工具函数
│   │   ├── plugins/              # 插件目录
│   │   │   └── chat-plugin/      # 频道聊天插件
│   │   │       ├── manifest.json # 插件配置
│   │   │       ├── plugin.js     # 插件逻辑
│   │   │       └── styles.css    # 插件样式
│   │   └── assets/               # 静态资源
│   ├── tests/                    # 前端测试
│   │   ├── unit/                 # 单元测试
│   │   ├── integration/          # 集成测试
│   │   └── e2e/                  # E2E 测试
│   └── dist/                     # 构建输出
├── backend/                      # Node.js 后端
│   ├── package.json
│   ├── src/
│   │   ├── app.ts               # Express 应用入口
│   │   ├── server.ts            # 服务器启动
│   │   ├── routes/              # API 路由
│   │   │   ├── channels.ts      # 频道相关路由
│   │   │   ├── messages.ts      # 消息相关路由
│   │   │   └── events.ts        # 事件相关路由
│   │   ├── services/            # 业务逻辑
│   │   │   ├── channel.service.ts
│   │   │   ├── message.service.ts
│   │   │   └── event.service.ts
│   │   ├── events/              # 事件系统
│   │   │   ├── event-bus.ts
│   │   │   └── event-handlers.ts
│   │   ├── models/              # 数据模型
│   │   │   ├── channel.model.ts
│   │   │   └── message.model.ts
│   │   ├── database/            # 数据库
│   │   │   ├── connection.ts
│   │   │   └── migrations/
│   │   └── utils/               # 工具函数
│   ├── tests/                   # 后端测试
│   │   ├── unit/                # 单元测试
│   │   ├── integration/         # 集成测试
│   │   └── fixtures/            # 测试数据
│   ├── prisma/                  # Prisma 配置
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── dist/                    # 构建输出
├── shared/                      # 前后端共享
│   ├── package.json
│   ├── src/
│   │   ├── types/              # 共享类型定义
│   │   │   ├── events.ts       # 事件类型
│   │   │   ├── plugin.ts       # 插件类型
│   │   │   ├── chat.ts         # 聊天相关类型
│   │   │   └── api.ts          # API 类型
│   │   └── constants/          # 常量定义
│   └── dist/                   # 构建输出
├── scripts/                    # 开发和构建脚本
├── docs/                       # 文档
└── .github/                    # CI/CD 配置
```

## 🔧 技术栈

### **前端技术栈**
```json
{
  "core": {
    "framework": "Tauri 2.0 + React 18+",
    "language": "TypeScript 5+",
    "bundler": "Vite 5+"
  },
  "ui": {
    "components": "shadcn/ui",
    "primitives": "Radix UI", 
    "styling": "Tailwind CSS 3+"
  },
  "state": {
    "management": "Zustand 4+",
    "forms": "React Hook Form",
    "data": "自定义 API 客户端"
  },
  "testing": {
    "unit": "Vitest + @testing-library/react",
    "integration": "Vitest + MSW", 
    "e2e": "Playwright"
  }
}
```

### **后端技术栈**
```json
{
  "core": {
    "runtime": "Node.js 18+",
    "framework": "Express.js",
    "language": "TypeScript 5+"
  },
  "database": {
    "primary": "SQLite 3+ (本地)",
    "orm": "Prisma 5+",
    "alternative": "PostgreSQL (可选)"
  },
  "events": {
    "library": "Node.js Events",
    "realtime": "WebSocket"
  },
  "testing": {
    "unit": "Jest + Supertest",
    "integration": "Jest + Test Containers"
  }
}
```

## 🧩 核心系统设计

### 1. **插件系统 (Script 标签加载)**

#### **插件加载器**
```typescript
// frontend/src/lib/plugin-system/plugin-loader.ts

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  entry: string;          // 插件入口文件 (plugin.js)
  styles?: string;        // 可选样式文件
  permissions: string[];  // 插件权限
}

export class PluginLoader {
  private loadedPlugins = new Map<string, any>();

  async loadPlugin(pluginPath: string): Promise<void> {
    // 1. 加载插件清单
    const manifestResponse = await fetch(`${pluginPath}/manifest.json`);
    const manifest: PluginManifest = await manifestResponse.json();

    // 2. 检查是否已加载
    if (this.loadedPlugins.has(manifest.id)) {
      console.warn(`Plugin ${manifest.id} already loaded`);
      return;
    }

    // 3. 加载样式文件
    if (manifest.styles) {
      await this.loadPluginStyles(`${pluginPath}/${manifest.styles}`);
    }

    // 4. 使用 script 标签加载插件 JavaScript
    await this.loadPluginScript(`${pluginPath}/${manifest.entry}`, manifest);
  }

  private async loadPluginScript(scriptPath: string, manifest: PluginManifest): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = scriptPath;
      script.defer = true;
      
      script.onload = () => {
        // 插件注册到全局 window.LifeBoxPlugins
        const pluginClass = (window as any).LifeBoxPlugins?.[manifest.id];
        if (pluginClass) {
          const pluginInstance = new pluginClass();
          this.loadedPlugins.set(manifest.id, pluginInstance);
          
          if (typeof pluginInstance.onLoad === 'function') {
            pluginInstance.onLoad();
          }
          
          resolve();
        } else {
          reject(new Error(`Plugin ${manifest.id} did not register properly`));
        }
      };

      script.onerror = () => reject(new Error(`Failed to load script: ${scriptPath}`));
      document.head.appendChild(script);
    });
  }
}
```

#### **插件基础类**
```typescript
// frontend/src/lib/plugin-system/base-plugin.ts

export interface PluginAPI {
  events: EventBus;
  storage: PluginStorage;
  ui: UIManager;
  http: HTTPClient;
}

export abstract class BasePlugin {
  protected api: PluginAPI;
  protected container: HTMLElement | null = null;

  constructor() {
    this.api = (window as any).LifeBoxAPI;
  }

  // 生命周期钩子
  abstract onLoad(): void;
  abstract onUnload(): void;

  // UI 管理
  protected createContainer(id: string): HTMLElement {
    const container = document.createElement('div');
    container.id = `plugin-${id}`;
    container.className = 'plugin-container';
    
    const pluginRoot = document.getElementById('plugin-root');
    if (pluginRoot) {
      pluginRoot.appendChild(container);
    }
    
    this.container = container;
    return container;
  }

  // 事件系统
  protected emit(eventType: string, data: any): void {
    this.api.events.emit(eventType, data);
  }

  protected on(eventType: string, handler: Function): void {
    this.api.events.on(eventType, handler);
  }

  // 存储系统
  protected async getStorage(key: string): Promise<any> {
    return this.api.storage.get(key);
  }

  protected async setStorage(key: string, value: any): Promise<void> {
    return this.api.storage.set(key, value);
  }

  // HTTP 请求
  protected async httpGet(url: string): Promise<any> {
    return this.api.http.get(url);
  }

  protected async httpPost(url: string, data: any): Promise<any> {
    return this.api.http.post(url, data);
  }
}
```

### 2. **Events 事件框架**

#### **事件类型定义**
```typescript
// shared/src/types/events.ts

export interface LifeBoxEvent {
  id: string;                    // 事件唯一ID
  type: string;                  // 事件类型
  data: any;                     // 事件数据
  source: string;                // 事件源（插件ID或系统）
  timestamp: number;             // 时间戳
  cancelled?: boolean;           // 是否被取消
  propagation?: boolean;         // 是否继续传播
}

export interface EventHandler {
  (event: LifeBoxEvent): void | Promise<void>;
}

export interface EventMiddleware {
  (event: LifeBoxEvent, next: () => void): void | Promise<void>;
}
```

#### **前端事件总线**
```typescript
// frontend/src/lib/events/event-bus.ts

import { EventEmitter } from 'events';

export class EventBus extends EventEmitter {
  private middlewares: EventMiddleware[] = [];
  private eventCounter = 0;

  // 注册中间件
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  // 发送事件
  async emitLifeBoxEvent(type: string, data: any, source: string = 'system'): Promise<LifeBoxEvent> {
    const event: LifeBoxEvent = {
      id: `event_${++this.eventCounter}_${Date.now()}`,
      type,
      data,
      source,
      timestamp: Date.now(),
      cancelled: false,
      propagation: true,
    };

    // 通过中间件处理事件
    await this.processMiddlewares(event);

    // 如果事件没有被取消，则继续传播
    if (!event.cancelled && event.propagation) {
      this.emit(type, event);
      
      // 同时发送到后端
      await this.sendToBackend(event);
    }

    return event;
  }

  // 取消事件
  cancelEvent(event: LifeBoxEvent): void {
    event.cancelled = true;
    event.propagation = false;
  }

  // 修改事件数据
  modifyEventData(event: LifeBoxEvent, newData: any): void {
    event.data = { ...event.data, ...newData };
  }

  // 发送事件到后端
  private async sendToBackend(event: LifeBoxEvent): Promise<void> {
    try {
      await fetch('http://localhost:3001/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send event to backend:', error);
    }
  }
}
```

#### **后端事件总线**
```typescript
// backend/src/events/event-bus.ts

import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

export class BackendEventBus extends EventEmitter {
  private connectedClients: Set<WebSocket> = new Set();
  private pluginEventHandlers: Map<string, Set<EventHandler>> = new Map();

  // 处理来自前端的事件
  async handleClientEvent(event: LifeBoxEvent): Promise<void> {
    // 触发服务器端事件处理
    this.emit(event.type, event);

    // 广播给所有插件
    await this.broadcastToPlugins(event);

    // 广播给所有连接的客户端
    this.broadcastToClients(event);
  }

  // 插件注册事件处理器
  registerPluginHandler(pluginId: string, eventType: string, handler: EventHandler): void {
    if (!this.pluginEventHandlers.has(eventType)) {
      this.pluginEventHandlers.set(eventType, new Set());
    }
    this.pluginEventHandlers.get(eventType)!.add(handler);
  }

  // 广播给客户端
  private broadcastToClients(event: LifeBoxEvent): void {
    const eventData = JSON.stringify({
      type: 'event',
      payload: event,
    });

    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(eventData);
      }
    });
  }
}
```

### 3. **TDD 测试驱动开发**

#### **测试示例结构**
```typescript
// frontend/tests/unit/plugin-system/plugin-loader.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginLoader } from '../../../src/lib/plugin-system/plugin-loader';

describe('PluginLoader', () => {
  let pluginLoader: PluginLoader;

  beforeEach(() => {
    document.body.innerHTML = '<div id="plugin-container"></div>';
    pluginLoader = new PluginLoader();
  });

  describe('loadPlugin', () => {
    it('should load a valid plugin successfully', async () => {
      // 🔴 Red: 写测试，测试失败
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            entry: 'plugin.js',
            permissions: []
          })
        });

      await pluginLoader.loadPlugin('/plugins/test-plugin');

      expect(global.fetch).toHaveBeenCalledWith('/plugins/test-plugin/manifest.json');
      // 🟢 Green: 实现代码，测试通过
      // 🔵 Refactor: 重构代码，保持测试通过
    });

    it('should handle plugin loading errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(pluginLoader.loadPlugin('/invalid-plugin'))
        .rejects.toThrow('Network error');
    });
  });
});
```

### 4. **频道聊天插件设计**

#### **数据模型**
```typescript
// shared/src/types/chat.ts

export interface Channel {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
}

export interface Message {
  id: string;
  channelId: string;
  content: string;
  author: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

export interface ChatEvents {
  'chat:channel-created': { channel: Channel };
  'chat:channel-deleted': { channelId: string };
  'chat:message-sent': { message: Message };
  'chat:message-received': { message: Message };
  'chat:user-joined': { channelId: string; userId: string };
  'chat:user-left': { channelId: string; userId: string };
}
```

#### **后端 API 路由**
```typescript
// backend/src/routes/channels.ts

import { Router } from 'express';
import { ChannelService } from '../services/channel.service';

const router = Router();
const channelService = new ChannelService();

// GET /api/channels - 获取所有频道
router.get('/', async (req, res) => {
  try {
    const channels = await channelService.getAllChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/channels - 创建新频道
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const channel = await channelService.createChannel({ name, description });
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

#### **前端插件实现**
```javascript
// frontend/src/plugins/chat-plugin/plugin.js

class ChatPlugin extends window.LifeBoxAPI.BasePlugin {
  constructor() {
    super();
    this.channels = [];
    this.currentChannel = null;
    this.container = null;
  }

  onLoad() {
    console.log('Chat Plugin loaded');
    
    // 创建插件容器
    this.container = this.createContainer('chat-plugin');
    
    // 初始化 UI
    this.initializeUI();
    
    // 监听事件
    this.setupEventListeners();
    
    // 加载频道列表
    this.loadChannels();
  }

  onUnload() {
    console.log('Chat Plugin unloaded');
    this.removeContainer();
  }

  initializeUI() {
    this.container.innerHTML = `
      <div class="chat-plugin">
        <div class="chat-sidebar">
          <div class="channel-header">
            <h3>频道</h3>
            <button id="create-channel-btn" class="btn btn-primary">+</button>
          </div>
          <div id="channel-list" class="channel-list"></div>
        </div>
        
        <div class="chat-main">
          <div id="chat-header" class="chat-header">
            <h3 id="current-channel-name">选择一个频道</h3>
          </div>
          
          <div id="messages-container" class="messages-container"></div>
          
          <div class="message-input-container">
            <input 
              type="text" 
              id="message-input" 
              placeholder="输入消息..." 
              class="message-input"
            />
            <button id="send-btn" class="btn btn-primary">发送</button>
          </div>
        </div>
      </div>
    `;

    this.bindUIEvents();
  }

  setupEventListeners() {
    // 监听新消息事件
    this.on('chat:message-received', (event) => {
      this.handleNewMessage(event.data.message);
    });

    // 监听频道创建事件
    this.on('chat:channel-created', (event) => {
      this.handleChannelCreated(event.data.channel);
    });
  }

  async sendMessage() {
    if (!this.currentChannel) {
      alert('请先选择一个频道');
      return;
    }

    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content) return;

    try {
      const message = await this.httpPost(`/api/channels/${this.currentChannel.id}/messages`, {
        content,
        author: 'Current User',
        type: 'text'
      });

      // 触发消息发送事件
      this.emit('chat:message-sent', { message });
      
      input.value = '';
      this.addMessageToUI(message);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('发送消息失败');
    }
  }
}

// 注册插件到全局
if (!window.LifeBoxPlugins) {
  window.LifeBoxPlugins = {};
}

window.LifeBoxPlugins['chat-plugin'] = ChatPlugin;
```

#### **插件配置文件**
```json
// frontend/src/plugins/chat-plugin/manifest.json
{
  "id": "chat-plugin",
  "name": "频道聊天",
  "version": "1.0.0",
  "description": "多频道聊天插件，支持创建频道和实时消息",
  "entry": "plugin.js",
  "styles": "styles.css",
  "permissions": [
    "http:api",
    "events:chat.*",
    "storage:local"
  ],
  "author": "LifeBox Team"
}
```

## 📅 开发实施计划

### **第一阶段：基础架构 (2-3 周)**

#### **Week 1: 项目搭建**
- [ ] 创建前后端分离的项目结构
- [ ] 配置 Tauri + React + TypeScript 前端
- [ ] 配置 Node.js + Express + TypeScript 后端
- [ ] 设置 Prisma + SQLite 数据库
- [ ] 配置测试环境 (Vitest + Jest)

#### **Week 2: 核心系统**
- [ ] 实现基于 Script 标签的插件加载器 (TDD)
- [ ] 实现 Events 事件框架 (TDD)
- [ ] 创建前后端通信机制 (HTTP + WebSocket)
- [ ] 实现基础的插件 API

#### **Week 3: 测试和文档**
- [ ] 完善单元测试和集成测试
- [ ] 编写插件开发文档
- [ ] 设置 CI/CD 流程

### **第二阶段：聊天插件 (1-2 周)**

#### **Week 4: 聊天插件开发**
- [ ] 设计聊天数据模型和 API (TDD)
- [ ] 实现后端聊天服务 (TDD)
- [ ] 开发前端聊天插件 (TDD)
- [ ] 实现实时消息功能

#### **Week 5: 优化和测试**
- [ ] 性能优化和代码重构
- [ ] E2E 测试覆盖
- [ ] 用户体验优化
- [ ] 准备发布

## 🔄 **TDD 开发流程**

```
1. 🔴 Red: 编写失败的测试
2. 🟢 Green: 编写最小化的实现代码
3. 🔵 Refactor: 重构代码，保持测试通过
4. ♻️ Repeat: 重复循环
```

**测试优先级**:
1. **核心功能**: 插件加载、事件系统
2. **业务逻辑**: 聊天功能、数据操作
3. **集成测试**: 前后端通信、插件交互
4. **E2E 测试**: 用户完整流程

## 🚀 **架构优势**

### **简单性**
- ✅ 前后端完全分离，独立开发和部署
- ✅ 基于 Script 标签的插件系统，易于理解和调试
- ✅ 统一的事件系统，简化组件间通信

### **可扩展性**
- ✅ 插件可以是纯前端 (JavaScript)，无需复杂构建
- ✅ 事件驱动架构，松耦合的系统设计
- ✅ 模块化的后端服务，易于扩展新功能

### **开发效率**
- ✅ TDD 确保代码质量和可维护性
- ✅ TypeScript 提供类型安全和优秀的开发体验
- ✅ 热重载和快速迭代支持

### **技术债务低**
- ✅ 基于成熟技术栈，社区支持良好
- ✅ 清晰的代码结构和文档
- ✅ 完善的测试覆盖

---

这个架构设计更加务实和渐进式，专注于核心功能的快速实现，同时保持系统的可扩展性和maintainability。通过 TDD 开发模式，确保代码质量，通过事件驱动的插件系统，提供强大的扩展能力。