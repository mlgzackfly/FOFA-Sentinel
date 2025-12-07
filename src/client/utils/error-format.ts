/**
 * Format error messages for UI display
 * Truncates long error messages and extracts key information
 */

export function formatError(error: string | undefined | null): string {
  if (!error) {
    return '';
  }

  // Extract error type and key information
  let formatted = error;

  // SSL Certificate errors
  if (error.includes('SSL') || error.includes('certificate')) {
    if (error.includes('hostname') && error.includes("doesn't match")) {
      // Extract hostname mismatch info
      const match = error.match(/hostname '([^']+)' doesn't match (?:either of )?['"]([^'"]+)['"]/);
      if (match) {
        return `SSL: Hostname mismatch (${match[1]})`;
      }
      return 'SSL: Certificate hostname mismatch';
    }
    if (error.includes('CERTIFICATE_VERIFY_FAILED')) {
      if (error.includes('self signed')) {
        return 'SSL: Self-signed certificate';
      }
      if (error.includes('expired')) {
        return 'SSL: Certificate expired';
      }
      if (error.includes('unable to get local issuer')) {
        return 'SSL: Certificate verification failed';
      }
      return 'SSL: Certificate error';
    }
    if (error.includes('SSLError')) {
      return 'SSL: Connection error';
    }
    return 'SSL: Certificate error';
  }

  // Connection errors
  if (error.includes('Connection') || error.includes('connection')) {
    if (error.includes('timeout') || error.includes('timed out')) {
      return 'Connection timeout';
    }
    if (error.includes('refused')) {
      return 'Connection refused';
    }
    if (error.includes('unreachable') || error.includes('Network is unreachable')) {
      return 'Network unreachable';
    }
    if (error.includes('reset')) {
      return 'Connection reset';
    }
    if (error.includes('aborted')) {
      return 'Connection aborted';
    }
    return 'Connection error';
  }

  // Timeout errors
  if (error.includes('timeout') || error.includes('Timeout')) {
    return 'Request timeout';
  }

  // Scanner timeout
  if (error.includes('Scanner timeout')) {
    return 'Scanner timeout';
  }

  // Generic truncation for other long errors
  if (error.length > 60) {
    // Try to extract the first meaningful part
    const parts = error.split(':');
    if (parts.length > 1) {
      const firstPart = parts[0].trim();
      if (firstPart.length > 0 && firstPart.length < 50) {
        return `${firstPart}...`;
      }
    }
    return `${error.substring(0, 57)}...`;
  }

  return error;
}

/**
 * Get full error message for tooltip or detailed view
 */
export function getFullError(error: string | undefined | null): string {
  if (!error) {
    return '';
  }
  return error;
}
