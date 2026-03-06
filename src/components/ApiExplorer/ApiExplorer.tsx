import { MethodBadge } from '../common/MethodBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ParameterForm } from './ParameterForm';
import type { ParameterField } from './ParameterForm';
import { RequestPanel } from './RequestPanel';
import { ResponsePanel } from './ResponsePanel';
import { CodeSnippets } from './CodeSnippets';
import type { ApiDefinition } from '../../services/apiCatalog';
import type { CapturedApiCall } from '../../types/azure';
import './ApiExplorer.css';

interface ApiExplorerProps {
  apiDef: ApiDefinition;
  fields: ParameterField[];
  onFieldChange: (name: string, value: string) => void;
  onSubmit: () => void;
  apiCall: CapturedApiCall | null;
  children?: React.ReactNode;
}

export function ApiExplorer({ apiDef, fields, onFieldChange, onSubmit, apiCall, children }: ApiExplorerProps) {
  return (
    <div className="api-explorer animate-in">
      <div className="api-explorer-header">
        <div className="api-header-top">
          <MethodBadge method={apiDef.method} size="lg" />
          <h2 className="api-name">{apiDef.name}</h2>
          {!apiDef.requiresAuth && <span className="api-public-badge">🌐 No Auth Required</span>}
        </div>
        <p className="api-description">{apiDef.description}</p>
        <div className="api-meta">
          <code className="api-endpoint">
            {apiDef.isExternalUrl ? apiDef.pathTemplate : `https://management.azure.com${apiDef.pathTemplate}`}
          </code>
          <a href={apiDef.docsUrl} target="_blank" rel="noopener noreferrer" className="api-docs-link">
            📖 View Docs ↗
          </a>
        </div>
      </div>

      <div className="api-explorer-body">
        <div className="api-explorer-left">
          <ParameterForm
            fields={fields}
            onChange={onFieldChange}
            onSubmit={onSubmit}
            loading={apiCall?.loading || false}
          />
        </div>

        <div className="api-explorer-right">
          {apiCall?.loading && <LoadingSpinner />}

          {apiCall && !apiCall.loading && apiCall.request && (
            <div className="api-results animate-in">
              <RequestPanel request={apiCall.request} />

              {apiCall.response && <ResponsePanel response={apiCall.response} />}

              {apiCall.error && !apiCall.response && (
                <div className="api-error-panel">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{apiCall.error}</span>
                </div>
              )}

              <CodeSnippets request={apiCall.request} apiId={apiDef.id} />

              {children}
            </div>
          )}

          {!apiCall && (
            <div className="api-empty-state">
              <div className="empty-icon">⬡</div>
              <h3>Ready to Explore</h3>
              <p>Fill in the parameters and click <strong>Send Request</strong> to call this Azure API. You'll see the exact HTTP request, response, and code snippets.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
