/**
 * PoC Script Executor Service
 * Executes PoC scripts based on their language and type
 */

import { spawn } from 'node:child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPocScript } from './poc-scripts.js';
import { randomUUID } from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '../../../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export interface PocScanOptions {
  timeout?: number;
  verifySsl?: boolean;
  followRedirects?: boolean;
  customHeaders?: Record<string, string>;
  [key: string]: unknown; // Allow additional options for different PoC types
}

export interface PocScanResult {
  host: string;
  vulnerable: boolean | null;
  statusCode?: number;
  error?: string;
  finalUrl?: string;
  testedUrl?: string;
  timestamp?: string;
  pocOutput?: string; // Additional output from PoC script
}

/**
 * Execute a PoC script against a host
 */
export async function executePocScript(
  scriptId: string,
  host: string,
  options: PocScanOptions = {}
): Promise<PocScanResult> {
  const script = getPocScript(scriptId);

  if (!script.enabled) {
    throw new Error(`PoC script ${script.name} is disabled`);
  }

  // Normalize host URL
  let targetUrl = host.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  const timeout = options.timeout || 15;
  const timestamp = new Date().toISOString();

  try {
    switch (script.language) {
      case 'python':
        return await executePythonPoc(script, targetUrl, options, timeout);
      case 'http':
        return await executeHttpRequestPoc(script, targetUrl, options, timeout);
      case 'javascript':
        return await executeJavaScriptPoc(script, targetUrl, options, timeout);
      case 'bash':
        return await executeBashPoc(script, targetUrl, options, timeout);
      default:
        throw new Error(`Unsupported language: ${script.language}`);
    }
  } catch (error) {
    return {
      host: targetUrl,
      vulnerable: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}

/**
 * Execute Python PoC script
 */
async function executePythonPoc(
  script: { script: string; parameters?: Record<string, any> },
  targetUrl: string,
  options: PocScanOptions,
  timeout: number
): Promise<PocScanResult> {
  return new Promise(resolve => {
    // Create temporary Python file
    const tempFile = path.join(TEMP_DIR, `poc_${randomUUID()}.py`);
    fs.writeFileSync(tempFile, script.script);

    // Prepare command arguments
    const args = [tempFile, targetUrl];

    // Add additional parameters if needed
    if (script.parameters) {
      Object.entries(script.parameters).forEach(([key, value]) => {
        if (options[key] !== undefined) {
          args.push(`--${key}`, String(options[key]));
        } else if (value !== undefined) {
          args.push(`--${key}`, String(value));
        }
      });
    }

    // Use uv to run Python script
    const proc = spawn('uv', ['run', 'python3', ...args], {
      cwd: path.join(__dirname, '../../../'),
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let output = '';

    proc.stdout?.on('data', data => {
      const text = data.toString();
      stdout += text;
      output += text;
    });

    proc.stderr?.on('data', data => {
      const text = data.toString();
      stderr += text;
      output += text;
    });

    const timeoutId = setTimeout(() => {
      proc.kill();
      resolve({
        host: targetUrl,
        vulnerable: null,
        error: 'PoC execution timeout',
        timestamp: new Date().toISOString(),
      });
    }, timeout * 1000);

    proc.on('close', code => {
      clearTimeout(timeoutId);

      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      // Try to parse JSON output
      try {
        const jsonOutput = JSON.parse(stdout.trim() || '{}');
        // Handle vulnerable field: can be true, false, or null/undefined
        // Use explicit check instead of ?? to preserve false values
        let vulnerableValue: boolean | null = null;
        if (jsonOutput.vulnerable === true) {
          vulnerableValue = true;
        } else if (jsonOutput.vulnerable === false) {
          vulnerableValue = false;
        } else {
          vulnerableValue = null;
        }
        // If vulnerable is false, it means the target is safe (not vulnerable)
        // In this case, error messages like "No vulnerable endpoint found" are informational, not actual errors
        // Only set error if vulnerable is null (actual error occurred) or if vulnerable is true but there's a real error
        let errorValue: string | undefined = undefined;
        if (vulnerableValue === null) {
          // Actual error - keep the error message
          errorValue = jsonOutput.error;
        } else if (vulnerableValue === false) {
          // Safe (not vulnerable) - clear error message as it's not an error
          // Messages like "No vulnerable endpoint found" are expected and not errors
          errorValue = undefined;
        } else if (vulnerableValue === true && jsonOutput.error) {
          // Vulnerable but has error - might be a warning, keep it
          errorValue = jsonOutput.error;
        }

        resolve({
          host: targetUrl,
          vulnerable: vulnerableValue,
          statusCode: jsonOutput.status_code,
          error: errorValue,
          finalUrl: jsonOutput.final_url,
          testedUrl: jsonOutput.tested_url || targetUrl,
          pocOutput: output,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // If not JSON, check for vulnerability indicators in output
        const isVulnerable =
          output.toLowerCase().includes('vulnerable') ||
          output.toLowerCase().includes('exploit') ||
          (code === 0 && !stderr.includes('error'));

        resolve({
          host: targetUrl,
          vulnerable: isVulnerable ? true : null,
          error: stderr || (code !== 0 ? `Process exited with code ${code}` : undefined),
          testedUrl: targetUrl,
          pocOutput: output,
          timestamp: new Date().toISOString(),
        });
      }
    });

    proc.on('error', error => {
      clearTimeout(timeoutId);
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      resolve({
        host: targetUrl,
        vulnerable: null,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

/**
 * Execute HTTP Request PoC
 * Parses raw HTTP request text and sends it to target host
 */
async function executeHttpRequestPoc(
  script: { script: string },
  targetUrl: string,
  options: PocScanOptions,
  timeout: number
): Promise<PocScanResult> {
  try {
    // Parse the raw HTTP request
    const lines = script.script.split(/\r?\n/);
    if (lines.length === 0) {
      throw new Error('Empty HTTP request');
    }

    // Parse request line: METHOD PATH HTTP/VERSION
    const requestLine = lines[0].trim();
    const requestLineMatch = requestLine.match(/^(\w+)\s+(.+?)\s+(HTTP\/[\d.]+)$/i);
    if (!requestLineMatch) {
      throw new Error(`Invalid HTTP request line: ${requestLine}`);
    }

    const method = requestLineMatch[1].toUpperCase();
    let path = requestLineMatch[2];

    // Parse headers
    const headers: Record<string, string> = {};
    let bodyStartIndex = 1;
    let body = '';

    // Find where headers end (empty line)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') {
        // Empty line marks end of headers
        bodyStartIndex = i + 1;
        break;
      }

      // Parse header: Key: Value
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    }

    // Extract body (everything after empty line)
    if (bodyStartIndex < lines.length) {
      body = lines.slice(bodyStartIndex).join('\n');
    }

    // Parse target URL to extract host and port
    let targetHost: string;
    let targetPort: number;
    let targetProtocol: string;

    try {
      const url = new URL(targetUrl);
      targetHost = url.hostname;
      targetPort = url.port ? parseInt(url.port, 10) : url.protocol === 'https:' ? 443 : 80;
      targetProtocol = url.protocol.replace(':', '');
    } catch {
      // If targetUrl is not a full URL, try to parse it
      if (targetUrl.includes('://')) {
        throw new Error(`Invalid target URL: ${targetUrl}`);
      }
      // Assume it's a hostname
      targetHost = targetUrl;
      targetPort = 80;
      targetProtocol = 'http';
    }

    // Replace Host header with target host
    headers['Host'] =
      targetPort === 80 || targetPort === 443 ? targetHost : `${targetHost}:${targetPort}`;

    // Build full URL from path
    // If path is absolute (starts with /), use it as is
    // Otherwise, treat it as relative to root
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    const fullUrl = `${targetProtocol}://${targetHost}${targetPort !== 80 && targetPort !== 443 ? `:${targetPort}` : ''}${path}`;

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method,
      headers: headers,
      signal: AbortSignal.timeout(timeout * 1000),
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      fetchOptions.body = body;
    }

    // Send HTTP request
    const startTime = Date.now();
    const response = await fetch(fullUrl, fetchOptions);
    const responseTime = Date.now() - startTime;

    // Read response body
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch (e) {
      // Ignore body read errors
    }

    // Determine vulnerability based on response
    // This is a simple heuristic - can be enhanced based on specific PoC requirements
    let vulnerable: boolean | null = null;
    let error: string | undefined = undefined;

    // Check response status
    if (response.status >= 200 && response.status < 300) {
      // Success response - check if it indicates vulnerability
      // Common indicators: command execution results, error messages, etc.
      const bodyLower = responseBody.toLowerCase();
      const hasVulnerabilityIndicators =
        bodyLower.includes('uid=') ||
        bodyLower.includes('gid=') ||
        bodyLower.includes('whoami') ||
        bodyLower.includes('root') ||
        bodyLower.includes('administrator') ||
        bodyLower.includes('command') ||
        bodyLower.includes('exec') ||
        responseBody.length > 0; // Non-empty response might indicate success

      vulnerable = hasVulnerabilityIndicators ? true : false;
    } else if (response.status >= 400 && response.status < 500) {
      // Client error - likely not vulnerable or wrong endpoint
      vulnerable = false;
      error = `HTTP ${response.status}: ${response.statusText}`;
    } else if (response.status >= 500) {
      // Server error - might indicate vulnerability or server issue
      vulnerable = null;
      error = `HTTP ${response.status}: ${response.statusText}`;
    } else {
      // Other status codes
      vulnerable = null;
    }

    // If vulnerable is false, clear error (it's informational)
    if (vulnerable === false) {
      error = undefined;
    }

    return {
      host: targetUrl,
      vulnerable: vulnerable,
      statusCode: response.status,
      error: error,
      finalUrl: fullUrl,
      testedUrl: fullUrl,
      pocOutput: `Response Status: ${response.status} ${response.statusText}\nResponse Time: ${responseTime}ms\n\nResponse Headers:\n${Array.from(
        response.headers.entries()
      )
        .map(([k, v]) => `${k}: ${v}`)
        .join(
          '\n'
        )}\n\nResponse Body:\n${responseBody.substring(0, 1000)}${responseBody.length > 1000 ? '...' : ''}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[http-poc] Error executing HTTP request:`, errorMessage);
    return {
      host: targetUrl,
      vulnerable: null,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Execute JavaScript PoC script
 */
async function executeJavaScriptPoc(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _script: { script: string },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: PocScanOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _timeout: number
): Promise<PocScanResult> {
  // For now, JavaScript PoCs would need to be executed in Node.js context
  // This is a placeholder - can be enhanced later
  throw new Error('JavaScript PoC execution not yet implemented');
}

/**
 * Execute Bash PoC script
 */
async function executeBashPoc(
  script: { script: string },
  targetUrl: string,
  options: PocScanOptions,
  timeout: number
): Promise<PocScanResult> {
  return new Promise(resolve => {
    const tempFile = path.join(TEMP_DIR, `poc_${randomUUID()}.sh`);
    fs.writeFileSync(tempFile, script.script);
    fs.chmodSync(tempFile, 0o755);

    const proc = spawn('bash', [tempFile, targetUrl], {
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', data => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      proc.kill();
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      resolve({
        host: targetUrl,
        vulnerable: null,
        error: 'PoC execution timeout',
        timestamp: new Date().toISOString(),
      });
    }, timeout * 1000);

    proc.on('close', code => {
      clearTimeout(timeoutId);
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      resolve({
        host: targetUrl,
        vulnerable: code === 0 ? true : null,
        error: stderr || (code !== 0 ? `Process exited with code ${code}` : undefined),
        testedUrl: targetUrl,
        pocOutput: stdout,
        timestamp: new Date().toISOString(),
      });
    });

    proc.on('error', error => {
      clearTimeout(timeoutId);
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      resolve({
        host: targetUrl,
        vulnerable: null,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

/**
 * Execute PoC script for multiple hosts
 */
export async function executePocScriptForHosts(
  scriptId: string,
  hosts: string[],
  options: PocScanOptions = {}
): Promise<PocScanResult[]> {
  // Execute all hosts in parallel using Promise.allSettled
  // This ensures that if one host hangs or fails, others can still complete

  const promises = hosts.map(host => {
    // Wrap each execution in a promise that will always resolve
    // This prevents one hanging host from blocking others
    return Promise.race([
      executePocScript(scriptId, host, options),
      new Promise<PocScanResult>(resolve => {
        // Fallback timeout (should be longer than PoC timeout)
        const fallbackTimeout = (options.timeout || 30) * 1000 + 5000; // PoC timeout + 5s buffer
        setTimeout(() => {
          resolve({
            host,
            vulnerable: null,
            error: 'Scan timeout (fallback)',
            timestamp: new Date().toISOString(),
          });
        }, fallbackTimeout);
      }),
    ]);
  });

  // Use allSettled to ensure all promises complete, even if some fail
  const settledResults = await Promise.allSettled(promises);

  const results: PocScanResult[] = settledResults.map((settled, index) => {
    if (settled.status === 'fulfilled') {
      return settled.value;
    } else {
      // If a promise was rejected, create an error result
      console.error(`[executePocScriptForHosts] Host ${hosts[index]} failed:`, settled.reason);
      return {
        host: hosts[index],
        vulnerable: null,
        error: settled.reason instanceof Error ? settled.reason.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  });

  return results;
}
