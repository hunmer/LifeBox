import { Router, Request, Response, NextFunction, Express } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import {
  RouteDefinition,
  RouteCallback,
  RouteContext,
  RouteResponse,
  MiddlewareFunction,
  HttpMethod
} from '@lifebox/shared';

export class HTTPRouterService {
  private app: Express;
  private registeredRouters: Map<string, Router> = new Map();

  constructor(app: Express) {
    this.app = app;
  }

  /**
   * Register a new router with prefix and routes
   * @param prefix - The route prefix (e.g., 'auth', 'users')
   * @param middleware - Optional middleware functions
   * @param routes - Array of route definitions
   */
  register(
    prefix: string,
    middleware: MiddlewareFunction[] = [],
    routes: RouteDefinition[]
  ): void {
    // Validate prefix
    if (!prefix || typeof prefix !== 'string') {
      throw new Error('Route prefix must be a non-empty string');
    }

    // Clean prefix (remove leading/trailing slashes)
    const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');

    if (this.registeredRouters.has(cleanPrefix)) {
      throw new Error(`Router with prefix "${cleanPrefix}" already exists`);
    }

    // Create new router
    const router = Router();

    // Apply middleware to router
    if (middleware.length > 0) {
      router.use(...middleware);
    }

    // Register routes
    routes.forEach(route => {
      this.registerRoute(router, route);
    });

    // Mount router to app
    this.app.use(`/api/${cleanPrefix}`, router);

    // Store reference
    this.registeredRouters.set(cleanPrefix, router);

    console.log(`✅ Registered HTTP router: /api/${cleanPrefix} with ${routes.length} routes`);
    console.log(`📋 Routes:`, routes.map(r => `${r.method} /api/${cleanPrefix}/${r.url.replace(/^\/+/, '')}`));
  }

  /**
   * Register a single route to a router
   */
  private registerRoute(router: Router, route: RouteDefinition): void {
    const { url, method, callback } = route;

    // Clean URL (remove leading slash)
    const cleanUrl = url.replace(/^\/+/, '');
    const routePath = cleanUrl ? `/${cleanUrl}` : '/';

    // Create Express handler
    const expressHandler = this.createExpressHandler(callback);

    // Register route based on HTTP method
    switch (method.toUpperCase() as HttpMethod) {
      case 'GET':
        router.get(routePath, expressHandler);
        break;
      case 'POST':
        router.post(routePath, expressHandler);
        break;
      case 'PUT':
        router.put(routePath, expressHandler);
        break;
      case 'DELETE':
        router.delete(routePath, expressHandler);
        break;
      case 'PATCH':
        router.patch(routePath, expressHandler);
        break;
      case 'OPTIONS':
        router.options(routePath, expressHandler);
        break;
      case 'HEAD':
        router.head(routePath, expressHandler);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    console.log(`  📍 Route registered: ${method.toUpperCase()} ${routePath}`);
  }

  /**
   * Create Express-compatible handler from simplified callback
   */
  private createExpressHandler(callback: RouteCallback) {
    return asyncHandler(async (req: Request, res: Response) => {
      // Prepare context object
      const context: RouteContext = {
        query: req.query,
        params: req.params,
        data: req.body,
        headers: req.headers as Record<string, string>,
        req,
        res
      };

      try {
        // Execute callback
        const result = await callback(context);

        // Handle response
        this.handleRouteResponse(res, result);
      } catch (error) {
        // Let the error handler middleware deal with it
        throw error;
      }
    });
  }

  /**
   * Handle route response based on returned data
   */
  private handleRouteResponse(res: Response, result: RouteResponse): void {
    // Set custom headers if provided
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Set status code
    const statusCode = result.code || 200;
    res.status(statusCode);

    // Handle different response types
    if (result.redirect) {
      res.redirect(result.redirect);
    } else if (result.json !== undefined) {
      res.json(result.json);
    } else if (result.html) {
      res.setHeader('Content-Type', 'text/html');
      res.send(result.html);
    } else if (result.text) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(result.text);
    } else {
      // Default empty response
      res.end();
    }
  }

  /**
   * Unregister a router by prefix
   */
  unregister(prefix: string): boolean {
    const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');

    if (this.registeredRouters.has(cleanPrefix)) {
      this.registeredRouters.delete(cleanPrefix);
      console.log(`🗑️ Unregistered HTTP router: /api/${cleanPrefix}`);
      return true;
    }

    return false;
  }

  /**
   * Get list of registered router prefixes
   */
  getRegisteredPrefixes(): string[] {
    return Array.from(this.registeredRouters.keys());
  }

  /**
   * Check if a router is registered
   */
  isRegistered(prefix: string): boolean {
    const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');
    return this.registeredRouters.has(cleanPrefix);
  }
}