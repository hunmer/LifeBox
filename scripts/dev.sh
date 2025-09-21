#!/bin/bash

# LifeBox 开发环境启动脚本

echo "🚀 启动 LifeBox 开发环境..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ 需要 Node.js $REQUIRED_VERSION 或更高版本，当前版本: $NODE_VERSION"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm run install:all

# 生成共享类型
echo "🔧 构建共享包..."
npm run build:shared

# 启动开发服务器
echo "🌟 启动开发服务器..."
npm run dev