import { HTTPRouterService } from '@/services/http-router.service.js';
import { app } from '@/app.js';

// Export the global HTTP router instance
export const httpRouter: HTTPRouterService = (app as any).httpRouter;

// Export convenience function for easy access
export function getHTTPRouter(): HTTPRouterService {
  return httpRouter;
}

// Export types for external use
export * from '@lifebox/shared';