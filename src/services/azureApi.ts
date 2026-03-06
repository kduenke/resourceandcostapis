import type { ApiRequestInfo, ApiResponseInfo, CapturedApiCall } from '../types/azure';

const ARM_BASE = 'https://management.azure.com';

export interface AzureApiCallOptions {
  method?: string;
  path: string;
  apiVersion: string;
  queryParams?: Record<string, string>;
  body?: unknown;
  token?: string;
  isExternalUrl?: boolean;
}

export async function callAzureApi(options: AzureApiCallOptions): Promise<CapturedApiCall> {
  const {
    method = 'GET',
    path,
    apiVersion,
    queryParams = {},
    body,
    token,
    isExternalUrl = false,
  } = options;

  const baseUrl = isExternalUrl ? path : `${ARM_BASE}${path}`;

  // Rewrite external URLs to use the Vite dev proxy to avoid CORS
  const PROXY_REWRITES: Record<string, string> = {
    'https://prices.azure.com': '',
  };
  let fetchUrl = baseUrl;
  for (const [origin, replacement] of Object.entries(PROXY_REWRITES)) {
    if (fetchUrl.startsWith(origin)) {
      fetchUrl = fetchUrl.replace(origin, replacement);
      break;
    }
  }

  const allQueryParams = { ...queryParams, 'api-version': apiVersion };

  const headers: Record<string, string> = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestInfo: ApiRequestInfo = {
    method,
    url: baseUrl,
    headers: { ...headers },
    queryParams: allQueryParams,
    body: body || undefined,
    timestamp: Date.now(),
  };

  const captured: CapturedApiCall = {
    request: requestInfo,
    response: null,
    loading: true,
    error: null,
  };

  try {
    const qs = Object.entries(allQueryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const fullUrl = `${fetchUrl}?${qs}`;

    const startTime = performance.now();
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(fullUrl, fetchOptions);
    const duration = Math.round(performance.now() - startTime);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    const responseInfo: ApiResponseInfo = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
    };

    captured.response = responseInfo;
    captured.loading = false;

    if (!response.ok) {
      captured.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (err) {
    captured.loading = false;
    captured.error = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  return captured;
}

export function buildArmPath(template: string, params: Record<string, string>): string {
  let path = template;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  }
  return path;
}
