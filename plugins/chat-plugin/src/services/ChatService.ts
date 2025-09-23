import type {
  ChatMessage,
  ChatChannel,
  ChatUser,
  WebSocketMessage,
  PluginAPI,
  ChatConfig
} from '../types';
import { WebSocketService } from './WebSocketService';

export class ChatService {
  private websocketService: WebSocketService;
  private channels = new Map<string, ChatChannel>();
  private messages = new Map<string, ChatMessage[]>();
  private currentChannel: ChatChannel | null = null;
  private currentUser: ChatUser | null = null;
  private eventHandlers = new Map<string, Function[]>();

  constructor(
    private api: PluginAPI,
    private config: ChatConfig
  ) {
    this.websocketService = new WebSocketService(config);
    this.setupWebSocketHandlers();
  }

  async initialize(): Promise<void> {
    try {
      await this.websocketService.connect();
      this.authenticate();
    } catch (error) {
      this.api.logger.error('聊天服务初始化失败:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.websocketService.disconnect();
  }

  // 频道操作
  async joinChannel(channelId: string): Promise<void> {
    this.websocketService.send({
      type: 'join_channel',
      channelId
    });
  }

  async leaveChannel(channelId: string): Promise<void> {
    this.websocketService.send({
      type: 'leave_channel',
      channelId
    });
  }

  async createChannel(name: string, description?: string): Promise<void> {
    this.websocketService.send({
      type: 'create_channel',
      name,
      description: description || '',
      channelType: 'public'
    });
  }

  async requestChannelList(): Promise<void> {
    this.websocketService.send({ type: 'get_channels' });
  }

  async requestChannelMessages(channelId: string, limit = 50): Promise<void> {
    this.websocketService.send({
      type: 'get_messages',
      channelId,
      limit
    });
  }

  // 消息操作
  async sendMessage(content: string, messageType: 'text' | 'file' = 'text', attachment?: any): Promise<void> {
    if (!this.currentChannel) {
      throw new Error('没有选择频道');
    }

    const message: WebSocketMessage = {
      type: 'send_message',
      channelId: this.currentChannel.id,
      content,
      messageType
    };

    if (attachment) {
      message.attachment = attachment;
    }

    this.websocketService.send(message);
  }

  async sendTypingStart(): Promise<void> {
    if (!this.currentChannel) return;

    this.websocketService.send({
      type: 'typing_start',
      channelId: this.currentChannel.id
    });
  }

  async sendTypingStop(): Promise<void> {
    if (!this.currentChannel) return;

    this.websocketService.send({
      type: 'typing_stop',
      channelId: this.currentChannel.id
    });
  }

  // 数据访问
  getChannels(): Map<string, ChatChannel> {
    return new Map(this.channels);
  }

  getChannel(channelId: string): ChatChannel | undefined {
    return this.channels.get(channelId);
  }

  getCurrentChannel(): ChatChannel | null {
    return this.currentChannel;
  }

  getMessages(channelId: string): ChatMessage[] {
    return this.messages.get(channelId) || [];
  }

  getCurrentUser(): ChatUser | null {
    return this.currentUser;
  }

  isConnected(): boolean {
    return this.websocketService.isConnectionActive();
  }

  // 事件处理
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.api.logger.error(`聊天服务事件处理器执行失败 [${event}]:`, error);
        }
      });
    }
  }

  private setupWebSocketHandlers(): void {
    this.websocketService.on('connected', () => {
      this.emit('connected');
    });

    this.websocketService.on('disconnected', (data: any) => {
      this.emit('disconnected', data);
    });

    this.websocketService.on('error', (error: any) => {
      this.emit('error', error);
    });

    this.websocketService.on('reconnecting', (data: any) => {
      this.emit('reconnecting', data);
    });

    this.websocketService.on('message', (message: WebSocketMessage) => {
      this.handleServerMessage(message);
    });
  }

  private authenticate(): void {
    this.websocketService.send({
      type: 'authenticate',
      token: 'user_token' // 实际应该从存储中获取
    });
  }

  private handleServerMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'auth_success':
        this.handleAuthSuccess(data);
        break;
      case 'channel_list':
        this.handleChannelList(data.channels);
        break;
      case 'channel_joined':
        this.handleChannelJoined(data.channel);
        break;
      case 'channel_created':
        this.handleChannelCreated(data.channel);
        break;
      case 'message':
        this.handleNewMessage(data.message);
        break;
      case 'user_joined':
        this.handleUserJoined(data);
        break;
      case 'user_left':
        this.handleUserLeft(data);
        break;
      case 'typing_start':
        this.emit('typing_start', data);
        break;
      case 'typing_stop':
        this.emit('typing_stop', data);
        break;
      case 'error':
        this.handleServerError(data);
        break;
      default:
        this.api.logger.warn('未知的服务器消息类型:', data.type);
    }
  }

  private handleAuthSuccess(data: any): void {
    this.currentUser = data.user;
    this.api.logger.info('用户认证成功:', this.currentUser?.username);
    this.emit('auth_success', this.currentUser);

    // 请求频道列表
    this.requestChannelList();

    // 自动加入频道
    this.autoJoinChannels();
  }

  private handleChannelList(channels: ChatChannel[]): void {
    this.api.logger.debug('收到频道列表:', channels);

    // 更新频道映射
    channels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });

    this.emit('channel_list_updated', channels);
  }

  private handleChannelJoined(channel: ChatChannel): void {
    this.currentChannel = channel;
    this.channels.set(channel.id, channel);
    this.api.logger.info('已加入频道:', channel.name);

    this.emit('channel_joined', channel);

    // 请求频道消息
    this.requestChannelMessages(channel.id);
  }

  private handleChannelCreated(channel: ChatChannel): void {
    this.channels.set(channel.id, channel);
    this.emit('channel_created', channel);
  }

  private handleNewMessage(message: ChatMessage): void {
    this.api.logger.debug('收到新消息:', message);

    // 存储消息
    if (!this.messages.has(message.channelId)) {
      this.messages.set(message.channelId, []);
    }
    this.messages.get(message.channelId)!.push(message);

    // 限制消息数量
    const maxMessages = this.config.maxMessages;
    const channelMessages = this.messages.get(message.channelId)!;
    if (channelMessages.length > maxMessages) {
      channelMessages.splice(0, channelMessages.length - maxMessages);
    }

    this.emit('new_message', message);

    // 如果启用通知且不是当前用户发送的消息
    if (this.config.enableNotifications &&
        message.authorId !== this.currentUser?.id) {
      this.api.ui.showNotification(
        `${message.author.displayName}: ${message.content}`,
        'info'
      );
    }
  }

  private handleUserJoined(data: any): void {
    this.api.logger.info(`用户 ${data.user.displayName} 加入了频道 ${data.channelId}`);
    this.emit('user_joined', data);
  }

  private handleUserLeft(data: any): void {
    this.api.logger.info(`用户 ${data.userId} 离开了频道 ${data.channelId}`);
    this.emit('user_left', data);
  }

  private handleServerError(data: any): void {
    this.api.logger.error('服务器错误:', data.message);
    this.emit('server_error', data);
  }

  private autoJoinChannels(): void {
    const autoJoinChannels = this.config.autoJoinChannels;
    if (Array.isArray(autoJoinChannels)) {
      autoJoinChannels.forEach(channelId => {
        this.joinChannel(channelId);
      });
    }
  }
}