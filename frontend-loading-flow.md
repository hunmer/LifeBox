# LifeBox 前端加载流程图

```mermaid
flowchart TD
    A[浏览器加载 index.html] --> B[1. HTML 解析完成]
    B --> C[2. 加载 @vite/client]
    C --> D[3. 建立 WebSocket 连接]
    D --> E[4. 加载 main.tsx]
    E --> F[5. React 初始化]
    F --> G[6. App 组件挂载]
    G --> H[7. useAppStore 初始化]
    H --> I[8. usePluginInitialization Hook]
    I --> J[9. 插件系统初始化]
    J --> K[10. MainLayout 渲染]
    K --> L[11. UI 组件渲染]
    L --> M[12. 样式加载完成]
    M --> N[13. 应用完全加载]

    %% 可能的卡顿点
    C --> |WebSocket 连接失败| X1[❌ Vite HMR 连接问题]
    I --> |插件加载超时| X2[❌ 插件系统卡顿]
    H --> |状态管理错误| X3[❌ Zustand 初始化失败]
    K --> |组件依赖缺失| X4[❌ UI 组件加载失败]

    style A fill:#e1f5fe
    style N fill:#c8e6c9
    style X1 fill:#ffcdd2
    style X2 fill:#ffcdd2
    style X3 fill:#ffcdd2
    style X4 fill:#ffcdd2
```

## 关键加载点说明

1. **HTML 解析** - 基础 DOM 结构
2. **Vite Client** - 开发服务器热更新客户端
3. **WebSocket 连接** - HMR 实时更新连接
4. **main.tsx** - React 应用入口
5. **React 初始化** - React 核心库加载
6. **App 组件** - 根组件挂载
7. **useAppStore** - Zustand 状态管理
8. **usePluginInitialization** - 插件系统 Hook
9. **插件系统初始化** - 动态插件加载
10. **MainLayout** - 主布局组件
11. **UI 组件** - shadcn/ui 组件渲染
12. **样式加载** - CSS 和 Tailwind 样式
13. **应用完全加载** - 所有资源加载完成

## 常见卡顿原因

- **WebSocket 连接失败**: Vite HMR 连接问题
- **插件系统超时**: 插件加载或初始化异常
- **状态管理错误**: Zustand store 初始化失败
- **组件依赖缺失**: UI 组件或样式加载问题