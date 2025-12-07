/**
 * PoC Management Service
 * Handles saving, retrieving, and managing RSC vulnerability scan results
 */

import { getDatabase } from '../db/index.js';
import { randomUUID } from 'crypto';

export interface PocScanSession {
  id?: number;
  sessionId: string;
  name?: string;
  description?: string;
  query?: string;
  totalHosts: number;
  scannedHosts: number;
  vulnerableCount: number;
  safeCount: number;
  errorCount: number;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface PocScanResult {
  id?: number;
  sessionId: string;
  host: string;
  vulnerable: boolean | null;
  statusCode?: number;
  error?: string;
  finalUrl?: string;
  testedUrl?: string;
  notes?: string;
  tags?: string[];
  status: 'pending' | 'scanned' | 'error';
  scannedAt: string;
}

/**
 * Create a new PoC scan session
 */
export function createScanSession(
  name?: string,
  description?: string,
  query?: string
): PocScanSession {
  const db = getDatabase();
  const sessionId = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO poc_scan_sessions (session_id, name, description, query, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);

  stmt.run(sessionId, name || null, description || null, query || null);

  return getScanSession(sessionId);
}

/**
 * Get a scan session by ID
 */
export function getScanSession(sessionId: string): PocScanSession {
  const db = getDatabase();
  const session = db
    .prepare('SELECT * FROM poc_scan_sessions WHERE session_id = ?')
    .get(sessionId) as PocScanSession | undefined;

  if (!session) {
    throw new Error('Scan session not found');
  }

  return session;
}

/**
 * Update scan session
 */
export function updateScanSession(
  sessionId: string,
  updates: Partial<Omit<PocScanSession, 'id' | 'sessionId' | 'createdAt'>>
): PocScanSession {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.query !== undefined) {
    fields.push('query = ?');
    values.push(updates.query);
  }
  if (updates.totalHosts !== undefined) {
    fields.push('total_hosts = ?');
    values.push(updates.totalHosts);
  }
  if (updates.scannedHosts !== undefined) {
    fields.push('scanned_hosts = ?');
    values.push(updates.scannedHosts);
  }
  if (updates.vulnerableCount !== undefined) {
    fields.push('vulnerable_count = ?');
    values.push(updates.vulnerableCount);
  }
  if (updates.safeCount !== undefined) {
    fields.push('safe_count = ?');
    values.push(updates.safeCount);
  }
  if (updates.errorCount !== undefined) {
    fields.push('error_count = ?');
    values.push(updates.errorCount);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(sessionId);

  if (fields.length > 1) {
    db.prepare(`UPDATE poc_scan_sessions SET ${fields.join(', ')} WHERE session_id = ?`).run(
      ...values
    );
  }

  return getScanSession(sessionId);
}

/**
 * Save scan results
 */
export function saveScanResults(
  sessionId: string,
  results: Array<{
    host: string;
    vulnerable: boolean | null;
    statusCode?: number;
    error?: string;
    finalUrl?: string;
    testedUrl?: string;
  }>
): void {
  const db = getDatabase();
  const insertStmt = db.prepare(`
    INSERT INTO poc_scan_results 
    (session_id, host, vulnerable, status_code, error, final_url, tested_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    let vulnerableCount = 0;
    let safeCount = 0;
    let errorCount = 0;

    for (const result of results) {
      const status =
        result.vulnerable === true
          ? 'scanned'
          : result.vulnerable === false
          ? 'scanned'
          : 'error';

      insertStmt.run(
        sessionId,
        result.host,
        result.vulnerable,
        result.statusCode || null,
        result.error || null,
        result.finalUrl || null,
        result.testedUrl || null,
        status
      );

      if (result.vulnerable === true) {
        vulnerableCount++;
      } else if (result.vulnerable === false) {
        safeCount++;
      } else {
        errorCount++;
      }
    }

    // Update session statistics
    const currentSession = getScanSession(sessionId);
    updateScanSession(sessionId, {
      scannedHosts: currentSession.scannedHosts + results.length,
      vulnerableCount: currentSession.vulnerableCount + vulnerableCount,
      safeCount: currentSession.safeCount + safeCount,
      errorCount: currentSession.errorCount + errorCount,
    });
  });

  transaction();
}

/**
 * Get all scan sessions
 */
export function getAllScanSessions(limit = 50, offset = 0): PocScanSession[] {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT * FROM poc_scan_sessions ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    .all(limit, offset) as PocScanSession[];
}

/**
 * Get scan results for a session
 */
export function getScanResults(
  sessionId: string,
  filter?: {
    vulnerable?: boolean | null;
    status?: string;
  }
): PocScanResult[] {
  const db = getDatabase();
  let query = 'SELECT * FROM poc_scan_results WHERE session_id = ?';
  const params: unknown[] = [sessionId];

  if (filter?.vulnerable !== undefined) {
    query += ' AND vulnerable = ?';
    params.push(filter.vulnerable);
  }
  if (filter?.status) {
    query += ' AND status = ?';
    params.push(filter.status);
  }

  query += ' ORDER BY scanned_at DESC';

  const results = db.prepare(query).all(...params) as Array<
    Omit<PocScanResult, 'tags'> & { tags?: string | string[] }
  >;

  // Parse tags from JSON string
  return results.map(result => ({
    ...result,
    tags: result.tags
      ? typeof result.tags === 'string'
        ? JSON.parse(result.tags)
        : result.tags
      : [],
  })) as PocScanResult[];
}

/**
 * Update scan result (for notes, tags, etc.)
 */
export function updateScanResult(
  sessionId: string,
  host: string,
  updates: {
    notes?: string;
    tags?: string[];
  }
): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(updates.tags));
  }

  if (fields.length > 0) {
    values.push(sessionId, host);
    db.prepare(
      `UPDATE poc_scan_results SET ${fields.join(', ')} WHERE session_id = ? AND host = ?`
    ).run(...values);
  }
}

/**
 * Delete scan session
 */
export function deleteScanSession(sessionId: string): void {
  const db = getDatabase();
  
  // Ensure foreign keys are enabled (must be set per connection)
  db.pragma('foreign_keys = ON');
  
  // First check if session exists
  const session = db
    .prepare('SELECT session_id FROM poc_scan_sessions WHERE session_id = ?')
    .get(sessionId) as { session_id: string } | undefined;
  
  if (!session) {
    throw new Error('Scan session not found');
  }
  
  // Use a transaction to ensure atomicity
  const transaction = db.transaction(() => {
    // First delete all related results (explicit deletion for safety)
    db.prepare('DELETE FROM poc_scan_results WHERE session_id = ?').run(sessionId);
    
    // Then delete the session
    const result = db.prepare('DELETE FROM poc_scan_sessions WHERE session_id = ?').run(sessionId);
    
    if (result.changes === 0) {
      throw new Error('Failed to delete scan session');
    }
  });
  
  transaction();
}

/**
 * Get statistics
 */
export function getPocStatistics(): {
  totalSessions: number;
  totalScanned: number;
  totalVulnerable: number;
  totalSafe: number;
  totalErrors: number;
} {
  const db = getDatabase();
  const stats = db
    .prepare(
      `
    SELECT 
      COUNT(*) as total_sessions,
      SUM(scanned_hosts) as total_scanned,
      SUM(vulnerable_count) as total_vulnerable,
      SUM(safe_count) as total_safe,
      SUM(error_count) as total_errors
    FROM poc_scan_sessions
    WHERE status = 'completed'
  `
    )
    .get() as {
      total_sessions: number;
      total_scanned: number;
      total_vulnerable: number;
      total_safe: number;
      total_errors: number;
    };

  return {
    totalSessions: stats.total_sessions || 0,
    totalScanned: stats.total_scanned || 0,
    totalVulnerable: stats.total_vulnerable || 0,
    totalSafe: stats.total_safe || 0,
    totalErrors: stats.total_errors || 0,
  };
}

