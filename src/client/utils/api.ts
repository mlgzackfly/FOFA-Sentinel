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
  onProgress?: (progress: { fetched: number; total: number; pages: number; message: string }) => void
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

