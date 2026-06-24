import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Header />
      <Sidebar />
      <main className="app-main fade-in">
        <Outlet />
      </main>
    </div>
  );
}
