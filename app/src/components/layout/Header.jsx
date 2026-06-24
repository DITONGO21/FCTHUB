import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';
import NotificationsPanel from '../ui/NotificationsPanel';

export default function Header() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/projects?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="header">
      <div className="header-logo">
        <span>⬡</span> FCTHub
      </div>

      <form className="header-search" onSubmit={handleSearch}>
        <Search size={15} className="header-search-icon" />
        <input
          placeholder="Pesquisar projetos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </form>

      <div className="header-actions">
        <div className="notif-btn" style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifs(v => !v)}>
            <Bell size={18} />
          </button>
          {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
        </div>

        <button className="flex items-center gap-8" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Avatar initials={profile?.avatar_initials} size="sm" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {profile?.name?.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
}
