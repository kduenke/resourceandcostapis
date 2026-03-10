import { useState, useCallback, useEffect } from 'react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('support-tickets-create')!;

const defaultBody = JSON.stringify(apiDef.bodyTemplate, null, 2);

export function SupportTicketsCreatePage() {
  const { apiCall, execute } = useAzureApi();
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [ticketName, setTicketName] = useState('');
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
      name: 'ticketName',
      label: 'Ticket Name',
      description: 'Unique support ticket name (e.g., quota_increase_vm_eastus).',
      required: true,
      type: 'text',
      placeholder: 'quota_increase_vm_eastus',
      value: ticketName,
    },
    {
      name: 'body',
      label: 'Request Body (JSON)',
      description: 'The PUT body for creating the support ticket.',
      required: true,
      type: 'textarea',
      placeholder: 'Enter JSON body...',
      value: requestBody,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === 'subscriptionId') setSubscriptionId(value);
    if (name === 'ticketName') setTicketName(value);
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
    await execute(apiDef, { subscriptionId, ticketName }, {}, body);
  }, [execute, subscriptionId, ticketName, requestBody]);

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
