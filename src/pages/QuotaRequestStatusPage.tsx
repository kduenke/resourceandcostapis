import { useState, useCallback, useEffect } from 'react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('quota-request-status')!;

export function QuotaRequestStatusPage() {
  const { apiCall, execute } = useAzureApi();
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [resourceProvider, setResourceProvider] = useState('Microsoft.Compute');
  const [location, setLocation] = useState('eastus');
  const [requestId, setRequestId] = useState('');

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
      description: 'The Azure subscription.',
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
    {
      name: 'requestId',
      label: 'Request ID',
      description: 'The quota request ID (GUID) from a previous quota increase request.',
      required: true,
      type: 'text',
      placeholder: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
      value: requestId,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === 'subscriptionId') setSubscriptionId(value);
    if (name === 'resourceProvider') setResourceProvider(value);
    if (name === 'location') setLocation(value);
    if (name === 'requestId') setRequestId(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    await execute(apiDef, { subscriptionId, resourceProvider, location, requestId });
  }, [execute, subscriptionId, resourceProvider, location, requestId]);

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
