import { getDatabase } from '../db/index.js';

const FOFA_API_BASE = 'https://fofa.info/api/v1';

export interface FofaSearchParams {
  qbase64: string;
  fields?: string;
  page?: number;
  size?: number;
  full?: boolean;
}

export interface FofaSearchResponse {
  error: boolean;
  size: number;
  page: number;
  mode?: string;
  query: string;
  results: any[][];
  search_after?: string;
}

export interface FofaStatsParams {
  qbase64: string;
  fields?: string;
}

export interface FofaHostParams {
  qbase64: string;
  size?: number;
}

export interface FofaAccountResponse {
  error: boolean;
  email?: string;
  username?: string;
  fcoin?: number;
  vip_level?: number;
  isvip?: boolean;
  vip_level_name?: string;
  fcoin_balance?: number;
}

async function getApiCredentials(): Promise<{ email: string; key: string }> {
  const db = getDatabase();
  const config = db
    .prepare('SELECT email, api_key FROM api_config ORDER BY updated_at DESC LIMIT 1')
    .get() as { email: string | null; api_key: string } | undefined;

  if (!config?.api_key) {
    throw new Error('API key not configured');
  }

  // If email is not stored, try to get it from account info (without email parameter)
  let email = config.email;
  if (!email) {
    try {
      const accountUrl = new URL(`${FOFA_API_BASE}/info/my`);
      accountUrl.searchParams.set('key', config.api_key);
      accountUrl.searchParams.set('r_type', 'json');
      
      const accountResponse = await fetch(accountUrl.toString());
      if (accountResponse.ok) {
        const accountData = await accountResponse.json() as FofaAccountResponse;
        if (accountData.email) {
          email = accountData.email;
          // Save email to database for future use
          db.prepare('UPDATE api_config SET email = ? WHERE api_key = ?')
            .run(email, config.api_key);
        }
      }
    } catch (error) {
      console.error('Failed to fetch email from account info:', error);
      // If we can't get email, use empty string - some FOFA API endpoints might work without it
    }
  }

  return {
    email: email || '',
    key: config.api_key,
  };
}

export async function searchFofa(params: FofaSearchParams): Promise<FofaSearchResponse> {
  const { email, key } = await getApiCredentials();
  const url = new URL(`${FOFA_API_BASE}/search/all`);
  
  url.searchParams.set('email', email);
  url.searchParams.set('key', key);
  url.searchParams.set('qbase64', params.qbase64);
  
  if (params.fields) url.searchParams.set('fields', params.fields);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.size) url.searchParams.set('size', params.size.toString());
  if (params.full !== undefined) url.searchParams.set('full', params.full.toString());
  url.searchParams.set('r_type', 'json');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FOFA API error: ${response.statusText}`);
  }

  return await response.json();
}

export async function getFofaStats(params: FofaStatsParams): Promise<any> {
  const { email, key } = await getApiCredentials();
  const url = new URL(`${FOFA_API_BASE}/search/stats`);
  
  url.searchParams.set('email', email);
  url.searchParams.set('key', key);
  url.searchParams.set('qbase64', params.qbase64);
  if (params.fields) url.searchParams.set('fields', params.fields);
  url.searchParams.set('r_type', 'json');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FOFA API error: ${response.statusText}`);
  }

  return await response.json();
}

export async function getFofaHostAggregation(params: FofaHostParams): Promise<any> {
  const { email, key } = await getApiCredentials();
  const url = new URL(`${FOFA_API_BASE}/host`);
  
  url.searchParams.set('email', email);
  url.searchParams.set('key', key);
  url.searchParams.set('qbase64', params.qbase64);
  if (params.size) url.searchParams.set('size', params.size.toString());
  url.searchParams.set('r_type', 'json');

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.errmsg || `FOFA API error: ${response.statusText}`);
    } catch {
      throw new Error(`FOFA API error: ${response.statusText} - ${errorText}`);
    }
  }

  return await response.json();
}

export async function getFofaAccountInfo(): Promise<FofaAccountResponse> {
  const { email, key } = await getApiCredentials();
  const url = new URL(`${FOFA_API_BASE}/info/my`);
  
  url.searchParams.set('email', email);
  url.searchParams.set('key', key);
  url.searchParams.set('r_type', 'json');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FOFA API error: ${response.statusText}`);
  }

  return await response.json();
}

export async function searchAfterFofa(
  qbase64: string,
  searchAfter: string,
  size?: number
): Promise<any> {
  const { email, key } = await getApiCredentials();
  const url = new URL(`${FOFA_API_BASE}/search/after`);
  
  url.searchParams.set('email', email);
  url.searchParams.set('key', key);
  url.searchParams.set('qbase64', qbase64);
  url.searchParams.set('search_after', searchAfter);
  if (size) url.searchParams.set('size', size.toString());
  url.searchParams.set('r_type', 'json');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FOFA API error: ${response.statusText}`);
  }

  return await response.json();
}

