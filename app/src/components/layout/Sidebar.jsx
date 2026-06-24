import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CalendarDays, User, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/projects', icon: FolderKanban,    label: 'Projetos' },
  { to: '/calendar', icon: CalendarDays,    label: 'Calendário' },
  { to: '/profile',  icon: User,            label: 'Perfil' },
];

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Sessão terminada');
    navigate('/login');
  };

  return (
    <nav className="app-sidebar sidebar">
      <p className="sidebar-section-title">Menu</p>

      {navItems.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}

      {profile?.role === 'admin' && (
        <>
          <p className="sidebar-section-title">Administração</p>
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <ShieldCheck size={17} />
            Admin
          </NavLink>
        </>
      )}

      <div style={{ marginTop: 'auto' }}>
        <button className="sidebar-link w-full" onClick={handleLogout} style={{ color: 'var(--red)' }}>
          <LogOut size={17} />
          Terminar Sessão
        </button>
      </div>
    </nav>
  );
}
