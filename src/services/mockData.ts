import type {
  AzureSubscription,
  AzureLocation,
  ResourceSku,
  VirtualMachine,
  RetailPrice,
  CostManagementResult,
} from '../types/azure';

// ─── 1. Subscriptions ───────────────────────────────────────────────────────

export const mockSubscriptionsResponse: { value: AzureSubscription[] } = {
  value: [
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111',
      subscriptionId: '11111111-1111-1111-1111-111111111111',
      displayName: 'Contoso Development',
      state: 'Enabled',
      tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    },
    {
      id: '/subscriptions/22222222-2222-2222-2222-222222222222',
      subscriptionId: '22222222-2222-2222-2222-222222222222',
      displayName: 'Contoso Production',
      state: 'Enabled',
      tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    },
    {
      id: '/subscriptions/33333333-3333-3333-3333-333333333333',
      subscriptionId: '33333333-3333-3333-3333-333333333333',
      displayName: 'Fabrikam Staging',
      state: 'Enabled',
      tenantId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    },
  ],
};

// ─── 2. Locations ────────────────────────────────────────────────────────────

export const mockLocationsResponse: { value: AzureLocation[] } = {
  value: [
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/locations/eastus',
      name: 'eastus',
      displayName: 'East US',
      regionalDisplayName: '(US) East US',
      metadata: {
        regionType: 'Physical',
        regionCategory: 'Recommended',
      },
    },
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/locations/westus2',
      name: 'westus2',
      displayName: 'West US 2',
      regionalDisplayName: '(US) West US 2',
      metadata: {
        regionType: 'Physical',
        regionCategory: 'Recommended',
      },
    },
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/locations/westeurope',
      name: 'westeurope',
      displayName: 'West Europe',
      regionalDisplayName: '(Europe) West Europe',
      metadata: {
        regionType: 'Physical',
        regionCategory: 'Recommended',
      },
    },
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/locations/southeastasia',
      name: 'southeastasia',
      displayName: 'Southeast Asia',
      regionalDisplayName: '(Asia Pacific) Southeast Asia',
      metadata: {
        regionType: 'Physical',
        regionCategory: 'Recommended',
      },
    },
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/locations/centralus',
      name: 'centralus',
      displayName: 'Central US',
      regionalDisplayName: '(US) Central US',
      metadata: {
        regionType: 'Physical',
        regionCategory: 'Recommended',
      },
    },
  ],
};

// ─── 3. Resource SKUs ────────────────────────────────────────────────────────

export const mockResourceSkusResponse: { value: ResourceSku[] } = {
  value: [
    {
      resourceType: 'virtualMachines',
      name: 'Standard_D2s_v5',
      tier: 'Standard',
      size: 'D2s_v5',
      family: 'standardDSv5Family',
      locations: ['eastus'],
      capabilities: [
        { name: 'vCPUs', value: '2' },
        { name: 'MemoryGB', value: '8' },
        { name: 'MaxDataDiskCount', value: '4' },
        { name: 'MaxNetworkInterfaces', value: '2' },
        { name: 'OSVhdSizeMB', value: '1047552' },
        { name: 'CachedDiskBytes', value: '107374182400' },
        { name: 'UncachedDiskIOPS', value: '3750' },
        { name: 'UncachedDiskBytesPerSecond', value: '89128960' },
        { name: 'AcceleratedNetworkingEnabled', value: 'True' },
        { name: 'PremiumIO', value: 'True' },
        { name: 'HyperVGenerations', value: 'V1,V2' },
      ],
      restrictions: [],
    },
    {
      resourceType: 'virtualMachines',
      name: 'Standard_E4s_v5',
      tier: 'Standard',
      size: 'E4s_v5',
      family: 'standardESv5Family',
      locations: ['eastus', 'westus2'],
      capabilities: [
        { name: 'vCPUs', value: '4' },
        { name: 'MemoryGB', value: '32' },
        { name: 'MaxDataDiskCount', value: '8' },
        { name: 'MaxNetworkInterfaces', value: '4' },
        { name: 'OSVhdSizeMB', value: '1047552' },
        { name: 'CachedDiskBytes', value: '214748364800' },
        { name: 'UncachedDiskIOPS', value: '6400' },
        { name: 'UncachedDiskBytesPerSecond', value: '178257920' },
        { name: 'AcceleratedNetworkingEnabled', value: 'True' },
        { name: 'PremiumIO', value: 'True' },
        { name: 'HyperVGenerations', value: 'V1,V2' },
      ],
      restrictions: [],
    },
    {
      resourceType: 'virtualMachines',
      name: 'Standard_B2ms',
      tier: 'Standard',
      size: 'B2ms',
      family: 'standardBSFamily',
      locations: ['eastus', 'westus2', 'westeurope'],
      capabilities: [
        { name: 'vCPUs', value: '2' },
        { name: 'MemoryGB', value: '8' },
        { name: 'MaxDataDiskCount', value: '4' },
        { name: 'MaxNetworkInterfaces', value: '3' },
        { name: 'OSVhdSizeMB', value: '1047552' },
        { name: 'AcceleratedNetworkingEnabled', value: 'False' },
        { name: 'PremiumIO', value: 'True' },
        { name: 'HyperVGenerations', value: 'V1,V2' },
      ],
      restrictions: [],
    },
    {
      resourceType: 'virtualMachines',
      name: 'Standard_D8as_v5',
      tier: 'Standard',
      size: 'D8as_v5',
      family: 'standardDASv5Family',
      locations: ['eastus'],
      capabilities: [
        { name: 'vCPUs', value: '8' },
        { name: 'MemoryGB', value: '32' },
        { name: 'MaxDataDiskCount', value: '16' },
        { name: 'MaxNetworkInterfaces', value: '4' },
        { name: 'OSVhdSizeMB', value: '1047552' },
        { name: 'CachedDiskBytes', value: '214748364800' },
        { name: 'UncachedDiskIOPS', value: '12800' },
        { name: 'UncachedDiskBytesPerSecond', value: '178257920' },
        { name: 'AcceleratedNetworkingEnabled', value: 'True' },
        { name: 'PremiumIO', value: 'True' },
        { name: 'HyperVGenerations', value: 'V1,V2' },
      ],
      restrictions: [
        {
          type: 'Zone',
          values: ['3'],
          reasonCode: 'NotAvailableForSubscription',
        },
      ],
    },
  ],
};

// ─── 4. VM Sizes (same underlying API as resource-skus, filtered) ────────────

export const mockVmSizesResponse = mockResourceSkusResponse;

// ─── 5. Compute Resources (Virtual Machines) ────────────────────────────────

export const mockComputeResourcesResponse: { value: VirtualMachine[] } = {
  value: [
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/contoso-dev-rg/providers/Microsoft.Compute/virtualMachines/contoso-web-01',
      name: 'contoso-web-01',
      type: 'Microsoft.Compute/virtualMachines',
      location: 'eastus',
      properties: {
        vmId: 'aabbccdd-1111-2222-3333-444455556666',
        hardwareProfile: { vmSize: 'Standard_D2s_v5' },
        provisioningState: 'Succeeded',
        osProfile: {
          computerName: 'contoso-web-01',
          adminUsername: 'azureadmin',
        },
      },
    },
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/contoso-dev-rg/providers/Microsoft.Compute/virtualMachines/contoso-api-01',
      name: 'contoso-api-01',
      type: 'Microsoft.Compute/virtualMachines',
      location: 'eastus',
      properties: {
        vmId: 'aabbccdd-5555-6666-7777-888899990000',
        hardwareProfile: { vmSize: 'Standard_E4s_v5' },
        provisioningState: 'Succeeded',
        osProfile: {
          computerName: 'contoso-api-01',
          adminUsername: 'azureadmin',
        },
      },
    },
    {
      id: '/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/fabrikam-staging-rg/providers/Microsoft.Compute/virtualMachines/fabrikam-db-01',
      name: 'fabrikam-db-01',
      type: 'Microsoft.Compute/virtualMachines',
      location: 'westus2',
      properties: {
        vmId: 'ffeeddcc-aaaa-bbbb-cccc-ddddeeeeffff',
        hardwareProfile: { vmSize: 'Standard_D8as_v5' },
        provisioningState: 'Succeeded',
        osProfile: {
          computerName: 'fabrikam-db-01',
          adminUsername: 'dbadmin',
        },
      },
    },
  ],
};

// ─── 6. Retail Pricing ───────────────────────────────────────────────────────

export const mockRetailPricingResponse: {
  BillingCurrency: string;
  CustomerEntityId: string;
  CustomerEntityType: string;
  Items: RetailPrice[];
  NextPageLink: string | null;
  Count: number;
} = {
  BillingCurrency: 'USD',
  CustomerEntityId: 'Default',
  CustomerEntityType: 'Retail',
  Items: [
    {
      currencyCode: 'USD',
      tierMinimumUnits: 0,
      retailPrice: 0.096,
      unitPrice: 0.096,
      armRegionName: 'eastus',
      location: 'US East',
      effectiveStartDate: '2024-08-01T00:00:00Z',
      meterId: 'dddd1111-eeee-2222-ffff-333344445555',
      meterName: 'D2s v5',
      productId: 'DZH318Z0CXFD',
      skuId: 'DZH318Z0CXFD/0001',
      productName: 'Virtual Machines Dsv5 Series',
      skuName: 'D2s v5',
      serviceName: 'Virtual Machines',
      serviceId: 'DZH313Z7MMC8',
      serviceFamily: 'Compute',
      unitOfMeasure: '1 Hour',
      type: 'Consumption',
      isPrimaryMeterRegion: true,
      armSkuName: 'Standard_D2s_v5',
    },
    {
      currencyCode: 'USD',
      tierMinimumUnits: 0,
      retailPrice: 0.252,
      unitPrice: 0.252,
      armRegionName: 'eastus',
      location: 'US East',
      effectiveStartDate: '2024-08-01T00:00:00Z',
      meterId: 'dddd2222-eeee-3333-ffff-444455556666',
      meterName: 'E4s v5',
      productId: 'DZH318Z0CXFH',
      skuId: 'DZH318Z0CXFH/0001',
      productName: 'Virtual Machines Esv5 Series',
      skuName: 'E4s v5',
      serviceName: 'Virtual Machines',
      serviceId: 'DZH313Z7MMC8',
      serviceFamily: 'Compute',
      unitOfMeasure: '1 Hour',
      type: 'Consumption',
      isPrimaryMeterRegion: true,
      armSkuName: 'Standard_E4s_v5',
    },
    {
      currencyCode: 'USD',
      tierMinimumUnits: 0,
      retailPrice: 0.0832,
      unitPrice: 0.0832,
      armRegionName: 'eastus',
      location: 'US East',
      effectiveStartDate: '2024-06-01T00:00:00Z',
      meterId: 'dddd3333-eeee-4444-ffff-555566667777',
      meterName: 'B2ms',
      productId: 'DZH318Z0BQ3Z',
      skuId: 'DZH318Z0BQ3Z/0001',
      productName: 'Virtual Machines BS Series',
      skuName: 'B2ms',
      serviceName: 'Virtual Machines',
      serviceId: 'DZH313Z7MMC8',
      serviceFamily: 'Compute',
      unitOfMeasure: '1 Hour',
      type: 'Consumption',
      isPrimaryMeterRegion: true,
      armSkuName: 'Standard_B2ms',
    },
    {
      currencyCode: 'USD',
      tierMinimumUnits: 0,
      retailPrice: 0.384,
      unitPrice: 0.384,
      armRegionName: 'westeurope',
      location: 'EU West',
      effectiveStartDate: '2024-08-01T00:00:00Z',
      meterId: 'dddd4444-eeee-5555-ffff-666677778888',
      meterName: 'D8as v5',
      productId: 'DZH318Z0CXFP',
      skuId: 'DZH318Z0CXFP/0001',
      productName: 'Virtual Machines Dasv5 Series',
      skuName: 'D8as v5',
      serviceName: 'Virtual Machines',
      serviceId: 'DZH313Z7MMC8',
      serviceFamily: 'Compute',
      unitOfMeasure: '1 Hour',
      type: 'Consumption',
      isPrimaryMeterRegion: true,
      armSkuName: 'Standard_D8as_v5',
    },
  ],
  NextPageLink: null,
  Count: 4,
};

// ─── 7. Cost Management ─────────────────────────────────────────────────────

export const mockCostManagementResponse: CostManagementResult = {
  id: '/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.CostManagement/query/aaaabbbb-cccc-dddd-eeee-ffffffffffff',
  name: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
  type: 'Microsoft.CostManagement/query',
  properties: {
    nextLink: null,
    columns: [
      { name: 'Cost', type: 'Number' },
      { name: 'UsageDate', type: 'Number' },
      { name: 'ServiceName', type: 'String' },
      { name: 'Currency', type: 'String' },
    ],
    rows: [
      [42.18, 20260301, 'Virtual Machines', 'USD'],
      [38.74, 20260302, 'Virtual Machines', 'USD'],
      [15.32, 20260301, 'Storage', 'USD'],
      [14.88, 20260302, 'Storage', 'USD'],
      [7.56, 20260301, 'Bandwidth', 'USD'],
      [9.21, 20260302, 'Bandwidth', 'USD'],
      [3.44, 20260301, 'Azure DNS', 'USD'],
      [3.44, 20260302, 'Azure DNS', 'USD'],
      [45.91, 20260303, 'Virtual Machines', 'USD'],
      [16.05, 20260303, 'Storage', 'USD'],
      [8.33, 20260303, 'Bandwidth', 'USD'],
      [3.44, 20260303, 'Azure DNS', 'USD'],
    ],
  },
};

// ─── Combined lookup by API id ──────────────────────────────────────────────

export const mockResponses: Record<string, unknown> = {
  subscriptions: mockSubscriptionsResponse,
  locations: mockLocationsResponse,
  'resource-skus': mockResourceSkusResponse,
  'vm-sizes': mockVmSizesResponse,
  'compute-resources': mockComputeResourcesResponse,
  'retail-pricing': mockRetailPricingResponse,
  'cost-management': mockCostManagementResponse,
};
