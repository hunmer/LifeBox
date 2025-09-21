#!/bin/bash

# LifeBox 生产构建脚本

echo "🏗️  开始生产构建..."

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
npm run clean

# 类型检查
echo "🔍 执行类型检查..."
npm run typecheck || {
    echo "❌ 类型检查失败"
    exit 1
}

# 运行测试
echo "🧪 运行测试..."
npm run test || {
    echo "❌ 测试失败"
    exit 1
}

# 代码检查
echo "📝 执行代码检查..."
npm run lint || {
    echo "❌ 代码检查失败"
    exit 1
}

# 构建项目
echo "🔨 构建项目..."
npm run build || {
    echo "❌ 构建失败"
    exit 1
}

echo "✅ 构建完成！"