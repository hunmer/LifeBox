/**
 * LifeBox 共享常量定义
 * 
 * 定义了应用中使用的常量值，包括配置默认值、
 * 限制参数、API端点等，确保前后端使用一致的常量。
 */

/**
 * 应用配置常量
 */
export const APP_CONFIG = {
  /** 应用名称 */
  NAME: 'LifeBox',
  /** 应用版本 */
  VERSION: '1.0.0',
  /** 应用描述 */
  DESCRIPTION: '全能纪录应用',
  /** 应用主页 */
  HOMEPAGE: 'https://lifebox.app',
} as const;

/**
 * API配置常量
 */
export const API_CONFIG = {
  /** 默认API基础URL */
  BASE_URL: 'http://localhost:3001/api',
  /** API版本 */
  VERSION: 'v1',
  /** 请求超时时间（毫秒） */
  TIMEOUT: 10000,
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 重试延迟（毫秒） */
  RETRY_DELAY: 1000,
} as const;

/**
 * WebSocket配置常量
 */
export const WEBSOCKET_CONFIG = {
  /** 默认WebSocket URL */
  URL: 'ws://localhost:3001',
  /** 心跳间隔（毫秒） */
  HEARTBEAT_INTERVAL: 30000,
  /** 重连间隔（毫秒） */
  RECONNECT_INTERVAL: 5000,
  /** 最大重连次数 */
  MAX_RECONNECT_ATTEMPTS: 10,
  /** 连接超时时间（毫秒） */
  CONNECTION_TIMEOUT: 10000,
} as const;

/**
 * 插件系统常量
 */
export const PLUGIN_CONFIG = {
  /** 插件目录路径 */
  PLUGINS_DIR: '/plugins',
  /** 插件清单文件名 */
  MANIFEST_FILE: 'manifest.json',
  /** 插件入口文件名 */
  ENTRY_FILE: 'plugin.js',
  /** 插件样式文件名 */
  STYLE_FILE: 'styles.css',
  /** 最大插件数量 */
  MAX_PLUGINS: 100,
  /** 插件加载超时时间（毫秒） */
  LOAD_TIMEOUT: 30000,
} as const;

/**
 * 事件系统常量
 */
export const EVENT_CONFIG = {
  /** 最大监听器数量 */
  MAX_LISTENERS: 1000,
  /** 事件历史记录最大数量 */
  MAX_HISTORY_SIZE: 10000,
  /** 事件超时时间（毫秒） */
  EVENT_TIMEOUT: 5000,
  /** 事件ID前缀 */
  EVENT_ID_PREFIX: 'event_',
} as const;

/**
 * 聊天功能常量
 */
export const CHAT_CONFIG = {
  /** 最大频道数量 */
  MAX_CHANNELS: 1000,
  /** 最大频道成员数量 */
  MAX_CHANNEL_MEMBERS: 10000,
  /** 最大消息长度 */
  MAX_MESSAGE_LENGTH: 4000,
  /** 消息分页默认大小 */
  DEFAULT_PAGE_SIZE: 50,
  /** 消息分页最大大小 */
  MAX_PAGE_SIZE: 200,
  /** 输入状态超时时间（毫秒） */
  TYPING_TIMEOUT: 3000,
  /** 最大附件大小（字节） */
  MAX_ATTACHMENT_SIZE: 100 * 1024 * 1024, // 100MB
  /** 支持的图片格式 */
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  /** 支持的文档格式 */
  SUPPORTED_DOCUMENT_FORMATS: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'],
  /** 支持的音频格式 */
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'ogg', 'aac', 'm4a'],
  /** 支持的视频格式 */
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
} as const;

/**
 * 文件上传常量
 */
export const UPLOAD_CONFIG = {
  /** 最大文件大小（字节） */
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  /** 分块上传块大小（字节） */
  CHUNK_SIZE: 1024 * 1024, // 1MB
  /** 并发上传数量 */
  CONCURRENT_UPLOADS: 3,
  /** 上传超时时间（毫秒） */
  UPLOAD_TIMEOUT: 300000, // 5分钟
  /** 支持的文件类型 */
  SUPPORTED_TYPES: [
    ...CHAT_CONFIG.SUPPORTED_IMAGE_FORMATS,
    ...CHAT_CONFIG.SUPPORTED_DOCUMENT_FORMATS,
    ...CHAT_CONFIG.SUPPORTED_AUDIO_FORMATS,
    ...CHAT_CONFIG.SUPPORTED_VIDEO_FORMATS,
  ],
} as const;

/**
 * 缓存配置常量
 */
export const CACHE_CONFIG = {
  /** 默认TTL（秒） */
  DEFAULT_TTL: 3600, // 1小时
  /** 最大缓存条目数 */
  MAX_ENTRIES: 10000,
  /** 缓存键前缀 */
  KEY_PREFIX: 'lifebox_',
  /** 缓存版本 */
  VERSION: '1.0',
} as const;

/**
 * 数据库配置常量
 */
export const DATABASE_CONFIG = {
  /** 连接池最大连接数 */
  MAX_CONNECTIONS: 20,
  /** 连接超时时间（毫秒） */
  CONNECTION_TIMEOUT: 30000,
  /** 查询超时时间（毫秒） */
  QUERY_TIMEOUT: 30000,
  /** 事务超时时间（毫秒） */
  TRANSACTION_TIMEOUT: 60000,
} as const;

/**
 * 日志配置常量
 */
export const LOG_CONFIG = {
  /** 日志级别 */
  LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },
  /** 默认日志级别 */
  DEFAULT_LEVEL: 'INFO',
  /** 日志文件最大大小（字节） */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  /** 日志文件保留数量 */
  MAX_FILES: 10,
} as const;

/**
 * 安全配置常量
 */
export const SECURITY_CONFIG = {
  /** JWT密钥长度 */
  JWT_SECRET_LENGTH: 64,
  /** JWT过期时间（秒） */
  JWT_EXPIRES_IN: 86400, // 24小时
  /** 密码最小长度 */
  MIN_PASSWORD_LENGTH: 8,
  /** 密码最大长度 */
  MAX_PASSWORD_LENGTH: 128,
  /** 登录失败最大次数 */
  MAX_LOGIN_ATTEMPTS: 5,
  /** 账户锁定时间（秒） */
  ACCOUNT_LOCKOUT_TIME: 1800, // 30分钟
} as const;

/**
 * 性能配置常量
 */
export const PERFORMANCE_CONFIG = {
  /** 请求节流间隔（毫秒） */
  THROTTLE_INTERVAL: 100,
  /** 防抖延迟（毫秒） */
  DEBOUNCE_DELAY: 300,
  /** 虚拟滚动项目高度 */
  VIRTUAL_ITEM_HEIGHT: 60,
  /** 虚拟滚动缓冲区大小 */
  VIRTUAL_BUFFER_SIZE: 10,
} as const;

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  /** 通用错误 */
  GENERAL: {
    UNKNOWN: 'UNKNOWN_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RATE_LIMITED: 'RATE_LIMITED',
  },
  /** 插件错误 */
  PLUGIN: {
    LOAD_FAILED: 'PLUGIN_LOAD_FAILED',
    INVALID_MANIFEST: 'INVALID_MANIFEST',
    PERMISSION_DENIED: 'PLUGIN_PERMISSION_DENIED',
    NOT_FOUND: 'PLUGIN_NOT_FOUND',
  },
  /** 聊天错误 */
  CHAT: {
    CHANNEL_NOT_FOUND: 'CHANNEL_NOT_FOUND',
    MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
    ATTACHMENT_TOO_LARGE: 'ATTACHMENT_TOO_LARGE',
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  },
  /** 文件错误 */
  FILE: {
    TOO_LARGE: 'FILE_TOO_LARGE',
    UNSUPPORTED_TYPE: 'UNSUPPORTED_FILE_TYPE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    NOT_FOUND: 'FILE_NOT_FOUND',
  },
} as const;

/**
 * 正则表达式常量
 */
export const REGEX_PATTERNS = {
  /** 邮箱格式 */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** 用户名格式（3-20位字母数字下划线） */
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  /** 频道名称格式（2-50位字符，不包含特殊字符） */
  CHANNEL_NAME: /^[a-zA-Z0-9\u4e00-\u9fa5\s_-]{2,50}$/,
  /** URL格式 */
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  /** 颜色格式（HEX） */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

/**
 * 时间相关常量（毫秒）
 */
export const TIME_CONSTANTS = {
  /** 秒 */
  SECOND: 1000,
  /** 分钟 */
  MINUTE: 60 * 1000,
  /** 小时 */
  HOUR: 60 * 60 * 1000,
  /** 天 */
  DAY: 24 * 60 * 60 * 1000,
  /** 周 */
  WEEK: 7 * 24 * 60 * 60 * 1000,
  /** 月（30天） */
  MONTH: 30 * 24 * 60 * 60 * 1000,
  /** 年（365天） */
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;