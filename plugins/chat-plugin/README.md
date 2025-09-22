# LifeBox 聊天插件

LifeBox 聊天插件是一个基于标准插件架构的全功能聊天应用，提供实时多频道聊天、用户管理、文件传输等功能。

## 功能特性

### 🚀 核心功能
- **多频道聊天**: 支持创建和管理多个聊天频道
- **实时通信**: 基于 WebSocket 的实时消息传输
- **用户状态**: 在线状态显示和用户列表管理
- **消息类型**: 支持文本、图片、文件等多种消息类型
- **消息历史**: 消息持久化存储和历史记录查看

### 🎨 界面特性
- **现代化UI**: 基于现代设计语言的清洁界面
- **主题支持**: 支持亮色、暗色和自动主题切换
- **响应式设计**: 适配桌面和移动设备
- **无障碍支持**: 遵循 WCAG 无障碍设计标准

### ⚙️ 高级功能
- **打字指示器**: 实时显示用户输入状态
- **消息通知**: 桌面通知和声音提醒
- **文件上传**: 支持图片、文档等文件分享
- **搜索功能**: 消息内容和历史搜索
- **频道管理**: 创建、编辑、删除频道

## 插件架构

### 标准插件格式

本插件严格遵循 LifeBox 标准插件规范：

```
chat-plugin/
├── manifest.json          # 插件清单文件
├── chat-plugin.js         # 主插件代码
├── chat-plugin.css        # 样式文件
├── assets/                # 静态资源
│   ├── chat-icon.svg      # 插件图标
│   └── notification.mp3   # 通知音效（可选）
└── README.md              # 说明文档
```

### 插件清单 (manifest.json)

```json
{
  "id": "lifebox.chat.plugin",
  "name": "LifeBox聊天插件",
  "version": "1.0.0",
  "description": "提供多频道实时聊天功能",
  "entry": "chat-plugin.js",
  "styles": "chat-plugin.css",
  "permissions": [
    "http:request",
    "storage:local",
    "events:listen",
    "events:emit",
    "ui:manipulate",
    "system:notification"
  ]
}
```

## 插件开发

### 基础架构

本插件继承自 `BasePlugin` 基类，实现以下核心生命周期方法：

- `onLoad()`: 插件加载初始化
- `onUnload()`: 插件卸载清理
- `onActivate()`: 插件激活
- `onDeactivate()`: 插件停用

### API 使用

插件通过 `PluginAPI` 接口访问系统功能：

```javascript
// 事件系统
this.api.events.on('chat:message-received', handler);
this.api.events.emit('chat:message-sent', data);

// 存储系统
await this.api.storage.set('settings', config);
const settings = await this.api.storage.get('settings');

// UI 管理
this.api.ui.showNotification('消息已发送', 'success');
await this.api.ui.showDialog(config);

// HTTP 客户端
const response = await this.api.http.get('/api/channels');
```

## 配置选项

### 基础配置

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `serverUrl` | string | `ws://localhost:3001` | WebSocket服务器地址 |
| `maxMessages` | number | `1000` | 本地消息缓存数量 |
| `enableNotifications` | boolean | `true` | 是否启用桌面通知 |
| `enableSound` | boolean | `true` | 是否启用声音提醒 |
| `theme` | string | `auto` | 界面主题 (light/dark/auto) |
| `autoJoinChannels` | array | `['general']` | 自动加入的频道列表 |

### 高级配置

```javascript
// 在插件代码中动态配置
await this.setConfig('reconnectInterval', 5000);
await this.setConfig('messageRetention', 30); // 消息保留天数
await this.setConfig('uploadMaxSize', 10 * 1024 * 1024); // 最大上传大小
```

## 事件系统

### 聊天事件

插件支持以下标准聊天事件：

```javascript
// 监听消息事件
this.on('chat:message-received', (message) => {
  console.log('收到新消息:', message);
});

// 发送自定义事件
this.emitLifeBoxEvent('chat:user-typing', {
  channelId: 'channel-1',
  userId: 'user-123'
});
```

### 系统事件

```javascript
// 主题变更
this.on('system:theme-changed', (theme) => {
  this.applyTheme(theme);
});

// 窗口关闭
this.on('system:before-quit', () => {
  this.disconnect();
});
```

## 消息协议

### WebSocket 消息格式

```javascript
// 发送消息
{
  "type": "send_message",
  "channelId": "channel-123",
  "content": "Hello, World!",
  "messageType": "text"
}

// 接收消息
{
  "type": "message",
  "message": {
    "id": "msg-123",
    "channelId": "channel-123",
    "content": "Hello, World!",
    "author": {
      "id": "user-123",
      "displayName": "John Doe",
      "avatar": "https://..."
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## 安装和使用

### 自动安装

```javascript
// 通过插件管理器安装
const pluginSystem = new PluginSystem();
await pluginSystem.installPlugin('./plugins/chat-plugin');
```

### 手动安装

1. 将插件文件夹复制到 `plugins/` 目录
2. 在插件管理界面中启用聊天插件
3. 配置服务器连接地址
4. 开始使用聊天功能

### 开发调试

```bash
# 启动开发服务器
npm run dev:frontend

# 在浏览器开发者工具中查看插件日志
# 插件会在控制台输出调试信息
```

## 故障排除

### 常见问题

**Q: 无法连接到聊天服务器**
A: 检查 `serverUrl` 配置是否正确，确保服务器正在运行

**Q: 消息无法发送**
A: 检查网络连接和用户认证状态

**Q: 界面显示异常**
A: 清除浏览器缓存或重置插件配置

**Q: 插件无法加载**
A: 检查插件文件完整性和权限配置

### 调试模式

```javascript
// 启用调试模式
const pluginSystem = new PluginSystem({ debug: true });

// 插件日志会输出更详细的信息
this.debug('WebSocket连接状态:', this.websocket.readyState);
```

## 扩展开发

### 自定义消息类型

```javascript
// 添加自定义消息处理
handleServerMessage(data) {
  switch (data.type) {
    case 'custom_message':
      this.handleCustomMessage(data);
      break;
    // ... 其他消息类型
  }
}
```

### 插件集成

```javascript
// 与其他插件通信
this.emitLifeBoxEvent('plugin:chat:ready', {
  pluginId: this.getId(),
  api: this.getPublicAPI()
});
```

## 许可证

本插件遵循 MIT 许可证开源。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进本插件。

## 更新日志

### v1.0.0
- 初始版本发布
- 基础聊天功能实现
- 多频道支持
- 实时消息传输
- 主题系统支持