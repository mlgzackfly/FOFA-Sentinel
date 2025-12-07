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

