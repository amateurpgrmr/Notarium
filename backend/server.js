import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDatabase } from './database.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database (will fail gracefully in development)
initDatabase();

// Helper to check if database is available
function isDatabaseAvailable() {
  return process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('example.com');
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Notarium Backend API is running!',
    database: isDatabaseAvailable() ? 'Connected' : 'Not connected (expected)'
  });
});

// Get current user info
app.get('/api/user/me', async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.json({ user: null, message: 'Database not available in development' });
    }
    
    const userId = req.headers['x-encrypted-yw-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found' });
    }

    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE encrypted_yw_id = $1',
      [userId]
    );

    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      // Create new user
      const insertResult = await pool.query(
        'INSERT INTO users (encrypted_yw_id, role) VALUES ($1, $2) RETURNING *',
        [userId, 'student']
      );
      user = insertResult.rows[0];
    }

    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add other routes similarly...

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Database will be provided by Railway in production');
});
