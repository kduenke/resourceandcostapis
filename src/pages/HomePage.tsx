import { useIsAuthenticated } from '@azure/msal-react';
import { apiCatalog } from '../services/apiCatalog';
import { MethodBadge } from '../components/common/MethodBadge';
import { Link } from 'react-router-dom';
import './HomePage.css';

const coreApis = apiCatalog.filter((a) => a.category === 'core');
const pricingApis = apiCatalog.filter((a) => a.category === 'pricing');

const apiIcons: Record<string, string> = {
  subscriptions: '🔑',
  locations: '🌍',
  'resource-skus': '⚙️',
  'vm-sizes': '📐',
  'compute-resources': '🖥️',
  'retail-pricing': '💰',
  'cost-management': '📊',
};

export function HomePage() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content animate-in">
          <span className="hero-badge">Interactive API Training</span>
          <h1 className="hero-title">
            Explore Azure
            <br />
            <span className="hero-title-accent">Resource APIs</span>
          </h1>
          <p className="hero-subtitle">
            Discover the right APIs for pulling hardware SKUs, VM sizes, pricing, and cost data from Azure.
            See every HTTP request, header, and parameter — then grab the code in your language.
          </p>
          <div className="hero-status">
            {isAuthenticated ? (
              <span className="status-badge status-connected">
                <span className="status-dot-green" /> Authenticated — Ready to explore
              </span>
            ) : (
              <span className="status-badge status-disconnected">
                🔐 Sign in with Microsoft to access authenticated APIs
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-heading">
          <span className="heading-line" />
          Core Resource APIs
          <span className="heading-tag">Authenticated</span>
        </h2>
        <div className="api-cards-grid">
          {coreApis.map((api, i) => (
            <Link key={api.id} to={`/api/${api.id}`} className={`api-card animate-in stagger-${i + 1}`}>
              <div className="api-card-icon">{apiIcons[api.id]}</div>
              <div className="api-card-content">
                <div className="api-card-top">
                  <h3 className="api-card-name">{api.shortName}</h3>
                  <MethodBadge method={api.method} size="sm" />
                </div>
                <p className="api-card-desc">{api.description}</p>
                <code className="api-card-path">{api.pathTemplate}</code>
              </div>
              <div className="api-card-arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-heading">
          <span className="heading-line" />
          Pricing &amp; Cost APIs
          <span className="heading-tag heading-tag-green">Includes Public API</span>
        </h2>
        <div className="api-cards-grid">
          {pricingApis.map((api, i) => (
            <Link key={api.id} to={`/api/${api.id}`} className={`api-card animate-in stagger-${i + 1}`}>
              <div className="api-card-icon">{apiIcons[api.id]}</div>
              <div className="api-card-content">
                <div className="api-card-top">
                  <h3 className="api-card-name">{api.shortName}</h3>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <MethodBadge method={api.method} size="sm" />
                    {!api.requiresAuth && <span className="card-public-badge">Public</span>}
                  </div>
                </div>
                <p className="api-card-desc">{api.description}</p>
                <code className="api-card-path">
                  {api.isExternalUrl ? api.pathTemplate : api.pathTemplate}
                </code>
              </div>
              <div className="api-card-arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section features-section">
        <h2 className="section-heading">
          <span className="heading-line" />
          What You'll Learn
        </h2>
        <div className="features-grid">
          <div className="feature-card animate-in stagger-1">
            <div className="feature-icon">📤</div>
            <h3>Full Request Visibility</h3>
            <p>See every HTTP method, URL, header, query parameter, and request body for each API call.</p>
          </div>
          <div className="feature-card animate-in stagger-2">
            <div className="feature-icon">📥</div>
            <h3>Live Response Data</h3>
            <p>Inspect real JSON responses from your Azure subscription with syntax highlighting and collapsible trees.</p>
          </div>
          <div className="feature-card animate-in stagger-3">
            <div className="feature-icon">💻</div>
            <h3>Code in 5 Languages</h3>
            <p>Grab ready-to-use code snippets in cURL, Python, PowerShell, C#, and JavaScript.</p>
          </div>
          <div className="feature-card animate-in stagger-4">
            <div className="feature-icon">🔐</div>
            <h3>Entra ID Auth Flow</h3>
            <p>Learn how Microsoft Entra ID (Azure AD) authentication works with MSAL.js in a real SPA.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
