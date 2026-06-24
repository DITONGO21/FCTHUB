import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsApi, activityApi, turmasApi } from '../lib/api';
import { FolderKanban, Users, CheckCircle, Clock, Plus, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const filters = profile?.role === 'aluno' ? { authorId: profile.id } : {};
        const [p, a] = await Promise.all([
          projectsApi.getAll(filters),
          activityApi.getRecent(10),
        ]);
        setProjects(p);
        setActivity(a);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (profile) load();
  }, [profile]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const stats = {
    total:       projects.length,
    progresso:   projects.filter(p => p.status === 'em_progresso').length,
    concluidos:  projects.filter(p => p.status === 'concluido').length,
    pendentes:   projects.filter(p => p.status === 'pendente').length,
  };

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">
          Olá, {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p className="page-sub">
          {profile?.role === 'aluno' && 'Acompanha o progresso dos teus projetos FCT.'}
          {profile?.role === 'professor' && 'Monitoriza e orienta os projetos dos teus alunos.'}
          {profile?.role === 'admin' && 'Visão global da plataforma FCTHub.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        <StatCard icon="📁" label="Total Projetos" value={stats.total} color="var(--accent)" />
        <StatCard icon="🔄" label="Em Progresso" value={stats.progresso} color="var(--blue)" />
        <StatCard icon="✅" label="Concluídos" value={stats.concluidos} color="var(--green)" />
        <StatCard icon="⏳" label="Pendentes" value={stats.pendentes} color="var(--yellow)" />
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Recent projects */}
        <div className="card">
          <div className="flex items-center gap-8 mb-24">
            <FolderKanban size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Projetos Recentes</h2>
            <button className="btn btn-ghost btn-sm ml-auto" onClick={() => navigate('/projects')}>
              Ver todos <ArrowRight size={13} />
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <p className="empty-state-title">Sem projetos</p>
              {profile?.role === 'aluno' && (
                <button className="btn btn-primary btn-sm mt-8" onClick={() => navigate('/projects')}>
                  <Plus size={14} /> Criar Projeto
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.slice(0, 5).map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                >
                  <div style={{ fontSize: 20 }}>📋</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.empresa}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="card">
          <div className="flex items-center gap-8 mb-24">
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Atividade Recente</h2>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state"><p className="text-muted">Sem atividade</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activity.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Avatar initials={a.profiles?.avatar_initials} url={a.profiles?.avatar_url} size="sm" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13 }}>
                      <strong>{a.profiles?.name}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{a.text}</span>{' '}
                      <strong>{a.target}</strong>
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: pt })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color }}>{value}</p>
    </div>
  );
}
