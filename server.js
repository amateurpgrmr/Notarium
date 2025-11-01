import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Root endpoint - CRITICAL for Railway health checks
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Notarium Backend API is Running!',
    status: 'healthy',
    service: 'notarium-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'notarium-backend',
    uptime: process.uptime()
  });
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'API healthy' });
});

app.get('/api/subjects', (req, res) => {
  res.json({
    subjects: ['Math', 'Science', 'History', 'English', 'CS']
  });
});

// Handle all routes - important for Railway
app.use('*', (req, res) => {
  res.json({
    message: 'Notarium Backend',
    availableEndpoints: ['/', '/health', '/api/health', '/api/subjects']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Notarium Backend running on port ${PORT}`);
});
