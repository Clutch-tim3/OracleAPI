import http from 'http';
import { app, scheduleSyncJobs, runInitialSync } from './app';
import wsServer from './websocket/wsServer';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

async function startServer() {
  try {
    console.log('Starting OracleIQ API server...');
    
    // Initialize WebSocket server
    if (process.env.ENABLE_WEBSOCKET !== 'false') {
      wsServer.start(server);
    }
    
    // Run initial sync before accepting traffic
    console.log('Running initial market sync...');
    await runInitialSync();
    
    // Schedule recurring sync jobs
    scheduleSyncJobs();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`OracleIQ API server running on port ${PORT}`);
      console.log('Available endpoints:');
      console.log('- GET /v1/markets');
      console.log('- GET /v1/markets/:id');
      console.log('- POST /v1/markets/:id/analyse');
      console.log('- GET /v1/markets/trending');
      console.log('- GET /v1/markets/consensus');
      console.log('- GET /v1/markets/search/semantic');
      console.log('- POST /v1/portfolio/simulate');
      console.log('- POST /v1/alerts/register');
      console.log('- GET /embed/:marketId');
      console.log('- GET /v1/health');
      
      if (process.env.ENABLE_WEBSOCKET !== 'false') {
        console.log('- WebSocket /v1/feed/live');
      }
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    wsServer.stop();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    wsServer.stop();
    process.exit(0);
  });
});

// Start the server
startServer();