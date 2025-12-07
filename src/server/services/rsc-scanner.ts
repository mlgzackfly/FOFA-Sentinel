/**
 * RSC (React Server Components) vulnerability scanner service
 * Uses react2shell-scanner to detect CVE-2025-55182 and CVE-2025-66478
 */

import { spawn } from 'node:child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCANNER_API_PATH = path.join(__dirname, '../../../tools/react2shell-scanner/scanner_api.py');

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

/**
 * Check if a single host is vulnerable to RSC RCE
 */
export async function scanHost(host: string, options: RSCScanOptions = {}): Promise<RSCScanResult> {
  const {
    timeout = 10,
    safeCheck = false,
    windows = false,
    wafBypass = false,
    wafBypassSize = 128,
    vercelWafBypass = false,
    paths,
    customHeaders,
    verifySsl = true,
    followRedirects = true,
  } = options;

  return new Promise(resolve => {
    const input = JSON.stringify({
      host,
      timeout,
      safeCheck,
      windows,
      wafBypass,
      wafBypassSize,
      vercelWafBypass,
      paths,
      customHeaders,
      verifySsl,
      followRedirects,
    });

    // Use uv run python3 to ensure dependencies are available
    // This will use the virtual environment managed by uv
    const pythonProcess = spawn('uv', ['run', 'python3', SCANNER_API_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '../../../'), // Set working directory to project root
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', data => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', data => {
      stderr += data.toString();
    });

    let resolved = false;

    const resolveOnce = (result: RSCScanResult) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(result);
      }
    };

    // Set timeout first
    const timeoutId = setTimeout(
      () => {
        if (!resolved) {
          pythonProcess.kill('SIGTERM');
          // Give it a moment to clean up, then force kill
          setTimeout(() => {
            if (!resolved) {
              try {
                pythonProcess.kill('SIGKILL');
              } catch {
                // Process already dead
              }
              resolveOnce({
                host,
                vulnerable: null,
                error: 'Scanner timeout',
                timestamp: new Date().toISOString(),
              });
            }
          }, 1000);
        }
      },
      (timeout + 5) * 1000
    );

    pythonProcess.on('close', code => {
      if (resolved) return;

      try {
        if (stdout && stdout.trim()) {
          const result = JSON.parse(stdout.trim());
          if (result.error) {
            resolveOnce({
              host,
              vulnerable: null,
              error: result.error,
              timestamp: new Date().toISOString(),
            });
          } else {
            resolveOnce({
              host: result.host || host,
              vulnerable: result.vulnerable ?? null,
              statusCode: result.statusCode,
              error: result.error,
              finalUrl: result.finalUrl,
              testedUrl: result.testedUrl,
              timestamp: result.timestamp || new Date().toISOString(),
            });
          }
        } else {
          // No output - could be an error or the process was killed
          const errorMsg = stderr
            ? stderr.trim().split('\n').pop() || 'No output from scanner'
            : code !== 0
              ? `Process exited with code ${code}`
              : 'No output from scanner';
          resolveOnce({
            host,
            vulnerable: null,
            error: errorMsg,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        resolveOnce({
          host,
          vulnerable: null,
          error: error instanceof Error ? error.message : 'Failed to parse scanner output',
          timestamp: new Date().toISOString(),
        });
      }
    });

    pythonProcess.on('error', error => {
      if (!resolved) {
        resolveOnce({
          host,
          vulnerable: null,
          error: error.message || 'Failed to start Python scanner',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Send input
    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();
  });
}

/**
 * Scan multiple hosts in parallel
 */
export async function scanHosts(
  hosts: string[],
  options: RSCScanOptions = {}
): Promise<RSCScanResult[]> {
  const { timeout = 10 } = options;
  const maxConcurrent = 10; // Limit concurrent scans

  // Process hosts in batches
  const results: RSCScanResult[] = [];
  for (let i = 0; i < hosts.length; i += maxConcurrent) {
    const batch = hosts.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(host => scanHost(host, { ...options, timeout }))
    );
    results.push(...batchResults);
  }

  return results;
}
