import { MethodBadge } from '../common/MethodBadge';
import { CopyButton } from '../common/CopyButton';
import { maskToken } from '../../utils/formatters';
import type { ApiRequestInfo } from '../../types/azure';
import './RequestPanel.css';

interface RequestPanelProps {
  request: ApiRequestInfo;
}

export function RequestPanel({ request }: RequestPanelProps) {
  const queryString = Object.entries(request.queryParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const fullUrl = `${request.url}${queryString ? '?' + queryString : ''}`;

  return (
    <div className="request-panel">
      <div className="request-panel-header">
        <h3 className="panel-title">
          <span className="panel-icon">📤</span> Request
        </h3>
        <CopyButton text={fullUrl} label="Copy URL" />
      </div>

      <div className="request-url-bar">
        <MethodBadge method={request.method} size="lg" />
        <code className="request-url">{request.url}</code>
      </div>

      {Object.keys(request.queryParams).length > 0 && (
        <div className="request-section">
          <h4 className="request-section-title">Query Parameters</h4>
          <div className="request-params-table">
            {Object.entries(request.queryParams).map(([key, value]) => (
              <div key={key} className="request-param-row">
                <span className="param-key">{key}</span>
                <span className="param-sep">=</span>
                <span className="param-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="request-section">
        <h4 className="request-section-title">Headers</h4>
        <div className="request-params-table">
          {Object.entries(request.headers).map(([key, value]) => (
            <div key={key} className="request-param-row">
              <span className="param-key">{key}</span>
              <span className="param-sep">:</span>
              <span className="param-value">
                {key.toLowerCase() === 'authorization'
                  ? `Bearer ${maskToken(value.replace('Bearer ', ''))}`
                  : value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {request.body != null && (
        <div className="request-section">
          <h4 className="request-section-title">Request Body</h4>
          <pre className="request-body-code">{JSON.stringify(request.body, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
