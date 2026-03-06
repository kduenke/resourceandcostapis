import { useMemo } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { MethodBadge } from '../common/MethodBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ParameterForm } from './ParameterForm';
import type { ParameterField } from './ParameterForm';
import { RequestPanel } from './RequestPanel';
import { ResponsePanel } from './ResponsePanel';
import { CodeSnippets } from './CodeSnippets';
import type { ApiDefinition } from '../../services/apiCatalog';
import type { CapturedApiCall } from '../../types/azure';
import { mockResponses } from '../../services/mockData';
import './ApiExplorer.css';

function buildMockApiCall(apiDef: ApiDefinition): CapturedApiCall {
  const baseUrl = apiDef.displayUrl
    || (apiDef.isExternalUrl ? apiDef.pathTemplate : `https://management.azure.com${apiDef.pathTemplate}`);

  return {
    request: {
      method: apiDef.method,
      url: `${baseUrl}?api-version=${apiDef.apiVersion}`,
      headers: {
        'content-type': 'application/json',
        ...(apiDef.requiresAuth ? { authorization: 'Bearer ••••••' } : {}),
      },
      queryParams: { 'api-version': apiDef.apiVersion },
      timestamp: Date.now(),
    },
    response: {
      status: 200,
      statusText: 'OK (Sample)',
      headers: { 'content-type': 'application/json' },
      body: mockResponses[apiDef.id] ?? {},
      duration: 0,
    },
    loading: false,
    error: null,
  };
}

interface ApiExplorerProps {
  apiDef: ApiDefinition;
  fields: ParameterField[];
  onFieldChange: (name: string, value: string) => void;
  onSubmit: () => void;
  apiCall: CapturedApiCall | null;
  children?: React.ReactNode;
}

export function ApiExplorer({ apiDef, fields, onFieldChange, onSubmit, apiCall, children }: ApiExplorerProps) {
  const isAuthenticated = useIsAuthenticated();
  const mockCall = useMemo(() => buildMockApiCall(apiDef), [apiDef]);

  // Show live data when a real call has been made; otherwise show mock preview
  const displayCall = apiCall ?? mockCall;
  const isShowingMock = !apiCall;

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
            {apiDef.displayUrl || (apiDef.isExternalUrl ? apiDef.pathTemplate : `https://management.azure.com${apiDef.pathTemplate}`)}
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
            disableSubmit={!isAuthenticated && apiDef.requiresAuth}
            disableMessage="🔐 Sign in with Microsoft to send live requests for this API."
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

          {isShowingMock && !displayCall.loading && displayCall.request && (
            <div className="api-results animate-in">
              <div className="api-sample-banner">
                📋 Sample Data — Sign in with Microsoft to make live API calls
              </div>

              <RequestPanel request={displayCall.request} />

              {displayCall.response && <ResponsePanel response={displayCall.response} />}

              <CodeSnippets request={displayCall.request} apiId={apiDef.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
