# LifeBox 文档

欢迎来到 LifeBox 项目文档！

## 📖 文档结构

- [项目架构](./architecture.md) - 整体架构设计
- [开发指南](./development.md) - 开发环境搭建和开发流程
- [插件开发](./plugin-development.md) - 插件系统开发指南
- [API 文档](./api.md) - 后端 API 接口文档
- [部署指南](./deployment.md) - 项目部署说明

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

## 🏗️ 项目结构

```
lifebox/
├── frontend/          # Tauri 前端应用
├── backend/           # Node.js 后端服务
├── shared/            # 前后端共享类型定义
├── scripts/           # 开发和构建脚本
├── docs/              # 项目文档
└── .github/           # CI/CD 配置
```

## 🧩 核心特性

- **前后端分离**: Tauri + React 前端 + Node.js 后端
- **插件系统**: 基于 Script 标签的动态插件加载
- **事件驱动**: 完整的事件系统支持事件传递、取消、修改
- **TDD 开发**: 测试驱动开发模式
- **TypeScript**: 全栈 TypeScript 开发

## 📞 联系我们

如有问题或建议，请提交 Issue 或 Pull Request。