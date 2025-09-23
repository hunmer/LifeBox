# HTTP Router Registration System

This system allows you to dynamically register custom HTTP routes with middleware support and simplified callback format.

## Basic Usage

```typescript
import { httpRouter } from '@/http-router.js';

// Register routes with prefix, middleware, and route definitions
httpRouter.register('auth', middleware, [
  {url: 'login', method: 'POST', callback},
  {url: 'register', method: 'POST', callback},
]);
```

This will create:
- `POST /api/auth/login`
- `POST /api/auth/register`

## Route Definition Format

```typescript
interface RouteDefinition {
  url: string;           // Route path (e.g., 'login', 'users/:id')
  method: HttpMethod;    // HTTP method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
  callback: RouteCallback;
}
```

## Callback Format

Your callback function receives a simplified context object and returns a response object:

```typescript
type RouteCallback = (context: RouteContext) => RouteResponse | Promise<RouteResponse>;

interface RouteContext {
  query: Record<string, any>;     // URL query parameters
  params: Record<string, string>; // Route parameters (e.g., :id)
  data: any;                      // Request body (JSON)
  headers: Record<string, string>; // Request headers
  req: Request;                   // Full Express request object
  res: Response;                  // Full Express response object
}

interface RouteResponse {
  code?: number;                  // HTTP status code (default: 200)
  json?: any;                     // JSON response
  html?: string;                  // HTML response
  text?: string;                  // Plain text response
  redirect?: string;              // Redirect URL
  headers?: Record<string, string>; // Custom headers
}
```

## Examples

### Simple GET Route

```typescript
httpRouter.register('api', [], [
  {
    url: 'status',
    method: 'GET',
    callback: () => ({
      code: 200,
      json: { status: 'OK', timestamp: new Date().toISOString() }
    })
  }
]);
// Creates: GET /api/api/status
```

### POST Route with Data Processing

```typescript
httpRouter.register('users', [], [
  {
    url: 'create',
    method: 'POST',
    callback: ({ data }) => {
      const { name, email } = data;

      // Your business logic here
      const user = createUser(name, email);

      return {
        code: 201,
        json: {
          success: true,
          user: user
        }
      };
    }
  }
]);
// Creates: POST /api/users/create
```

### Route with Parameters

```typescript
httpRouter.register('users', [], [
  {
    url: ':id',
    method: 'GET',
    callback: ({ params }) => {
      const userId = params.id;

      return {
        code: 200,
        json: {
          user: { id: userId, name: 'User ' + userId }
        }
      };
    }
  }
]);
// Creates: GET /api/users/:id
```

### Using Middleware

```typescript
const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const loggingMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

httpRouter.register('protected', [authMiddleware, loggingMiddleware], [
  {
    url: 'data',
    method: 'GET',
    callback: () => ({
      code: 200,
      json: { data: 'Secret data' }
    })
  }
]);
// Creates: GET /api/protected/data (with middleware)
```

### Different Response Types

```typescript
httpRouter.register('content', [], [
  {
    url: 'json',
    method: 'GET',
    callback: () => ({
      code: 200,
      json: { message: 'JSON response' }
    })
  },
  {
    url: 'html',
    method: 'GET',
    callback: () => ({
      code: 200,
      html: '<h1>HTML Response</h1>'
    })
  },
  {
    url: 'text',
    method: 'GET',
    callback: () => ({
      code: 200,
      text: 'Plain text response'
    })
  },
  {
    url: 'redirect',
    method: 'GET',
    callback: () => ({
      code: 302,
      redirect: 'https://example.com'
    })
  }
]);
```

## Advanced Features

### Custom Headers

```typescript
httpRouter.register('api', [], [
  {
    url: 'custom',
    method: 'GET',
    callback: () => ({
      code: 200,
      headers: {
        'X-Custom-Header': 'custom-value',
        'Cache-Control': 'no-cache'
      },
      json: { message: 'Custom headers set' }
    })
  }
]);
```

### Async Callbacks

```typescript
httpRouter.register('async', [], [
  {
    url: 'data',
    method: 'GET',
    callback: async ({ query }) => {
      const data = await fetchDataFromDatabase(query.id);

      return {
        code: 200,
        json: { data }
      };
    }
  }
]);
```

### Error Handling

```typescript
httpRouter.register('api', [], [
  {
    url: 'might-fail',
    method: 'POST',
    callback: ({ data }) => {
      try {
        const result = processData(data);
        return {
          code: 200,
          json: { result }
        };
      } catch (error) {
        return {
          code: 500,
          json: {
            success: false,
            error: error.message
          }
        };
      }
    }
  }
]);
```

## Management Functions

### Check if Router Exists

```typescript
if (httpRouter.isRegistered('auth')) {
  console.log('Auth router already exists');
}
```

### Unregister Router

```typescript
httpRouter.unregister('auth');
```

### Get Registered Prefixes

```typescript
const prefixes = httpRouter.getRegisteredPrefixes();
console.log('Registered routers:', prefixes);
```

## Best Practices

1. **Prefix Organization**: Use meaningful prefixes that group related functionality
2. **Middleware Reuse**: Create reusable middleware functions for common operations
3. **Error Handling**: Always handle errors gracefully in your callbacks
4. **Validation**: Validate input data before processing
5. **Async Operations**: Use async/await for database or external API calls
6. **Type Safety**: Use TypeScript interfaces for your data structures

## Integration with Plugins

This system is designed to work with the plugin system. Plugins can register their own routes:

```typescript
// In a plugin
export class MyPlugin extends BasePlugin {
  onInit() {
    httpRouter.register('myplugin', [], [
      {
        url: 'action',
        method: 'POST',
        callback: this.handleAction.bind(this)
      }
    ]);
  }

  private handleAction({ data }) {
    // Plugin-specific logic
    return {
      code: 200,
      json: { result: 'Plugin action completed' }
    };
  }
}
```

This creates a clean, powerful HTTP routing system that allows for dynamic route registration with minimal boilerplate and maximum flexibility.