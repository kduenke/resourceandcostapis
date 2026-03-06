import { useState, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { callAzureApi, buildArmPath } from '../services/azureApi';
import { armScopes } from '../auth/authConfig';
import type { ApiDefinition } from '../services/apiCatalog';
import type { CapturedApiCall } from '../types/azure';

export function useAzureApi() {
  const { instance, accounts } = useMsal();
  const [apiCall, setApiCall] = useState<CapturedApiCall | null>(null);

  const execute = useCallback(
    async (
      apiDef: ApiDefinition,
      pathParams: Record<string, string>,
      queryOverrides: Record<string, string> = {},
      bodyOverride?: unknown
    ) => {
      let token: string | undefined;

      if (apiDef.requiresAuth && accounts.length > 0) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            ...armScopes,
            account: accounts[0],
          });
          token = tokenResponse.accessToken;
        } catch (error) {
          if (error instanceof InteractionRequiredAuthError) {
            const tokenResponse = await instance.acquireTokenPopup(armScopes);
            token = tokenResponse.accessToken;
          } else {
            throw error;
          }
        }
      }

      const path = apiDef.isExternalUrl
        ? apiDef.pathTemplate
        : buildArmPath(apiDef.pathTemplate, pathParams);

      // Display URL uses the real external URL; fetch goes through proxy if needed
      const displayUrl = apiDef.displayUrl
        || (apiDef.isExternalUrl ? path : `https://management.azure.com${path}`);

      const queryParams: Record<string, string> = {};
      apiDef.parameters
        .filter((p) => p.type === 'query')
        .forEach((p) => {
          if (queryOverrides[p.name]) {
            queryParams[p.name] = queryOverrides[p.name];
          }
        });

      const body = bodyOverride || apiDef.bodyTemplate;

      setApiCall({
        request: {
          method: apiDef.method,
          url: displayUrl,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          queryParams: { ...queryParams, 'api-version': apiDef.apiVersion },
          body: apiDef.method !== 'GET' ? body : undefined,
          timestamp: Date.now(),
        },
        response: null,
        loading: true,
        error: null,
      });

      const result = await callAzureApi({
        method: apiDef.method,
        path,
        apiVersion: apiDef.apiVersion,
        queryParams,
        body: apiDef.method !== 'GET' ? body : undefined,
        token,
        isExternalUrl: apiDef.isExternalUrl,
      });

      setApiCall(result);
      return result;
    },
    [instance, accounts]
  );

  const reset = useCallback(() => {
    setApiCall(null);
  }, []);

  return { apiCall, execute, reset };
}
