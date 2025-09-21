/**
 * LifeBox API 接口类型定义
 * 
 * 定义了前后端API通信的类型接口，包括请求响应结构、
 * 状态码、错误处理等，确保类型安全的API调用。
 */

/**
 * API响应基础结构
 */
export interface ApiResponse<T = any> {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data?: T;
  /** 响应时间戳 */
  timestamp: number;
  /** 请求追踪ID */
  traceId?: string;
}

/**
 * API错误响应结构
 */
export interface ApiErrorResponse {
  /** 错误码 */
  code: number;
  /** 错误消息 */
  message: string;
  /** 详细错误信息 */
  details?: string;
  /** 错误堆栈（仅开发环境） */
  stack?: string;
  /** 错误字段（表单验证错误） */
  fields?: Record<string, string[]>;
  /** 响应时间戳 */
  timestamp: number;
  /** 请求追踪ID */
  traceId?: string;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 页码（从1开始） */
  page?: number;
  /** 每页大小 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  items: T[];
  /** 总数据量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * API状态码枚举
 */
export enum ApiStatusCode {
  /** 成功 */
  SUCCESS = 200,
  /** 创建成功 */
  CREATED = 201,
  /** 无内容 */
  NO_CONTENT = 204,
  /** 请求错误 */
  BAD_REQUEST = 400,
  /** 未授权 */
  UNAUTHORIZED = 401,
  /** 禁止访问 */
  FORBIDDEN = 403,
  /** 未找到 */
  NOT_FOUND = 404,
  /** 方法不允许 */
  METHOD_NOT_ALLOWED = 405,
  /** 冲突 */
  CONFLICT = 409,
  /** 请求实体过大 */
  PAYLOAD_TOO_LARGE = 413,
  /** 请求频率过高 */
  TOO_MANY_REQUESTS = 429,
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR = 500,
  /** 服务不可用 */
  SERVICE_UNAVAILABLE = 503,
}

/**
 * HTTP方法枚举
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * API请求配置
 */
export interface ApiRequestConfig {
  /** 请求URL */
  url: string;
  /** HTTP方法 */
  method: HttpMethod;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求参数（用于GET请求） */
  params?: Record<string, any>;
  /** 请求体数据 */
  data?: any;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否包含凭证 */
  withCredentials?: boolean;
  /** 响应类型 */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

/**
 * API客户端接口
 */
export interface ApiClient {
  /** GET请求 */
  get<T = any>(url: string, params?: Record<string, any>, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  
  /** POST请求 */
  post<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  
  /** PUT请求 */
  put<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  
  /** DELETE请求 */
  delete<T = any>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  
  /** PATCH请求 */
  patch<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  
  /** 上传文件 */
  upload<T = any>(url: string, file: File | FormData, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  
  /** 下载文件 */
  download(url: string, config?: Partial<ApiRequestConfig>): Promise<Blob>;
}

/**
 * API拦截器接口
 */
export interface ApiInterceptor {
  /** 请求拦截器 */
  request?: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>;
  
  /** 响应拦截器 */
  response?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  
  /** 错误拦截器 */
  error?: (error: ApiErrorResponse) => ApiErrorResponse | Promise<ApiErrorResponse>;
}

/**
 * API重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 重试延迟倍数 */
  retryDelayMultiplier: number;
  /** 可重试的状态码 */
  retryableStatusCodes: number[];
  /** 重试条件函数 */
  shouldRetry?: (error: ApiErrorResponse, retryCount: number) => boolean;
}

/**
 * API缓存配置
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存TTL（秒） */
  ttl: number;
  /** 缓存键生成函数 */
  keyGenerator?: (config: ApiRequestConfig) => string;
  /** 缓存存储适配器 */
  storage?: CacheStorage;
}

/**
 * 缓存存储接口
 */
export interface CacheStorage {
  /** 获取缓存值 */
  get(key: string): Promise<any>;
  /** 设置缓存值 */
  set(key: string, value: any, ttl?: number): Promise<void>;
  /** 删除缓存值 */
  delete(key: string): Promise<void>;
  /** 清空缓存 */
  clear(): Promise<void>;
  /** 检查键是否存在 */
  has(key: string): Promise<boolean>;
}

/**
 * API监控指标
 */
export interface ApiMetrics {
  /** 请求总数 */
  totalRequests: number;
  /** 成功请求数 */
  successRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 最慢响应时间 */
  slowestResponseTime: number;
  /** 最快响应时间 */
  fastestResponseTime: number;
  /** 状态码统计 */
  statusCodeCounts: Record<number, number>;
  /** 错误统计 */
  errorCounts: Record<string, number>;
}

/**
 * WebSocket消息类型
 */
export interface WebSocketMessage<T = any> {
  /** 消息类型 */
  type: string;
  /** 消息ID */
  id?: string;
  /** 消息数据 */
  payload: T;
  /** 时间戳 */
  timestamp: number;
}

/**
 * WebSocket连接状态
 */
export enum WebSocketStatus {
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 已断开 */
  DISCONNECTED = 'disconnected',
  /** 重连中 */
  RECONNECTING = 'reconnecting',
  /** 连接错误 */
  ERROR = 'error',
}

/**
 * WebSocket配置
 */
export interface WebSocketConfig {
  /** WebSocket URL */
  url: string;
  /** 协议 */
  protocols?: string | string[];
  /** 自动重连 */
  autoReconnect?: boolean;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 心跳消息 */
  heartbeatMessage?: any;
}