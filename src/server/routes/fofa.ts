import { Router } from 'express';
import {
  searchFofa,
  getFofaStats,
  getFofaHostAggregation,
  getFofaAccountInfo,
  searchAfterFofa,
} from '../services/fofa.js';

export const fofaRoutes = Router();

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('FOFA search error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

fofaRoutes.post('/stats', async (req, res) => {
  try {
    const { qbase64, fields } = req.body;
    
    if (!qbase64) {
      return res.status(400).json({ error: 'qbase64 is required' });
    }

    const result = await getFofaStats({ qbase64, fields });
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('FOFA stats error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

fofaRoutes.post('/host', async (req, res) => {
  try {
    const { qbase64, size } = req.body;
    
    if (!qbase64) {
      return res.status(400).json({ error: 'qbase64 is required' });
    }

    const result = await getFofaHostAggregation({ qbase64, size });
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('FOFA host aggregation error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

fofaRoutes.get('/account', async (req, res) => {
  try {
    const result = await getFofaAccountInfo();
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('FOFA account info error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

fofaRoutes.post('/search-after', async (req, res) => {
  try {
    const { qbase64, search_after, size } = req.body;
    
    if (!qbase64 || !search_after) {
      return res.status(400).json({ error: 'qbase64 and search_after are required' });
    }

    const result = await searchAfterFofa(qbase64, search_after, size);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('FOFA search after error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

fofaRoutes.post('/search-all', async (req, res) => {
  try {
    const { qbase64, fields, size, maxResults } = req.body;
    
    if (!qbase64) {
      return res.status(400).json({ error: 'qbase64 is required' });
    }

    const pageSize = Math.min(size || 100, 10000);
    const maxResultsLimit = maxResults || 100000;
    const allResults: unknown[][] = [];
    let searchAfter: string | null = null;
    let totalFetched = 0;
    let pageCount = 0;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    interface ProgressData {
      fetched: number;
      total: number;
      pages: number;
      message: string;
    }

    const sendProgress = (progress: ProgressData) => {
      res.write(JSON.stringify({ type: 'progress', ...progress }) + '\n');
    };

    try {
      const firstResult = await searchFofa({
        qbase64,
        fields,
        page: 1,
        size: pageSize,
        full: false,
      });

      if (firstResult.error) {
        res.write(JSON.stringify({ type: 'error', ...firstResult }) + '\n');
        res.end();
        return;
      }

      const totalSize = firstResult.size || 0;
      allResults.push(...(firstResult.results || []));
      totalFetched += firstResult.results?.length || 0;
      pageCount = 1;

      sendProgress({
        fetched: totalFetched,
        total: totalSize,
        pages: pageCount,
        message: `Fetched page ${pageCount}, ${totalFetched} results`,
      });

      if (firstResult.results && firstResult.results.length > 0) {
        const lastResult = firstResult.results[firstResult.results.length - 1];
        if (Array.isArray(lastResult) && lastResult.length > 0) {
          searchAfter = String(lastResult[0]);
        } else if (typeof lastResult === 'object' && lastResult !== null) {
          const keys = Object.keys(lastResult);
          if (keys.length > 0) {
            searchAfter = String((lastResult as Record<string, unknown>)[keys[0]]);
          }
        }
      }

      while (searchAfter && totalFetched < maxResultsLimit && totalFetched < totalSize) {
        const nextResult = await searchAfterFofa(qbase64, searchAfter, pageSize);
        
        if (nextResult.error || !nextResult.results || nextResult.results.length === 0) {
          break;
        }

        allResults.push(...nextResult.results);
        totalFetched += nextResult.results.length;
        pageCount++;

        sendProgress({
          fetched: totalFetched,
          total: totalSize,
          pages: pageCount,
          message: `Fetched page ${pageCount}, ${totalFetched} results`,
        });

        if (nextResult.results.length < pageSize) {
          break;
        }

        const lastResult = nextResult.results[nextResult.results.length - 1];
        if (Array.isArray(lastResult) && lastResult.length > 0) {
          searchAfter = String(lastResult[0]);
        } else if (typeof lastResult === 'object' && lastResult !== null) {
          const keys = Object.keys(lastResult);
          if (keys.length > 0) {
            searchAfter = String((lastResult as Record<string, unknown>)[keys[0]]);
          } else {
            break;
          }
        } else {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const finalResult = {
        error: false,
        size: totalSize,
        query: firstResult.query || '',
        results: allResults,
        fetched: totalFetched,
        pages: pageCount,
        message: `Successfully fetched ${totalFetched} results in ${pageCount} pages`,
      };

      res.write(JSON.stringify({ type: 'complete', ...finalResult }) + '\n');
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch all results';
      res.write(JSON.stringify({ 
        type: 'error', 
        error: true, 
        errmsg: errorMessage,
        fetched: totalFetched,
        pages: pageCount,
      }) + '\n');
      res.end();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('FOFA search all error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

