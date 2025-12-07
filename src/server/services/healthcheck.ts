/**
 * Health check service for verifying if hosts are alive
 */

interface HealthCheckOptions {
  timeout?: number;
  port?: number;
  protocol?: 'http' | 'https';
}

interface HealthCheckResult {
  host: string;
  alive: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

/**
 * Check if a host is alive by attempting HTTP/HTTPS connection
 */
export async function checkHostHealth(
  host: string,
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const { timeout = 5000, port, protocol = 'https' } = options;

  // Parse host to extract hostname and port if present
  let hostname = host;
  let defaultPort = port;

  // Handle URLs like http://example.com or https://example.com:8080
  if (host.startsWith('http://') || host.startsWith('https://')) {
    try {
      const url = new URL(host);
      hostname = url.hostname;
      defaultPort = url.port ? parseInt(url.port, 10) : undefined;
      const urlProtocol = url.protocol.replace(':', '');
      if (urlProtocol === 'http' || urlProtocol === 'https') {
        // Use protocol from URL if present
      }
    } catch {
      // Invalid URL, use as-is
    }
  } else if (host.includes(':')) {
    // Handle host:port format
    const parts = host.split(':');
    hostname = parts[0];
    defaultPort = parseInt(parts[1], 10) || undefined;
  }

  const finalPort = defaultPort || (protocol === 'https' ? 443 : 80);
  const finalProtocol = defaultPort === 443 || (!defaultPort && protocol === 'https') ? 'https' : 'http';
  const url = `${finalProtocol}://${hostname}${finalPort && finalPort !== 80 && finalPort !== 443 ? `:${finalPort}` : ''}`;

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'FOFA-Sentinel/1.0',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      host,
      alive: response.ok || response.status < 500,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Try TCP connection as fallback
    try {
      const net = await import('node:net');
      const socket = new net.Socket();
      const tcpAlive = await new Promise<boolean>((resolve) => {
        const tcpTimeout = setTimeout(() => {
          socket.destroy();
          resolve(false);
        }, timeout);

        socket.connect(finalPort, hostname, () => {
          clearTimeout(tcpTimeout);
          socket.destroy();
          resolve(true);
        });

        socket.on('error', () => {
          clearTimeout(tcpTimeout);
          resolve(false);
        });
      });

      return {
        host,
        alive: tcpAlive,
        responseTime,
        error: tcpAlive ? undefined : errorMessage,
      };
    } catch {
      return {
        host,
        alive: false,
        responseTime,
        error: errorMessage,
      };
    }
  }
}

/**
 * Check multiple hosts in parallel
 */
export async function checkHostsHealth(
  hosts: string[],
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult[]> {
  const checks = hosts.map((host) => checkHostHealth(host, options));
  return Promise.all(checks);
}

