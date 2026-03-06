import { useState, useCallback } from 'react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';
import type { AzureSubscription } from '../types/azure';

const apiDef = getApiById('subscriptions')!;

export function SubscriptionsPage() {
  const { apiCall, execute } = useAzureApi();
  const [fields] = useState<ParameterField[]>([]);

  const handleSubmit = useCallback(async () => {
    const result = await execute(apiDef, {});
    if (result.response?.body) {
      const body = result.response.body as { value?: AzureSubscription[] };
      if (body.value) {
        const event = new CustomEvent('subscriptions-loaded', { detail: body.value });
        window.dispatchEvent(event);
      }
    }
  }, [execute]);

  return (
    <ApiExplorer
      apiDef={apiDef}
      fields={fields}
      onFieldChange={() => {}}
      onSubmit={handleSubmit}
      apiCall={apiCall}
    />
  );
}
