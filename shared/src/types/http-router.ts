import { Request, Response, NextFunction } from 'express';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface RouteContext {
  query: Record<string, any>;
  params: Record<string, string>;
  data: any;
  headers: Record<string, string>;
  req: Request;
  res: Response;
}

export interface RouteResponse {
  code?: number;
  json?: any;
  html?: string;
  text?: string;
  redirect?: string;
  headers?: Record<string, string>;
}

export type RouteCallback = (context: RouteContext) => RouteResponse | Promise<RouteResponse>;

export interface RouteDefinition {
  url: string;
  method: HttpMethod;
  callback: RouteCallback;
}

export interface MiddlewareFunction {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

export interface RouterRegistration {
  prefix: string;
  middleware?: MiddlewareFunction[];
  routes: RouteDefinition[];
}