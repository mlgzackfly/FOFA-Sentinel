const API_BASE = '/api';

export interface FofaSearchParams {
  qbase64: string;
  fields?: string;
  page?: number;
  size?: number;
  full?: boolean;
}

export async function searchFofa(params: FofaSearchParams) {
  const response = await fetch(`${API_BASE}/fofa/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export async function getFofaStats(params: { qbase64: string; fields?: string }) {
  const response = await fetch(`${API_BASE}/fofa/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export async function getFofaHostAggregation(params: { qbase64: string; size?: number }) {
  const response = await fetch(`${API_BASE}/fofa/host`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export async function getFofaAccountInfo() {
  const response = await fetch(`${API_BASE}/fofa/account`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export async function searchAfterFofa(params: {
  qbase64: string;
  search_after: string;
  size?: number;
}) {
  const response = await fetch(`${API_BASE}/fofa/search-after`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export interface FofaSearchAllResult {
  error: boolean;
  size: number;
  query: string;
  results: unknown[][];
  fetched: number;
  pages: number;
  message: string;
  errmsg?: string;
}

export async function searchAllFofa(
  params: {
    qbase64: string;
    fields?: string;
    size?: number;
    maxResults?: number;
  },
  onProgress?: (progress: {
    fetched: number;
    total: number;
    pages: number;
    message: string;
  }) => void
): Promise<FofaSearchAllResult> {
  const response = await fetch(`${API_BASE}/fofa/search-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: FofaSearchAllResult | null = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        if (data.type === 'progress' && onProgress) {
          onProgress({
            fetched: data.fetched || 0,
            total: data.total || 0,
            pages: data.pages || 0,
            message: data.message || '',
          });
        } else if (data.type === 'complete') {
          finalResult = data;
        } else if (data.type === 'error') {
          throw new Error(data.errmsg || 'Failed to fetch all results');
        }
      } catch (e) {
        console.error('Error parsing progress data:', e);
      }
    }
  }

  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer);
      if (data.type === 'complete') {
        finalResult = data;
      }
    } catch (e) {
      console.error('Error parsing final data:', e);
    }
  }

  if (!finalResult) {
    throw new Error('No result received');
  }

  return finalResult;
}

export interface HealthCheckOptions {
  timeout?: number;
  port?: number;
  protocol?: 'http' | 'https';
}

export interface HealthCheckResult {
  host: string;
  alive: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

export async function checkHostHealth(
  host: string,
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const response = await fetch(`${API_BASE}/fofa/healthcheck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host, ...options }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Health check failed');
  }

  return response.json();
}

export async function checkHostsHealth(
  hosts: string[],
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult[]> {
  const response = await fetch(`${API_BASE}/fofa/healthcheck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hosts, ...options }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Health check failed');
  }

  const data = await response.json();
  return data.results || [];
}

export interface RSCScanOptions {
  timeout?: number;
  safeCheck?: boolean;
  windows?: boolean;
  wafBypass?: boolean;
  wafBypassSize?: number;
  vercelWafBypass?: boolean;
  paths?: string[];
  customHeaders?: Record<string, string>;
  verifySsl?: boolean;
  followRedirects?: boolean;
  sessionId?: string;
  saveToPoc?: boolean;
  pocName?: string;
  pocDescription?: string;
  pocQuery?: string;
}

export interface RSCScanResult {
  host: string;
  vulnerable: boolean | null;
  statusCode?: number;
  error?: string;
  finalUrl?: string;
  testedUrl?: string;
  timestamp?: string;
}

export async function scanRSC(host: string, options: RSCScanOptions = {}): Promise<RSCScanResult> {
  const timeout = options.timeout || 15;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), (timeout + 10) * 1000);

  try {
    const response = await fetch(`${API_BASE}/fofa/rsc-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, ...options }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'RSC scan failed');
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Scan request timeout');
    }
    throw error;
  }
}

export async function scanRSCs(
  hosts: string[],
  options: RSCScanOptions = {}
): Promise<RSCScanResult[]> {
  const timeout = options.timeout || 15;
  // For batch scans, allow more time (timeout per host * number of hosts + buffer)
  const totalTimeout = (timeout + 5) * hosts.length + 10;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), totalTimeout * 1000);

  try {
    const response = await fetch(`${API_BASE}/fofa/rsc-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hosts,
        timeout: options.timeout,
        safeCheck: options.safeCheck,
        windows: options.windows,
        wafBypass: options.wafBypass,
        wafBypassSize: options.wafBypassSize,
        vercelWafBypass: options.vercelWafBypass,
        paths: options.paths,
        customHeaders: options.customHeaders,
        verifySsl: options.verifySsl,
        followRedirects: options.followRedirects,
        sessionId: options.sessionId,
        saveToPoc: options.saveToPoc,
        pocName: options.pocName,
        pocDescription: options.pocDescription,
        pocQuery: options.pocQuery,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'RSC scan failed');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Batch scan request timeout');
    }
    throw error;
  }
}

// PoC scan functions
export interface PocScanOptions {
  timeout?: number;
  verifySsl?: boolean;
  followRedirects?: boolean;
  customHeaders?: Record<string, string>;
  sessionId?: string;
  saveToPoc?: boolean;
  pocName?: string;
  pocDescription?: string;
  pocQuery?: string;
}

export interface PocScanResult {
  host: string;
  vulnerable: boolean | null;
  statusCode?: number;
  error?: string;
  finalUrl?: string;
  testedUrl?: string;
  timestamp?: string;
  pocOutput?: string;
}

export async function scanWithPoc(
  hosts: string[],
  scriptId: string,
  options: PocScanOptions = {}
): Promise<PocScanResult[]> {
  const timeout = options.timeout || 15;
  const totalTimeout = (timeout + 5) * hosts.length + 10;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), totalTimeout * 1000);

  try {
    const response = await fetch(`${API_BASE}/fofa/poc-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hosts,
        scriptId,
        timeout: options.timeout,
        verifySsl: options.verifySsl,
        followRedirects: options.followRedirects,
        customHeaders: options.customHeaders,
        sessionId: options.sessionId,
        saveToPoc: options.saveToPoc,
        pocName: options.pocName,
        pocDescription: options.pocDescription,
        pocQuery: options.pocQuery,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'PoC scan failed');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('PoC scan request timeout');
    }
    throw error;
  }
}
