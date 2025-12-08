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
  error?: boolean;
  email?: string;
  username?: string;
  category?: string;
  fcoin?: number;
  fofa_point?: number;
  remain_free_point?: number;
  remain_api_query?: number;
  remain_api_data?: number;
  isvip?: boolean;
  vip_level?: number;
  is_verified?: boolean;
  avatar?: string;
  message?: string;
  fofacli_ver?: string;
  fofa_server?: boolean;
  expiration?: string;
  // Legacy field names (for backward compatibility)
  fcoin_balance?: number;
  errmsg?: string;
}

export type FofaQueryResult =
  | FofaSearchResult
  | FofaStatsResult
  | FofaHostResult
  | FofaAccountResult;

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
