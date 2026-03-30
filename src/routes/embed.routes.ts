import { Router } from 'express';

const router = Router();

// Embeddable widget
router.get('/:marketId', (req, res) => {
  const { marketId } = req.params;
  
  const widgetHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OracleIQ Market Widget</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            padding: 20px;
        }
        
        .widget-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .market-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            line-height: 1.4;
        }
        
        .probability-container {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .probability-gauge {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: conic-gradient(#10b981 0deg 122.4deg, #ef4444 122.4deg 360deg);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20px;
        }
        
        .probability-gauge::before {
            content: '';
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: white;
            position: absolute;
        }
        
        .probability-value {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            position: relative;
            z-index: 1;
        }
        
        .probability-label {
            color: #64748b;
            font-size: 14px;
            margin-top: 4px;
        }
        
        .chart-container {
            height: 60px;
            margin-bottom: 16px;
            background: #f1f5f9;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #64748b;
        }
        
        .platform-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
        }
        
        .platform-logo {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #3b82f6;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .platform-name {
            font-size: 14px;
            color: #64748b;
            margin-left: 8px;
        }
        
        .powered-by {
            font-size: 12px;
            color: #94a3b8;
        }
        
        .volume-info {
            background: #f1f5f9;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        
        .volume-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 4px;
        }
        
        .volume-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
        }
        
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
            body {
                background: #0f172a;
                color: #f1f5f9;
            }
            
            .widget-container {
                background: #1e293b;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            }
            
            .probability-value {
                color: #f1f5f9;
            }
            
            .platform-info {
                border-top-color: #334155;
            }
            
            .platform-name {
                color: #cbd5e1;
            }
            
            .volume-info {
                background: #334155;
            }
            
            .volume-value {
                color: #f1f5f9;
            }
        }
    </style>
</head>
<body>
    <div class="widget-container">
        <div class="market-title">Will the Fed cut rates at the March 2026 FOMC meeting?</div>
        
        <div class="probability-container">
            <div class="probability-gauge">
                <div class="probability-value">34%</div>
            </div>
            <div>
                <div class="probability-label">Market Probability</div>
            </div>
        </div>
        
        <div class="volume-info">
            <div class="volume-label">Trading Volume</div>
            <div class="volume-value">$2.85M</div>
        </div>
        
        <div class="chart-container">
            Probability Chart
        </div>
        
        <div class="platform-info">
            <div style="display: flex; align-items: center;">
                <div class="platform-logo">K</div>
                <div class="platform-name">Kalshi</div>
            </div>
            <div class="powered-by">Powered by OracleIQ</div>
        </div>
    </div>
</body>
</html>
  `;

  res.send(widgetHtml);
});

export default router;