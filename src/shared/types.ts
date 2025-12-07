/**
 * Shared types for FOFA API client
 */

export interface FofaSearchResult {
  query?: string;
  size?: number;
  page?: number;
  results?: unknown[][];
  error?: boolean;
  errmsg?: string;
  [key: string]: unknown;
}

export interface FofaStatsResult {
  [key: string]: unknown;
  error?: boolean;
  errmsg?: string;
}

export interface FofaHostResult {
  [key: string]: unknown;
  error?: boolean;
  errmsg?: string;
}

export interface FofaAccountResult {
  email?: string;
  username?: string;
  vip_level?: number;
  isvip?: boolean;
  fcoin_balance?: number;
  error?: boolean;
  errmsg?: string;
}

export type FofaQueryResult = FofaSearchResult | FofaStatsResult | FofaHostResult | FofaAccountResult;

export interface HistoryItem {
  id: number;
  task_id: string;
  query: string;
  tab: string;
  fields?: string | null;
  page?: number;
  size?: number;
  full?: number;
  result_count: number;
  created_at: string;
}

export interface QueryResult {
  id: number;
  result_data: unknown;
  total_size: number;
  page: number;
  created_at: string;
}
