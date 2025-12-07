import { Router } from 'express';
import {
  createScanSession,
  getScanSession,
  updateScanSession,
  getAllScanSessions,
  getScanResults,
  updateScanResult,
  deleteScanSession,
  getPocStatistics,
  saveScanResults,
} from '../services/poc-manager.js';
import {
  createPocScript,
  getPocScript,
  getAllPocScripts,
  updatePocScript,
  deletePocScript,
} from '../services/poc-scripts.js';
import {
  executePocScriptForHosts,
  type PocScanResult as PocExecutionResult,
} from '../services/poc-executor.js';
import { scanHosts } from '../services/rsc-scanner.js';

export const pocRoutes = Router();

// Get all scan sessions
pocRoutes.get('/sessions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const sessions = getAllScanSessions(limit, offset);
    res.json({ sessions });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Get sessions error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Get statistics
pocRoutes.get('/statistics', (req, res) => {
  try {
    const stats = getPocStatistics();
    res.json(stats);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Get statistics error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Create new scan session
pocRoutes.post('/sessions', (req, res) => {
  try {
    const { name, description, query } = req.body;
    const session = createScanSession(name, description, query);
    res.json(session);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Create session error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Get scan session by ID
pocRoutes.get('/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getScanSession(sessionId);
    res.json(session);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Get session error:', error);
    res.status(404).json({ error: errorMessage });
  }
});

// Update scan session
pocRoutes.patch('/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = updateScanSession(sessionId, req.body);
    res.json(session);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Update session error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Start background batch scan
pocRoutes.post('/scan-batch', async (req, res) => {
  try {
    const {
      hosts,
      pocScriptId,
      pocParameters,
      timeout,
      name,
      description,
      query,
      useRscScan = false,
    } = req.body;

    if (!hosts || !Array.isArray(hosts) || hosts.length === 0) {
      return res.status(400).json({ error: 'hosts array is required' });
    }

    // Create session immediately
    const session = createScanSession(name, description, query);
    updateScanSession(session.sessionId, {
      totalHosts: hosts.length,
      status: 'scanning',
    });

    // Return session ID immediately, scan will continue in background
    res.json({
      success: true,
      sessionId: session.sessionId,
      message: 'Scan started in background',
    });

    // Execute scan in background (don't await - fire and forget)
    (async () => {
      try {
        const batchSize = 5;
        let vulnerableCount = 0;
        let safeCount = 0;
        let errorCount = 0;
        let scannedCount = 0;

        for (let i = 0; i < hosts.length; i += batchSize) {
          const batch = hosts.slice(i, i + batchSize);
          let batchResults: Array<{
            host: string;
            vulnerable: boolean | null;
            statusCode?: number;
            error?: string;
            finalUrl?: string;
            testedUrl?: string;
          }> = [];

          try {
            if (useRscScan) {
              // Use RSC scan
              const { scanHosts } = await import('../services/rsc-scanner.js');
              batchResults = await scanHosts(batch, {
                timeout: timeout || 15,
                safeCheck: true,
              });
            } else if (pocScriptId) {
              // Use PoC scan
              batchResults = await executePocScriptForHosts(pocScriptId, batch, {
                timeout: timeout || 30,
                ...pocParameters,
              });
            } else {
              throw new Error('Either pocScriptId or useRscScan must be provided');
            }

            // Save results to database
            saveScanResults(session.sessionId, batchResults);

            // Update counts
            batchResults.forEach(result => {
              if (result.vulnerable === true) {
                vulnerableCount++;
              } else if (result.vulnerable === false) {
                safeCount++;
              } else {
                errorCount++;
              }
            });

            scannedCount = Math.min(i + batchSize, hosts.length);

            // Update session progress
            updateScanSession(session.sessionId, {
              scannedHosts: scannedCount,
              vulnerableCount: vulnerableCount,
              safeCount: safeCount,
              errorCount: errorCount,
              status: scannedCount < hosts.length ? 'scanning' : 'completed',
            });
          } catch (batchError) {
            console.error(`Failed to scan batch ${i}-${i + batchSize}:`, batchError);
            errorCount += batch.length;
            scannedCount = Math.min(i + batchSize, hosts.length);
            updateScanSession(session.sessionId, {
              scannedHosts: scannedCount,
              errorCount: errorCount,
              status: scannedCount < hosts.length ? 'scanning' : 'completed',
            });
          }
        }

        // Final update
        updateScanSession(session.sessionId, {
          scannedHosts: hosts.length,
          vulnerableCount: vulnerableCount,
          safeCount: safeCount,
          errorCount: errorCount,
          status: 'completed',
        });

        console.log(`Background scan completed for session ${session.sessionId}`);
      } catch (error) {
        console.error('Background scan error:', error);
        updateScanSession(session.sessionId, {
          status: 'failed',
        });
      }
    })();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Start batch scan error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Delete scan session
pocRoutes.delete('/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    deleteScanSession(sessionId);
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Delete session error:', error);
    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Get scan results for a session
pocRoutes.get('/sessions/:sessionId/results', (req, res) => {
  try {
    const { sessionId } = req.params;
    const vulnerable = req.query.vulnerable;
    const status = req.query.status as string | undefined;

    const filter: { vulnerable?: boolean | null; status?: string } = {};
    if (vulnerable !== undefined) {
      filter.vulnerable = vulnerable === 'true' ? true : vulnerable === 'false' ? false : null;
    }
    if (status) {
      filter.status = status;
    }

    const results = getScanResults(sessionId, filter);
    res.json({ results });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Get results error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Update scan result
pocRoutes.patch('/sessions/:sessionId/results/:host', (req, res) => {
  try {
    const { sessionId, host } = req.params;
    const { notes, tags } = req.body;
    updateScanResult(sessionId, decodeURIComponent(host), { notes, tags });
    res.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Update result error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Save scan results (used by RSC scan endpoint)
pocRoutes.post('/sessions/:sessionId/results', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { results } = req.body;

    if (!Array.isArray(results)) {
      return res.status(400).json({ error: 'results must be an array' });
    }

    saveScanResults(sessionId, results);
    res.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Save results error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// ========== PoC Scripts Management ==========

// Get all PoC scripts
pocRoutes.get('/scripts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const scripts = getAllPocScripts(limit, offset);
    res.json({ scripts });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Get PoC scripts error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Get a PoC script by ID
pocRoutes.get('/scripts/:scriptId', (req, res) => {
  try {
    const { scriptId } = req.params;
    const script = getPocScript(scriptId);
    res.json(script);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Get PoC script error:', error);
    res.status(404).json({ error: errorMessage });
  }
});

// Create a new PoC script
pocRoutes.post('/scripts', (req, res) => {
  try {
    const { name, description, type, language, script, parameters, enabled } = req.body;

    if (!name || !type || !language || !script) {
      return res.status(400).json({ error: 'name, type, language, and script are required' });
    }

    const newScript = createPocScript({
      name,
      description,
      type,
      language,
      script,
      parameters,
      enabled: enabled !== undefined ? enabled : true,
    });

    res.status(201).json(newScript);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Create PoC script error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Update a PoC script
pocRoutes.patch('/scripts/:scriptId', (req, res) => {
  try {
    const { scriptId } = req.params;
    const updates = req.body;
    const updatedScript = updatePocScript(scriptId, updates);
    res.json(updatedScript);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Update PoC script error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

// Delete a PoC script
pocRoutes.delete('/scripts/:scriptId', (req, res) => {
  try {
    const { scriptId } = req.params;
    deletePocScript(scriptId);
    res.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Delete PoC script error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

