import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';

const router = express.Router();

/**
 * GET /api/plugins/files/:pluginId/*
 * 提供插件静态文件服务
 */
router.get('/files/:pluginId/*', async (req, res) => {
  try {
    const pluginId = req.params.pluginId;
    const filePath = req.params[0]; // 捕获剩余路径

    // 安全检查：防止路径遍历攻击
    if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) {
      return res.status(400).json({
        error: 'Invalid file path',
        message: 'File path contains invalid characters'
      });
    }

    // 构建完整文件路径
    const pluginsDirectory = path.join(process.cwd(), 'data', 'plugins');
    const fullFilePath = path.join(pluginsDirectory, pluginId, filePath);

    // 确保文件在插件目录内（额外的安全检查）
    const resolvedPath = path.resolve(fullFilePath);
    const pluginDirectory = path.resolve(path.join(pluginsDirectory, pluginId));

    if (!resolvedPath.startsWith(pluginDirectory)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'File access outside plugin directory is not allowed'
      });
    }

    // 检查文件是否存在
    try {
      const stats = await fs.stat(resolvedPath);

      if (!stats.isFile()) {
        return res.status(404).json({
          error: 'File not found',
          message: 'The requested file does not exist'
        });
      }

      // 设置正确的Content-Type
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.zip': 'application/zip',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);

      // 对于下载文件（如zip），设置下载头
      if (ext === '.zip') {
        const filename = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }

      // 设置缓存头
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时缓存
      res.setHeader('ETag', `"${stats.mtime.getTime()}-${stats.size}"`);

      // 检查If-None-Match头（ETag缓存）
      const clientETag = req.headers['if-none-match'];
      const serverETag = `"${stats.mtime.getTime()}-${stats.size}"`;

      if (clientETag === serverETag) {
        return res.status(304).send(); // Not Modified
      }

      // 设置文件大小头
      res.setHeader('Content-Length', stats.size);

      // 流式传输文件
      const fileStream = createReadStream(resolvedPath);

      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'File read error',
            message: 'Error reading the requested file'
          });
        }
      });

      fileStream.pipe(res);

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({
          error: 'File not found',
          message: `File '${filePath}' not found in plugin '${pluginId}'`
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Plugin file service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to serve plugin file'
    });
  }
});

/**
 * GET /api/plugins/files/:pluginId
 * 列出插件目录中的文件
 */
router.get('/files/:pluginId', async (req, res) => {
  try {
    const pluginId = req.params.pluginId;
    const pluginsDirectory = path.join(process.cwd(), 'data', 'plugins');
    const pluginDirectory = path.join(pluginsDirectory, pluginId);

    // 检查插件目录是否存在
    try {
      const stats = await fs.stat(pluginDirectory);

      if (!stats.isDirectory()) {
        return res.status(404).json({
          error: 'Plugin directory not found',
          message: `Plugin '${pluginId}' directory does not exist`
        });
      }

      // 读取目录内容
      const files = await fs.readdir(pluginDirectory, { withFileTypes: true });

      const fileList = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(pluginDirectory, file.name);
          const stats = await fs.stat(filePath);

          return {
            name: file.name,
            type: file.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            lastModified: stats.mtime.getTime(),
            url: `/api/plugins/files/${pluginId}/${file.name}`
          };
        })
      );

      res.json({
        pluginId,
        files: fileList,
        totalFiles: fileList.length
      });

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({
          error: 'Plugin directory not found',
          message: `Plugin '${pluginId}' directory does not exist`
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Plugin directory listing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list plugin files'
    });
  }
});

export default router;