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

        console.log(
          `[poc-executor] PoC result for ${targetUrl}: vulnerable=${vulnerableValue}, error=${errorValue || 'none'}`
        );
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
  const results: PocScanResult[] = [];

  for (const host of hosts) {
    const result = await executePocScript(scriptId, host, options);
    results.push(result);
  }

  return results;
}
