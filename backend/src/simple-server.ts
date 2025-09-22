import express from 'express';
import cors from 'cors';
import path from 'path';
import pluginsRouter from './routes/plugins.js';
import pluginFilesRouter from './routes/plugin-files.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(cors({
  origin: ['http://localhost:1420', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LifeBox Plugin Repository'
  });
});

// 插件相关路由
app.use('/api/plugins', pluginsRouter);
app.use('/api/plugins', pluginFilesRouter);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LifeBox Plugin Repository Server running on port ${PORT}`);
  console.log(`📦 Plugin API: http://localhost:${PORT}/api/plugins`);
  console.log(`📁 Plugin Files: http://localhost:${PORT}/api/plugins/files`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
});