const API_BASE = '/api';

export interface PocSession {
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

export interface PocResult {
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

export interface PocStatistics {
  totalSessions: number;
  totalScanned: number;
  totalVulnerable: number;
  totalSafe: number;
  totalErrors: number;
}

export async function getAllPocSessions(limit = 50, offset = 0): Promise<{ sessions: PocSession[] }> {
  const response = await fetch(`${API_BASE}/poc/sessions?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sessions');
  }
  return response.json();
}

export async function getPocSession(sessionId: string): Promise<PocSession> {
  const response = await fetch(`${API_BASE}/poc/sessions/${sessionId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch session');
  }
  return response.json();
}

export async function createPocSession(
  name?: string,
  description?: string,
  query?: string
): Promise<PocSession> {
  const response = await fetch(`${API_BASE}/poc/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, query }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }
  return response.json();
}

export async function updatePocSession(
  sessionId: string,
  updates: Partial<PocSession>
): Promise<PocSession> {
  const response = await fetch(`${API_BASE}/poc/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update session');
  }
  return response.json();
}

export async function deletePocSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/poc/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete session');
  }
}

export async function getPocResults(
  sessionId: string,
  filter?: {
    vulnerable?: boolean | null;
    status?: string;
  }
): Promise<{ results: PocResult[] }> {
  const params = new URLSearchParams();
  if (filter?.vulnerable !== undefined) {
    params.append('vulnerable', String(filter.vulnerable));
  }
  if (filter?.status) {
    params.append('status', filter.status);
  }

  const response = await fetch(`${API_BASE}/poc/sessions/${sessionId}/results?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch results');
  }
  return response.json();
}

export async function updatePocResult(
  sessionId: string,
  host: string,
  updates: { notes?: string; tags?: string[] }
): Promise<void> {
  const response = await fetch(`${API_BASE}/poc/sessions/${sessionId}/results/${encodeURIComponent(host)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update result');
  }
}

export async function getPocStatistics(): Promise<PocStatistics> {
  const response = await fetch(`${API_BASE}/poc/statistics`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch statistics');
  }
  return response.json();
}

// ========== PoC Scripts Management ==========

export interface PocScript {
  id?: number;
  scriptId: string;
  name: string;
  description?: string;
  type: 'rsc' | 'xss' | 'sqli' | 'rce' | 'ssrf' | 'other';
  language: 'python' | 'javascript' | 'bash' | 'other';
  script: string;
  parameters?: Record<string, any>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAllPocScripts(limit = 100, offset = 0): Promise<{ scripts: PocScript[] }> {
  const response = await fetch(`${API_BASE}/poc/scripts?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch PoC scripts');
  }
  return response.json();
}

export async function getPocScriptById(scriptId: string): Promise<PocScript> {
  const response = await fetch(`${API_BASE}/poc/scripts/${scriptId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch PoC script');
  }
  return response.json();
}

export async function createPocScript(data: Omit<PocScript, 'id' | 'scriptId' | 'createdAt' | 'updatedAt'>): Promise<PocScript> {
  const response = await fetch(`${API_BASE}/poc/scripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create PoC script');
  }
  return response.json();
}

export async function updatePocScript(
  scriptId: string,
  updates: Partial<Omit<PocScript, 'id' | 'scriptId' | 'createdAt'>>
): Promise<PocScript> {
  const response = await fetch(`${API_BASE}/poc/scripts/${scriptId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update PoC script');
  }
  return response.json();
}

export async function deletePocScript(scriptId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/poc/scripts/${scriptId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete PoC script');
  }
}

export async function startBackgroundScan(
  hosts: string[],
  options: {
    pocScriptId?: string;
    pocParameters?: Record<string, any>;
    timeout?: number;
    name?: string;
    description?: string;
    query?: string;
    useRscScan?: boolean;
  }
): Promise<{ sessionId: string }> {
  const response = await fetch(`${API_BASE}/poc/scan-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hosts,
      pocScriptId: options.pocScriptId,
      pocParameters: options.pocParameters,
      timeout: options.timeout,
      name: options.name,
      description: options.description,
      query: options.query,
      useRscScan: options.useRscScan || false,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start background scan');
  }
  return response.json();
}

