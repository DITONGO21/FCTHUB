import { useEffect, useState, useRef } from 'react';
import { notificationsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Bell, X, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPanel({ onClose }) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await notificationsApi.getByUser(user.id);
        setNotifs(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();

    // click outside to close
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [user.id]);

  const markAll = async () => {
    await notificationsApi.markAllRead(user.id);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    toast.success('Notificações lidas');
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '110%', right: 0, width: 340,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
      zIndex: 200, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bell size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Notificações</span>
        {unread > 0 && <span className="badge badge-purple" style={{ marginLeft: 4 }}>{unread}</span>}
        <button className="btn btn-ghost btn-sm ml-auto" onClick={markAll} title="Marcar todas como lidas">
          <CheckCheck size={15} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {loading && <div className="spinner-center"><div className="spinner" /></div>}
        {!loading && notifs.length === 0 && (
          <div className="empty-state" style={{ padding: 32 }}>
            <p className="text-muted">Sem notificações</p>
          </div>
        )}
        {notifs.map(n => (
          <div key={n.id} style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            background: n.read ? 'transparent' : 'var(--accent-subtle)',
            fontSize: 13,
          }}>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.text}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
