import { useState, useCallback, useEffect } from 'react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('quota-update')!;

const defaultBody = JSON.stringify(apiDef.bodyTemplate, null, 2);

export function QuotaUpdatePage() {
  const { apiCall, execute } = useAzureApi();
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [resourceProvider, setResourceProvider] = useState('Microsoft.Compute');
  const [location, setLocation] = useState('eastus');
  const [quotaName, setQuotaName] = useState('standardDSv3Family');
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
      name: 'quotaName',
      label: 'Quota Name',
      description: 'The quota resource name (e.g., standardDSv3Family).',
      required: true,
      type: 'text',
      placeholder: 'standardDSv3Family',
      value: quotaName,
    },
    {
      name: 'body',
      label: 'Request Body (JSON)',
      description: 'The PUT body for the quota increase request.',
      required: true,
      type: 'textarea',
      placeholder: 'Enter JSON body...',
      value: requestBody,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === 'subscriptionId') setSubscriptionId(value);
    if (name === 'resourceProvider') setResourceProvider(value);
    if (name === 'location') setLocation(value);
    if (name === 'quotaName') setQuotaName(value);
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
    await execute(apiDef, { subscriptionId, resourceProvider, location, quotaName }, {}, body);
  }, [execute, subscriptionId, resourceProvider, location, quotaName, requestBody]);

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
