import type { FileAttachment, PluginAPI } from '../types';

export class FileUploadService {
  constructor(private api: PluginAPI) {}

  async showFileDialog(): Promise<File | null> {
    return new Promise((resolve) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar';
      fileInput.style.display = 'none';

      fileInput.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        resolve(file);
        document.body.removeChild(fileInput);
      };

      fileInput.oncancel = () => {
        resolve(null);
        document.body.removeChild(fileInput);
      };

      document.body.appendChild(fileInput);
      fileInput.click();
    });
  }

  async uploadFile(file: File): Promise<FileAttachment> {
    // 验证文件
    this.validateFile(file);

    try {
      this.api.ui.showNotification('正在上传文件...', 'info');

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'chat_attachment');

      // 调用上传 API
      const response = await this.api.http.post('/api/upload', formData, {
        headers: {
          // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
        }
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      const attachment: FileAttachment = {
        id: result.id || Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.url || URL.createObjectURL(file) // 如果服务器返回URL使用服务器的，否则使用本地预览
      };

      this.api.ui.showNotification('文件上传成功', 'success');
      return attachment;

    } catch (error) {
      this.api.logger.error('文件上传失败:', error);

      // 如果是网络错误，创建本地预览（仅用于演示）
      if (this.isNetworkError(error)) {
        this.api.ui.showNotification('文件上传失败，使用本地预览', 'warning');

        return {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        };
      }

      throw error;
    }
  }

  private validateFile(file: File): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      throw new Error(`文件大小不能超过 ${this.formatFileSize(maxSize)}`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的文件类型');
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private isNetworkError(error: any): boolean {
    return error instanceof TypeError ||
           (error instanceof Error && error.message.includes('fetch'));
  }

  // 创建文件预览
  createFilePreview(file: File): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'file-preview';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.style.maxWidth = '200px';
      img.style.maxHeight = '200px';
      preview.appendChild(img);
    } else {
      preview.innerHTML = `
        <div class="file-icon">📄</div>
        <div class="file-info">
          <div class="file-name">${this.escapeHtml(file.name)}</div>
          <div class="file-size">${this.formatFileSize(file.size)}</div>
        </div>
      `;
    }

    return preview;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}