export interface AzureSubscription {
  id: string;
  subscriptionId: string;
  displayName: string;
  state: string;
  tenantId: string;
}

export interface AzureLocation {
  id: string;
  name: string;
  displayName: string;
  regionalDisplayName: string;
  metadata: {
    regionType: string;
    regionCategory: string;
  };
}

export interface ResourceSku {
  resourceType: string;
  name: string;
  tier: string;
  size: string;
  family: string;
  locations: string[];
  capabilities: Array<{ name: string; value: string }>;
  restrictions: Array<{
    type: string;
    values: string[];
    reasonCode: string;
  }>;
}

export interface VmSize {
  name: string;
  numberOfCores: number;
  osDiskSizeInMB: number;
  resourceDiskSizeInMB: number;
  memoryInMB: number;
  maxDataDiskCount: number;
}

export interface VirtualMachine {
  id: string;
  name: string;
  type: string;
  location: string;
  properties: {
    vmId: string;
    hardwareProfile: { vmSize: string };
    provisioningState: string;
    osProfile?: { computerName: string; adminUsername: string };
  };
}

export interface RetailPrice {
  currencyCode: string;
  tierMinimumUnits: number;
  retailPrice: number;
  unitPrice: number;
  armRegionName: string;
  location: string;
  effectiveStartDate: string;
  meterId: string;
  meterName: string;
  productId: string;
  skuId: string;
  productName: string;
  skuName: string;
  serviceName: string;
  serviceId: string;
  serviceFamily: string;
  unitOfMeasure: string;
  type: string;
  isPrimaryMeterRegion: boolean;
  armSkuName: string;
}

export interface CostManagementQuery {
  type: string;
  timeframe: 'MonthToDate' | 'BillingMonthToDate' | 'TheLastMonth' | 'TheLastBillingMonth' | 'WeekToDate' | 'Custom';
  timePeriod?: { from: string; to: string };
  dataset: {
    granularity: 'Daily' | 'Monthly' | 'None';
    aggregation: Record<string, { name: string; function: 'Sum' | 'Avg' | 'Min' | 'Max' }>;
    grouping?: Array<{ type: 'Dimension' | 'Tag'; name: string }>;
  };
}

export interface CostManagementResult {
  id: string;
  name: string;
  type: string;
  properties: {
    nextLink: string | null;
    columns: Array<{ name: string; type: string }>;
    rows: Array<Array<string | number>>;
  };
}

export interface ApiRequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: unknown;
  timestamp: number;
}

export interface ApiResponseInfo {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
}

export interface CapturedApiCall {
  request: ApiRequestInfo;
  response: ApiResponseInfo | null;
  loading: boolean;
  error: string | null;
}
