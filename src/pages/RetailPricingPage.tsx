import { useState, useCallback } from 'react';
import { ApiExplorer } from '../components/ApiExplorer/ApiExplorer';
import { getApiById } from '../services/apiCatalog';
import { useAzureApi } from '../hooks/useAzureApi';
import type { ParameterField } from '../components/ApiExplorer/ParameterForm';

const apiDef = getApiById('retail-pricing')!;

export function RetailPricingPage() {
  const { apiCall, execute } = useAzureApi();
  const [filter, setFilter] = useState("serviceName eq 'Virtual Machines' and armRegionName eq 'eastus'");
  const [meterRegion, setMeterRegion] = useState('primary');

  const fields: ParameterField[] = [
    {
      name: '$filter',
      label: 'OData Filter',
      description: "Filter retail prices. Examples: serviceName eq 'Virtual Machines', armRegionName eq 'eastus', skuName eq 'D2 v3'",
      required: false,
      type: 'text',
      placeholder: "serviceName eq 'Virtual Machines' and armRegionName eq 'eastus'",
      value: filter,
    },
    {
      name: 'meterRegion',
      label: 'Meter Region',
      description: "Filter to primary meter region. Use 'primary' to get only primary region meters.",
      required: false,
      type: 'text',
      placeholder: 'primary',
      value: meterRegion,
    },
  ];

  const handleFieldChange = useCallback((name: string, value: string) => {
    if (name === '$filter') setFilter(value);
    if (name === 'meterRegion') setMeterRegion(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    const queryOverrides: Record<string, string> = {};
    if (filter.trim()) queryOverrides['$filter'] = filter.trim();
    if (meterRegion.trim()) queryOverrides['meterRegion'] = meterRegion.trim();
    await execute(apiDef, {}, queryOverrides);
  }, [execute, filter, meterRegion]);

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
