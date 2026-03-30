## ⚡ Get your first result in 60 seconds

```bash
# 1. Get your free API key at rapidapi.com/oracleiq
# 2. Run this:

curl "https://oracleiq.p.rapidapi.com/v1/markets/trending?window=24h&limit=3" \
  -H "X-RapidAPI-Key: YOUR_KEY_HERE"
```

You'll get back the 3 most actively traded prediction markets
right now, with current probabilities and 24h volume.

**Next:** Call `/v1/markets/:id/analyse` on any market ID from
that response to get a full AI analysis of what the market
probability means.

→ [Full API Reference](#endpoints)
→ [JavaScript SDK](#javascript)
→ [Python SDK](#python)
→ [Error Reference](#errors)

## Hello World Flow: 4 Steps to First Insight

### Step 1: Browse Economics Markets
Get the most active prediction markets in the economics category:

```bash
curl "https://oracleiq.p.rapidapi.com/v1/markets?category=economics&limit=3" \
  -H "X-RapidAPI-Key: YOUR_KEY_HERE"
```

**Response snippet:**
```json
{
  "success": true,
  "data": [
    {
      "id": "market_demo_inflation_2026",
      "title": "Will US CPI inflation fall below 3% in 2026?",
      "probability": 0.41,
      "volume_24h": 156000
    }
  ],
  "meta": {
    "code_examples": { ... },
    "demo_markets_available": true
  }
}
```

**Next step:** Take the `id` field from any market.

### Step 2: Get a Market Details
Get detailed information about a specific market:

```bash
curl "https://oracleiq.p.rapidapi.com/v1/markets/market_demo_inflation_2026" \
  -H "X-RapidAPI-Key: YOUR_KEY_HERE"
```

**Response includes:** Market structure, outcomes, historical data, AI summary, and confidence intervals.

### Step 3: Run AI Analysis
Get a deep analysis of what the market probability means:

```bash
curl "https://oracleiq.p.rapidapi.com/v1/markets/market_demo_inflation_2026/analyse" \
  -H "X-RapidAPI-Key: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"analysis_depth": "standard"}'
```

**Response includes:** Key drivers, historical context, expert opinions, and risk factors.

### Step 4: Set an Alert
Get notified when the market probability crosses a threshold:

```bash
curl "https://oracleiq.p.rapidapi.com/v1/alerts/register" \
  -H "X-RapidAPI-Key: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "market_id": "market_demo_inflation_2026",
    "threshold": 0.70,
    "direction": "above",
    "webhook_url": "https://your-app.com/webhooks/oracleiq"
  }'
```

---

# OracleIQ — World Prediction Markets Intelligence API

The world's most powerful collective intelligence API built on prediction market data. Real-time event probabilities from Kalshi, Polymarket & more. AI market analysis, trending events, consensus views, portfolio simulation, and embeddable widgets.

## Features

- **Real-time Market Data**: Live odds from Kalshi, Polymarket, Metaculus, and Manifold
- **AI Analysis**: Deep market analysis with natural language understanding
- **Trending Markets**: Identify fast-moving markets with significant price changes
- **Consensus Views**: Aggregated market intelligence on any topic
- **Portfolio Simulation**: Test hypothetical prediction market strategies
- **Embeddable Widgets**: Easy-to-integrate market widgets for any website
- **WebSocket Stream**: Real-time updates for live dashboards
- **Semantic Search**: Natural language search for relevant markets

## Getting Started

### Prerequisites

- Node.js 20 LTS or later
- PostgreSQL 16
- Redis 7
- Docker (for containerized deployment)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/oracleiq/oracleiq-api.git
   cd oracleiq-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Start the server**:
   ```bash
   npm run dev
   ```

### Docker Deployment

```bash
# Build and start containers
docker-compose up --build

# Run migrations
docker-compose run api npm run prisma:migrate
```

## API Documentation

### Base URL
`https://api.oracleiq.dev/v1`

### Authentication

All API endpoints require an `X-RapidAPI-Key` header.

```bash
curl -H "X-RapidAPI-Key: your-api-key" "https://api.oracleiq.dev/v1/markets"
```

### Rate Limits

| Tier        | Requests/Month | Requests/Second | Price    |
|------------|----------------|-----------------|----------|
| FREE       | 100            | 2               | $0       |
| BASIC      | 2,000          | 5               | $29/mo   |
| PRO        | 15,000         | 20              | $79/mo   |
| ENTERPRISE | 150,000        | 100             | $199/mo  |

### Example Usage

#### Get Trending Markets

```javascript
const fetch = require('node-fetch');

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
};

fetch('https://api.oracleiq.dev/v1/markets/trending', options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

#### Analyze a Market

```python
import requests

url = "https://api.oracleiq.dev/v1/markets/clx9k2/analyse"
headers = {
    "X-RapidAPI-Key": "your-api-key",
    "Content-Type": "application/json"
}
data = {
    "analysis_depth": "standard",
    "perspective": "neutral",
    "audience": "general",
    "include_historical_context": true,
    "include_price_drivers": true,
    "include_scenarios": true
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

#### Portfolio Simulation

```bash
curl -X POST "https://api.oracleiq.dev/v1/portfolio/simulate" \
  -H "X-RapidAPI-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "positions": [
      {
        "market_id": "clx9k2",
        "side": "yes",
        "entry_probability": 0.58,
        "stake": 100,
        "entry_date": "2026-02-01"
      }
    ],
    "cash_balance": 500,
    "include_pnl": true,
    "include_expected_value": true
  }'
```

## API Endpoints

### Markets

- `GET /v1/markets` - List all markets with filters
- `GET /v1/markets/:id` - Get market details
- `POST /v1/markets/:id/analyse` - Analyze a market
- `GET /v1/markets/trending` - Get trending markets
- `GET /v1/markets/consensus` - Get consensus view on a topic
- `GET /v1/markets/search/semantic` - Semantic search
- `GET /v1/markets/compare` - Compare two markets
- `GET /v1/markets/resolved` - Get resolved markets

### Portfolio

- `POST /v1/portfolio/simulate` - Simulate a prediction market portfolio

### Alerts

- `POST /v1/alerts/register` - Register an alert (PRO+)
- `GET /v1/alerts` - Get alerts (PRO+)
- `PUT /v1/alerts/:id` - Update an alert (PRO+)
- `DELETE /v1/alerts/:id` - Delete an alert (PRO+)

### Widgets

- `GET /embed/:marketId` - Embeddable widget

### Health

- `GET /v1/health` - Health check
- `GET /v1/health/status` - System status

## WebSocket: GET /v1/feed/live (PRO+)

### Connection
```javascript
const ws = new WebSocket(
  'wss://oracleiq.p.rapidapi.com/v1/feed/live?categories=economics,crypto',
  { headers: { 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY } }
);
```

### Message Shape
Every message from the server is JSON with this structure:
```json
{
  "type": "probability_update",
  "market_id": "market_fed_rate_2026",
  "previous_probability": 0.61,
  "current_probability": 0.67,
  "volume_24h": 1234560,
  "timestamp": "2026-04-01T14:22:07.341Z"
}
```

Message types: probability_update | market_resolved |
                new_market | volume_spike | connection_ack

### Reconnection (REQUIRED — implement this)
```javascript
class OracleIQFeed {
  constructor(apiKey, categories) {
    this.apiKey = apiKey;
    this.categories = categories;
    this.reconnectDelay = 1000;
    this.maxDelay = 30000;
  }
  
  connect() {
    this.ws = new WebSocket(
      `wss://oracleiq.p.rapidapi.com/v1/feed/live?categories=${this.categories}`,
      { headers: { 'X-RapidAPI-Key': this.apiKey } }
    );
    
    this.ws.on('open', () => {
      this.reconnectDelay = 1000; // reset on success
      console.log('Connected to OracleIQ live feed');
    });
    
    this.ws.on('close', (code) => {
      if (code !== 1000) { // 1000 = intentional close
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
      }
    });
    
    this.ws.on('message', (data) => {
      const event = JSON.parse(data);
      this.onEvent(event);
    });
  }
  
  onEvent(event) { /* override this */ }
}
```

### Heartbeat
The server sends a ping frame every 30 seconds.
Your WebSocket client must respond with a pong frame.
If no pong is received within 10 seconds, the server closes
the connection with code 1001. Your reconnect logic handles this.

### Rate Limits on WebSocket
- Max 5 concurrent WebSocket connections per API key
- Max 10 category subscriptions per connection
- Messages are throttled to max 100/second per connection

## Data Sources

- **Kalshi** - CFTC-regulated prediction markets
- **Polymarket** - Largest prediction market platform
- **Metaculus** - Community and AI forecasts
- **Manifold Markets** - Play-money but real signals

## Performance & SLAs

| Endpoint                        | p50  | p95   | p99   |
|---------------------------------|------|-------|-------|
| GET /v1/markets                 | 35ms | 80ms  | 150ms |
| GET /v1/markets/:id             | 20ms | 50ms  | 100ms |
| POST /v1/markets/:id/analyse    | 2.1s | 4.5s  | 8s    |
| GET /v1/markets/trending        | 25ms | 60ms  | 120ms |
| GET /v1/markets/consensus       | 800ms| 2.5s  | 5s    |
| GET /v1/markets/search/semantic | 400ms| 1.2s  | 3s    |
| POST /v1/portfolio/simulate     | 80ms | 200ms | 500ms |

AI endpoints (analyse, consensus, semantic) involve a Claude API call.
Latency includes network + Claude inference time (~1-3s typical).
All non-AI endpoints are cached in Redis with 5-minute TTL.
Cached responses include: X-Cache: HIT and X-Cache-Age: 147

## API Versioning Policy

OracleIQ follows semantic versioning:
- Breaking changes increment the major version (/v2 → /v3)
- New endpoints and fields are additive — no version bump needed
- Deprecated endpoints receive 6 months notice via X-API-Deprecated header
- /v1 endpoints are supported for minimum 12 months after /v2 ships

When you see X-API-Deprecated: true in a response, check the
Link header for the migration guide URL.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5
- **Framework**: Express.js 4
- **Database**: PostgreSQL 16 via Prisma ORM
- **Cache**: Redis 7 (ioredis)
- **Queue**: BullMQ
- **AI**: Anthropic Claude API
- **HTTP Client**: Axios
- **WebSockets**: ws library
- **Validation**: Zod
- **Auth**: X-RapidAPI-Key header
- **Rate Limiting**: Redis sliding-window
- **Logging**: Winston + Morgan
- **Security**: Helmet.js, hpp, xss-clean
- **Docs**: Swagger UI + OpenAPI 3.0
- **Testing**: Jest + supertest + nock
- **Containers**: Docker + docker-compose
- **Deployment**: Railway + Render

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE for details.

## Contact

For support or inquiries, email support@oracleiq.dev