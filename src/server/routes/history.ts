import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/index.js';

export const historyRoutes = Router();

historyRoutes.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = db
      .prepare(
        `SELECT 
          id, 
          task_id,
          query, 
          query_base64, 
          fields, 
          page, 
          size, 
          full, 
          created_at, 
          updated_at,
          COALESCE((SELECT SUM(total_size) FROM query_results WHERE history_id = query_history.id), 0) as result_count
        FROM query_history 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`
      )
      .all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM query_history').get() as { count: number };

    res.json({
      history,
      total: total.count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

historyRoutes.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id);

    const query = db
      .prepare(
        `SELECT 
          id, 
          query, 
          query_base64, 
          fields, 
          page, 
          size, 
          full, 
          created_at, 
          updated_at
        FROM query_history 
        WHERE id = ?`
      )
      .get(id);

    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    res.json(query);
  } catch (error: any) {
    console.error('Get query error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

historyRoutes.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { query, query_base64, fields, page, size, full } = req.body;

    if (!query || !query_base64) {
      return res.status(400).json({ error: 'query and query_base64 are required' });
    }

    const taskId = randomUUID();
    const result = db
      .prepare(
        `INSERT INTO query_history (task_id, query, query_base64, fields, page, size, full)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(taskId, query, query_base64, fields || null, page || 1, size || 100, full ? 1 : 0);

    res.json({ id: result.lastInsertRowid, task_id: taskId });
  } catch (error: any) {
    console.error('Save history error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

historyRoutes.post('/:id/results', (req, res) => {
  try {
    const db = getDatabase();
    const historyId = parseInt(req.params.id);
    const { result_data, total_size, page } = req.body;

    if (!result_data) {
      return res.status(400).json({ error: 'result_data is required' });
    }

    const history = db.prepare('SELECT id FROM query_history WHERE id = ?').get(historyId);
    if (!history) {
      return res.status(404).json({ error: 'Query history not found' });
    }

    const result = db
      .prepare(
        `INSERT INTO query_results (history_id, result_data, total_size, page)
         VALUES (?, ?, ?, ?)`
      )
      .run(historyId, JSON.stringify(result_data), total_size || null, page || null);

    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    console.error('Save results error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

historyRoutes.get('/:id/results', (req, res) => {
  try {
    const db = getDatabase();
    const historyId = parseInt(req.params.id);

    const results = db
      .prepare(
        `SELECT id, result_data, total_size, page, created_at
         FROM query_results 
         WHERE history_id = ?
         ORDER BY created_at DESC`
      )
      .all(historyId);

    const parsedResults = results.map((r: any) => ({
      ...r,
      result_data: JSON.parse(r.result_data),
    }));

    res.json(parsedResults);
  } catch (error: any) {
    console.error('Get results error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

historyRoutes.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const id = parseInt(req.params.id);

    const result = db.prepare('DELETE FROM query_history WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Query not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

historyRoutes.get('/:id/export', (req, res) => {
  try {
    const db = getDatabase();
    const historyId = parseInt(req.params.id);

    const history = db
      .prepare('SELECT query, created_at FROM query_history WHERE id = ?')
      .get(historyId) as { query: string; created_at: string } | undefined;

    if (!history) {
      return res.status(404).json({ error: 'Query not found' });
    }

    const results = db
      .prepare(
        `SELECT result_data, total_size, page, created_at
         FROM query_results 
         WHERE history_id = ?
         ORDER BY created_at DESC`
      )
      .all(historyId);

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No results found for this query' });
    }

    let txtContent = `FOFA Query Export\n`;
    txtContent += `==================\n\n`;
    txtContent += `Query: ${history.query}\n`;
    txtContent += `Date: ${history.created_at}\n`;
    txtContent += `\n${'='.repeat(50)}\n\n`;

    results.forEach((result: any, index: number) => {
      try {
        let data;
        if (typeof result.result_data === 'string') {
          data = JSON.parse(result.result_data);
        } else {
          data = result.result_data;
        }

        txtContent += `Result Set ${index + 1} (Page: ${result.page || 'N/A'}, Total: ${result.total_size || 'N/A'})\n`;
        txtContent += `-`.repeat(50) + `\n`;

        if (data && data.results && Array.isArray(data.results)) {
          data.results.forEach((row: any, rowIndex: number) => {
            if (Array.isArray(row)) {
              txtContent += `${rowIndex + 1}. ${row.join(' | ')}\n`;
            } else if (typeof row === 'object') {
              const rowValues = Object.values(row).map(v => String(v || ''));
              txtContent += `${rowIndex + 1}. ${rowValues.join(' | ')}\n`;
            } else {
              txtContent += `${rowIndex + 1}. ${String(row)}\n`;
            }
          });
        } else if (data && Array.isArray(data)) {
          data.forEach((row: any, rowIndex: number) => {
            if (Array.isArray(row)) {
              txtContent += `${rowIndex + 1}. ${row.join(' | ')}\n`;
            } else if (typeof row === 'object') {
              const rowValues = Object.values(row).map(v => String(v || ''));
              txtContent += `${rowIndex + 1}. ${rowValues.join(' | ')}\n`;
            } else {
              txtContent += `${rowIndex + 1}. ${String(row)}\n`;
            }
          });
        } else {
          txtContent += `No results in this set\n`;
        }

        txtContent += `\n`;
      } catch (parseError: any) {
        console.error(`Error parsing result set ${index + 1}:`, parseError);
        txtContent += `Error parsing result set ${index + 1}: ${parseError.message}\n\n`;
      }
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="fofa_export_${historyId}_${Date.now()}.txt"`);
    res.send(txtContent);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

