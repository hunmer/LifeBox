# 简单测试插件

这是一个展示LifeBox全局API使用方法的测试插件示例。

## 功能特点

- ✅ 使用全局API `window.LifeBoxAPI`
- ✅ 直接使用shadcn UI组件（Button等）
- ✅ 侧边栏菜单注册和管理
- ✅ 通知系统
- ✅ 事件系统
- ✅ 本地存储
- ✅ React组件渲染
- ✅ TypeScript支持（编译为JavaScript）

## 文件结构

```
simple-test-plugin/
├── manifest.json     # 插件清单文件
├── plugin.js         # 主要的JavaScript插件文件（直接可用）
├── plugin.ts         # TypeScript源码版本
├── plugin.css        # 插件样式
├── build.js          # TypeScript构建脚本
├── tsconfig.json     # TypeScript配置
└── README.md         # 说明文档
```

## 使用方法

### 方式1：直接使用JavaScript版本
1. 将整个 `simple-test-plugin` 文件夹复制到 LifeBox 的插件目录
2. 在LifeBox中加载插件
3. 插件会自动显示在界面中并注册侧边栏菜单

### 方式2：使用TypeScript开发
1. 编辑 `plugin.ts` 文件
2. 运行构建脚本：`node build.js`
3. 构建脚本会将TypeScript代码转换为 `plugin.js`
4. 加载插件

## 全局API使用示例

### 基础组件使用
```javascript
const { React, components, utils } = window.LifeBoxAPI;
const { Button } = components;
const { cn } = utils;

// 创建按钮组件
const button = React.createElement(Button, {
  variant: 'default',
  onClick: () => alert('Hello!')
}, 'Click Me');
```

### 侧边栏管理
```javascript
const { sidebar } = window.LifeBoxAPI;

// 注册菜单项
const itemId = sidebar.registerMenuItem({
  label: '我的插件',
  icon: '🚀',
  onClick: () => showMyPlugin()
});

// 更新菜单项
sidebar.updateMenuItem(itemId, {
  label: '更新的标签',
  badge: 5
});

// 移除菜单项
sidebar.removeMenuItem(itemId);
```

### 通知系统
```javascript
const { notifications } = window.LifeBoxAPI;

notifications.show('操作成功!', 'success');
notifications.show('注意事项', 'warning');
notifications.show('发生错误', 'error');
```

### 存储API
```javascript
const { storage } = window.LifeBoxAPI;

// 保存数据
await storage.set('my-key', { data: 'value' });

// 读取数据
const data = await storage.get('my-key');

// 删除数据
await storage.remove('my-key');
```

### 事件系统
```javascript
const { events } = window.LifeBoxAPI;

// 监听事件
events.on('my-event', (event) => {
  console.log('收到事件:', event.detail);
});

// 发送事件
events.emit('my-event', { message: 'Hello World' });
```

### React组件渲染
```javascript
const { dom, React } = window.LifeBoxAPI;

const MyComponent = React.createElement('div', {
  style: { padding: '20px' }
}, 'Hello from React!');

const container = dom.findContainer('plugin-root');
dom.renderReactComponent(MyComponent, container);
```

## TypeScript类型支持

全局API设计时考虑了易用性，所有类型都可以设置为 `any`：

```typescript
// 简单的类型声明
declare const window: any;

interface LifeBoxAPI {
  React: any;
  components: { [key: string]: any };
  utils: { [key: string]: any };
  // ... 其他API
}

class MyPlugin {
  private api: LifeBoxAPI;

  constructor() {
    this.api = window.LifeBoxAPI;
    // 使用API...
  }
}
```

## 开发建议

1. **简单开始**：先使用JavaScript版本理解API
2. **逐步升级**：熟悉后可以迁移到TypeScript
3. **充分利用**：多使用全局API提供的功能，避免重复开发
4. **保持简单**：插件应该专注于核心功能，UI和通用功能使用全局API

## 调试技巧

1. 插件实例会暴露到全局：`window.SimpleTestPlugin`
2. 使用 `logger` API进行日志输出
3. 浏览器控制台中可以直接访问：`window.LifeBoxAPI`
4. 监听全局事件来调试状态变化

## 扩展建议

基于这个示例，你可以：

- 添加更多UI组件
- 实现数据持久化
- 创建复杂的事件通信
- 集成第三方服务
- 添加设置页面
- 实现主题切换支持