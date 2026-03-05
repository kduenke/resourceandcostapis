import { type Configuration, LogLevel } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || 'common';

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: ['https://management.azure.com/.default'],
};

export const armScopes = {
  scopes: ['https://management.azure.com/.default'],
};
