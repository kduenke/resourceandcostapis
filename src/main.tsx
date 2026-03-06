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

// MSAL v5 popup flow: when the popup redirects back to this page with
// #code=...&state=..., we must broadcast the auth response to the parent
// window via BroadcastChannel and close the popup — without rendering React.
if (window.location.hash.includes('code=')) {
  broadcastResponseToMainFrame()
    .then(() => {
      window.close();
    })
    .catch(() => {
      // Not a popup redirect — fall through to normal app rendering
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
