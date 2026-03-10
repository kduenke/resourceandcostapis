import { useState, useCallback, useEffect } from 'react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('quota-list')!;

export function QuotaListPage() {
  const { apiCall, execute } = useAzureApi();
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [resourceProvider, setResourceProvider] = useState('Microsoft.Compute');
  const [location, setLocation] = useState('eastus');

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
      description: 'The Azure subscription to query quota limits for.',
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
      name: 'resourceProvider',
      label: 'Resource Provider',
      description: 'The resource provider namespace.',
      required: true,
      type: 'select',
      placeholder: 'Select a resource provider...',
      options: [
        { value: 'Microsoft.Compute', label: 'Microsoft.Compute' },
        { value: 'Microsoft.Network', label: 'Microsoft.Network' },
        { value: 'Microsoft.Storage', label: 'Microsoft.Storage' },
        { value: 'Microsoft.Sql', label: 'Microsoft.Sql' },
        { value: 'Microsoft.MachineLearningServices', label: 'Microsoft.MachineLearningServices' },
      ],
      value: resourceProvider,
    },
    {
      name: 'location',
      label: 'Location',
      description: 'Azure region (e.g., eastus).',
      required: true,
      type: 'text',
      placeholder: 'eastus',
      value: location,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === 'subscriptionId') setSubscriptionId(value);
    if (name === 'resourceProvider') setResourceProvider(value);
    if (name === 'location') setLocation(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    await execute(apiDef, { subscriptionId, resourceProvider, location });
  }, [execute, subscriptionId, resourceProvider, location]);

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
