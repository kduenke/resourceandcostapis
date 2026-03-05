# Azure API Explorer

> **Interactive training site** for learning Azure Resource Manager REST APIs. Sign in with Microsoft Entra ID, explore your Azure resources, and see exactly how every API call is made — then grab the code in your language.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![MSAL](https://img.shields.io/badge/MSAL.js-v5-purple) ![Vite](https://img.shields.io/badge/Vite-7-yellow)

## What This Does

This is a **pure client-side SPA** (no backend) that lets you:

- 🔐 **Authenticate** with Microsoft Entra ID (Azure AD) using MSAL.js
- 🔍 **Explore** 7 Azure REST APIs for resources, SKUs, pricing, and cost data
- 📤 **See every request** — HTTP method, full URL, headers, query parameters, request body
- 📥 **Inspect responses** — syntax-highlighted JSON with collapsible tree view
- 💻 **Copy code snippets** — auto-generated cURL, Python, PowerShell, C#, and JavaScript
- 💰 **Try public APIs** — Azure Retail Prices API works without authentication

All API calls go **directly from your browser** to Azure — no proxying, no secrets on a server. This transparency is the whole point.

## APIs Covered

| API | Method | Auth | Description |
|-----|--------|------|-------------|
| **Subscriptions** | `GET` | ✅ Entra ID | List subscriptions you have access to |
| **Locations** | `GET` | ✅ Entra ID | List available Azure regions |
| **Resource SKUs** | `GET` | ✅ Entra ID | List compute SKUs (VM sizes, disks) with capabilities & restrictions |
| **VM Sizes** | `GET` | ✅ Entra ID | List VM sizes in a specific region |
| **Compute Resources** | `GET` | ✅ Entra ID | List virtual machines in a subscription |
| **Retail Prices** | `GET` | 🌐 Public | Query Azure retail pricing (no auth needed!) |
| **Cost Management** | `POST` | ✅ Entra ID | Query and analyze Azure resource costs |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- An Azure account (free tier works)
- An Entra ID app registration (see below)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/resourceandcostapis.git
cd resourceandcostapis
npm install
```

### 2. Create an Entra ID App Registration

1. Go to the [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Set the following:
   - **Name**: `Azure API Explorer` (or whatever you like)
   - **Supported account types**: "Single tenant only - Default Directory"
   - **Redirect URI**: Select **Single-page application (SPA)** and enter `http://localhost:5173`
3. Click **Register**
4. On the app's **Overview** page, copy the **Application (client) ID** and **Directory (tenant) ID**

#### Configure API Permissions

5. Go to **API permissions** → **Add a permission** → **Azure Service Management**
6. Select **Delegated permissions** → check `user_impersonation`
7. Click **Add permissions**

#### Configure Authentication

9. Go to **Authentication** → Under **Single-page application**, confirm `http://localhost:5173` is listed
10. Click the **Settings** tab -> Under **Implicit grant and hybrid flows**, leave both checkboxes **unchecked** (MSAL.js v5 uses auth code flow with PKCE)
11. Click **Save**

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```
VITE_AZURE_CLIENT_ID=your-application-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with your Microsoft account.

## How to Use

1. **Sign in** using the Microsoft button in the header
2. **Start with Subscriptions** — this loads your available subscriptions
3. **Navigate** to any API page in the sidebar
4. **Fill in parameters** (subscription ID, location, filters)
5. **Click Send Request** — watch the request inspector show the full HTTP details
6. **Copy code** — switch between cURL, Python, PowerShell, C#, JavaScript tabs
7. **Try Retail Pricing** — this works without authentication!

## Architecture

```
Browser (React SPA)
  ├── MSAL.js → login.microsoftonline.com  (Entra ID auth)
  ├── fetch() → management.azure.com       (Azure Resource Manager)
  └── fetch() → prices.azure.com           (Retail Prices - public)
```

- **No backend server** — all API calls are direct from the browser
- **MSAL.js v5** handles auth code flow with PKCE (most secure SPA flow)
- **Token scope**: `https://management.azure.com/.default`
- Azure Resource Manager APIs [support CORS](https://learn.microsoft.com/en-us/rest/api/azure/) for SPAs

## Tech Stack

- **React 19** + **TypeScript 5.9** — UI framework
- **Vite 7** — build tool and dev server
- **@azure/msal-browser** + **@azure/msal-react** — Microsoft Authentication Library
- **React Router 7** — client-side routing

## Project Structure

```
src/
├── auth/           # MSAL configuration and AuthProvider
├── components/
│   ├── Layout/     # Header, Sidebar, Layout shell
│   ├── ApiExplorer/# RequestPanel, ResponsePanel, CodeSnippets, ParameterForm
│   └── common/     # JsonViewer, CopyButton, MethodBadge, LoadingSpinner
├── pages/          # One page per API (SubscriptionsPage, VmSizesPage, etc.)
├── services/       # Azure API client and API catalog/definitions
├── hooks/          # useAzureApi hook for state management
├── utils/          # Code generators (cURL, Python, PS, C#, JS) and formatters
├── types/          # TypeScript interfaces for Azure API responses
└── styles/         # Color theme from design palette
```

## Deployment

### GitHub Pages

```bash
npm run build
# Deploy the `dist/` folder to GitHub Pages
```

### Azure Static Web Apps

This project works great with [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/). Just connect your GitHub repo and it auto-deploys.

Remember to add your production URL as a redirect URI in your app registration.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/new-api`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

[MIT](LICENSE)
