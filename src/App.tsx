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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
