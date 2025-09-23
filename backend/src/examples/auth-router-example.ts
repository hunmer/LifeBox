import { httpRouter } from '@/http-router.js';
import { RouteDefinition, MiddlewareFunction, RouteContext } from '@lifebox/shared';
import { Request, Response, NextFunction } from 'express';

// Example middleware for authentication
const authMiddleware: MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => {
  // Simple auth check (in real app, verify JWT token)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authorization header required' }
    });
  }

  // Add user info to request (mock)
  (req as any).user = { id: '123', username: 'testuser' };
  next();
};

// Example middleware for logging
const loggingMiddleware: MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[AUTH] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

// Define auth routes
const authRoutes: RouteDefinition[] = [
  {
    url: 'login',
    method: 'POST',
    callback: async ({ data, headers }: RouteContext) => {
      const { username, password } = data;

      // Simple validation
      if (!username || !password) {
        return {
          code: 400,
          json: {
            success: false,
            error: { message: 'Username and password are required' }
          }
        };
      }

      // Mock authentication
      if (username === 'admin' && password === 'password') {
        return {
          code: 200,
          json: {
            success: true,
            data: {
              user: { id: '123', username: 'admin' },
              token: 'mock-jwt-token'
            },
            message: 'Login successful'
          }
        };
      }

      return {
        code: 401,
        json: {
          success: false,
          error: { message: 'Invalid credentials' }
        }
      };
    }
  },
  {
    url: 'register',
    method: 'POST',
    callback: async ({ data }: RouteContext) => {
      const { username, password, email } = data;

      // Validation
      if (!username || !password || !email) {
        return {
          code: 400,
          json: {
            success: false,
            error: { message: 'Username, password, and email are required' }
          }
        };
      }

      // Mock registration
      return {
        code: 201,
        json: {
          success: true,
          data: {
            user: { id: '124', username, email },
            message: 'User registered successfully'
          }
        }
      };
    }
  },
  {
    url: 'profile',
    method: 'GET',
    callback: async ({ req }: RouteContext) => {
      // This route will use auth middleware, so user should be available
      const user = (req as any).user;

      return {
        code: 200,
        json: {
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              lastLogin: new Date().toISOString()
            }
          }
        }
      };
    }
  },
  {
    url: 'logout',
    method: 'POST',
    callback: async () => {
      return {
        code: 200,
        json: {
          success: true,
          message: 'Logout successful'
        }
      };
    }
  }
];

// Register the auth router
export function registerAuthRouter() {
  try {
    // Check if already registered to avoid duplicates
    if (!httpRouter.isRegistered('auth')) {
      httpRouter.register('auth', [loggingMiddleware, authMiddleware], authRoutes);
      console.log('✅ Auth router registered successfully');
    } else {
      console.log('ℹ️ Auth router already registered, skipping...');
    }
  } catch (error) {
    console.error('❌ Failed to register auth router:', error);
  }
}

// Function to demonstrate registration
if (import.meta.url === `file://${process.argv[1]}`) {
  registerAuthRouter();
}