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
    .get(sessionId) as
    | (Omit<PocScanSession, 'sessionId' | 'createdAt' | 'updatedAt'> & {
        session_id: string;
        created_at: string;
        updated_at: string;
      })
    | undefined;

  if (!session) {
    throw new Error('Scan session not found');
  }

  // Map database fields to TypeScript interface
  return {
    id: session.id,
    sessionId: session.session_id, // Map session_id to sessionId
    name: session.name,
    description: session.description,
    query: session.query,
    totalHosts: (session as any).total_hosts || 0, // Map total_hosts to totalHosts
    scannedHosts: (session as any).scanned_hosts || 0, // Map scanned_hosts to scannedHosts
    vulnerableCount: (session as any).vulnerable_count || 0, // Map vulnerable_count to vulnerableCount
    safeCount: (session as any).safe_count || 0, // Map safe_count to safeCount
    errorCount: (session as any).error_count || 0, // Map error_count to errorCount
    status: session.status,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
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
  if (!results || results.length === 0) {
    console.log(`[saveScanResults] No results to save for session ${sessionId}`);
    return;
  }

  console.log(`[saveScanResults] Saving ${results.length} results for session ${sessionId}`);
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
    let insertedCount = 0;

    for (const result of results) {
      try {
        const status =
          result.vulnerable === true
            ? 'scanned'
            : result.vulnerable === false
              ? 'scanned'
              : 'error';

        // Log before insertion for debugging
        console.log(
          `[saveScanResults] Inserting result for ${result.host}: vulnerable=${result.vulnerable} (type: ${typeof result.vulnerable}), status=${status}`
        );
        const insertResult = insertStmt.run(
          sessionId,
          result.host,
          result.vulnerable, // This should be true, false, or null
          result.statusCode || null,
          result.error || null,
          result.finalUrl || null,
          result.testedUrl || null,
          status
        );

        if (insertResult.changes > 0) {
          insertedCount++;
        } else {
          console.warn(`[saveScanResults] Failed to insert result for host ${result.host}`);
        }

        if (result.vulnerable === true) {
          vulnerableCount++;
        } else if (result.vulnerable === false) {
          safeCount++;
        } else {
          errorCount++;
        }
      } catch (insertError) {
        console.error(
          `[saveScanResults] Error inserting result for host ${result.host}:`,
          insertError
        );
        // Continue with next result
      }
    }

    console.log(`[saveScanResults] Inserted ${insertedCount} results into database`);

    // Update session statistics
    try {
      const currentSession = getScanSession(sessionId);
      // Use insertedCount instead of results.length to reflect actual saved records
      updateScanSession(sessionId, {
        scannedHosts: currentSession.scannedHosts + insertedCount,
        vulnerableCount: currentSession.vulnerableCount + vulnerableCount,
        safeCount: currentSession.safeCount + safeCount,
        errorCount: currentSession.errorCount + errorCount,
      });
      console.log(
        `[saveScanResults] Updated session ${sessionId} stats: scannedHosts=${currentSession.scannedHosts} + ${insertedCount} = ${currentSession.scannedHosts + insertedCount}, safeCount=${currentSession.safeCount} + ${safeCount} = ${currentSession.safeCount + safeCount}`
      );
    } catch (updateError) {
      console.error(`[saveScanResults] Error updating session statistics:`, updateError);
      throw updateError; // Re-throw to rollback transaction
    }
  });

  try {
    transaction();
    console.log(
      `[saveScanResults] Successfully saved ${results.length} results for session ${sessionId}`
    );
  } catch (transactionError) {
    console.error(
      `[saveScanResults] Transaction failed for session ${sessionId}:`,
      transactionError
    );
    throw transactionError;
  }
}

/**
 * Get all scan sessions
 */
export function getAllScanSessions(limit = 50, offset = 0): PocScanSession[] {
  const db = getDatabase();
  const sessions = db
    .prepare('SELECT * FROM poc_scan_sessions ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as Array<
    Omit<PocScanSession, 'sessionId' | 'createdAt' | 'updatedAt'> & {
      session_id: string;
      created_at: string;
      updated_at: string;
    }
  >;

  // Map database fields to TypeScript interface
  return sessions.map(session => ({
    id: session.id,
    sessionId: session.session_id, // Map session_id to sessionId
    name: session.name,
    description: session.description,
    query: session.query,
    totalHosts: (session as any).total_hosts || 0, // Map total_hosts to totalHosts
    scannedHosts: (session as any).scanned_hosts || 0, // Map scanned_hosts to scannedHosts
    vulnerableCount: (session as any).vulnerable_count || 0, // Map vulnerable_count to vulnerableCount
    safeCount: (session as any).safe_count || 0, // Map safe_count to safeCount
    errorCount: (session as any).error_count || 0, // Map error_count to errorCount
    status: session.status,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  }));
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

  // First, check if session exists and count total results
  const sessionCheck = db
    .prepare('SELECT session_id FROM poc_scan_sessions WHERE session_id = ?')
    .get(sessionId) as { session_id: string } | undefined;

  if (!sessionCheck) {
    console.log(`[DB] Session ${sessionId} not found in poc_scan_sessions`);
    return [];
  }

  const totalCount = db
    .prepare('SELECT COUNT(*) as count FROM poc_scan_results WHERE session_id = ?')
    .get(sessionId) as { count: number } | undefined;

  console.log(`[DB] Session ${sessionId} exists. Total results in DB: ${totalCount?.count || 0}`);

  let query = 'SELECT * FROM poc_scan_results WHERE session_id = ?';
  const params: unknown[] = [sessionId];

  if (filter?.vulnerable !== undefined) {
    if (filter.vulnerable === null) {
      // Handle null case (errors)
      query += ' AND vulnerable IS NULL';
    } else {
      query += ' AND vulnerable = ?';
      // SQLite stores BOOLEAN as INTEGER (0 or 1), so convert boolean to number
      // false -> 0, true -> 1
      const vulnerableValue = filter.vulnerable === true ? 1 : 0;
      params.push(vulnerableValue);
      console.log(
        `[getScanResults] Filtering by vulnerable=${filter.vulnerable} (SQL: vulnerable=${vulnerableValue})`
      );
    }
  }
  if (filter?.status) {
    if (filter.status === 'error') {
      // When filtering for errors, check multiple conditions to catch all error cases:
      // 1. status = 'error'
      // 2. vulnerable IS NULL (which indicates an error)
      // 3. error IS NOT NULL (has an error message)
      query += ' AND (status = ? OR vulnerable IS NULL OR error IS NOT NULL)';
      params.push(filter.status);
    } else {
      query += ' AND status = ?';
      params.push(filter.status);
    }
  }
  // If no filter is specified, include all results (including errors)
  // This ensures that when filter is 'all', we get all results

  query += ' ORDER BY scanned_at DESC';

  console.log(`[DB] Executing query: ${query} with params:`, params);
  const results = db.prepare(query).all(...params) as Array<
    Omit<PocScanResult, 'tags'> & { tags?: string | string[] }
  >;
  console.log(`[DB] Query returned ${results.length} results for session ${sessionId}`);

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

  // Check how many results are associated with this session (for logging)
  const resultCount = db
    .prepare('SELECT COUNT(*) as count FROM poc_scan_results WHERE session_id = ?')
    .get(sessionId) as { count: number } | undefined;

  console.log(`Deleting session ${sessionId} with ${resultCount?.count || 0} associated results`);

  // Use a transaction to ensure atomicity
  const transaction = db.transaction(() => {
    // Ensure foreign keys are enabled within transaction
    db.pragma('foreign_keys = ON');

    // Prepare statements for deletion
    const deleteResults = db.prepare('DELETE FROM poc_scan_results WHERE session_id = ?');
    const deleteSession = db.prepare('DELETE FROM poc_scan_sessions WHERE session_id = ?');

    // First delete all related results (explicit deletion for safety)
    // This should work even if foreign keys are disabled
    const resultsDeleted = deleteResults.run(sessionId);
    console.log(`Deleted ${resultsDeleted.changes} scan results`);

    // Then delete the session
    const sessionDeleted = deleteSession.run(sessionId);

    if (sessionDeleted.changes === 0) {
      throw new Error('Failed to delete scan session - no rows affected');
    }

    console.log(`Successfully deleted session ${sessionId}`);
  });

  try {
    transaction();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Transaction failed during session deletion:', errorMessage);
    console.error('Error details:', error);
    throw new Error(`Failed to delete scan session: ${errorMessage}`);
  }
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
  // Count all sessions (not just completed ones)
  const totalSessions = db.prepare('SELECT COUNT(*) as count FROM poc_scan_sessions').get() as {
    count: number;
  };

  // Sum statistics from all sessions (including scanning ones)
  const stats = db
    .prepare(
      `
    SELECT 
      COALESCE(SUM(scanned_hosts), 0) as total_scanned,
      COALESCE(SUM(vulnerable_count), 0) as total_vulnerable,
      COALESCE(SUM(safe_count), 0) as total_safe,
      COALESCE(SUM(error_count), 0) as total_errors
    FROM poc_scan_sessions
  `
    )
    .get() as {
    total_scanned: number;
    total_vulnerable: number;
    total_safe: number;
    total_errors: number;
  };

  return {
    totalSessions: totalSessions.count || 0,
    totalScanned: stats.total_scanned || 0,
    totalVulnerable: stats.total_vulnerable || 0,
    totalSafe: stats.total_safe || 0,
    totalErrors: stats.total_errors || 0,
  };
}
