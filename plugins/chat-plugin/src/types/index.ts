// 插件基础类型定义
export interface PluginAPI {
  http: {
    get: (url: string, options?: RequestInit) => Promise<Response>;
    post: (url: string, data?: any, options?: RequestInit) => Promise<Response>;
    put: (url: string, data?: any, options?: RequestInit) => Promise<Response>;
    delete: (url: string, options?: RequestInit) => Promise<Response>;
  };
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, data?: any) => void;
  };
  ui: {
    showNotification: (message: string, type?: NotificationType) => void;
    showDialog: (options: DialogOptions) => Promise<any>;
    createContainer: (id: string) => HTMLElement;
    removeContainer: (id?: string) => void;
  };
  logger: {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  entryPoint: string;
  icon?: string;
  homepage?: string;
  repository?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface DialogOptions {
  title: string;
  content: string;
  buttons: DialogButton[];
}

export interface DialogButton {
  text: string;
  type: 'primary' | 'secondary' | 'danger';
  onClick?: () => boolean | void;
}

// 聊天相关类型定义
export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  author: ChatUser;
  content: string;
  messageType: 'text' | 'file' | 'image';
  timestamp: string;
  attachment?: FileAttachment;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface ChatConfig {
  serverUrl: string;
  maxMessages: number;
  enableNotifications: boolean;
  enableSound: boolean;
  theme: 'light' | 'dark' | 'auto';
  autoJoinChannels: string[];
}

// 组件属性类型
export interface ChatContainerProps {
  plugin: ChatPlugin;
}

export interface ChannelListProps {
  channels: Map<string, ChatChannel>;
  currentChannel: ChatChannel | null;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
}

export interface MessageAreaProps {
  messages: ChatMessage[];
  currentChannel: ChatChannel | null;
  isLoading: boolean;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onFileUpload: () => void;
  disabled: boolean;
  currentChannel: ChatChannel | null;
}

export interface UserListProps {
  users: ChatUser[];
  currentUser: ChatUser | null;
}

// 前向声明 ChatPlugin 类
export declare class ChatPlugin {
  constructor(api: PluginAPI, manifest: PluginManifest);
}