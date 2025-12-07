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
  errmsg?: string;
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
  errmsg?: string;
}

export interface QueryHistory {
  id: number;
  query: string;
  query_base64: string;
  fields: string | null;
  page: number;
  size: number;
  full: number;
  created_at: string;
  updated_at: string;
  result_count?: number;
}

export interface QueryResult {
  id: number;
  history_id: number;
  result_data: any;
  total_size: number | null;
  page: number | null;
  created_at: string;
}

