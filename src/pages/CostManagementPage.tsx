import { useState, useCallback, useEffect } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('cost-management')!;

const defaultBody = JSON.stringify(apiDef.bodyTemplate, null, 2);

export function CostManagementPage() {
  const isAuthenticated = useIsAuthenticated();
  const { apiCall, execute } = useAzureApi();
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [requestBody, setRequestBody] = useState(defaultBody);

  useEffect(() => {
    const handler = (e: Event) => {
      setSubscriptions((e as CustomEvent).detail);
    };
    window.addEventListener('subscriptions-loaded', handler);
    return () => window.removeEventListener('subscriptions-loaded', handler);
  }, []);

  const fields: ParameterField[] = [
    {
      name: 'subscriptionId',
      label: 'Subscription ID',
      description: 'The Azure subscription to query costs for.',
      required: true,
      type: subscriptions.length > 0 ? 'select' : 'text',
      placeholder: 'Enter or select a subscription ID...',
      options: subscriptions.map((s) => ({
        value: s.subscriptionId,
        label: `${s.displayName} (${s.subscriptionId})`,
      })),
      value: subscriptionId,
    },
    {
      name: 'body',
      label: 'Request Body (JSON)',
      description: 'The POST body for the cost management query. Edit the JSON to change timeframe, granularity, aggregation, and grouping.',
      required: true,
      type: 'textarea',
      placeholder: 'Enter JSON body...',
      value: requestBody,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === 'subscriptionId') setSubscriptionId(value);
    if (name === 'body') setRequestBody(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    let body: unknown;
    try {
      body = JSON.parse(requestBody);
    } catch {
      alert('Invalid JSON in request body');
      return;
    }
    await execute(apiDef, { subscriptionId }, {}, body);
  }, [execute, subscriptionId, requestBody]);

  if (!isAuthenticated) {
    return (
      <div className="api-explorer animate-in">
        <div className="api-empty-state">
          <div className="empty-icon">🔐</div>
          <h3>Authentication Required</h3>
          <p>Sign in with Microsoft to access this API.</p>
        </div>
      </div>
    );
  }

  return (
    <ApiExplorer
      apiDef={apiDef}
      fields={fields}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      apiCall={apiCall}
    />
  );
}
