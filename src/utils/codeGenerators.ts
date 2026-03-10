import type { ApiRequestInfo } from '../types/azure';
import { maskToken } from './formatters';

// --- Helpers to extract path params from the URL ---

function extractSubscriptionId(url: string): string {
  const match = url.match(/\/subscriptions\/([^/?]+)/);
  return match?.[1] || '<subscription-id>';
}

function extractFilter(params: Record<string, string>): string {
  return params['$filter'] || '';
}

function extractLocation(url: string): string {
  const match = url.match(/\/locations\/([^/?]+)/);
  return match?.[1] || 'eastus';
}

function extractResourceProvider(url: string): string {
  const match = url.match(/\/providers\/(Microsoft\.[^/]+)\/locations/);
  return match?.[1] || 'Microsoft.Compute';
}

// --- cURL (always raw HTTP) ---

export function generateCurl(req: ApiRequestInfo): string {
  const parts = [`curl -X ${req.method}`];

  let fullUrl = req.url;
  const params = Object.entries(req.queryParams);
  if (params.length > 0) {
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
  }
  parts.push(`  "${fullUrl}"`);

  for (const [key, value] of Object.entries(req.headers)) {
    const displayValue = key.toLowerCase() === 'authorization' ? `Bearer ${maskToken(value.replace('Bearer ', ''))}` : value;
    parts.push(`  -H "${key}: ${displayValue}"`);
  }

  if (req.body) {
    parts.push(`  -d '${JSON.stringify(req.body, null, 2)}'`);
  }

  return parts.join(' \\\n');
}

// --- Python (azure-mgmt-* / azure-identity) ---

export function generatePython(req: ApiRequestInfo, apiId?: string): string {
  const lines: string[] = [];
  const subscriptionId = extractSubscriptionId(req.url);
  const filter = extractFilter(req.queryParams);

  switch (apiId) {
    case 'subscriptions':
      lines.push('# pip install azure-identity azure-mgmt-resource');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.resource import SubscriptionClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push('client = SubscriptionClient(credential)');
      lines.push('');
      lines.push('for sub in client.subscriptions.list():');
      lines.push('    print(f"{sub.display_name} ({sub.subscription_id}) - {sub.state}")');
      break;

    case 'locations':
      lines.push('# pip install azure-identity azure-mgmt-resource');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.resource import SubscriptionClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push('client = SubscriptionClient(credential)');
      lines.push('');
      lines.push(`subscription_id = "${subscriptionId}"`);
      lines.push('');
      lines.push('for loc in client.subscriptions.list_locations(subscription_id):');
      lines.push('    print(f"{loc.name} - {loc.display_name} ({loc.metadata.region_category})")');
      break;

    case 'resource-skus':
    case 'vm-sizes':
      lines.push('# pip install azure-identity azure-mgmt-compute');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.compute import ComputeManagementClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push(`client = ComputeManagementClient(credential, "${subscriptionId}")`);
      lines.push('');
      if (filter) {
        lines.push(`for sku in client.resource_skus.list(filter="${filter}"):`);
      } else {
        lines.push('for sku in client.resource_skus.list():');
      }
      lines.push('    print(f"{sku.resource_type}: {sku.name} - {sku.locations}")');
      break;

    case 'compute-resources':
      lines.push('# pip install azure-identity azure-mgmt-compute');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.compute import ComputeManagementClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push(`client = ComputeManagementClient(credential, "${subscriptionId}")`);
      lines.push('');
      lines.push('for vm in client.virtual_machines.list_all():');
      lines.push('    print(f"{vm.name} ({vm.location}) - {vm.hardware_profile.vm_size}")');
      break;

    case 'retail-pricing':
      lines.push('# No SDK needed — this is a public API');
      lines.push('import requests');
      lines.push('');
      lines.push(`url = "${req.url}"`);
      if (filter) {
        lines.push(`params = {"$filter": "${filter}", "api-version": "${req.queryParams['api-version'] || '2023-01-01-preview'}"}`);
      } else {
        lines.push(`params = {"api-version": "${req.queryParams['api-version'] || '2023-01-01-preview'}"}`);
      }
      lines.push('');
      lines.push('response = requests.get(url, params=params)');
      lines.push('data = response.json()');
      lines.push('');
      lines.push('for item in data.get("Items", []):');
      lines.push('    print(f"{item[\'productName\']} / {item[\'skuName\']} - ${item[\'retailPrice\']} {item[\'currencyCode\']}")');
      break;

    case 'cost-management':
      lines.push('# pip install azure-identity azure-mgmt-costmanagement');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.costmanagement import CostManagementClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push('client = CostManagementClient(credential)');
      lines.push('');
      lines.push(`scope = "/subscriptions/${subscriptionId}"`);
      lines.push(`body = ${JSON.stringify(req.body, null, 4)}`);
      lines.push('');
      lines.push('result = client.query.usage(scope, body)');
      lines.push('');
      lines.push('for row in result.rows:');
      lines.push('    print(row)');
      break;

    case 'quota-list': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('# pip install azure-identity azure-mgmt-quota');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.quota import QuotaMgmtClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push('client = QuotaMgmtClient(credential)');
      lines.push('');
      lines.push(`scope = f"/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push('');
      lines.push('for quota in client.quota.list(scope):');
      lines.push('    props = quota.properties');
      lines.push('    print(f"{props.name.localized_value}: {props.limit.value} {props.unit}")');
      break;
    }

    case 'quota-update': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('# pip install azure-identity azure-mgmt-quota');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.quota import QuotaMgmtClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push('client = QuotaMgmtClient(credential)');
      lines.push('');
      lines.push(`scope = f"/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push(`body = ${JSON.stringify(req.body, null, 4)}`);
      lines.push('');
      lines.push('quota_name = body["properties"]["name"]["value"]');
      lines.push('result = client.quota.begin_create_or_update(quota_name, scope, body).result()');
      lines.push('print(f"Quota request submitted: {result.properties.provisioning_state}")');
      break;
    }

    case 'quota-request-status': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('# pip install azure-identity azure-mgmt-quota');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.quota import QuotaMgmtClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push('client = QuotaMgmtClient(credential)');
      lines.push('');
      lines.push(`scope = f"/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push(`request_id = "<your-request-id>"`);
      lines.push('');
      lines.push('status = client.quota_request_status.get(request_id, scope)');
      lines.push('print(f"Status: {status.properties.provisioning_state}")');
      lines.push('print(f"Message: {status.properties.message}")');
      break;
    }

    case 'provider-usage': {
      const loc = extractLocation(req.url);
      lines.push('# pip install azure-identity azure-mgmt-compute');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.compute import ComputeManagementClient');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push(`client = ComputeManagementClient(credential, "${subscriptionId}")`);
      lines.push('');
      lines.push(`for usage in client.usage.list("${loc}"):`);
      lines.push('    print(f"{usage.name.localized_value}: {usage.current_value}/{usage.limit}")');
      break;
    }

    case 'support-tickets-list':
      lines.push('# pip install azure-identity azure-mgmt-support');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.support import MicrosoftSupport');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push(`client = MicrosoftSupport(credential, "${subscriptionId}")`);
      lines.push('');
      lines.push('for ticket in client.support_tickets.list():');
      lines.push('    props = ticket.properties');
      lines.push('    print(f"{props.support_ticket_id}: {props.title} [{props.status}] - {props.severity}")');
      break;

    case 'support-tickets-create':
      lines.push('# pip install azure-identity azure-mgmt-support');
      lines.push('from azure.identity import DefaultAzureCredential');
      lines.push('from azure.mgmt.support import MicrosoftSupport');
      lines.push('');
      lines.push('credential = DefaultAzureCredential()');
      lines.push(`client = MicrosoftSupport(credential, "${subscriptionId}")`);
      lines.push('');
      lines.push(`body = ${JSON.stringify(req.body, null, 4)}`);
      lines.push('');
      lines.push('ticket_name = "quota_increase_vm_eastus"');
      lines.push('result = client.support_tickets.begin_create(ticket_name, body).result()');
      lines.push('print(f"Ticket created: {result.properties.support_ticket_id}")');
      break;

    default:
      return generatePythonRaw(req);
  }

  return lines.join('\n');
}

function generatePythonRaw(req: ApiRequestInfo): string {
  const lines = ['import requests', ''];
  const fullUrl = buildFullUrl(req);
  lines.push(`url = "${fullUrl}"`);
  lines.push('headers = {"Authorization": "Bearer <your-access-token>"}');
  lines.push('');
  lines.push(`response = requests.${req.method.toLowerCase()}(url, headers=headers)`);
  lines.push('print(response.json())');
  return lines.join('\n');
}

// --- PowerShell (Az module) ---

export function generatePowerShell(req: ApiRequestInfo, apiId?: string): string {
  const lines: string[] = [];
  const subscriptionId = extractSubscriptionId(req.url);
  const filter = extractFilter(req.queryParams);

  switch (apiId) {
    case 'subscriptions':
      lines.push('# Install-Module Az -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push('Get-AzSubscription | Format-Table DisplayName, Id, State');
      break;

    case 'locations':
      lines.push('# Install-Module Az -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push('Get-AzLocation | Format-Table DisplayName, Location, RegionCategory');
      break;

    case 'resource-skus':
    case 'vm-sizes': {
      lines.push('# Install-Module Az -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      const locMatch = filter.match(/location\s+eq\s+'([^']+)'/);
      if (locMatch) {
        lines.push(`Get-AzComputeResourceSku -Location "${locMatch[1]}" |`);
      } else {
        lines.push('Get-AzComputeResourceSku |');
      }
      lines.push('    Format-Table ResourceType, Name, @{N="Locations";E={$_.Locations -join ", "}}');
      break;
    }

    case 'compute-resources':
      lines.push('# Install-Module Az -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push('Get-AzVM |');
      lines.push('    Format-Table Name, Location, @{N="VMSize";E={$_.HardwareProfile.VmSize}}, ProvisioningState');
      break;

    case 'retail-pricing': {
      lines.push('# No Az module cmdlet — use Invoke-RestMethod');
      let fullUrl = req.url;
      const params = Object.entries(req.queryParams);
      if (params.length > 0) {
        const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
      lines.push(`$uri = "${fullUrl}"`);
      lines.push('');
      lines.push('$response = Invoke-RestMethod -Uri $uri -Method GET');
      lines.push('$response.Items | Format-Table productName, skuName, retailPrice, currencyCode');
      break;
    }

    case 'cost-management':
      lines.push('# Install-Module Az.CostManagement -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push(`$scope = "/subscriptions/${subscriptionId}"`);
      lines.push('');
      lines.push('Invoke-AzCostManagementQuery -Scope $scope `');
      lines.push('    -Type "ActualCost" `');
      lines.push('    -Timeframe "MonthToDate" `');
      lines.push('    -DatasetGranularity "Daily" |');
      lines.push('    Select-Object -ExpandProperty Row');
      break;

    case 'quota-list': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('# Install-Module Az.Quota -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push(`$scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push('');
      lines.push('Get-AzQuota -Scope $scope | Format-Table Name, Limit, Unit');
      break;
    }

    case 'quota-update': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('# Install-Module Az.Quota -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push(`$scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push(`$body = '${JSON.stringify(req.body)}' | ConvertFrom-Json`);
      lines.push('');
      lines.push('$quotaName = $body.properties.name.value');
      lines.push('$limit = $body.properties.limit.value');
      lines.push('');
      lines.push('New-AzQuota -Scope $scope -ResourceName $quotaName -LimitValue $limit');
      break;
    }

    case 'quota-request-status': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('# Install-Module Az.Quota -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push(`$scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push('$requestId = "<your-request-id>"');
      lines.push('');
      lines.push('$status = Get-AzQuotaRequestStatus -Scope $scope -Id $requestId');
      lines.push('Write-Output "Status: $($status.ProvisioningState)"');
      lines.push('Write-Output "Message: $($status.Message)"');
      break;
    }

    case 'provider-usage': {
      const loc = extractLocation(req.url);
      lines.push('# Install-Module Az.Compute -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push(`Get-AzVMUsage -Location "${loc}" | Format-Table @{L="Name";E={$_.Name.LocalizedValue}}, CurrentValue, Limit`);
      break;
    }

    case 'support-tickets-list':
      lines.push('# Install-Module Az.Support -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push('Get-AzSupportTicket | Format-Table SupportTicketId, Title, Status, Severity');
      break;

    case 'support-tickets-create':
      lines.push('# Install-Module Az.Support -Scope CurrentUser');
      lines.push('Connect-AzAccount');
      lines.push('');
      lines.push('New-AzSupportTicket `');
      lines.push('    -Name "quota_increase_vm_eastus" `');
      lines.push('    -Title "Quota increase request" `');
      lines.push('    -Description "Request to increase VM quota" `');
      lines.push('    -Severity "Minimal" `');
      lines.push('    -ProblemClassificationId "/providers/Microsoft.Support/services/<service-id>/problemClassifications/<classification-id>" `');
      lines.push('    -ServiceId "/providers/Microsoft.Support/services/<service-id>" `');
      lines.push('    -ContactFirstName "First" `');
      lines.push('    -ContactLastName "Last" `');
      lines.push('    -ContactEmail "user@example.com" `');
      lines.push('    -ContactTimezone "Pacific Standard Time" `');
      lines.push('    -ContactCountry "USA" `');
      lines.push('    -ContactLanguage "en-US"');
      break;

    default:
      return generatePowerShellRaw(req);
  }

  return lines.join('\n');
}

function generatePowerShellRaw(req: ApiRequestInfo): string {
  const lines: string[] = [];
  const fullUrl = buildFullUrl(req);
  lines.push(`$token = (Get-AzAccessToken -ResourceUrl "https://management.azure.com").Token`);
  lines.push(`$headers = @{ "Authorization" = "Bearer $token" }`);
  lines.push(`Invoke-RestMethod -Uri "${fullUrl}" -Method ${req.method} -Headers $headers`);
  return lines.join('\n');
}

// --- C# (Azure.ResourceManager.*) ---

export function generateCSharp(req: ApiRequestInfo, apiId?: string): string {
  const lines: string[] = [];
  const subscriptionId = extractSubscriptionId(req.url);
  const filter = extractFilter(req.queryParams);

  switch (apiId) {
    case 'subscriptions':
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('');
      lines.push('var client = new ArmClient(new DefaultAzureCredential());');
      lines.push('');
      lines.push('await foreach (var sub in client.GetSubscriptions().GetAllAsync())');
      lines.push('{');
      lines.push('    Console.WriteLine($"{sub.Data.DisplayName} ({sub.Data.SubscriptionId}) - {sub.Data.State}");');
      lines.push('}');
      break;

    case 'locations':
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('');
      lines.push('var client = new ArmClient(new DefaultAzureCredential());');
      lines.push(`var subscription = await client.GetSubscriptions().GetAsync("${subscriptionId}");`);
      lines.push('');
      lines.push('await foreach (var loc in subscription.Value.GetLocations().GetAllAsync())');
      lines.push('{');
      lines.push('    Console.WriteLine($"{loc.Name} - {loc.DisplayName}");');
      lines.push('}');
      break;

    case 'resource-skus':
    case 'vm-sizes':
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Compute');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Compute;');
      lines.push('');
      lines.push('var client = new ArmClient(new DefaultAzureCredential());');
      lines.push(`var subscription = await client.GetSubscriptions().GetAsync("${subscriptionId}");`);
      lines.push('');
      if (filter) {
        lines.push(`await foreach (var sku in subscription.Value.GetComputeResourceSkusAsync(filter: "${filter}"))`);
      } else {
        lines.push('await foreach (var sku in subscription.Value.GetComputeResourceSkusAsync())');
      }
      lines.push('{');
      lines.push('    Console.WriteLine($"{sku.ResourceType}: {sku.Name} - {string.Join(", ", sku.Locations)}");');
      lines.push('}');
      break;

    case 'compute-resources':
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Compute');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Compute;');
      lines.push('');
      lines.push('var client = new ArmClient(new DefaultAzureCredential());');
      lines.push(`var subscription = await client.GetSubscriptions().GetAsync("${subscriptionId}");`);
      lines.push('');
      lines.push('await foreach (var vm in subscription.Value.GetVirtualMachinesAsync())');
      lines.push('{');
      lines.push('    Console.WriteLine($"{vm.Data.Name} ({vm.Data.Location}) - {vm.Data.HardwareProfile.VmSize}");');
      lines.push('}');
      break;

    case 'retail-pricing': {
      lines.push('// No SDK — use HttpClient for this public API');
      lines.push('using System.Net.Http;');
      lines.push('using System.Text.Json;');
      lines.push('');
      const fullUrl = buildFullUrl(req);
      lines.push('var client = new HttpClient();');
      lines.push(`var response = await client.GetStringAsync("${fullUrl}");`);
      lines.push('var doc = JsonDocument.Parse(response);');
      lines.push('');
      lines.push('foreach (var item in doc.RootElement.GetProperty("Items").EnumerateArray())');
      lines.push('{');
      lines.push('    Console.WriteLine($"{item.GetProperty("productName")} / {item.GetProperty("skuName")} - {item.GetProperty("retailPrice")}");');
      lines.push('}');
      break;
    }

    case 'cost-management':
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.CostManagement');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.CostManagement;');
      lines.push('using Azure.ResourceManager.CostManagement.Models;');
      lines.push('');
      lines.push('var client = new ArmClient(new DefaultAzureCredential());');
      lines.push(`var scope = new ResourceIdentifier("/subscriptions/${subscriptionId}");`);
      lines.push('');
      lines.push('var queryDef = new QueryDefinition(ExportType.ActualCost, QueryTimeframe.MonthToDate)');
      lines.push('{');
      lines.push('    Dataset = new QueryDataset(GranularityType.Daily)');
      lines.push('    {');
      lines.push('        Aggregation = { ["totalCost"] = new QueryAggregation("Cost", FunctionType.Sum) }');
      lines.push('    }');
      lines.push('};');
      lines.push('');
      lines.push('var result = await client.UsageQuery(scope, queryDef);');
      lines.push('foreach (var row in result.Value.Rows)');
      lines.push('{');
      lines.push('    Console.WriteLine(string.Join(", ", row));');
      lines.push('}');
      break;

    case 'quota-list': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Quota');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Quota;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredential();');
      lines.push('var armClient = new ArmClient(credential);');
      lines.push('');
      lines.push(`var scope = new ResourceIdentifier("/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}");`);
      lines.push('');
      lines.push('var quotas = armClient.GetCurrentQuotaLimitBases(scope);');
      lines.push('foreach (var quota in quotas.GetAll())');
      lines.push('{');
      lines.push('    Console.WriteLine($"{quota.Data.Name}: {quota.Data.Limit} {quota.Data.Unit}");');
      lines.push('}');
      break;
    }

    case 'quota-update': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Quota');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Quota;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredential();');
      lines.push('var armClient = new ArmClient(credential);');
      lines.push('');
      lines.push(`var scope = new ResourceIdentifier("/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}");`);
      lines.push('var quotas = armClient.GetCurrentQuotaLimitBases(scope);');
      lines.push('');
      lines.push(`var quotaName = "<quota-name>";`);
      lines.push('var data = new CurrentQuotaLimitBaseData()');
      lines.push('{');
      lines.push('    Properties = new QuotaProperties()');
      lines.push('    {');
      lines.push('        Limit = new QuotaLimitObject(100)');
      lines.push('    }');
      lines.push('};');
      lines.push('');
      lines.push('var result = await quotas.CreateOrUpdateAsync(Azure.WaitUntil.Completed, quotaName, data);');
      lines.push('Console.WriteLine($"Quota request: {result.Value.Data.Properties.ProvisioningState}");');
      break;
    }

    case 'quota-request-status': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Quota');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Quota;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredential();');
      lines.push('var armClient = new ArmClient(credential);');
      lines.push('');
      lines.push(`var scope = new ResourceIdentifier("/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}");`);
      lines.push('var requestId = "<your-request-id>";');
      lines.push('');
      lines.push('var requestStatuses = armClient.GetQuotaRequestDetails(scope);');
      lines.push('var status = await requestStatuses.GetAsync(requestId);');
      lines.push('Console.WriteLine($"Status: {status.Value.Data.ProvisioningState}");');
      lines.push('Console.WriteLine($"Message: {status.Value.Data.Message}");');
      break;
    }

    case 'provider-usage': {
      const loc = extractLocation(req.url);
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Compute');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Compute;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredential();');
      lines.push('var armClient = new ArmClient(credential);');
      lines.push('');
      lines.push(`var subscription = armClient.GetSubscriptionResource(new ResourceIdentifier("/subscriptions/${subscriptionId}"));`);
      lines.push('');
      lines.push(`await foreach (var usage in subscription.GetUsagesAsync(new Azure.Core.AzureLocation("${loc}")))`);
      lines.push('{');
      lines.push('    Console.WriteLine($"{usage.Name.LocalizedValue}: {usage.CurrentValue}/{usage.Limit}");');
      lines.push('}');
      break;
    }

    case 'support-tickets-list':
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Support');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Support;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredential();');
      lines.push('var armClient = new ArmClient(credential);');
      lines.push('');
      lines.push(`var subscription = armClient.GetSubscriptionResource(new ResourceIdentifier("/subscriptions/${subscriptionId}"));`);
      lines.push('var tickets = subscription.GetSubscriptionSupportTickets();');
      lines.push('');
      lines.push('foreach (var ticket in tickets.GetAll())');
      lines.push('{');
      lines.push('    Console.WriteLine($"{ticket.Data.SupportTicketId}: {ticket.Data.Title} [{ticket.Data.Status}] - {ticket.Data.Severity}");');
      lines.push('}');
      break;

    case 'support-tickets-create':
      lines.push('// dotnet add package Azure.Identity');
      lines.push('// dotnet add package Azure.ResourceManager.Support');
      lines.push('using Azure.Identity;');
      lines.push('using Azure.ResourceManager;');
      lines.push('using Azure.ResourceManager.Support;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredential();');
      lines.push('var armClient = new ArmClient(credential);');
      lines.push('');
      lines.push(`var subscription = armClient.GetSubscriptionResource(new ResourceIdentifier("/subscriptions/${subscriptionId}"));`);
      lines.push('var tickets = subscription.GetSubscriptionSupportTickets();');
      lines.push('');
      lines.push('var data = new SupportTicketData()');
      lines.push('{');
      lines.push('    Title = "Quota increase request",');
      lines.push('    Description = "Request to increase VM quota",');
      lines.push('    Severity = SeverityLevel.Minimal,');
      lines.push('    ServiceId = "/providers/Microsoft.Support/services/<service-id>",');
      lines.push('    ProblemClassificationId = "/providers/Microsoft.Support/services/<service-id>/problemClassifications/<classification-id>",');
      lines.push('    ContactDetails = new ContactProfile("First", "Last", "user@example.com", "Pacific Standard Time", "USA", "en-US")');
      lines.push('};');
      lines.push('');
      lines.push('var result = await tickets.CreateOrUpdateAsync(Azure.WaitUntil.Completed, "quota_increase_vm_eastus", data);');
      lines.push('Console.WriteLine($"Ticket created: {result.Value.Data.SupportTicketId}");');
      break;

    default:
      return generateCSharpRaw(req);
  }

  return lines.join('\n');
}

function generateCSharpRaw(req: ApiRequestInfo): string {
  const lines: string[] = [];
  const fullUrl = buildFullUrl(req);
  lines.push('using Azure.Identity;');
  lines.push('using System.Net.Http;');
  lines.push('');
  lines.push('var credential = new DefaultAzureCredential();');
  lines.push('var token = await credential.GetTokenAsync(new Azure.Core.TokenRequestContext(new[] { "https://management.azure.com/.default" }));');
  lines.push('var client = new HttpClient();');
  lines.push('client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Token);');
  lines.push(`var response = await client.GetStringAsync("${fullUrl}");`);
  lines.push('Console.WriteLine(response);');
  return lines.join('\n');
}

// --- JavaScript/TypeScript (@azure/arm-*) ---

export function generateJavaScript(req: ApiRequestInfo, apiId?: string): string {
  const lines: string[] = [];
  const subscriptionId = extractSubscriptionId(req.url);
  const filter = extractFilter(req.queryParams);

  switch (apiId) {
    case 'subscriptions':
      lines.push('// npm install @azure/identity @azure/arm-subscriptions');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { SubscriptionClient } from "@azure/arm-subscriptions";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const client = new SubscriptionClient(credential);');
      lines.push('');
      lines.push('for await (const sub of client.subscriptions.list()) {');
      lines.push('  console.log(`${sub.displayName} (${sub.subscriptionId}) - ${sub.state}`);');
      lines.push('}');
      break;

    case 'locations':
      lines.push('// npm install @azure/identity @azure/arm-subscriptions');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { SubscriptionClient } from "@azure/arm-subscriptions";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const client = new SubscriptionClient(credential);');
      lines.push('');
      lines.push(`for await (const loc of client.subscriptions.listLocations("${subscriptionId}")) {`);
      lines.push('  console.log(`${loc.name} - ${loc.displayName} (${loc.metadata?.regionCategory})`);');
      lines.push('}');
      break;

    case 'resource-skus':
    case 'vm-sizes':
      lines.push('// npm install @azure/identity @azure/arm-compute');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { ComputeManagementClient } from "@azure/arm-compute";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push(`const client = new ComputeManagementClient(credential, "${subscriptionId}");`);
      lines.push('');
      if (filter) {
        lines.push(`for await (const sku of client.resourceSkus.list({ filter: "${filter}" })) {`);
      } else {
        lines.push('for await (const sku of client.resourceSkus.list()) {');
      }
      lines.push('  console.log(`${sku.resourceType}: ${sku.name} - ${sku.locations?.join(", ")}`);');
      lines.push('}');
      break;

    case 'compute-resources':
      lines.push('// npm install @azure/identity @azure/arm-compute');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { ComputeManagementClient } from "@azure/arm-compute";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push(`const client = new ComputeManagementClient(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push('for await (const vm of client.virtualMachines.listAll()) {');
      lines.push('  console.log(`${vm.name} (${vm.location}) - ${vm.hardwareProfile?.vmSize}`);');
      lines.push('}');
      break;

    case 'retail-pricing': {
      lines.push('// No SDK needed — this is a public API');
      const fullUrl = buildFullUrl(req);
      lines.push(`const response = await fetch("${fullUrl}");`);
      lines.push('const data = await response.json();');
      lines.push('');
      lines.push('for (const item of data.Items) {');
      lines.push('  console.log(`${item.productName} / ${item.skuName} - $${item.retailPrice} ${item.currencyCode}`);');
      lines.push('}');
      break;
    }

    case 'cost-management':
      lines.push('// npm install @azure/identity @azure/arm-costmanagement');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { CostManagementClient } from "@azure/arm-costmanagement";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const client = new CostManagementClient(credential);');
      lines.push('');
      lines.push(`const scope = "/subscriptions/${subscriptionId}";`);
      lines.push(`const body = ${JSON.stringify(req.body, null, 2)};`);
      lines.push('');
      lines.push('const result = await client.query.usage(scope, body);');
      lines.push('');
      lines.push('for (const row of result.rows ?? []) {');
      lines.push('  console.log(row);');
      lines.push('}');
      break;

    case 'quota-list': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// npm install @azure/identity @azure/arm-quota');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { AzureQuotaExtensionAPI } from "@azure/arm-quota";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const client = new AzureQuotaExtensionAPI(credential);');
      lines.push('');
      lines.push(`const scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}";`);
      lines.push('');
      lines.push('for await (const quota of client.quota.list(scope)) {');
      lines.push('  console.log(`${quota.properties?.name?.localizedValue}: ${quota.properties?.limit?.value} ${quota.properties?.unit}`);');
      lines.push('}');
      break;
    }

    case 'quota-update': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// npm install @azure/identity @azure/arm-quota');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { AzureQuotaExtensionAPI } from "@azure/arm-quota";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const client = new AzureQuotaExtensionAPI(credential);');
      lines.push('');
      lines.push(`const scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}";`);
      lines.push(`const body = ${JSON.stringify(req.body, null, 2)};`);
      lines.push('');
      lines.push('const quotaName = body.properties.name.value;');
      lines.push('const result = await client.quota.beginCreateOrUpdateAndWait(quotaName, scope, body);');
      lines.push('console.log(`Quota request submitted: ${result.properties?.provisioningState}`);');
      break;
    }

    case 'quota-request-status': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// npm install @azure/identity @azure/arm-quota');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { AzureQuotaExtensionAPI } from "@azure/arm-quota";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const client = new AzureQuotaExtensionAPI(credential);');
      lines.push('');
      lines.push(`const scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}";`);
      lines.push('const requestId = "<your-request-id>";');
      lines.push('');
      lines.push('const status = await client.quotaRequestStatus.get(requestId, scope);');
      lines.push('console.log(`Status: ${status.properties?.provisioningState}`);');
      lines.push('console.log(`Message: ${status.properties?.message}`);');
      break;
    }

    case 'provider-usage': {
      const loc = extractLocation(req.url);
      lines.push('// npm install @azure/identity @azure/arm-compute');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { ComputeManagementClient } from "@azure/arm-compute";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push(`const client = new ComputeManagementClient(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push(`for await (const usage of client.usage.list("${loc}")) {`);
      lines.push('  console.log(`${usage.name?.localizedValue}: ${usage.currentValue}/${usage.limit}`);');
      lines.push('}');
      break;
    }

    case 'support-tickets-list':
      lines.push('// npm install @azure/identity @azure/arm-support');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { MicrosoftSupport } from "@azure/arm-support";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push(`const client = new MicrosoftSupport(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push('for await (const ticket of client.supportTickets.list()) {');
      lines.push('  console.log(`${ticket.supportTicketId}: ${ticket.title} [${ticket.status}] - ${ticket.severity}`);');
      lines.push('}');
      break;

    case 'support-tickets-create':
      lines.push('// npm install @azure/identity @azure/arm-support');
      lines.push('import { DefaultAzureCredential } from "@azure/identity";');
      lines.push('import { MicrosoftSupport } from "@azure/arm-support";');
      lines.push('');
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push(`const client = new MicrosoftSupport(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push(`const body = ${JSON.stringify(req.body, null, 2)};`);
      lines.push('');
      lines.push('const result = await client.supportTickets.beginCreateAndWait("quota_increase_vm_eastus", body);');
      lines.push('console.log(`Ticket created: ${result.supportTicketId}`);');
      break;

    default:
      return generateJavaScriptRaw(req);
  }

  return lines.join('\n');
}

function generateJavaScriptRaw(req: ApiRequestInfo): string {
  const fullUrl = buildFullUrl(req);
  const lines: string[] = [];
  lines.push(`const response = await fetch("${fullUrl}", {`);
  lines.push(`  method: "${req.method}",`);
  lines.push('  headers: { "Authorization": "Bearer <your-access-token>" },');
  lines.push('});');
  lines.push('console.log(await response.json());');
  return lines.join('\n');
}

// --- Go (azure-sdk-for-go) ---

export function generateGo(req: ApiRequestInfo, apiId?: string): string {
  const lines: string[] = [];
  const subscriptionId = extractSubscriptionId(req.url);
  const filter = extractFilter(req.queryParams);

  switch (apiId) {
    case 'subscriptions':
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tclient, err := armsubscriptions.NewClient(cred, nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tpager := client.NewListPager(nil)');
      lines.push('\tfor pager.More() {');
      lines.push('\t\tpage, err := pager.NextPage(context.Background())');
      lines.push('\t\tif err != nil { panic(err) }');
      lines.push('\t\tfor _, sub := range page.Value {');
      lines.push('\t\t\tfmt.Printf("%s (%s) - %s\\n", *sub.DisplayName, *sub.SubscriptionID, *sub.State)');
      lines.push('\t\t}');
      lines.push('\t}');
      lines.push('}');
      break;

    case 'locations':
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tclient, err := armsubscriptions.NewClient(cred, nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tpager := client.NewListLocationsPager("${subscriptionId}", nil)`);
      lines.push('\tfor pager.More() {');
      lines.push('\t\tpage, err := pager.NextPage(context.Background())');
      lines.push('\t\tif err != nil { panic(err) }');
      lines.push('\t\tfor _, loc := range page.Value {');
      lines.push('\t\t\tfmt.Printf("%s - %s\\n", *loc.Name, *loc.DisplayName)');
      lines.push('\t\t}');
      lines.push('\t}');
      lines.push('}');
      break;

    case 'resource-skus':
    case 'vm-sizes':
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armcompute.NewResourceSKUsClient("${subscriptionId}", cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      if (filter) {
        lines.push(`\tfilter := "${filter}"`);
        lines.push('\tpager := client.NewListPager(&armcompute.ResourceSKUsClientListOptions{Filter: &filter})');
      } else {
        lines.push('\tpager := client.NewListPager(nil)');
      }
      lines.push('\tfor pager.More() {');
      lines.push('\t\tpage, err := pager.NextPage(context.Background())');
      lines.push('\t\tif err != nil { panic(err) }');
      lines.push('\t\tfor _, sku := range page.Value {');
      lines.push('\t\t\tfmt.Printf("%s: %s - %v\\n", *sku.ResourceType, *sku.Name, sku.Locations)');
      lines.push('\t\t}');
      lines.push('\t}');
      lines.push('}');
      break;

    case 'compute-resources':
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armcompute.NewVirtualMachinesClient("${subscriptionId}", cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tpager := client.NewListAllPager(nil)');
      lines.push('\tfor pager.More() {');
      lines.push('\t\tpage, err := pager.NextPage(context.Background())');
      lines.push('\t\tif err != nil { panic(err) }');
      lines.push('\t\tfor _, vm := range page.Value {');
      lines.push('\t\t\tfmt.Printf("%s (%s) - %s\\n", *vm.Name, *vm.Location, *vm.Properties.HardwareProfile.VMSize)');
      lines.push('\t\t}');
      lines.push('\t}');
      lines.push('}');
      break;

    case 'retail-pricing':
      return generateGoRaw(req);

    case 'cost-management':
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/costmanagement/armcostmanagement');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/costmanagement/armcostmanagement"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tclient, err := armcostmanagement.NewQueryClient(cred, nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tscope := "/subscriptions/${subscriptionId}"`);
      lines.push('\ttimeframe := armcostmanagement.TimeframeTypeMonthToDate');
      lines.push('\tgranularity := armcostmanagement.GranularityTypeDaily');
      lines.push('\texportType := armcostmanagement.ExportTypeActualCost');
      lines.push('');
      lines.push('\tresult, err := client.Usage(context.Background(), scope, armcostmanagement.QueryDefinition{');
      lines.push('\t\tType:      &exportType,');
      lines.push('\t\tTimeframe: &timeframe,');
      lines.push('\t\tDataset: &armcostmanagement.QueryDataset{');
      lines.push('\t\t\tGranularity: &granularity,');
      lines.push('\t\t},');
      lines.push('\t}, nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tfor _, row := range result.Properties.Rows {');
      lines.push('\t\tfmt.Println(row)');
      lines.push('\t}');
      lines.push('}');
      break;

    case 'quota-list': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armquota.NewClient(cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tscope := "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push('\tpager := client.NewListPager(scope, nil)');
      lines.push('\tfor pager.More() {');
      lines.push('\t\tpage, err := pager.NextPage(context.Background())');
      lines.push('\t\tif err != nil { panic(err) }');
      lines.push('\t\tfor _, quota := range page.Value {');
      lines.push('\t\t\tfmt.Printf("%s: %v %s\\n", *quota.Properties.Name.LocalizedValue, quota.Properties.Limit.Value, *quota.Properties.Unit)');
      lines.push('\t\t}');
      lines.push('\t}');
      lines.push('}');
      break;
    }

    case 'quota-update': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armquota.NewClient(cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tscope := "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push('\tquotaName := "<quota-name>"');
      lines.push('\tpoller, err := client.BeginCreateOrUpdate(context.Background(), quotaName, scope, armquota.CurrentQuotaLimitBase{');
      lines.push('\t\tProperties: &armquota.Properties{},');
      lines.push('\t}, nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tresult, err := poller.PollUntilDone(context.Background(), nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('\tfmt.Printf("Quota request: %s\\n", *result.Properties.ProvisioningState)');
      lines.push('}');
      break;
    }

    case 'quota-request-status': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armquota.NewRequestStatusClient(cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tscope := "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}"`);
      lines.push('\trequestID := "<your-request-id>"');
      lines.push('');
      lines.push('\tstatus, err := client.Get(context.Background(), requestID, scope, nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('\tfmt.Printf("Status: %s\\n", *status.Properties.ProvisioningState)');
      lines.push('\tfmt.Printf("Message: %s\\n", *status.Properties.Message)');
      lines.push('}');
      break;
    }

    case 'provider-usage': {
      const loc = extractLocation(req.url);
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armcompute.NewUsageClient("${subscriptionId}", cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tpager := client.NewListPager("${loc}", nil)`);
      lines.push('\tfor pager.More() {');
      lines.push('\t\tpage, err := pager.NextPage(context.Background())');
      lines.push('\t\tif err != nil { panic(err) }');
      lines.push('\t\tfor _, usage := range page.Value {');
      lines.push('\t\t\tfmt.Printf("%s: %d/%d\\n", *usage.Name.LocalizedValue, *usage.CurrentValue, *usage.Limit)');
      lines.push('\t\t}');
      lines.push('\t}');
      lines.push('}');
      break;
    }

    case 'support-tickets-list':
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/support/armsupport');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/support/armsupport"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armsupport.NewTicketsClient("${subscriptionId}", cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tpager := client.NewListPager(nil)');
      lines.push('\tfor pager.More() {');
      lines.push('\t\tpage, err := pager.NextPage(context.Background())');
      lines.push('\t\tif err != nil { panic(err) }');
      lines.push('\t\tfor _, ticket := range page.Value {');
      lines.push('\t\t\tfmt.Printf("%s: %s [%s] - %s\\n", *ticket.Properties.SupportTicketID, *ticket.Properties.Title, *ticket.Properties.Status, *ticket.Properties.Severity)');
      lines.push('\t\t}');
      lines.push('\t}');
      lines.push('}');
      break;

    case 'support-tickets-create':
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/azidentity');
      lines.push('// go get github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/support/armsupport');
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"context"');
      lines.push('\t"fmt"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/azidentity"');
      lines.push('\t"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/support/armsupport"');
      lines.push(')');
      lines.push('');
      lines.push('func main() {');
      lines.push('\tcred, err := azidentity.NewDefaultAzureCredential(nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push(`\tclient, err := armsupport.NewTicketsClient("${subscriptionId}", cred, nil)`);
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\ttitle := "Quota increase request"');
      lines.push('\tdesc := "Request to increase VM quota"');
      lines.push('\tseverity := armsupport.SeverityLevelMinimal');
      lines.push('\tpoller, err := client.BeginCreate(context.Background(), "quota_increase_vm_eastus", armsupport.TicketsDetails{');
      lines.push('\t\tProperties: &armsupport.TicketsDetailsProperties{');
      lines.push('\t\t\tTitle:       &title,');
      lines.push('\t\t\tDescription: &desc,');
      lines.push('\t\t\tSeverity:    &severity,');
      lines.push('\t\t},');
      lines.push('\t}, nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('');
      lines.push('\tresult, err := poller.PollUntilDone(context.Background(), nil)');
      lines.push('\tif err != nil { panic(err) }');
      lines.push('\tfmt.Printf("Ticket created: %s\\n", *result.Properties.SupportTicketID)');
      lines.push('}');
      break;

    default:
      return generateGoRaw(req);
  }

  return lines.join('\n');
}

function generateGoRaw(req: ApiRequestInfo): string {
  const lines: string[] = [];
  const fullUrl = buildFullUrl(req);
  lines.push('package main');
  lines.push('');
  lines.push('import (');
  lines.push('\t"fmt"');
  lines.push('\t"io"');
  lines.push('\t"net/http"');
  lines.push(')');
  lines.push('');
  lines.push('func main() {');
  lines.push(`\treq, _ := http.NewRequest("${req.method}", "${fullUrl}", nil)`);
  if (req.headers['Authorization']) {
    lines.push('\treq.Header.Set("Authorization", "Bearer <your-access-token>")');
  }
  lines.push('\tresp, err := http.DefaultClient.Do(req)');
  lines.push('\tif err != nil { panic(err) }');
  lines.push('\tdefer resp.Body.Close()');
  lines.push('\tdata, _ := io.ReadAll(resp.Body)');
  lines.push('\tfmt.Println(string(data))');
  lines.push('}');
  return lines.join('\n');
}

// --- Java (azure-resourcemanager-*) ---

export function generateJava(req: ApiRequestInfo, apiId?: string): string {
  const lines: string[] = [];
  const subscriptionId = extractSubscriptionId(req.url);
  const filter = extractFilter(req.queryParams);

  switch (apiId) {
    case 'subscriptions':
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.AzureResourceManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push('var azure = AzureResourceManager.authenticate(credential, null)');
      lines.push('    .withDefaultSubscription();');
      lines.push('');
      lines.push('azure.subscriptions().list().forEach(sub ->');
      lines.push('    System.out.printf("%s (%s) - %s%n",');
      lines.push('        sub.displayName(), sub.subscriptionId(), sub.state())');
      lines.push(');');
      break;

    case 'locations':
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.AzureResourceManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push('var azure = AzureResourceManager.authenticate(credential, null)');
      lines.push(`    .withSubscription("${subscriptionId}");`);
      lines.push('');
      lines.push(`azure.subscriptions().listLocations("${subscriptionId}").forEach(loc ->`);
      lines.push('    System.out.printf("%s - %s%n", loc.name(), loc.displayName())');
      lines.push(');');
      break;

    case 'resource-skus':
    case 'vm-sizes':
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-compute');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.compute.ComputeManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push(`var computeManager = ComputeManager.authenticate(credential, "${subscriptionId}");`);
      lines.push('');
      if (filter) {
        const locMatch = filter.match(/location\s+eq\s+'([^']+)'/);
        if (locMatch) {
          lines.push(`computeManager.computeSkus().listByRegion("${locMatch[1]}").forEach(sku ->`);
        } else {
          lines.push('computeManager.computeSkus().list().forEach(sku ->');
        }
      } else {
        lines.push('computeManager.computeSkus().list().forEach(sku ->');
      }
      lines.push('    System.out.printf("%s: %s - %s%n",');
      lines.push('        sku.resourceType(), sku.skuType(), sku.regions())');
      lines.push(');');
      break;

    case 'compute-resources':
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-compute');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.compute.ComputeManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push(`var computeManager = ComputeManager.authenticate(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push('computeManager.virtualMachines().list().forEach(vm ->');
      lines.push('    System.out.printf("%s (%s) - %s%n",');
      lines.push('        vm.name(), vm.regionName(), vm.size())');
      lines.push(');');
      break;

    case 'retail-pricing': {
      lines.push('// No SDK — use java.net.http for this public API');
      lines.push('import java.net.URI;');
      lines.push('import java.net.http.HttpClient;');
      lines.push('import java.net.http.HttpRequest;');
      lines.push('import java.net.http.HttpResponse;');
      lines.push('');
      const fullUrl = buildFullUrl(req);
      lines.push('var client = HttpClient.newHttpClient();');
      lines.push('var request = HttpRequest.newBuilder()');
      lines.push(`    .uri(URI.create("${fullUrl}"))`);
      lines.push('    .GET()');
      lines.push('    .build();');
      lines.push('');
      lines.push('var response = client.send(request, HttpResponse.BodyHandlers.ofString());');
      lines.push('System.out.println(response.body());');
      break;
    }

    case 'cost-management':
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-costmanagement');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.costmanagement.CostManagementManager;');
      lines.push('import com.azure.resourcemanager.costmanagement.models.*;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push('var costManager = CostManagementManager.authenticate(credential, null);');
      lines.push('');
      lines.push(`var scope = "/subscriptions/${subscriptionId}";`);
      lines.push('var queryDef = new QueryDefinition()');
      lines.push('    .withType(ExportType.ACTUAL_COST)');
      lines.push('    .withTimeframe(TimeframeType.MONTH_TO_DATE)');
      lines.push('    .withDataset(new QueryDataset()');
      lines.push('        .withGranularity(GranularityType.DAILY));');
      lines.push('');
      lines.push('var result = costManager.queries().usage(scope, queryDef);');
      lines.push('result.rows().forEach(row -> System.out.println(row));');
      break;

    case 'quota-list': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-quota');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.quota.QuotaManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push('var quotaManager = QuotaManager.authenticate(credential, null);');
      lines.push('');
      lines.push(`var scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}";`);
      lines.push('');
      lines.push('quotaManager.quotas().listByScope(scope).forEach(quota -> {');
      lines.push('    System.out.printf("%s: %s %s%n", quota.name(), quota.limit(), quota.unit());');
      lines.push('});');
      break;
    }

    case 'quota-update': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-quota');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.quota.QuotaManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push('var quotaManager = QuotaManager.authenticate(credential, null);');
      lines.push('');
      lines.push(`var scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}";`);
      lines.push('var quotaName = "<quota-name>";');
      lines.push('');
      lines.push('var result = quotaManager.quotas()');
      lines.push('    .define(quotaName)');
      lines.push('    .withExistingScope(scope)');
      lines.push('    .create();');
      lines.push('System.out.printf("Quota request: %s%n", result.provisioningState());');
      break;
    }

    case 'quota-request-status': {
      const loc = extractLocation(req.url);
      const provider = extractResourceProvider(req.url);
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-quota');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.quota.QuotaManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push('var quotaManager = QuotaManager.authenticate(credential, null);');
      lines.push('');
      lines.push(`var scope = "/subscriptions/${subscriptionId}/providers/${provider}/locations/${loc}";`);
      lines.push('var requestId = "<your-request-id>";');
      lines.push('');
      lines.push('var status = quotaManager.quotaRequestStatuses().get(scope, requestId);');
      lines.push('System.out.printf("Status: %s%n", status.provisioningState());');
      lines.push('System.out.printf("Message: %s%n", status.message());');
      break;
    }

    case 'provider-usage': {
      const loc = extractLocation(req.url);
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-compute');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.compute.ComputeManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push(`var computeManager = ComputeManager.authenticate(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push(`computeManager.usages().listByLocation("${loc}").forEach(usage -> {`);
      lines.push('    System.out.printf("%s: %d/%d%n", usage.name().localizedValue(), usage.currentValue(), usage.limit());');
      lines.push('});');
      break;
    }

    case 'support-tickets-list':
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-support');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.support.SupportManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push(`var supportManager = SupportManager.authenticate(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push('supportManager.supportTickets().list().forEach(ticket -> {');
      lines.push('    System.out.printf("%s: %s [%s] - %s%n", ticket.supportTicketId(), ticket.title(), ticket.status(), ticket.severity());');
      lines.push('});');
      break;

    case 'support-tickets-create':
      lines.push('// Maven: com.azure.resourcemanager:azure-resourcemanager-support');
      lines.push('import com.azure.identity.DefaultAzureCredentialBuilder;');
      lines.push('import com.azure.resourcemanager.support.SupportManager;');
      lines.push('');
      lines.push('var credential = new DefaultAzureCredentialBuilder().build();');
      lines.push(`var supportManager = SupportManager.authenticate(credential, "${subscriptionId}");`);
      lines.push('');
      lines.push('var ticket = supportManager.supportTickets()');
      lines.push('    .define("quota_increase_vm_eastus")');
      lines.push('    .withTitle("Quota increase request")');
      lines.push('    .withDescription("Request to increase VM quota")');
      lines.push('    .withSeverity(SeverityLevel.MINIMAL)');
      lines.push('    .withServiceId("/providers/Microsoft.Support/services/<service-id>")');
      lines.push('    .withProblemClassificationId("/providers/Microsoft.Support/services/<service-id>/problemClassifications/<classification-id>")');
      lines.push('    .create();');
      lines.push('System.out.printf("Ticket created: %s%n", ticket.supportTicketId());');
      break;

    default:
      return generateJavaRaw(req);
  }

  return lines.join('\n');
}

function generateJavaRaw(req: ApiRequestInfo): string {
  const fullUrl = buildFullUrl(req);
  const lines: string[] = [];
  lines.push('import java.net.URI;');
  lines.push('import java.net.http.HttpClient;');
  lines.push('import java.net.http.HttpRequest;');
  lines.push('import java.net.http.HttpResponse;');
  lines.push('');
  lines.push('var client = HttpClient.newHttpClient();');
  lines.push('var request = HttpRequest.newBuilder()');
  lines.push(`    .uri(URI.create("${fullUrl}"))`);
  lines.push('    .header("Authorization", "Bearer <your-access-token>")');
  lines.push('    .GET().build();');
  lines.push('');
  lines.push('var response = client.send(request, HttpResponse.BodyHandlers.ofString());');
  lines.push('System.out.println(response.body());');
  return lines.join('\n');
}

// --- Shared helpers ---

function buildFullUrl(req: ApiRequestInfo): string {
  let fullUrl = req.url;
  const params = Object.entries(req.queryParams);
  if (params.length > 0) {
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
  }
  return fullUrl;
}

export type SnippetLanguage = 'curl' | 'python' | 'powershell' | 'csharp' | 'javascript' | 'go' | 'java';

export const snippetGenerators: Record<SnippetLanguage, (req: ApiRequestInfo, apiId?: string) => string> = {
  curl: generateCurl,
  python: generatePython,
  powershell: generatePowerShell,
  csharp: generateCSharp,
  javascript: generateJavaScript,
  go: generateGo,
  java: generateJava,
};

export const snippetLabels: Record<SnippetLanguage, string> = {
  curl: 'cURL',
  python: 'Python',
  powershell: 'PowerShell',
  csharp: 'C#',
  javascript: 'JavaScript',
  go: 'Go',
  java: 'Java',
};
