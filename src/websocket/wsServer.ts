import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  socket: WebSocket;
  channels: string[];
  marketIds: string[];
  apiKey: string;
  connectedAt: Date;
}

class WebSocketServerManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  start(server: any): void {
    this.wss = new WebSocketServer({ server, path: '/v1/feed/live' });
    
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      const client: Client = {
        id: clientId,
        socket: ws,
        channels: [],
        marketIds: [],
        apiKey: '',
        connectedAt: new Date()
      };
      
      this.clients.set(clientId, client);
      
      console.log(`New WebSocket connection: ${clientId}`);
      
      // Handle incoming messages
      ws.on('message', (data) => {
        this.handleMessage(clientId, data.toString());
      });
      
      // Handle close
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`WebSocket connection closed: ${clientId}`);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });
    
    // Set up ping to keep connections alive
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000);
    
    // Clean up dead connections
    setInterval(() => {
      this.cleanupConnections();
    }, 60000);
    
    console.log('WebSocket server started');
  }

  private handleMessage(clientId: string, message: string): void {
    try {
      const data = JSON.parse(message);
      
      switch (data.action) {
        case 'subscribe':
          this.handleSubscribe(clientId, data);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, data);
          break;
        default:
          console.warn(`Unknown WebSocket action: ${data.action}`);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleSubscribe(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    if (data.channels) {
      client.channels = [...new Set([...client.channels, ...data.channels])];
    }
    
    if (data.market_ids) {
      client.marketIds = [...new Set([...client.marketIds, ...data.market_ids])];
    }
    
    if (data.api_key) {
      client.apiKey = data.api_key;
    }
    
    console.log(`Client ${clientId} subscribed to channels: ${client.channels.join(', ')}`);
    console.log(`Client ${clientId} subscribed to markets: ${client.marketIds.join(', ')}`);
  }

  private handleUnsubscribe(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    if (data.channels) {
      client.channels = client.channels.filter(channel => !data.channels.includes(channel));
    }
    
    if (data.market_ids) {
      client.marketIds = client.marketIds.filter(marketId => !data.market_ids.includes(marketId));
    }
    
    console.log(`Client ${clientId} unsubscribed from channels: ${data.channels?.join(', ')}`);
    console.log(`Client ${clientId} unsubscribed from markets: ${data.market_ids?.join(', ')}`);
  }

  private pingClients(): void {
    this.clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.ping();
      }
    });
  }

  private cleanupConnections(): void {
    const now = Date.now();
    
    this.clients.forEach((client, clientId) => {
      // Remove connections that haven't sent a message in 5 minutes
      if (now - client.connectedAt.getTime() > 5 * 60 * 1000) {
        client.socket.close();
        this.clients.delete(clientId);
        console.log(`Cleaned up inactive WebSocket connection: ${clientId}`);
      }
    });
  }

  publishProbabilityUpdate(market: any, prevProbability: number): void {
    const message = {
      type: 'probability_update',
      market_id: market.id,
      title: market.title,
      probability_prev: prevProbability,
      probability_new: market.probability_yes,
      change: market.probability_yes - prevProbability,
      timestamp: new Date().toISOString(),
      platform: market.source_platform
    };
    
    this.clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        const shouldSend = 
          (client.channels.includes(market.category) || client.marketIds.includes(market.id));
          
        if (shouldSend) {
          client.socket.send(JSON.stringify(message));
        }
      }
    });
  }

  getConnectionsCount(): number {
    return this.clients.size;
  }

  getClientStats(): any {
    const total = this.clients.size;
    const byPlatform: Record<string, number> = {};
    
    this.clients.forEach((client) => {
      client.channels.forEach((channel) => {
        byPlatform[channel] = (byPlatform[channel] || 0) + 1;
      });
    });
    
    return {
      total,
      channels: byPlatform,
      timestamp: new Date().toISOString()
    };
  }

  stop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.wss) {
      this.wss.close(() => {
        console.log('WebSocket server stopped');
      });
      this.wss = null;
    }
    
    this.clients.clear();
  }
}

export default new WebSocketServerManager();