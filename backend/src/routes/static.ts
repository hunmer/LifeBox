import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static file serving for plugins
const publicPath = path.join(__dirname, '..', '..', 'public');

router.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    // Set CORS headers for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Set appropriate Content-Type for JSON files
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }

    // Set caching headers
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

export default router;