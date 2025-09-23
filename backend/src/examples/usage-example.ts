import { httpRouter } from '@/http-router.js';

// Example usage as requested:
// httpRouter.register('auth', middleware, [
//   {url: 'login', method: 'POST', callback},
//   {url: 'register', method: 'POST', callback},
// ])
// This will create auth/login and auth/register endpoints

// Example middleware
const authMiddleware = (req: any, res: any, next: any) => {
  console.log(`[AUTH] ${req.method} ${req.path}`);
  next();
};

// Register auth routes as requested
httpRouter.register('auth', [authMiddleware], [
  {
    url: 'login',
    method: 'POST',
    callback: ({ data, headers }) => {
      // Your login logic here
      const { username, password } = data;

      if (username === 'admin' && password === 'password123') {
        return {
          code: 200,
          json: {
            success: true,
            token: 'jwt-token-here',
            user: { id: 1, username: 'admin' }
          }
        };
      }

      return {
        code: 401,
        json: {
          success: false,
          message: 'Invalid credentials'
        }
      };
    }
  },
  {
    url: 'register',
    method: 'POST',
    callback: ({ data }) => {
      // Your registration logic here
      const { username, email, password } = data;

      return {
        code: 201,
        json: {
          success: true,
          message: 'User registered successfully',
          user: { id: 2, username, email }
        }
      };
    }
  }
]);

console.log('✅ Auth routes registered: /api/auth/login and /api/auth/register');

// Another example with different routes
httpRouter.register('users', [], [
  {
    url: 'profile',
    method: 'GET',
    callback: ({ query, params }) => {
      return {
        code: 200,
        json: {
          profile: {
            id: params.id || 'current-user',
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      };
    }
  },
  {
    url: 'settings',
    method: 'PUT',
    callback: ({ data }) => {
      return {
        code: 200,
        json: {
          success: true,
          message: 'Settings updated',
          settings: data
        }
      };
    }
  }
]);

console.log('✅ User routes registered: /api/users/profile and /api/users/settings');