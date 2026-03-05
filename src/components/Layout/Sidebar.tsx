import { NavLink } from 'react-router-dom';
import { apiCatalog } from '../../services/apiCatalog';
import './Sidebar.css';

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

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link sidebar-home ${isActive ? 'active' : ''}`}>
          <span className="sidebar-icon">🏠</span>
          <span>Home</span>
        </NavLink>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">
            <span className="section-line" />
            Core Resource APIs
          </h3>
          {coreApis.map((api) => (
            <NavLink
              key={api.id}
              to={`/api/${api.id}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{apiIcons[api.id]}</span>
              <div className="sidebar-link-content">
                <span className="sidebar-link-name">{api.shortName}</span>
                <span className="sidebar-link-method">{api.method}</span>
              </div>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">
            <span className="section-line" />
            Pricing &amp; Cost
          </h3>
          {pricingApis.map((api) => (
            <NavLink
              key={api.id}
              to={`/api/${api.id}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{apiIcons[api.id]}</span>
              <div className="sidebar-link-content">
                <span className="sidebar-link-name">{api.shortName}</span>
                <span className="sidebar-link-method">{api.method}</span>
              </div>
              {!api.requiresAuth && <span className="sidebar-badge">Public</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <a
          href="https://learn.microsoft.com/en-us/rest/api/azure/"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-docs-link"
        >
          📚 Azure REST API Docs ↗
        </a>
      </div>
    </aside>
  );
}
