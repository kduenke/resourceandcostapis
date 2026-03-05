export interface ApiParameter {
  name: string;
  type: 'path' | 'query' | 'body';
  required: boolean;
  description: string;
  placeholder?: string;
  options?: string[];
}

export interface ApiDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  method: string;
  pathTemplate: string;
  apiVersion: string;
  category: 'core' | 'pricing';
  requiresAuth: boolean;
  isExternalUrl: boolean;
  parameters: ApiParameter[];
  docsUrl: string;
  bodyTemplate?: unknown;
}

export const apiCatalog: ApiDefinition[] = [
  {
    id: 'subscriptions',
    name: 'List Subscriptions',
    shortName: 'Subscriptions',
    description: 'Lists all subscriptions accessible to the authenticated user. This is typically the first API call to discover available subscriptions.',
    method: 'GET',
    pathTemplate: '/subscriptions',
    apiVersion: '2022-12-01',
    category: 'core',
    requiresAuth: true,
    isExternalUrl: false,
    parameters: [],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/resources/subscriptions/list',
  },
  {
    id: 'locations',
    name: 'List Locations',
    shortName: 'Locations',
    description: 'Lists all available Azure regions/locations for a subscription. Use this to discover where you can deploy resources.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/locations',
    apiVersion: '2022-12-01',
    category: 'core',
    requiresAuth: true,
    isExternalUrl: false,
    parameters: [
      {
        name: 'subscriptionId',
        type: 'path',
        required: true,
        description: 'The ID of the target subscription',
        placeholder: 'Select a subscription...',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/resources/subscriptions/list-locations',
  },
  {
    id: 'resource-skus',
    name: 'List Resource SKUs',
    shortName: 'Resource SKUs',
    description: 'Lists all available compute resource SKUs (VM sizes, disk types, etc.) with their capabilities, restrictions, and supported locations. This is the primary API for discovering hardware options.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/Microsoft.Compute/skus',
    apiVersion: '2021-07-01',
    category: 'core',
    requiresAuth: true,
    isExternalUrl: false,
    parameters: [
      {
        name: 'subscriptionId',
        type: 'path',
        required: true,
        description: 'The ID of the target subscription',
        placeholder: 'Select a subscription...',
      },
      {
        name: '$filter',
        type: 'query',
        required: false,
        description: 'OData filter (e.g., location eq \'eastus\')',
        placeholder: "location eq 'eastus'",
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/compute/resource-skus/list',
  },
  {
    id: 'vm-sizes',
    name: 'List VM Sizes',
    shortName: 'VM Sizes',
    description: 'Lists all available virtual machine sizes in a specific Azure location. Shows core count, memory, disk sizes, and data disk limits.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/Microsoft.Compute/locations/{location}/vmSizes',
    apiVersion: '2024-07-01',
    category: 'core',
    requiresAuth: true,
    isExternalUrl: false,
    parameters: [
      {
        name: 'subscriptionId',
        type: 'path',
        required: true,
        description: 'The ID of the target subscription',
        placeholder: 'Select a subscription...',
      },
      {
        name: 'location',
        type: 'path',
        required: true,
        description: 'Azure region name (e.g., eastus, westeurope)',
        placeholder: 'Select a location...',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/compute/virtual-machine-sizes/list',
  },
  {
    id: 'compute-resources',
    name: 'List Virtual Machines',
    shortName: 'Compute VMs',
    description: 'Lists all virtual machines in a subscription. Shows VM configuration, provisioning state, hardware profile, and OS details.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines',
    apiVersion: '2024-07-01',
    category: 'core',
    requiresAuth: true,
    isExternalUrl: false,
    parameters: [
      {
        name: 'subscriptionId',
        type: 'path',
        required: true,
        description: 'The ID of the target subscription',
        placeholder: 'Select a subscription...',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/compute/virtual-machines/list-all',
  },
  {
    id: 'retail-pricing',
    name: 'Azure Retail Prices',
    shortName: 'Retail Prices',
    description: 'Query Azure retail (list) prices. This is a PUBLIC API — no authentication required! Supports OData filtering by service, region, SKU, and more.',
    method: 'GET',
    pathTemplate: 'https://prices.azure.com/api/retail/prices',
    apiVersion: '2023-01-01-preview',
    category: 'pricing',
    requiresAuth: false,
    isExternalUrl: true,
    parameters: [
      {
        name: '$filter',
        type: 'query',
        required: false,
        description: 'OData filter expression for narrowing results',
        placeholder: "serviceName eq 'Virtual Machines' and armRegionName eq 'eastus'",
      },
      {
        name: 'meterRegion',
        type: 'query',
        required: false,
        description: "Filter to primary meter region (use 'primary')",
        placeholder: 'primary',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices',
  },
  {
    id: 'cost-management',
    name: 'Cost Management Query',
    shortName: 'Cost Query',
    description: 'Query and analyze Azure resource costs. Uses a POST request with a JSON body to specify time range, granularity, aggregation, and grouping dimensions.',
    method: 'POST',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query',
    apiVersion: '2023-11-01',
    category: 'pricing',
    requiresAuth: true,
    isExternalUrl: false,
    parameters: [
      {
        name: 'subscriptionId',
        type: 'path',
        required: true,
        description: 'The ID of the target subscription',
        placeholder: 'Select a subscription...',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/cost-management/query/usage',
    bodyTemplate: {
      type: 'ActualCost',
      timeframe: 'MonthToDate',
      dataset: {
        granularity: 'Daily',
        aggregation: {
          totalCost: {
            name: 'Cost',
            function: 'Sum',
          },
        },
        grouping: [
          {
            type: 'Dimension',
            name: 'ServiceName',
          },
        ],
      },
    },
  },
];

export function getApiById(id: string): ApiDefinition | undefined {
  return apiCatalog.find((api) => api.id === id);
}

export function getApisByCategory(category: 'core' | 'pricing'): ApiDefinition[] {
  return apiCatalog.filter((api) => api.category === category);
}
