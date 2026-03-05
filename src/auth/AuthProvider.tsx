import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import type { ReactNode } from 'react';

const msalInstance = new PublicClientApplication(msalConfig);

const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((event) => {
  if (
    event.eventType === EventType.LOGIN_SUCCESS &&
    event.payload &&
    'account' in event.payload &&
    event.payload.account
  ) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

export { msalInstance };
