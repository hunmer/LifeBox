/**
 * LifeBox 聊天功能类型定义
 * 
 * 定义了聊天插件的核心类型，包括频道、消息、用户、
 * 聊天事件等，支持多频道实时聊天功能。
 */

/**
 * 频道信息
 */
export interface Channel {
  /** 频道唯一标识符 */
  id: string;
  /** 频道名称 */
  name: string;
  /** 频道描述 */
  description?: string;
  /** 频道类型 */
  type: ChannelType;
  /** 频道创建者ID */
  creatorId: string;
  /** 频道创建时间 */
  createdAt: Date;
  /** 频道更新时间 */
  updatedAt: Date;
  /** 频道成员数量 */
  memberCount: number;
  /** 频道最后活动时间 */
  lastActivityAt?: Date;
  /** 频道设置 */
  settings: ChannelSettings;
  /** 频道标签 */
  tags?: string[];
  /** 频道图标 */
  icon?: string;
  /** 是否已归档 */
  archived: boolean;
}

/**
 * 频道类型枚举
 */
export enum ChannelType {
  /** 公开频道 */
  PUBLIC = 'public',
  /** 私有频道 */
  PRIVATE = 'private',
  /** 直接消息 */
  DIRECT_MESSAGE = 'direct_message',
  /** 群组消息 */
  GROUP_MESSAGE = 'group_message',
  /** 系统通知 */
  SYSTEM = 'system',
}

/**
 * 频道设置
 */
export interface ChannelSettings {
  /** 是否允许所有成员发言 */
  allowAllMembersToPost: boolean;
  /** 是否允许文件上传 */
  allowFileUpload: boolean;
  /** 是否显示成员列表 */
  showMemberList: boolean;
  /** 消息保留天数（0表示永久保留） */
  messageRetentionDays: number;
  /** 是否启用消息通知 */
  enableNotifications: boolean;
  /** 是否允许表情回复 */
  allowReactions: boolean;
  /** 是否允许消息编辑 */
  allowMessageEdit: boolean;
  /** 是否允许消息删除 */
  allowMessageDelete: boolean;
}

/**
 * 消息信息
 */
export interface Message {
  /** 消息唯一标识符 */
  id: string;
  /** 所属频道ID */
  channelId: string;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  type: MessageType;
  /** 消息发送者ID */
  authorId: string;
  /** 消息发送者信息 */
  author: User;
  /** 消息发送时间 */
  timestamp: Date;
  /** 消息更新时间 */
  updatedAt?: Date;
  /** 是否已编辑 */
  edited: boolean;
  /** 是否已删除 */
  deleted: boolean;
  /** 附件信息 */
  attachments?: MessageAttachment[];
  /** 回复的消息ID */
  replyToId?: string;
  /** 回复的消息信息 */
  replyTo?: Message;
  /** 消息反应 */
  reactions?: MessageReaction[];
  /** 提及的用户ID列表 */
  mentions?: string[];
  /** 消息标签 */
  tags?: string[];
  /** 消息元数据 */
  metadata?: Record<string, any>;
}

/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 文本消息 */
  TEXT = 'text',
  /** 图片消息 */
  IMAGE = 'image',
  /** 文件消息 */
  FILE = 'file',
  /** 音频消息 */
  AUDIO = 'audio',
  /** 视频消息 */
  VIDEO = 'video',
  /** 链接消息 */
  LINK = 'link',
  /** 代码消息 */
  CODE = 'code',
  /** 系统消息 */
  SYSTEM = 'system',
  /** 通知消息 */
  NOTIFICATION = 'notification',
}

/**
 * 消息附件
 */
export interface MessageAttachment {
  /** 附件ID */
  id: string;
  /** 附件名称 */
  name: string;
  /** 附件类型 */
  type: string;
  /** 附件大小（字节） */
  size: number;
  /** 附件URL */
  url: string;
  /** 缩略图URL */
  thumbnailUrl?: string;
  /** 附件宽度（适用于图片/视频） */
  width?: number;
  /** 附件高度（适用于图片/视频） */
  height?: number;
  /** 附件时长（适用于音频/视频，秒） */
  duration?: number;
}

/**
 * 消息反应
 */
export interface MessageReaction {
  /** 表情符号 */
  emoji: string;
  /** 反应的用户ID列表 */
  userIds: string[];
  /** 反应数量 */
  count: number;
}

/**
 * 用户信息
 */
export interface User {
  /** 用户唯一标识符 */
  id: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName: string;
  /** 用户头像URL */
  avatar?: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户状态 */
  status: UserStatus;
  /** 用户角色 */
  role: UserRole;
  /** 最后在线时间 */
  lastSeenAt?: Date;
  /** 用户创建时间 */
  createdAt: Date;
  /** 用户更新时间 */
  updatedAt: Date;
  /** 用户设置 */
  settings?: UserSettings;
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  /** 在线 */
  ONLINE = 'online',
  /** 离开 */
  AWAY = 'away',
  /** 忙碌 */
  BUSY = 'busy',
  /** 离线 */
  OFFLINE = 'offline',
  /** 隐身 */
  INVISIBLE = 'invisible',
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  /** 管理员 */
  ADMIN = 'admin',
  /** 版主 */
  MODERATOR = 'moderator',
  /** 普通用户 */
  USER = 'user',
  /** 访客 */
  GUEST = 'guest',
}

/**
 * 用户设置
 */
export interface UserSettings {
  /** 是否启用通知 */
  enableNotifications: boolean;
  /** 是否启用声音通知 */
  enableSoundNotifications: boolean;
  /** 主题偏好 */
  theme: 'light' | 'dark' | 'auto';
  /** 语言偏好 */
  language: string;
  /** 是否显示在线状态 */
  showOnlineStatus: boolean;
  /** 是否允许直接消息 */
  allowDirectMessages: boolean;
}

/**
 * 频道成员信息
 */
export interface ChannelMember {
  /** 用户ID */
  userId: string;
  /** 用户信息 */
  user: User;
  /** 频道ID */
  channelId: string;
  /** 成员角色 */
  role: ChannelMemberRole;
  /** 加入时间 */
  joinedAt: Date;
  /** 最后读取消息时间 */
  lastReadAt?: Date;
  /** 最后读取消息ID */
  lastReadMessageId?: string;
  /** 是否静音 */
  muted: boolean;
  /** 是否置顶 */
  pinned: boolean;
}

/**
 * 频道成员角色枚举
 */
export enum ChannelMemberRole {
  /** 频道所有者 */
  OWNER = 'owner',
  /** 频道管理员 */
  ADMIN = 'admin',
  /** 频道版主 */
  MODERATOR = 'moderator',
  /** 普通成员 */
  MEMBER = 'member',
}

/**
 * 聊天事件类型定义
 */
export interface ChatEvents {
  /** 频道创建事件 */
  'chat:channel-created': { channel: Channel };
  /** 频道更新事件 */
  'chat:channel-updated': { channel: Channel };
  /** 频道删除事件 */
  'chat:channel-deleted': { channelId: string };
  /** 消息发送事件 */
  'chat:message-sent': { message: Message };
  /** 消息接收事件 */
  'chat:message-received': { message: Message };
  /** 消息更新事件 */
  'chat:message-updated': { message: Message };
  /** 消息删除事件 */
  'chat:message-deleted': { messageId: string; channelId: string };
  /** 用户加入频道事件 */
  'chat:user-joined': { channelId: string; user: User };
  /** 用户离开频道事件 */
  'chat:user-left': { channelId: string; userId: string };
  /** 用户开始输入事件 */
  'chat:user-typing': { channelId: string; userId: string };
  /** 用户停止输入事件 */
  'chat:user-stop-typing': { channelId: string; userId: string };
  /** 用户状态变更事件 */
  'chat:user-status-changed': { userId: string; status: UserStatus };
  /** 消息反应添加事件 */
  'chat:reaction-added': { messageId: string; reaction: MessageReaction };
  /** 消息反应移除事件 */
  'chat:reaction-removed': { messageId: string; emoji: string; userId: string };
}

/**
 * 聊天API接口
 */
export interface ChatAPI {
  /** 获取频道列表 */
  getChannels(): Promise<Channel[]>;
  /** 创建频道 */
  createChannel(data: CreateChannelRequest): Promise<Channel>;
  /** 更新频道 */
  updateChannel(id: string, data: UpdateChannelRequest): Promise<Channel>;
  /** 删除频道 */
  deleteChannel(id: string): Promise<void>;
  /** 获取频道成员 */
  getChannelMembers(channelId: string): Promise<ChannelMember[]>;
  /** 加入频道 */
  joinChannel(channelId: string): Promise<void>;
  /** 离开频道 */
  leaveChannel(channelId: string): Promise<void>;
  /** 获取消息列表 */
  getMessages(channelId: string, params?: GetMessagesParams): Promise<Message[]>;
  /** 发送消息 */
  sendMessage(data: SendMessageRequest): Promise<Message>;
  /** 更新消息 */
  updateMessage(id: string, data: UpdateMessageRequest): Promise<Message>;
  /** 删除消息 */
  deleteMessage(id: string): Promise<void>;
  /** 添加消息反应 */
  addReaction(messageId: string, emoji: string): Promise<void>;
  /** 移除消息反应 */
  removeReaction(messageId: string, emoji: string): Promise<void>;
  /** 上传文件 */
  uploadFile(file: File): Promise<MessageAttachment>;
}

/**
 * 创建频道请求
 */
export interface CreateChannelRequest {
  /** 频道名称 */
  name: string;
  /** 频道描述 */
  description?: string;
  /** 频道类型 */
  type: ChannelType;
  /** 频道设置 */
  settings?: Partial<ChannelSettings>;
  /** 频道标签 */
  tags?: string[];
  /** 频道图标 */
  icon?: string;
}

/**
 * 更新频道请求
 */
export interface UpdateChannelRequest {
  /** 频道名称 */
  name?: string;
  /** 频道描述 */
  description?: string;
  /** 频道设置 */
  settings?: Partial<ChannelSettings>;
  /** 频道标签 */
  tags?: string[];
  /** 频道图标 */
  icon?: string;
}

/**
 * 获取消息参数
 */
export interface GetMessagesParams {
  /** 页码 */
  page?: number;
  /** 每页大小 */
  pageSize?: number;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 搜索关键词 */
  search?: string;
  /** 消息类型过滤 */
  types?: MessageType[];
  /** 发送者ID过滤 */
  authorIds?: string[];
}

/**
 * 发送消息请求
 */
export interface SendMessageRequest {
  /** 频道ID */
  channelId: string;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  type: MessageType;
  /** 附件列表 */
  attachments?: MessageAttachment[];
  /** 回复的消息ID */
  replyToId?: string;
  /** 提及的用户ID列表 */
  mentions?: string[];
  /** 消息标签 */
  tags?: string[];
  /** 消息元数据 */
  metadata?: Record<string, any>;
}

/**
 * 更新消息请求
 */
export interface UpdateMessageRequest {
  /** 消息内容 */
  content?: string;
  /** 附件列表 */
  attachments?: MessageAttachment[];
  /** 消息标签 */
  tags?: string[];
  /** 消息元数据 */
  metadata?: Record<string, any>;
}

/**
 * 输入状态信息
 */
export interface TypingInfo {
  /** 频道ID */
  channelId: string;
  /** 输入用户ID */
  userId: string;
  /** 开始输入时间 */
  startedAt: Date;
  /** 输入超时时间（毫秒） */
  timeout: number;
}