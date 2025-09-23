import type {
  PluginAPI,
  PluginManifest,
  ChatConfig,
  ChatChannel,
  ChatMessage
} from './types';

import { ChatService } from './services/ChatService';
import { FileUploadService } from './utils/FileUpload';
import { ChannelList } from './components/ChannelList';
import { MessageArea } from './components/MessageArea';
import { MessageInput } from './components/MessageInput';
import { UserList } from './components/UserList';

// 假设 BasePlugin 通过全局变量或模块系统可用
declare class BasePlugin {
  constructor(api: PluginAPI, manifest: PluginManifest);

  // 生命周期方法
  onLoad(): Promise<void>;
  onUnload(): Promise<void>;
  onActivate(): Promise<void>;
  onDeactivate(): Promise<void>;

  // 配置方法
  getConfig(key: string): any;
  setConfig(key: string, value: any): Promise<void>;
  getAllConfig(): Record<string, any>;

  // UI方法
  createContainer(id: string): HTMLElement;
  removeContainer(): void;

  // 事件方法
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;

  // 日志方法
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  debug(...args: any[]): void;

  // 通知方法
  showNotification(message: string, type?: string): void;
  showDialog(options: any): Promise<any>;

  // API访问
  protected api: PluginAPI;
  protected manifest: PluginManifest;
}

export class ChatPlugin extends BasePlugin {
  private chatService: ChatService;
  private fileUploadService: FileUploadService;

  // UI 组件
  private chatContainer: HTMLElement | null = null;
  private channelList: ChannelList | null = null;
  private messageArea: MessageArea | null = null;
  private messageInput: MessageInput | null = null;
  // TODO: 在后续版本中实现用户列表功能
  // private userList: UserList | null = null;

  // 状态
  private config: ChatConfig;

  constructor(api: PluginAPI, manifest: PluginManifest) {
    super(api, manifest);

    // 初始化配置
    this.config = {
      serverUrl: 'ws://localhost:3001',
      maxMessages: 1000,
      enableNotifications: true,
      enableSound: true,
      theme: 'auto',
      autoJoinChannels: ['general']
    };

    // 初始化服务
    this.chatService = new ChatService(this.api, this.config);
    this.fileUploadService = new FileUploadService(this.api);
  }

  override async onLoad(): Promise<void> {
    try {
      this.info('聊天插件开始加载 - TypeScript 开发版');

      // 加载配置
      await this.loadConfig();

      // 创建插件容器
      this.chatContainer = this.createContainer('chat-main');

      // 初始化UI
      this.initializeUI();

      // 连接到聊天服务器
      await this.chatService.initialize();

      // 注册事件监听器
      this.registerEventHandlers();

      this.info('聊天插件加载完成');
      this.showNotification('聊天插件已启动', 'success');

    } catch (error) {
      this.error('聊天插件加载失败:', error);
      this.showNotification('聊天插件启动失败: ' + (error as Error).message, 'error');
      throw error;
    }
  }

  override async onUnload(): Promise<void> {
    try {
      this.info('聊天插件开始卸载');

      // 断开连接
      await this.chatService.disconnect();

      // 移除事件监听器
      this.removeEventHandlers();

      // 清理UI
      this.cleanupUI();

      // 移除容器
      this.removeContainer();

      this.info('聊天插件卸载完成');

    } catch (error) {
      this.error('聊天插件卸载失败:', error);
    }
  }

  override async onActivate(): Promise<void> {
    this.info('聊天插件已激活');

    // 显示聊天界面
    if (this.chatContainer) {
      this.chatContainer.style.display = 'block';
    }

    // 如果未连接，尝试重新连接
    if (!this.chatService.isConnected()) {
      try {
        await this.chatService.initialize();
      } catch (error) {
        this.error('重新连接失败:', error);
      }
    }
  }

  override async onDeactivate(): Promise<void> {
    this.info('聊天插件已停用');

    // 隐藏聊天界面
    if (this.chatContainer) {
      this.chatContainer.style.display = 'none';
    }
  }

  private async loadConfig(): Promise<void> {
    const config = this.getAllConfig();

    // 设置默认配置并合并用户配置
    const defaults: ChatConfig = {
      serverUrl: 'ws://localhost:3001',
      maxMessages: 1000,
      enableNotifications: true,
      enableSound: true,
      theme: 'auto',
      autoJoinChannels: ['general']
    };

    for (const [key, value] of Object.entries(defaults)) {
      if (config[key] === undefined) {
        await this.setConfig(key, value);
      }
    }

    // 更新配置对象
    this.config = { ...defaults, ...config };
    this.debug('配置加载完成:', this.config);
  }

  private initializeUI(): void {
    if (!this.chatContainer) return;

    this.chatContainer.innerHTML = `
      <div class="chat-plugin-container">
        <div class="chat-header">
          <h2>LifeBox 聊天</h2>
          <div class="connection-status" id="connection-status">
            <span class="status-indicator"></span>
            <span class="status-text">连接中...</span>
          </div>
        </div>

        <div class="chat-body">
          <div class="sidebar">
            <div id="channel-list-container"></div>
            <div id="user-list-container"></div>
          </div>

          <div class="main-chat">
            <div class="channel-header" id="channel-header">
              <span class="channel-name">请选择一个频道</span>
              <div class="channel-actions">
                <button class="btn-channel-info" id="btn-channel-info">信息</button>
                <button class="btn-leave-channel" id="btn-leave-channel">离开</button>
              </div>
            </div>

            <div class="message-area" id="message-area"></div>
            <div class="input-area" id="input-area"></div>
          </div>
        </div>
      </div>
    `;

    // 初始化组件
    this.initializeComponents();

    // 绑定事件监听器
    this.bindUIEvents();

    // 应用主题
    this.applyTheme();
  }

  private initializeComponents(): void {
    if (!this.chatContainer) return;

    // 初始化频道列表
    const channelListContainer = this.chatContainer.querySelector('#channel-list-container') as HTMLElement;
    if (channelListContainer) {
      this.channelList = new ChannelList(channelListContainer);
    }

    // 初始化消息区域
    const messageArea = this.chatContainer.querySelector('#message-area') as HTMLElement;
    if (messageArea) {
      this.messageArea = new MessageArea(messageArea);
    }

    // 初始化输入区域
    const inputArea = this.chatContainer.querySelector('#input-area') as HTMLElement;
    if (inputArea) {
      this.messageInput = new MessageInput(inputArea);
    }

    // TODO: 初始化用户列表 - 在后续版本中实现
    // const userListContainer = this.chatContainer.querySelector('#user-list-container') as HTMLElement;
    // if (userListContainer) {
    //   this.userList = new UserList(userListContainer);
    // }
  }

  private bindUIEvents(): void {
    if (!this.chatContainer) return;

    // 频道信息按钮
    const channelInfoButton = this.chatContainer.querySelector('#btn-channel-info') as HTMLButtonElement;
    channelInfoButton?.addEventListener('click', () => {
      this.showChannelInfo();
    });

    // 离开频道按钮
    const leaveChannelButton = this.chatContainer.querySelector('#btn-leave-channel') as HTMLButtonElement;
    leaveChannelButton?.addEventListener('click', () => {
      this.leaveCurrentChannel();
    });

    // 监听消息输入的打字事件
    const inputArea = this.chatContainer.querySelector('#input-area') as HTMLElement;
    if (inputArea) {
      inputArea.addEventListener('typing:start', () => {
        this.chatService.sendTypingStart();
      });

      inputArea.addEventListener('typing:stop', () => {
        this.chatService.sendTypingStop();
      });
    }
  }

  private registerEventHandlers(): void {
    // 聊天服务事件
    this.chatService.on('connected', () => {
      this.updateConnectionStatus('connected', '已连接');
      this.updateUIState();
    });

    this.chatService.on('disconnected', () => {
      this.updateConnectionStatus('disconnected', '连接断开');
      this.updateUIState();
    });

    this.chatService.on('reconnecting', (data: any) => {
      this.updateConnectionStatus('reconnecting', `重连中(${data.attempt}/${data.maxAttempts})`);
    });

    this.chatService.on('error', (error: Error) => {
      this.updateConnectionStatus('error', '连接错误');
      this.error('聊天服务错误:', error);
    });

    this.chatService.on('channel_list_updated', (channels: ChatChannel[]) => {
      this.updateChannelList();
    });

    this.chatService.on('channel_joined', (channel: ChatChannel) => {
      this.handleChannelJoined(channel);
    });

    this.chatService.on('new_message', (message: ChatMessage) => {
      this.handleNewMessage(message);
    });

    this.chatService.on('typing_start', (data: any) => {
      this.messageInput?.setTypingIndicator(data.username, true);
    });

    this.chatService.on('typing_stop', (data: any) => {
      this.messageInput?.setTypingIndicator(data.username, false);
    });

    // 系统事件
    this.on('system:theme-changed', () => {
      this.applyTheme();
    });

    this.on('system:before-quit', () => {
      this.chatService.disconnect();
    });
  }

  private removeEventHandlers(): void {
    // 移除所有事件监听器
    this.off('system:theme-changed', this.applyTheme);
    this.off('system:before-quit', () => this.chatService.disconnect());
  }

  private updateConnectionStatus(status: string, text: string): void {
    const statusElement = this.chatContainer?.querySelector('#connection-status');
    if (!statusElement) return;

    const indicator = statusElement.querySelector('.status-indicator');
    const textElement = statusElement.querySelector('.status-text');

    if (indicator && textElement) {
      indicator.className = `status-indicator status-${status}`;
      textElement.textContent = text;
    }
  }

  private updateUIState(): void {
    const isConnected = this.chatService.isConnected();
    const currentChannel = this.chatService.getCurrentChannel();

    // 更新消息输入状态
    this.messageInput?.update({
      onSendMessage: (content: string) => this.sendMessage(content),
      onFileUpload: () => this.handleFileUpload(),
      disabled: !isConnected,
      currentChannel
    });
  }

  private updateChannelList(): void {
    const channels = this.chatService.getChannels();
    const currentChannel = this.chatService.getCurrentChannel();

    this.channelList?.update({
      channels,
      currentChannel,
      onChannelSelect: (channelId: string) => this.joinChannel(channelId),
      onCreateChannel: () => this.showCreateChannelDialog()
    });
  }

  private handleChannelJoined(channel: ChatChannel): void {
    this.updateChannelHeader(channel);
    this.updateMessageArea(channel.id);
    this.updateChannelList();
  }

  private handleNewMessage(message: ChatMessage): void {
    this.messageArea?.addMessage(message);

    // 播放声音提醒
    if (this.config.enableSound && message.authorId !== this.chatService.getCurrentUser()?.id) {
      this.playNotificationSound();
    }
  }

  private updateChannelHeader(channel: ChatChannel): void {
    const channelHeader = this.chatContainer?.querySelector('#channel-header');
    if (!channelHeader) return;

    const channelName = channelHeader.querySelector('.channel-name');
    if (channelName) {
      channelName.textContent = `# ${channel.name}`;
    }
  }

  private updateMessageArea(channelId: string): void {
    const messages = this.chatService.getMessages(channelId);
    const currentChannel = this.chatService.getCurrentChannel();

    this.messageArea?.update({
      messages,
      currentChannel,
      isLoading: false
    });
  }

  private async sendMessage(content: string): Promise<void> {
    try {
      await this.chatService.sendMessage(content);
    } catch (error) {
      this.error('发送消息失败:', error);
      this.showNotification('发送消息失败: ' + (error as Error).message, 'error');
    }
  }

  private async handleFileUpload(): Promise<void> {
    try {
      const file = await this.fileUploadService.showFileDialog();
      if (!file) return;

      const attachment = await this.fileUploadService.uploadFile(file);
      await this.chatService.sendMessage(`[文件] ${file.name}`, 'file', attachment);

    } catch (error) {
      this.error('文件上传失败:', error);
      this.showNotification('文件上传失败: ' + (error as Error).message, 'error');
    }
  }

  private async joinChannel(channelId: string): Promise<void> {
    try {
      await this.chatService.joinChannel(channelId);
    } catch (error) {
      this.error('加入频道失败:', error);
      this.showNotification('加入频道失败: ' + (error as Error).message, 'error');
    }
  }

  private async showCreateChannelDialog(): Promise<void> {
    try {
      await this.showDialog({
        title: '创建新频道',
        content: `
          <div class="create-channel-form">
            <div class="form-group">
              <label for="channel-name">频道名称：</label>
              <input type="text" id="channel-name" placeholder="输入频道名称">
            </div>
            <div class="form-group">
              <label for="channel-description">频道描述：</label>
              <textarea id="channel-description" placeholder="输入频道描述（可选）"></textarea>
            </div>
          </div>
        `,
        buttons: [
          {
            text: '创建',
            type: 'primary',
            onClick: () => {
              const nameElement = document.getElementById('channel-name') as HTMLInputElement;
              const descriptionElement = document.getElementById('channel-description') as HTMLTextAreaElement;

              const name = nameElement?.value.trim();
              const description = descriptionElement?.value.trim();

              if (!name) {
                this.showNotification('请输入频道名称', 'warning');
                return false;
              }

              this.createChannel(name, description);
              return true;
            }
          },
          {
            text: '取消',
            type: 'secondary'
          }
        ]
      });
    } catch (error) {
      this.error('显示创建频道对话框失败:', error);
    }
  }

  private async createChannel(name: string, description?: string): Promise<void> {
    try {
      await this.chatService.createChannel(name, description);
    } catch (error) {
      this.error('创建频道失败:', error);
      this.showNotification('创建频道失败: ' + (error as Error).message, 'error');
    }
  }

  private showChannelInfo(): void {
    const currentChannel = this.chatService.getCurrentChannel();
    if (!currentChannel) return;

    this.showDialog({
      title: '频道信息',
      content: `
        <div class="channel-info">
          <h3>${currentChannel.name}</h3>
          <p><strong>描述:</strong> ${currentChannel.description || '无描述'}</p>
          <p><strong>成员数量:</strong> ${currentChannel.memberCount || 0}</p>
          <p><strong>创建时间:</strong> ${new Date(currentChannel.createdAt).toLocaleString()}</p>
        </div>
      `,
      buttons: [
        { text: '关闭', type: 'primary' }
      ]
    });
  }

  private async leaveCurrentChannel(): Promise<void> {
    const currentChannel = this.chatService.getCurrentChannel();
    if (!currentChannel) return;

    try {
      const confirmed = await this.showDialog({
        title: '离开频道',
        content: `确定要离开频道 "${currentChannel.name}" 吗？`,
        buttons: [
          {
            text: '离开',
            type: 'danger',
            onClick: () => true
          },
          {
            text: '取消',
            type: 'secondary',
            onClick: () => false
          }
        ]
      });

      if (confirmed) {
        await this.chatService.leaveChannel(currentChannel.id);
      }
    } catch (error) {
      this.error('离开频道失败:', error);
      this.showNotification('离开频道失败: ' + (error as Error).message, 'error');
    }
  }

  private applyTheme(): void {
    const theme = this.config.theme;
    if (this.chatContainer) {
      this.chatContainer.setAttribute('data-theme', theme);
    }
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(error => {
        this.debug('播放通知声音失败:', error);
      });
    } catch (error) {
      this.debug('创建音频对象失败:', error);
    }
  }

  private cleanupUI(): void {
    // 清理组件引用
    this.channelList = null;
    this.messageArea = null;
    this.messageInput = null;
    this.userList = null;
  }
}