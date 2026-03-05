import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import {
  PublicClientApplication,
  EventType,
  type EventMessage,
  type AuthenticationResult,
} from '@azure/msal-browser';
import { msalConfig } from './auth/authConfig';
import './index.css';
import App from './App';

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL and process any auth code in the URL hash BEFORE rendering.
// This is critical for the popup login flow: when the popup redirects back
// with #code=..., handleRedirectPromise() extracts the code, communicates
// it to the parent window, and closes the popup — all before React mounts.
msalInstance.initialize().then(() => {
  return msalInstance.handleRedirectPromise();
}).then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as AuthenticationResult;
      if (result.account) {
        msalInstance.setActiveAccount(result.account);
      }
    }
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  );
});
