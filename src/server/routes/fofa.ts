import { Router } from 'express';
import {
  searchFofa,
  getFofaStats,
  getFofaHostAggregation,
  getFofaAccountInfo,
  searchAfterFofa,
} from '../services/fofa.js';

export const fofaRoutes = Router();

// Search interface
fofaRoutes.post('/search', async (req, res) => {
  try {
    const { qbase64, fields, page, size, full } = req.body;
    
    if (!qbase64) {
      return res.status(400).json({ error: 'qbase64 is required' });
    }

    const result = await searchFofa({
      qbase64,
      fields,
      page,
      size,
      full,
    });

    res.json(result);
  } catch (error: any) {
    console.error('FOFA search error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Statistics aggregation
fofaRoutes.post('/stats', async (req, res) => {
  try {
    const { qbase64, fields } = req.body;
    
    if (!qbase64) {
      return res.status(400).json({ error: 'qbase64 is required' });
    }

    const result = await getFofaStats({ qbase64, fields });
    res.json(result);
  } catch (error: any) {
    console.error('FOFA stats error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Host aggregation
fofaRoutes.post('/host', async (req, res) => {
  try {
    const { qbase64, size } = req.body;
    
    if (!qbase64) {
      return res.status(400).json({ error: 'qbase64 is required' });
    }

    const result = await getFofaHostAggregation({ qbase64, size });
    res.json(result);
  } catch (error: any) {
    console.error('FOFA host aggregation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Account information
fofaRoutes.get('/account', async (req, res) => {
  try {
    const result = await getFofaAccountInfo();
    res.json(result);
  } catch (error: any) {
    console.error('FOFA account info error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Search after interface
fofaRoutes.post('/search-after', async (req, res) => {
  try {
    const { qbase64, search_after, size } = req.body;
    
    if (!qbase64 || !search_after) {
      return res.status(400).json({ error: 'qbase64 and search_after are required' });
    }

    const result = await searchAfterFofa(qbase64, search_after, size);
    res.json(result);
  } catch (error: any) {
    console.error('FOFA search after error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

