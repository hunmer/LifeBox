import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import { getDatabase } from '@/database/connection.js';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const db = getDatabase();
  
  // Check database connection
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'LifeBox backend is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      version: '1.0.0',
    });
  }
}));

export default router;