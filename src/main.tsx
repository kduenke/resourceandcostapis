import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import {
  PublicClientApplication,
  EventType,
  type EventMessage,
  type AuthenticationResult,
} from '@azure/msal-browser';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { msalConfig } from './auth/authConfig';
import './index.css';
import App from './App';

// MSAL v5 popup flow: detect auth responses in both hash AND query string.
// Covers success (code=) and error (error=) responses in all URL formats.
// We gate on this check to avoid calling broadcastResponseToMainFrame() on
// normal page loads — that function strips URL hash/query on parse failure.
const _hash = window.location.hash;
const _search = window.location.search;
const hasAuthResponse =
  _hash.includes('code=') || _hash.includes('error=') ||
  _search.includes('code=') || _search.includes('error=');

if (hasAuthResponse) {
  broadcastResponseToMainFrame()
    .then(() => {
      // Auth response processed — popup closes itself via BroadcastChannel.
    })
    .catch(() => {
      // Parse failed despite auth-like params — render normally.
      renderApp();
    });
} else {
  renderApp();
}

function renderApp() {
  const msalInstance = new PublicClientApplication(msalConfig);

  msalInstance.initialize().then(() => {
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
}
