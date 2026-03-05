import type { ApiRequestInfo } from '../types/azure';
import { maskToken } from './formatters';

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

export function generatePython(req: ApiRequestInfo): string {
  const lines = ['import requests', ''];

  let fullUrl = req.url;
  const params = Object.entries(req.queryParams);
  if (params.length > 0) {
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
  }

  lines.push(`url = "${fullUrl}"`);
  lines.push('');

  const headers = { ...req.headers };
  if (headers['Authorization']) {
    headers['Authorization'] = 'Bearer <your-access-token>';
  }
  lines.push('headers = {');
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`    "${key}": "${value}",`);
  }
  lines.push('}');
  lines.push('');

  if (req.body) {
    lines.push(`payload = ${JSON.stringify(req.body, null, 4)}`);
    lines.push('');
    lines.push(`response = requests.${req.method.toLowerCase()}(url, headers=headers, json=payload)`);
  } else {
    lines.push(`response = requests.${req.method.toLowerCase()}(url, headers=headers)`);
  }

  lines.push('');
  lines.push('print(f"Status: {response.status_code}")');
  lines.push('print(response.json())');

  return lines.join('\n');
}

export function generatePowerShell(req: ApiRequestInfo): string {
  const lines: string[] = [];

  let fullUrl = req.url;
  const params = Object.entries(req.queryParams);
  if (params.length > 0) {
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
  }

  lines.push(`$uri = "${fullUrl}"`);
  lines.push('');

  const hasAuth = !!req.headers['Authorization'];
  if (hasAuth) {
    lines.push('# Get token using Azure PowerShell');
    lines.push('$token = (Get-AzAccessToken -ResourceUrl "https://management.azure.com").Token');
  }

  lines.push('$headers = @{');
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'authorization') {
      lines.push('    "Authorization" = "Bearer $token"');
    } else {
      lines.push(`    "${key}" = "${value}"`);
    }
  }
  lines.push('}');
  lines.push('');

  if (req.body) {
    lines.push(`$body = @'`);
    lines.push(JSON.stringify(req.body, null, 2));
    lines.push(`'@`);
    lines.push('');
    lines.push(`$response = Invoke-RestMethod -Uri $uri -Method ${req.method} -Headers $headers -Body $body -ContentType "application/json"`);
  } else {
    lines.push(`$response = Invoke-RestMethod -Uri $uri -Method ${req.method} -Headers $headers`);
  }

  lines.push('$response | ConvertTo-Json -Depth 10');

  return lines.join('\n');
}

export function generateCSharp(req: ApiRequestInfo): string {
  const lines: string[] = [];

  let fullUrl = req.url;
  const params = Object.entries(req.queryParams);
  if (params.length > 0) {
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
  }

  lines.push('using System.Net.Http;');
  lines.push('using System.Net.Http.Headers;');
  lines.push('');
  lines.push('var client = new HttpClient();');
  lines.push('');

  const hasAuth = !!req.headers['Authorization'];
  if (hasAuth) {
    lines.push('// Get token using Azure.Identity');
    lines.push('var credential = new Azure.Identity.DefaultAzureCredential();');
    lines.push('var tokenResult = await credential.GetTokenAsync(');
    lines.push('    new Azure.Core.TokenRequestContext(new[] { "https://management.azure.com/.default" }));');
    lines.push('');
    lines.push('client.DefaultRequestHeaders.Authorization =');
    lines.push('    new AuthenticationHeaderValue("Bearer", tokenResult.Token);');
  }

  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'authorization') continue;
    lines.push(`client.DefaultRequestHeaders.Add("${key}", "${value}");`);
  }
  lines.push('');

  if (req.body) {
    lines.push(`var content = new StringContent(`);
    lines.push(`    @"${JSON.stringify(req.body).replace(/"/g, '""')}",`);
    lines.push('    System.Text.Encoding.UTF8,');
    lines.push('    "application/json");');
    lines.push('');
    lines.push(`var response = await client.${req.method === 'POST' ? 'PostAsync' : 'PutAsync'}(`);
    lines.push(`    "${fullUrl}", content);`);
  } else {
    lines.push(`var response = await client.GetAsync("${fullUrl}");`);
  }

  lines.push('');
  lines.push('var json = await response.Content.ReadAsStringAsync();');
  lines.push('Console.WriteLine($"Status: {response.StatusCode}");');
  lines.push('Console.WriteLine(json);');

  return lines.join('\n');
}

export function generateJavaScript(req: ApiRequestInfo): string {
  const lines: string[] = [];

  let fullUrl = req.url;
  const params = Object.entries(req.queryParams);
  if (params.length > 0) {
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
  }

  const headers = { ...req.headers };
  if (headers['Authorization']) {
    headers['Authorization'] = 'Bearer <your-access-token>';
  }

  lines.push(`const response = await fetch("${fullUrl}", {`);
  lines.push(`  method: "${req.method}",`);
  lines.push('  headers: {');
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`    "${key}": "${value}",`);
  }
  lines.push('  },');

  if (req.body) {
    lines.push(`  body: JSON.stringify(${JSON.stringify(req.body, null, 4)}),`);
  }

  lines.push('});');
  lines.push('');
  lines.push('const data = await response.json();');
  lines.push(`console.log("Status:", response.status);`);
  lines.push('console.log(data);');

  return lines.join('\n');
}

export type SnippetLanguage = 'curl' | 'python' | 'powershell' | 'csharp' | 'javascript';

export const snippetGenerators: Record<SnippetLanguage, (req: ApiRequestInfo) => string> = {
  curl: generateCurl,
  python: generatePython,
  powershell: generatePowerShell,
  csharp: generateCSharp,
  javascript: generateJavaScript,
};

export const snippetLabels: Record<SnippetLanguage, string> = {
  curl: 'cURL',
  python: 'Python',
  powershell: 'PowerShell',
  csharp: 'C#',
  javascript: 'JavaScript',
};
