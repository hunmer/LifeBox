# 📋 LifeBox

**跨平台全能纪录应用** - 基于 Tauri 前端 + Node.js 后端的事件驱动插件系统

## 🎯 项目概述

LifeBox 是一款跨平台「全能纪录」应用，采用 **Tauri 前端 + Node.js 后端** 分离架构，支持强大的插件系统和事件驱动开发。

### 核心特点

- 🔧 **前后端分离**: Tauri (纯前端) + Node.js 独立后端
- 🧩 **Script 插件系统**: 基于 HTML script 标签的简单插件加载
- 📡 **Events 事件框架**: 支持事件传递、取消、修改的完整事件系统
- 🧪 **TDD 测试驱动**: 测试先行的开发模式
- 💬 **频道聊天插件**: 第一个完整的示例插件

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+
- Git

### 安装和运行

```bash
# 克隆项目
git clone <repository-url>
cd lifebox

# 运行开发环境
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### 开发命令

```bash
# 开发模式 (同时启动前后端)
npm run dev

# 单独启动前端
npm run dev:frontend

# 单独启动后端  
npm run dev:backend

# 构建项目
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint
```

## 🏗️ 项目结构

```
lifebox/
├── frontend/          # Tauri 前端应用
│   ├── src/           # React + TypeScript 源码
│   ├── src-tauri/     # Tauri 配置
│   └── tests/         # 前端测试
├── backend/           # Node.js 后端服务
│   ├── src/           # Express + TypeScript 源码
│   ├── prisma/        # 数据库配置
│   └── tests/         # 后端测试
├── shared/            # 前后端共享类型定义
├── scripts/           # 开发和构建脚本
├── docs/              # 项目文档
└── .github/           # CI/CD 配置
```

## 🔧 技术栈

### 前端
- **框架**: Tauri 2.0 + React 18+ + TypeScript 5+
- **构建**: Vite 5+
- **UI**: shadcn/ui + Tailwind CSS 3+
- **状态**: Zustand 4+
- **测试**: Vitest + Playwright

### 后端
- **运行时**: Node.js 18+ + Express.js + TypeScript 5+
- **数据库**: SQLite 3+ + Prisma 5+
- **实时通信**: WebSocket
- **测试**: Jest + Supertest

## 🧩 核心系统

### 插件系统
基于 Script 标签的动态插件加载机制，支持：
- 插件生命周期管理
- 权限控制和 API 访问
- 热插拔和版本管理

### 事件系统
完整的事件驱动架构，支持：
- 事件发布订阅
- 中间件处理
- 事件取消和修改
- 前后端事件同步

### TDD 开发
测试驱动开发模式：
- 🔴 Red: 编写失败的测试
- 🟢 Green: 编写最小化的实现代码
- 🔵 Refactor: 重构代码，保持测试通过

## 📚 文档

详细文档请查看 [docs/](./docs/) 目录：

- [架构设计](./docs/architecture.md)
- [开发指南](./docs/development.md)
- [插件开发](./docs/plugin-development.md)
- [API 文档](./docs/api.md)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！