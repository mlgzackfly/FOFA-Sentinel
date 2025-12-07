import { useState, useEffect } from 'react';
import { checkHostHealth, type HealthCheckResult } from '../utils/api';
import { getFullError } from '../utils/error-format';
import './HealthCheckStatus.css';

interface HealthCheckStatusProps {
  host: string;
  autoCheck?: boolean;
  externalResult?: HealthCheckResult;
}

type Status = 'idle' | 'checking' | 'alive' | 'dead';

export function HealthCheckStatus({
  host,
  autoCheck = false,
  externalResult,
}: HealthCheckStatusProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<HealthCheckResult | null>(null);

  // Update status when external result is provided
  useEffect(() => {
    if (externalResult) {
      setResult(externalResult);
      setStatus(externalResult.alive ? 'alive' : 'dead');
    }
  }, [externalResult]);

  const performCheck = async () => {
    if (!host) return;

    setStatus('checking');
    try {
      const checkResult = await checkHostHealth(host, { timeout: 5000 });
      setResult(checkResult);
      setStatus(checkResult.alive ? 'alive' : 'dead');
    } catch (error) {
      setStatus('dead');
      setResult({
        host,
        alive: false,
        error: error instanceof Error ? error.message : 'Check failed',
      });
    }
  };

  useEffect(() => {
    if (autoCheck && host) {
      performCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, autoCheck]);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return '⟳';
      case 'alive':
        return '✓';
      case 'dead':
        return '✗';
      default:
        return '?';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'checking':
        return 'health-check-checking';
      case 'alive':
        return 'health-check-alive';
      case 'dead':
        return 'health-check-dead';
      default:
        return 'health-check-idle';
    }
  };

  return (
    <span className={`health-check-status ${getStatusClass()}`}>
      <button
        className="health-check-button"
        onClick={performCheck}
        disabled={status === 'checking'}
        aria-label={`Check if ${host} is alive`}
        title={
          result?.error
            ? getFullError(result.error)
            : result?.alive
              ? 'Host is alive'
              : 'Host is dead'
        }
      >
        <span className="health-check-icon">{getStatusIcon()}</span>
        {status === 'checking' && <span className="health-check-spinner">⟳</span>}
      </button>
    </span>
  );
}
