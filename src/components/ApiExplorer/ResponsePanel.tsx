import { JsonViewer } from '../common/JsonViewer';
import { CopyButton } from '../common/CopyButton';
import { formatDuration } from '../../utils/formatters';
import type { ApiResponseInfo } from '../../types/azure';
import './ResponsePanel.css';

interface ResponsePanelProps {
  response: ApiResponseInfo;
}

export function ResponsePanel({ response }: ResponsePanelProps) {
  const isSuccess = response.status >= 200 && response.status < 300;
  const statusClass = isSuccess ? 'status-success' : 'status-error';

  const bodyStr = typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2);
  const itemCount = getItemCount(response.body);

  return (
    <div className="response-panel">
      <div className="response-panel-header">
        <h3 className="panel-title">
          <span className="panel-icon">📥</span> Response
        </h3>
        <div className="response-meta">
          <span className={`response-status ${statusClass}`}>
            {response.status} {response.statusText}
          </span>
          <span className="response-timing">{formatDuration(response.duration)}</span>
          {itemCount !== null && (
            <span className="response-count">{itemCount} items</span>
          )}
          <CopyButton text={bodyStr} label="Copy JSON" />
        </div>
      </div>

      <div className="response-headers-section">
        <details>
          <summary className="response-headers-toggle">Response Headers ({Object.keys(response.headers).length})</summary>
          <div className="response-headers-list">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="response-header-row">
                <span className="header-key">{key}</span>
                <span className="header-value">{value}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="response-body">
        {typeof response.body === 'object' ? (
          <JsonViewer data={response.body} />
        ) : (
          <pre className="response-body-text">{bodyStr}</pre>
        )}
      </div>
    </div>
  );
}

function getItemCount(body: unknown): number | null {
  if (body && typeof body === 'object' && 'value' in body && Array.isArray((body as Record<string, unknown>).value)) {
    return (body as Record<string, unknown[]>).value.length;
  }
  if (body && typeof body === 'object' && 'Items' in body && Array.isArray((body as Record<string, unknown>).Items)) {
    return (body as Record<string, unknown[]>).Items.length;
  }
  return null;
}
