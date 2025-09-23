import type { ChatChannel, MessageInputProps } from '../types';

export class MessageInput {
  private container: HTMLElement;
  private messageInput: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private attachButton: HTMLButtonElement | null = null;
  private typingIndicator: HTMLElement | null = null;

  private onSendMessage: ((content: string) => void) | null = null;
  private onFileUpload: (() => void) | null = null;
  private currentChannel: ChatChannel | null = null;
  private disabled = false;

  private typingTimeout: NodeJS.Timeout | null = null;
  private isTyping = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  update(props: MessageInputProps): void {
    this.onSendMessage = props.onSendMessage;
    this.onFileUpload = props.onFileUpload;
    this.currentChannel = props.currentChannel;
    this.disabled = props.disabled;

    this.updateUI();
  }

  setTypingIndicator(username: string, isVisible: boolean): void {
    if (!this.typingIndicator) return;

    if (isVisible) {
      this.typingIndicator.textContent = `${username} 正在输入...`;
      this.typingIndicator.style.display = 'block';
    } else {
      this.typingIndicator.style.display = 'none';
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="typing-indicator" id="typing-indicator"></div>
      <div class="message-input-container">
        <input type="text"
               class="message-input"
               id="message-input"
               placeholder="输入消息..."
               disabled>
        <button class="btn-send" id="btn-send" disabled>发送</button>
        <button class="btn-attach" id="btn-attach" disabled>📎</button>
      </div>
    `;

    this.cacheElements();
    this.bindEvents();
  }

  private cacheElements(): void {
    this.messageInput = this.container.querySelector('#message-input') as HTMLInputElement;
    this.sendButton = this.container.querySelector('#btn-send') as HTMLButtonElement;
    this.attachButton = this.container.querySelector('#btn-attach') as HTMLButtonElement;
    this.typingIndicator = this.container.querySelector('#typing-indicator') as HTMLElement;
  }

  private bindEvents(): void {
    if (this.messageInput) {
      this.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      this.messageInput.addEventListener('input', () => {
        this.handleTyping();
      });

      this.messageInput.addEventListener('blur', () => {
        this.stopTyping();
      });
    }

    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }

    if (this.attachButton) {
      this.attachButton.addEventListener('click', () => {
        this.onFileUpload?.();
      });
    }
  }

  private updateUI(): void {
    const shouldEnable = !this.disabled && this.currentChannel !== null;

    if (this.messageInput) {
      this.messageInput.disabled = !shouldEnable;
      this.messageInput.placeholder = this.currentChannel
        ? '输入消息...'
        : '请先选择一个频道';
    }

    if (this.sendButton) {
      this.sendButton.disabled = !shouldEnable;
    }

    if (this.attachButton) {
      this.attachButton.disabled = !shouldEnable;
    }
  }

  private handleSendMessage(): void {
    if (!this.messageInput || !this.currentChannel || this.disabled) {
      return;
    }

    const content = this.messageInput.value.trim();
    if (!content) {
      return;
    }

    this.onSendMessage?.(content);
    this.messageInput.value = '';
    this.stopTyping();
  }

  private handleTyping(): void {
    if (!this.currentChannel || this.disabled) return;

    if (!this.isTyping) {
      this.isTyping = true;
      this.emitTypingStart();
    }

    // 重置停止打字的定时器
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  private stopTyping(): void {
    if (this.isTyping) {
      this.isTyping = false;
      this.emitTypingStop();
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  private emitTypingStart(): void {
    // 这里可以通过事件系统通知外部组件
    const event = new CustomEvent('typing:start', {
      detail: { channelId: this.currentChannel?.id }
    });
    this.container.dispatchEvent(event);
  }

  private emitTypingStop(): void {
    const event = new CustomEvent('typing:stop', {
      detail: { channelId: this.currentChannel?.id }
    });
    this.container.dispatchEvent(event);
  }

  focus(): void {
    this.messageInput?.focus();
  }

  clear(): void {
    if (this.messageInput) {
      this.messageInput.value = '';
    }
    this.stopTyping();
  }
}