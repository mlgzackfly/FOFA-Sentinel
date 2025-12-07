/**
 * PoC Scripts Management Service
 * Handles CRUD operations for PoC scripts
 */

import { getDatabase } from '../db/index.js';
import { randomUUID } from 'crypto';

export interface PocScript {
  id?: number;
  scriptId: string;
  name: string;
  description?: string;
  type: 'rsc' | 'xss' | 'sqli' | 'rce' | 'ssrf' | 'other';
  language: 'python' | 'http' | 'javascript' | 'bash' | 'other';
  script: string;
  parameters?: Record<string, any>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new PoC script
 */
export function createPocScript(
  data: Omit<PocScript, 'id' | 'scriptId' | 'createdAt' | 'updatedAt'>
): PocScript {
  const db = getDatabase();
  const scriptId = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO poc_scripts (script_id, name, description, type, language, script, parameters, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    scriptId,
    data.name,
    data.description || null,
    data.type,
    data.language,
    data.script,
    data.parameters ? JSON.stringify(data.parameters) : null,
    data.enabled ? 1 : 0
  );

  return getPocScript(scriptId);
}

/**
 * Get a PoC script by ID
 */
export function getPocScript(scriptId: string): PocScript {
  const db = getDatabase();
  const script = db.prepare('SELECT * FROM poc_scripts WHERE script_id = ?').get(scriptId) as
    | (Omit<PocScript, 'parameters' | 'enabled' | 'scriptId' | 'createdAt' | 'updatedAt'> & {
        script_id: string;
        parameters?: string | null;
        enabled: number;
        created_at: string;
        updated_at: string;
      })
    | undefined;

  if (!script) {
    throw new Error('PoC script not found');
  }

  let parameters: Record<string, any> | undefined = undefined;
  if (script.parameters) {
    try {
      parameters = JSON.parse(script.parameters);
    } catch (parseError) {
      console.error(`Failed to parse parameters for script ${script.script_id}:`, parseError);
      // Continue with undefined parameters if parsing fails
    }
  }

  return {
    id: script.id,
    scriptId: script.script_id,
    name: script.name,
    description: script.description,
    type: script.type,
    language: script.language,
    script: script.script,
    parameters,
    enabled: script.enabled === 1,
    createdAt: script.created_at,
    updatedAt: script.updated_at,
  };
}

/**
 * Get all PoC scripts
 */
export function getAllPocScripts(limit = 100, offset = 0): PocScript[] {
  const db = getDatabase();
  const scripts = db
    .prepare('SELECT * FROM poc_scripts ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as Array<
    Omit<PocScript, 'parameters' | 'enabled' | 'scriptId' | 'createdAt' | 'updatedAt'> & {
      script_id: string;
      parameters?: string | null;
      enabled: number;
      created_at: string;
      updated_at: string;
    }
  >;

  return scripts.map(script => {
    let parameters: Record<string, any> | undefined = undefined;
    if (script.parameters) {
      try {
        parameters = JSON.parse(script.parameters);
      } catch (parseError) {
        console.error(`Failed to parse parameters for script ${script.script_id}:`, parseError);
        // Continue with undefined parameters if parsing fails
      }
    }

    return {
      id: script.id,
      scriptId: script.script_id,
      name: script.name,
      description: script.description,
      type: script.type,
      language: script.language,
      script: script.script,
      parameters,
      enabled: script.enabled === 1,
      createdAt: script.created_at,
      updatedAt: script.updated_at,
    };
  });
}

/**
 * Update a PoC script
 */
export function updatePocScript(
  scriptId: string,
  updates: Partial<Omit<PocScript, 'id' | 'scriptId' | 'createdAt'>>
): PocScript {
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
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.language !== undefined) {
    fields.push('language = ?');
    values.push(updates.language);
  }
  if (updates.script !== undefined) {
    fields.push('script = ?');
    values.push(updates.script);
  }
  if (updates.parameters !== undefined) {
    fields.push('parameters = ?');
    values.push(updates.parameters ? JSON.stringify(updates.parameters) : null);
  }
  if (updates.enabled !== undefined) {
    fields.push('enabled = ?');
    values.push(updates.enabled ? 1 : 0);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(scriptId);

  if (fields.length > 1) {
    db.prepare(`UPDATE poc_scripts SET ${fields.join(', ')} WHERE script_id = ?`).run(...values);
  }

  return getPocScript(scriptId);
}

/**
 * Delete a PoC script
 */
export function deletePocScript(scriptId: string): void {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM poc_scripts WHERE script_id = ?').run(scriptId);

  if (result.changes === 0) {
    throw new Error('PoC script not found');
  }
}
