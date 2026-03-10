import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { LocationsPage } from './pages/LocationsPage';
import { ResourceSkusPage } from './pages/ResourceSkusPage';
import { VmSizesPage } from './pages/VmSizesPage';
import { ComputeResourcesPage } from './pages/ComputeResourcesPage';
import { RetailPricingPage } from './pages/RetailPricingPage';
import { CostManagementPage } from './pages/CostManagementPage';
import { QuotaListPage } from './pages/QuotaListPage';
import { QuotaUpdatePage } from './pages/QuotaUpdatePage';
import { QuotaRequestStatusPage } from './pages/QuotaRequestStatusPage';
import { ProviderUsagePage } from './pages/ProviderUsagePage';
// Support ticket pages temporarily hidden
// import { SupportTicketsListPage } from './pages/SupportTicketsListPage';
// import { SupportTicketsCreatePage } from './pages/SupportTicketsCreatePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/api/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/api/locations" element={<LocationsPage />} />
          <Route path="/api/resource-skus" element={<ResourceSkusPage />} />
          <Route path="/api/vm-sizes" element={<VmSizesPage />} />
          <Route path="/api/compute-resources" element={<ComputeResourcesPage />} />
          <Route path="/api/retail-pricing" element={<RetailPricingPage />} />
          <Route path="/api/cost-management" element={<CostManagementPage />} />
          <Route path="/api/quota-list" element={<QuotaListPage />} />
          <Route path="/api/quota-update" element={<QuotaUpdatePage />} />
          <Route path="/api/quota-request-status" element={<QuotaRequestStatusPage />} />
          <Route path="/api/provider-usage" element={<ProviderUsagePage />} />
          {/* Support ticket routes temporarily hidden */}
          {/* <Route path="/api/support-tickets-list" element={<SupportTicketsListPage />} /> */}
          {/* <Route path="/api/support-tickets-create" element={<SupportTicketsCreatePage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
