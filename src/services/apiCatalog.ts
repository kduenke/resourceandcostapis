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
  category: 'core' | 'pricing' | 'quota' | 'support';
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
    name: 'List VM Sizes (via Resource SKUs)',
    shortName: 'VM Sizes',
    description: 'Lists available virtual machine sizes filtered to a specific location. Uses the Resource SKUs API (the legacy /vmSizes endpoint is deprecated). Shows capabilities like vCPUs, memory, disks, and restrictions.',
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
        required: true,
        description: "Filter to VM sizes in a location (e.g., location eq 'eastus')",
        placeholder: "location eq 'eastus'",
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/compute/resource-skus/list',
  },
  {
    id: 'compute-resources',
    name: 'List Virtual Machines',
    shortName: 'Compute VMs',
    description: 'Lists all virtual machines in a subscription. Shows VM configuration, provisioning state, hardware profile, and OS details.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines',
    apiVersion: '2025-04-01',
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
    apiVersion: '2025-03-01',
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

  // ─── Quota Management APIs ──────────────────────────────────────────────────

  {
    id: 'quota-list',
    name: 'List Quota Limits',
    shortName: 'Quota Limits',
    description: 'Lists current quota limits for a specific resource provider and location. Shows allocated quotas, current usage, and whether limits can be increased.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/{resourceProvider}/locations/{location}/providers/Microsoft.Quota/quotas',
    apiVersion: '2025-09-01',
    category: 'quota',
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
        name: 'resourceProvider',
        type: 'path',
        required: true,
        description: 'The resource provider namespace (e.g., Microsoft.Compute)',
        placeholder: 'Microsoft.Compute',
        options: [
          'Microsoft.Compute',
          'Microsoft.Network',
          'Microsoft.Storage',
          'Microsoft.Sql',
          'Microsoft.MachineLearningServices',
        ],
      },
      {
        name: 'location',
        type: 'path',
        required: true,
        description: 'Azure region (e.g., eastus)',
        placeholder: 'eastus',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/quota/quota/list',
  },
  {
    id: 'quota-update',
    name: 'Create or Update Quota Limit',
    shortName: 'Quota Increase',
    description: 'Request a quota increase for a specific resource. Submits a PUT request with the desired new limit value. The request is processed asynchronously.',
    method: 'PUT',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/{resourceProvider}/locations/{location}/providers/Microsoft.Quota/quotas/{quotaName}',
    apiVersion: '2025-09-01',
    category: 'quota',
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
        name: 'resourceProvider',
        type: 'path',
        required: true,
        description: 'The resource provider namespace',
        placeholder: 'Microsoft.Compute',
        options: [
          'Microsoft.Compute',
          'Microsoft.Network',
          'Microsoft.Storage',
          'Microsoft.Sql',
          'Microsoft.MachineLearningServices',
        ],
      },
      {
        name: 'location',
        type: 'path',
        required: true,
        description: 'Azure region (e.g., eastus)',
        placeholder: 'eastus',
      },
      {
        name: 'quotaName',
        type: 'path',
        required: true,
        description: 'The quota resource name (e.g., standardDSv3Family)',
        placeholder: 'standardDSv3Family',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/quota/quota/create-or-update',
    bodyTemplate: {
      properties: {
        limit: {
          limitObjectType: 'LimitValue',
          limitType: 'Independent',
          value: 100,
        },
        name: {
          value: 'standardDSv3Family',
        },
      },
    },
  },
  {
    id: 'quota-request-status',
    name: 'Get Quota Request Status',
    shortName: 'Quota Status',
    description: 'Check the status of a previously submitted quota increase request. Shows whether the request is pending, approved, or failed.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/{resourceProvider}/locations/{location}/providers/Microsoft.Quota/quotaRequests/{requestId}',
    apiVersion: '2025-09-01',
    category: 'quota',
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
        name: 'resourceProvider',
        type: 'path',
        required: true,
        description: 'The resource provider namespace',
        placeholder: 'Microsoft.Compute',
        options: [
          'Microsoft.Compute',
          'Microsoft.Network',
          'Microsoft.Storage',
          'Microsoft.Sql',
          'Microsoft.MachineLearningServices',
        ],
      },
      {
        name: 'location',
        type: 'path',
        required: true,
        description: 'Azure region (e.g., eastus)',
        placeholder: 'eastus',
      },
      {
        name: 'requestId',
        type: 'path',
        required: true,
        description: 'The quota request ID (GUID)',
        placeholder: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/quota/quota-request-status/get',
  },

  // ─── Provider Usage API ─────────────────────────────────────────────────────

  {
    id: 'provider-usage',
    name: 'List Provider Resource Usage',
    shortName: 'Provider Usage',
    description: 'Lists current resource usage and limits for a specific resource provider in a region. Shows how much of each quota is consumed vs. the limit.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/{resourceProvider}/locations/{location}/usages',
    apiVersion: '2021-04-01',
    category: 'quota',
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
        name: 'resourceProvider',
        type: 'path',
        required: true,
        description: 'The resource provider namespace',
        placeholder: 'Microsoft.Compute',
        options: [
          'Microsoft.Compute',
          'Microsoft.Network',
          'Microsoft.Storage',
        ],
      },
      {
        name: 'location',
        type: 'path',
        required: true,
        description: 'Azure region (e.g., eastus)',
        placeholder: 'eastus',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/compute/usage/list',
  },

  // ─── Support Tickets APIs ───────────────────────────────────────────────────

  {
    id: 'support-tickets-list',
    name: 'List Support Tickets',
    shortName: 'Support Tickets',
    description: 'Lists all Azure support tickets for a subscription. Shows ticket status, severity, creation date, and associated service/problem classification.',
    method: 'GET',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/Microsoft.Support/supportTickets',
    apiVersion: '2024-04-01',
    category: 'support',
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
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/support/support-tickets/list',
  },
  {
    id: 'support-tickets-create',
    name: 'Create Support Ticket',
    shortName: 'Create Ticket',
    description: 'Creates a new Azure support ticket. Requires service, problem classification, severity, contact details, and a description of the issue.',
    method: 'PUT',
    pathTemplate: '/subscriptions/{subscriptionId}/providers/Microsoft.Support/supportTickets/{ticketName}',
    apiVersion: '2024-04-01',
    category: 'support',
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
        name: 'ticketName',
        type: 'path',
        required: true,
        description: 'Unique support ticket name (e.g., quota_increase_vm_eastus)',
        placeholder: 'quota_increase_vm_eastus',
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/rest/api/support/support-tickets/create',
    bodyTemplate: {
      properties: {
        serviceId: '/providers/Microsoft.Support/services/quota_service_guid',
        title: 'Quota increase request for Compute VM cores',
        description: 'Request to increase vCPU quota for Standard DSv3 Family in East US from 100 to 200.',
        problemClassificationId: '/providers/Microsoft.Support/services/quota_service_guid/problemClassifications/compute_vm_cores',
        severity: 'moderate',
        contactDetails: {
          firstName: 'Jane',
          lastName: 'Doe',
          preferredContactMethod: 'email',
          primaryEmailAddress: 'jane.doe@contoso.com',
          preferredTimeZone: 'Pacific Standard Time',
          preferredSupportLanguage: 'en-us',
          country: 'usa',
        },
        quotaTicketDetails: {
          quotaChangeRequestSubType: 'Account',
          quotaChangeRequestVersion: '1.0',
          quotaChangeRequests: [
            {
              region: 'eastus',
              payload: '{"VMFamily":"standardDSv3Family","NewLimit":200}',
            },
          ],
        },
      },
    },
  },
];

export function getApiById(id: string): ApiDefinition | undefined {
  return apiCatalog.find((api) => api.id === id);
}

export function getApisByCategory(category: ApiDefinition['category']): ApiDefinition[] {
  return apiCatalog.filter((api) => api.category === category);
}
