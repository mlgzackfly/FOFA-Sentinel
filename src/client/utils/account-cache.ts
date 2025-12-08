import { type FofaAccountResult } from '../../shared/types';

const CACHE_KEY = 'fofa_account_info';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedAccountInfo {
  data: FofaAccountResult;
  timestamp: number;
}

/**
 * Get cached account info if it exists and is still valid
 */
export function getCachedAccountInfo(): FofaAccountResult | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsed: CachedAccountInfo = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within cache duration)
    if (now - parsed.timestamp < CACHE_DURATION) {
      return parsed.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Failed to read cached account info:', error);
    return null;
  }
}

/**
 * Cache account info with current timestamp
 */
export function setCachedAccountInfo(data: FofaAccountResult): void {
  try {
    const cached: CachedAccountInfo = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache account info:', error);
  }
}

/**
 * Clear cached account info
 */
export function clearCachedAccountInfo(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear cached account info:', error);
  }
}

/**
 * Check if cached account info exists and is valid
 */
export function hasValidCache(): boolean {
  return getCachedAccountInfo() !== null;
}
