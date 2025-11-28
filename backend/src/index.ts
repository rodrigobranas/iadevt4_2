import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import fetch from 'node-fetch';

app.get('/bitcoin-info', async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/bitcoin', {
      headers: {
        'X-Api-Key': 'kIwRwVNydIUrJzArE4LajA==xX81Zit9JC2zePiQ'
      }
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch bitcoin data' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});