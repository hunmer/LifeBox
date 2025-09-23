import type { ChatMessage, ChatChannel, MessageAreaProps } from '../types';

export class MessageArea {
  private container: HTMLElement;
  private messages: ChatMessage[] = [];
  private currentChannel: ChatChannel | null = null;
  private isLoading = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  update(props: MessageAreaProps): void {
    this.messages = props.messages;
    this.currentChannel = props.currentChannel;
    this.isLoading = props.isLoading;
    this.renderMessages();
  }

  addMessage(message: ChatMessage): void {
    if (message.channelId === this.currentChannel?.id) {
      this.messages.push(message);
      this.displayMessage(message);
      this.scrollToBottom();
    }
  }

  clear(): void {
    this.container.innerHTML = '';
  }

  showLoading(): void {
    this.container.innerHTML = '<div class="loading">加载消息中...</div>';
  }

  showNoChannel(): void {
    this.container.innerHTML = `
      <div class="no-channel-selected">
        <p>请从左侧选择一个频道开始聊天</p>
      </div>
    `;
  }

  private render(): void {
    this.showNoChannel();
  }

  private renderMessages(): void {
    if (!this.currentChannel) {
      this.showNoChannel();
      return;
    }

    if (this.isLoading) {
      this.showLoading();
      return;
    }

    this.container.innerHTML = '';

    if (this.messages.length === 0) {
      this.container.innerHTML = '<div class="no-messages">暂无消息</div>';
      return;
    }

    this.messages.forEach(message => {
      this.displayMessage(message);
    });

    this.scrollToBottom();
  }

  private displayMessage(message: ChatMessage): void {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item';
    messageElement.setAttribute('data-message-id', message.id);

    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    messageElement.innerHTML = `
      <div class="message-header">
        <img class="user-avatar"
             src="${message.author.avatar || '/default-avatar.png'}"
             alt="${this.escapeHtml(message.author.displayName)}"
             onerror="this.src='/default-avatar.png'">
        <span class="username">${this.escapeHtml(message.author.displayName)}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${this.formatMessageContent(message.content)}</div>
      ${this.renderAttachment(message)}
    `;

    this.container.appendChild(messageElement);
  }

  private renderAttachment(message: ChatMessage): string {
    if (!message.attachment) {
      return '';
    }

    const attachment = message.attachment;

    if (attachment.type.startsWith('image/')) {
      return `
        <div class="message-attachment">
          <img src="${attachment.url}"
               alt="${this.escapeHtml(attachment.name)}"
               class="attachment-image"
               loading="lazy">
        </div>
      `;
    }

    return `
      <div class="message-attachment">
        <a href="${attachment.url}"
           target="_blank"
           class="attachment-link">
          <span class="attachment-icon">📎</span>
          <span class="attachment-name">${this.escapeHtml(attachment.name)}</span>
          <span class="attachment-size">(${this.formatFileSize(attachment.size)})</span>
        </a>
      </div>
    `;
  }

  private formatMessageContent(content: string): string {
    // 简单的HTML转义和链接识别
    return this.escapeHtml(content)
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}