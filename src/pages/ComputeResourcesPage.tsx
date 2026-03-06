import { useState, useCallback, useEffect } from 'react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('compute-resources')!;

export function ComputeResourcesPage() {
  const { apiCall, execute } = useAzureApi();
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');

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
      description: 'The Azure subscription to list virtual machines for.',
      required: true,
      type: subscriptions.length > 0 ? 'select' : 'text',
      placeholder: 'Enter or select a subscription ID...',
      options: subscriptions.map((s) => ({
        value: s.subscriptionId,
        label: `${s.displayName} (${s.subscriptionId})`,
      })),
      value: subscriptionId,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === 'subscriptionId') setSubscriptionId(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    await execute(apiDef, { subscriptionId });
  }, [execute, subscriptionId]);

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
