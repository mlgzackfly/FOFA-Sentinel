import { Router } from 'express';
import {
  searchFofa,
  getFofaStats,
  getFofaHostAggregation,
  getFofaAccountInfo,
  searchAfterFofa,
} from '../services/fofa.js';
import { checkHostHealth, checkHostsHealth } from '../services/healthcheck.js';
import { scanHost, scanHosts } from '../services/rsc-scanner.js';
import {
  createScanSession,
  saveScanResults,
  updateScanSession,
  getScanSession,
} from '../services/poc-manager.js';
import {
  executePocScript,
  executePocScriptForHosts,
  type PocScanResult,
} from '../services/poc-executor.js';

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
    let totalFetched = 0;
    let pageCount = 0;
    let currentPage = 1;

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
      // Fetch first page
      const firstResult = await searchFofa({
        qbase64,
        fields,
        page: currentPage,
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

      // Continue fetching pages using page parameter
      let lastPageResults = firstResult.results || [];
      while (totalFetched < maxResultsLimit && totalFetched < totalSize) {
        // Check if we got fewer results than requested (last page)
        if (lastPageResults.length < pageSize) {
          break;
        }

        currentPage++;
        const maxPages = Math.ceil(Math.min(maxResultsLimit, totalSize) / pageSize);
        if (currentPage > maxPages) {
          break;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
          const nextResult = await searchFofa({
            qbase64,
            fields,
            page: currentPage,
            size: pageSize,
            full: false,
          });

          if (nextResult.error || !nextResult.results || nextResult.results.length === 0) {
            break;
          }

          lastPageResults = nextResult.results;
          allResults.push(...lastPageResults);
          totalFetched += lastPageResults.length;
          pageCount++;

          sendProgress({
            fetched: totalFetched,
            total: totalSize,
            pages: pageCount,
            message: `Fetched page ${pageCount}, ${totalFetched} results`,
          });

          // If we got fewer results than requested, we've reached the last page
          if (lastPageResults.length < pageSize) {
            break;
          }
        } catch (error) {
          // If page doesn't exist or other error, stop fetching
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error fetching page ${currentPage}:`, errorMessage);
          break;
        }
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
      res.write(
        JSON.stringify({
          type: 'error',
          error: true,
          errmsg: errorMessage,
          fetched: totalFetched,
          pages: pageCount,
        }) + '\n'
      );
      res.end();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('FOFA search all error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

fofaRoutes.post('/healthcheck', async (req, res) => {
  try {
    const { host, hosts, timeout, port, protocol } = req.body;

    if (host) {
      // Single host check
      const result = await checkHostHealth(host, { timeout, port, protocol });
      res.json(result);
    } else if (hosts && Array.isArray(hosts)) {
      // Multiple hosts check
      const results = await checkHostsHealth(hosts, { timeout, port, protocol });
      res.json({ results });
    } else {
      res.status(400).json({ error: 'host or hosts array is required' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Health check error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

fofaRoutes.post('/rsc-scan', async (req, res) => {
  try {
    const {
      host,
      hosts,
      timeout,
      safeCheck,
      windows,
      wafBypass,
      wafBypassSize,
      vercelWafBypass,
      paths,
      customHeaders,
      verifySsl,
      followRedirects,
      sessionId,
      saveToPoc,
      pocName,
      pocDescription,
      pocQuery,
    } = req.body;

    let pocSessionId: string | null = null;

    // Create PoC session if requested
    if (saveToPoc) {
      const session = createScanSession(pocName, pocDescription, pocQuery);
      pocSessionId = session.sessionId;
      updateScanSession(session.sessionId, {
        totalHosts: host ? 1 : hosts?.length || 0,
        status: 'scanning',
      });
    } else if (sessionId) {
      pocSessionId = sessionId;
      try {
        const existingSession = getScanSession(sessionId);
        if (existingSession) {
          updateScanSession(sessionId, {
            status: 'scanning',
            totalHosts: (existingSession.totalHosts || 0) + (host ? 1 : hosts?.length || 0),
          });
        }
      } catch (error) {
        // Session doesn't exist, ignore
        console.warn('PoC session not found:', sessionId);
      }
    }

    if (host) {
      // Single host scan
      const result = await scanHost(host, {
        timeout,
        safeCheck,
        windows,
        wafBypass,
        wafBypassSize,
        vercelWafBypass,
        paths,
        customHeaders,
        verifySsl,
        followRedirects,
      });

      // Save to PoC if requested
      if (pocSessionId) {
        saveScanResults(pocSessionId, [result]);
        updateScanSession(pocSessionId, { status: 'completed' });
      }

      res.json({ ...result, sessionId: pocSessionId });
    } else if (hosts && Array.isArray(hosts)) {
      // Multiple hosts scan
      const results = await scanHosts(hosts, {
        timeout,
        safeCheck,
        windows,
        wafBypass,
        wafBypassSize,
        vercelWafBypass,
        paths,
        customHeaders,
        verifySsl,
        followRedirects,
      });

      // Save to PoC if requested
      if (pocSessionId) {
        saveScanResults(pocSessionId, results);
        updateScanSession(pocSessionId, { status: 'completed' });
      }

      res.json({ results, sessionId: pocSessionId });
    } else {
      res.status(400).json({ error: 'host or hosts array is required' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('RSC scan error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// PoC scan endpoint - uses selected PoC script
fofaRoutes.post('/poc-scan', async (req, res) => {
  try {
    const {
      host,
      hosts,
      scriptId,
      timeout,
      verifySsl,
      followRedirects,
      customHeaders,
      sessionId,
      saveToPoc,
      pocName,
      pocDescription,
      pocQuery,
    } = req.body;

    if (!scriptId) {
      return res.status(400).json({ error: 'scriptId is required' });
    }

    let pocSessionId: string | null = null;

    // Create PoC session if requested
    if (saveToPoc) {
      const session = createScanSession(pocName, pocDescription, pocQuery);
      pocSessionId = session.sessionId;
      updateScanSession(session.sessionId, {
        totalHosts: host ? 1 : hosts?.length || 0,
        status: 'scanning',
      });
    } else if (sessionId) {
      pocSessionId = sessionId;
      const existingSession = getScanSession(sessionId);
      if (existingSession) {
        updateScanSession(sessionId, {
          status: 'scanning',
          totalHosts: (existingSession.totalHosts || 0) + (host ? 1 : hosts?.length || 0),
        });
      }
    }

    let results: PocScanResult[] = [];
    if (host) {
      // Single host scan
      const result = await executePocScript(scriptId, host, {
        timeout,
        verifySsl,
        followRedirects,
        customHeaders,
      });
      results.push(result);
    } else if (hosts && Array.isArray(hosts)) {
      // Multiple hosts scan
      results = await executePocScriptForHosts(scriptId, hosts, {
        timeout,
        verifySsl,
        followRedirects,
        customHeaders,
      });
    } else {
      return res.status(400).json({ error: 'host or hosts array is required' });
    }

    // Save to PoC if a session ID is available
    if (pocSessionId) {
      const scanResults = results.map(r => ({
        host: r.host,
        vulnerable: r.vulnerable,
        statusCode: r.statusCode,
        error: r.error,
        finalUrl: r.finalUrl,
        testedUrl: r.testedUrl,
      }));
      saveScanResults(pocSessionId, scanResults);

      // Update session status and counts after scan
      const vulnerableCount = results.filter(r => r.vulnerable === true).length;
      const safeCount = results.filter(r => r.vulnerable === false).length;
      const errorCount = results.filter(r => r.vulnerable === null || r.error).length;
      updateScanSession(pocSessionId, {
        scannedHosts: results.length,
        vulnerableCount: vulnerableCount,
        safeCount: safeCount,
        errorCount: errorCount,
        status: 'completed',
      });
    }

    if (host) {
      res.json({ ...results[0], sessionId: pocSessionId });
    } else {
      res.json({ results, sessionId: pocSessionId });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('PoC scan error:', error);
    res.status(500).json({ error: errorMessage });
  }
});
