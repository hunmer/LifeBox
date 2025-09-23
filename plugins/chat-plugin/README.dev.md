# Chat Plugin TypeScript 开发版

这是 LifeBox Chat Plugin 的 TypeScript 重构版本，支持模块化开发和热更新。

## 🚀 快速开始

### 开发环境设置

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **在 LifeBox 中测试**
   - 确保 LifeBox 前后端服务正在运行
   - 开发服务器会自动将构建的插件复制到 `frontend/public/plugins/`
   - 在插件管理器中加载开发版插件

### 项目结构

```
src/
├── types/              # TypeScript 类型定义
│   └── index.ts        # 主要类型导出
├── services/           # 服务层
│   ├── WebSocketService.ts    # WebSocket 连接管理
│   └── ChatService.ts         # 聊天业务逻辑
├── components/         # UI 组件
│   ├── ChannelList.ts         # 频道列表组件
│   ├── MessageArea.ts         # 消息显示组件
│   ├── MessageInput.ts        # 消息输入组件
│   └── UserList.ts            # 用户列表组件
├── utils/              # 工具函数
│   └── FileUpload.ts          # 文件上传服务
├── ChatPlugin.ts       # 主插件类
└── index.ts           # 入口文件
```

### 开发工作流

1. **修改源码**: 编辑 `src/` 目录下的 TypeScript 文件
2. **自动构建**: 开发服务器检测文件变化并自动构建
3. **热更新**: 构建完成后自动复制到 LifeBox 前端并触发重载
4. **实时测试**: 在 LifeBox 中实时查看更改效果

### 可用脚本

- `npm run dev` - 启动开发服务器（推荐）
- `npm run dev:watch` - 仅启动 Vite 监听模式
- `npm run build` - 构建生产版本
- `npm run build:prod` - 构建优化的生产版本
- `npm run type-check` - TypeScript 类型检查
- `npm run lint` - ESLint 代码检查
- `npm run clean` - 清理构建文件

### 热更新机制

开发服务器实现了完整的热更新机制：

1. **文件监听**: 使用 `chokidar` 监听 `src/` 目录变化
2. **自动构建**: 检测到变化时自动触发 Vite 构建
3. **文件同步**: 将构建结果复制到 LifeBox 前端插件目录
4. **重载通知**: 通过 WebSocket 通知前端重新加载插件

### 开发注意事项

1. **类型安全**: 充分利用 TypeScript 的类型检查
2. **模块化**: 按功能拆分代码到不同文件
3. **事件驱动**: 使用事件系统解耦组件间通信
4. **错误处理**: 添加适当的错误处理和日志记录

### 调试技巧

1. **浏览器开发者工具**: 使用 Chrome DevTools 调试
2. **源码映射**: 开发模式启用 source map，方便调试
3. **日志输出**: 使用 `console.log` 或插件 API 的日志方法
4. **类型检查**: 运行 `npm run type-check` 检查类型错误

### 构建配置

- **开发模式**: 未压缩，包含 source map
- **生产模式**: 压缩优化，移除调试信息
- **UMD 格式**: 兼容多种模块系统
- **类型声明**: 自动生成 `.d.ts` 文件

### 与 LifeBox 集成

插件遵循 LifeBox 插件系统规范：

1. **继承 BasePlugin**: 实现标准生命周期方法
2. **使用插件 API**: 通过 API 访问系统功能
3. **配置管理**: 支持持久化配置存储
4. **事件系统**: 集成系统级事件处理

### 故障排除

**构建失败**:
- 检查 TypeScript 错误
- 确保所有依赖已安装
- 运行 `npm run type-check`

**热更新不工作**:
- 检查开发服务器是否运行
- 确认文件路径配置正确
- 查看控制台错误信息

**插件加载失败**:
- 检查 manifest.json 配置
- 确认 LifeBox 前后端服务运行正常
- 查看插件管理器错误日志