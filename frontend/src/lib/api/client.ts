import type { HTTPClient, RequestConfig } from '@lifebox/shared';

/**
 * HTTPClient 实现
 * 提供插件系统使用的 HTTP 请求功能
 * 支持请求拦截、响应处理、错误处理等功能
 */
export class APIClient implements HTTPClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: any) => any | Promise<any>> = [];

  constructor(baseURL: string = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * 添加请求拦截器
   * @param interceptor 拦截器函数
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   * @param interceptor 拦截器函数
   */
  addResponseInterceptor(interceptor: (response: any) => any | Promise<any>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * GET 请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  async get(url: string, config?: RequestConfig): Promise<any> {
    return this.request('GET', url, undefined, config);
  }

  /**
   * POST 请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  async post(url: string, data?: any, config?: RequestConfig): Promise<any> {
    return this.request('POST', url, data, config);
  }

  /**
   * PUT 请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  async put(url: string, data?: any, config?: RequestConfig): Promise<any> {
    return this.request('PUT', url, data, config);
  }

  /**
   * DELETE 请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  async delete(url: string, config?: RequestConfig): Promise<any> {
    return this.request('DELETE', url, undefined, config);
  }

  /**
   * PATCH 请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  async patch(url: string, data?: any, config?: RequestConfig): Promise<any> {
    return this.request('PATCH', url, data, config);
  }

  /**
   * 通用请求方法
   * @private
   */
  private async request(method: string, url: string, data?: any, config?: RequestConfig): Promise<any> {
    try {
      // 处理 URL
      const fullURL = this.buildURL(url);

      // 构建请求配置
      let requestConfig: RequestConfig = {
        headers: { ...this.defaultHeaders, ...config?.headers },
        timeout: config?.timeout || 10000,
        responseType: config?.responseType || 'json',
        ...config
      };

      // 应用请求拦截器
      for (const interceptor of this.requestInterceptors) {
        requestConfig = await interceptor(requestConfig);
      }

      // 构建 fetch 请求选项
      const fetchOptions: RequestInit = {
        method,
        headers: requestConfig.headers,
        signal: this.createAbortSignal(requestConfig.timeout),
      };

      // 添加请求体（对于 POST、PUT、PATCH 请求）
      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (requestConfig.headers?.['Content-Type'] === 'application/json') {
          fetchOptions.body = JSON.stringify(data);
        } else {
          fetchOptions.body = data;
        }
      }

      // 发送请求
      const response = await fetch(fullURL, fetchOptions);

      // 检查响应状态
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          fullURL
        );
      }

      // 处理响应数据
      let responseData: any;
      const responseType = requestConfig.responseType || 'json';

      switch (responseType) {
        case 'json':
          responseData = await response.json();
          break;
        case 'text':
          responseData = await response.text();
          break;
        case 'blob':
          responseData = await response.blob();
          break;
        case 'arraybuffer':
          responseData = await response.arrayBuffer();
          break;
        default:
          responseData = await response.json();
      }

      // 应用响应拦截器
      for (const interceptor of this.responseInterceptors) {
        responseData = await interceptor(responseData);
      }

      return responseData;

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // 处理网络错误、超时等
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'Request Timeout', url);
        }
        
        throw new APIError(
          `Network error: ${error.message}`,
          0,
          'Network Error',
          url
        );
      }

      throw new APIError('Unknown error occurred', 500, 'Internal Server Error', url);
    }
  }

  /**
   * 构建完整的 URL
   * @private
   */
  private buildURL(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${this.baseURL}${url}`;
    }

    return `${this.baseURL}/${url}`;
  }

  /**
   * 创建超时信号
   * @private
   */
  private createAbortSignal(timeout?: number): AbortSignal | undefined {
    if (!timeout) {
      return undefined;
    }

    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  /**
   * 设置默认请求头
   * @param headers 请求头对象
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * 设置基础 URL
   * @param baseURL 基础 URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * 获取基础 URL
   * @returns 基础 URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

/**
 * API 错误类
 */
export class APIError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly url: string;

  constructor(message: string, status: number, statusText: string, url: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

/**
 * 创建默认的 API 客户端实例
 */
export const defaultAPIClient = new APIClient();