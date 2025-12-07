import { useState, useEffect } from 'react';
import { scanRSC, type RSCScanResult } from '../utils/api';
import { formatError, getFullError } from '../utils/error-format';
import './RSCScanStatus.css';

interface RSCScanStatusProps {
  host: string;
  autoScan?: boolean;
  externalResult?: RSCScanResult;
}

type Status = 'idle' | 'scanning' | 'vulnerable' | 'safe' | 'error';

export function RSCScanStatus({ host, autoScan = false, externalResult }: RSCScanStatusProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<RSCScanResult | null>(null);

  // Update status when external result is provided
  useEffect(() => {
    if (externalResult) {
      setResult(externalResult);
      if (externalResult.vulnerable === true) {
        setStatus('vulnerable');
      } else if (externalResult.vulnerable === false) {
        setStatus('safe');
      } else {
        setStatus('error');
      }
    }
  }, [externalResult]);

  const performScan = async () => {
    if (!host) return;

    setStatus('scanning');
    try {
      const scanResult = await scanRSC(host, { timeout: 15 });
      setResult(scanResult);
      if (scanResult.vulnerable === true) {
        setStatus('vulnerable');
      } else if (scanResult.vulnerable === false) {
        setStatus('safe');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
      setResult({
        host,
        vulnerable: null,
        error: error instanceof Error ? error.message : 'Scan failed',
      });
    }
  };

  useEffect(() => {
    if (autoScan && host) {
      performScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, autoScan]);

  const getStatusIcon = () => {
    switch (status) {
      case 'scanning':
        return '⟳';
      case 'vulnerable':
        return '⚠';
      case 'safe':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '?';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'scanning':
        return 'rsc-scan-scanning';
      case 'vulnerable':
        return 'rsc-scan-vulnerable';
      case 'safe':
        return 'rsc-scan-safe';
      case 'error':
        return 'rsc-scan-error';
      default:
        return 'rsc-scan-idle';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'scanning':
        return 'Scanning...';
      case 'vulnerable':
        return 'Vulnerable';
      case 'safe':
        return 'Safe';
      case 'error':
        return result?.error ? formatError(result.error) : 'Error';
      default:
        return 'Scan';
    }
  };

  return (
    <span className={`rsc-scan-status ${getStatusClass()}`}>
      <button
        className="rsc-scan-button"
        onClick={performScan}
        disabled={status === 'scanning'}
        aria-label={`Scan ${host} for RSC vulnerability`}
        title={result?.error ? getFullError(result.error) : getStatusText()}
      >
        <span className="rsc-scan-icon">{getStatusIcon()}</span>
        {status === 'scanning' && <span className="rsc-scan-spinner">⟳</span>}
        <span className="rsc-scan-text">{getStatusText()}</span>
      </button>
    </span>
  );
}
