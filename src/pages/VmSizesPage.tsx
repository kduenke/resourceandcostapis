import { useState, useCallback, useEffect } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('vm-sizes')!;

export function VmSizesPage() {
  const isAuthenticated = useIsAuthenticated();
  const { apiCall, execute } = useAzureApi();
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [filter, setFilter] = useState("location eq 'eastus'");

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
      description: 'The Azure subscription to query VM sizes for.',
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
      name: '$filter',
      label: 'Filter',
      description: "OData filter to narrow results by location (e.g., location eq 'eastus'). The legacy /vmSizes endpoint is deprecated — this uses Resource SKUs with a filter instead.",
      required: true,
      type: 'text',
      placeholder: "location eq 'eastus'",
      value: filter,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === 'subscriptionId') setSubscriptionId(value);
    if (name === '$filter') setFilter(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    await execute(apiDef, { subscriptionId }, { '$filter': filter });
  }, [execute, subscriptionId, filter]);

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
