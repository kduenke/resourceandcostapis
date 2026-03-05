import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <Header />
      <Sidebar />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
