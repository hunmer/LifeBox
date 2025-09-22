# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**LifeBox** 是一个跨平台的「全能纪录」桌面应用，采用 Tauri + React 前端和 Node.js 后端分离架构。该项目具有创新的插件系统和完整的事件驱动架构。

## 核心技术栈

- **桌面应用框架**: Tauri 2.0 (Rust + WebView)
- **前端**: React 18 + TypeScript 5+ + Vite
- **UI组件**: shadcn/ui + Radix UI + Tailwind CSS
- **状态管理**: Zustand + React Hook Form
- **后端**: Node.js 18 + Express + TypeScript
- **数据库**: Prisma ORM + SQLite
- **实时通信**: WebSocket
- **测试**: Vitest + Jest + Playwright

## 常用开发命令

### 快速启动
```bash
# 一键启动完整开发环境（推荐）
./scripts/dev.sh

# 或者手动启动各个服务
npm run dev              # 同时启动前后端开发服务器
npm run dev:frontend     # 仅启动前端 (Tauri + React)
npm run dev:backend      # 仅启动后端 API 服务器
```

### 构建和测试
```bash
# 测试
npm run test             # 运行全部测试套件
npm run test:unit        # 单元测试
npm run test:integration # 集成测试
npm run test:e2e         # E2E 测试
npm run test:coverage    # 测试覆盖率报告

# 构建
npm run build            # 构建生产版本
npm run build:frontend   # 仅构建前端
npm run build:backend    # 仅构建后端

# 代码质量
npm run lint             # ESLint 检查
npm run type-check       # TypeScript 类型检查
```

### Tauri 特定命令
```bash
# Tauri 开发
npm run tauri dev        # 启动 Tauri 开发模式
npm run tauri build      # 构建桌面应用
npm run tauri info       # 查看 Tauri 环境信息
```

## 项目架构

### 目录结构
```
LifeBox/
├── frontend/            # Tauri + React 前端应用
│   ├── src-tauri/      # Tauri Rust 代码
│   ├── src/            # React TypeScript 代码
│   └── dist/           # 前端构建输出
├── backend/            # Node.js Express 后端
│   ├── src/            # 后端 TypeScript 源码
│   ├── prisma/         # 数据库 schema 和迁移
│   └── dist/           # 后端构建输出
├── shared/             # 前后端共享代码
│   ├── types/          # TypeScript 类型定义
│   └── utils/          # 工具函数
├── plugins/            # 插件系统
│   ├── examples/       # 示例插件
│   └── api/            # 插件 API 定义
└── tests/              # 测试文件
```

### 核心架构特点

1. **前后端分离**: 前端通过 RESTful API 和 WebSocket 与后端通信
2. **事件驱动系统**: 基于发布订阅模式，支持中间件和事件修改
3. **插件系统**: 动态加载的 HTML script 插件，继承 `BasePlugin` 基类
4. **类型安全**: 前后端共享 TypeScript 类型定义

### 关键组件

**前端核心 (`frontend/src/`)**:
- `App.tsx` - 主应用组件
- `stores/` - Zustand 状态管理
- `components/` - React 组件
- `services/` - API 服务层
- `types/` - 前端特定类型

**后端核心 (`backend/src/`)**:
- `app.ts` - Express 应用入口
- `routes/` - API 路由定义
- `services/` - 业务逻辑层
- `models/` - 数据模型
- `events/` - 事件系统

**插件系统 (`plugins/`)**:
- `BasePlugin.ts` - 插件基类
- `PluginManager.ts` - 插件管理器
- `api/` - 插件 API 接口

## 开发规范

### 代码风格
- 使用 ESLint + Prettier 进行代码格式化
- 严格的 TypeScript 配置，启用所有严格检查
- 采用函数式组件和 React Hooks 模式

### 测试策略
- **TDD 驱动开发**: 先写测试，后写实现
- **三层测试**: 单元测试、集成测试、E2E 测试
- **覆盖率要求**: 保持 70% 以上的测试覆盖率
- **测试文件命名**: `*.test.ts` 或 `*.spec.ts`

### 插件开发
1. 继承 `BasePlugin` 基类
2. 实现必要的生命周期方法
3. 在 `manifest.json` 中声明权限
4. 使用提供的 API: 事件、存储、HTTP、UI

### 数据库操作
- 使用 Prisma ORM 进行数据库操作
- 迁移文件位于 `backend/prisma/migrations/`
- 运行迁移: `npx prisma migrate dev`
- 重置数据库: `npx prisma migrate reset`

## 调试和故障排除

### 常见问题
1. **Tauri 构建失败**: 检查 Rust 工具链和依赖
2. **WebSocket 连接问题**: 确认后端服务已启动
3. **插件加载失败**: 检查插件 manifest.json 配置
4. **数据库连接错误**: 运行 Prisma 迁移

### 调试工具
- 前端: React DevTools + Chrome DevTools
- 后端: Node.js 调试器 + 日志输出
- 数据库: Prisma Studio (`npx prisma studio`)
- 桌面应用: Tauri 开发者工具

## 重要配置文件

- `package.json` - 项目依赖和脚本
- `frontend/src-tauri/tauri.conf.json` - Tauri 配置
- `backend/prisma/schema.prisma` - 数据库 schema
- `shared/types/` - 前后端共享类型定义
- `tsconfig.json` - TypeScript 配置
- `.eslintrc.js` - ESLint 配置

## 部署和构建

### 开发环境
使用 `./scripts/dev.sh` 快速启动完整开发环境，包括前端、后端和数据库。

### 生产构建
```bash
npm run build           # 构建前后端
npm run tauri build     # 构建桌面应用安装包
```

构建输出:
- 前端: `frontend/dist/`
- 后端: `backend/dist/`
- 桌面应用: `frontend/src-tauri/target/release/`