import { useEffect, useState } from 'react';
import { profilesApi, turmasApi, projectsApi } from '../lib/api';
import { Users, GraduationCap, FolderKanban, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { RoleBadge, StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'users',    label: 'Utilizadores', icon: <Users size={15} /> },
  { key: 'turmas',   label: 'Turmas',        icon: <GraduationCap size={15} /> },
  { key: 'projects', label: 'Todos os Projetos', icon: <FolderKanban size={15} /> },
];

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTurmaModal, setShowTurmaModal] = useState(false);

  useEffect(() => {
    Promise.all([
      profilesApi.getAll(),
      turmasApi.getAll(),
      projectsApi.getAll(),
    ]).then(([u, t, p]) => { setUsers(u); setTurmas(t); setProjects(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = async (id, active) => {
    try {
      await profilesApi.toggleActive(id, !active);
      setUsers(u => u.map(x => x.id === id ? { ...x, active: !active } : x));
      toast.success(`Utilizador ${!active ? 'ativado' : 'desativado'}`);
    } catch { toast.error('Erro ao atualizar'); }
  };

  const deleteTurma = async (id) => {
    if (!confirm('Eliminar turma?')) return;
    try {
      await turmasApi.delete(id);
      setTurmas(t => t.filter(x => x.id !== id));
      toast.success('Turma eliminada');
    } catch { toast.error('Erro ao eliminar'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const stats = {
    users:    users.length,
    alunos:   users.filter(u => u.role === 'aluno').length,
    profs:    users.filter(u => u.role === 'professor').length,
    projects: projects.length,
    concluidos: projects.filter(p => p.status === 'concluido').length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administração</h1>
          <p className="page-sub">Gestão global da plataforma FCTHub</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        <StatCard icon="👥" label="Utilizadores" value={stats.users} />
        <StatCard icon="🎓" label="Alunos" value={stats.alunos} />
        <StatCard icon="👩‍🏫" label="Professores" value={stats.profs} />
        <StatCard icon="📁" label="Projetos" value={stats.projects} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, fontWeight: 600,
            color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, background: 'none', border: 'none', cursor: 'pointer',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
        {tab === 'turmas' && (
          <button className="btn btn-primary btn-sm ml-auto" onClick={() => setShowTurmaModal(true)}>
            <Plus size={14} /> Nova Turma
          </button>
        )}
      </div>

      {/* Users */}
      {tab === 'users' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilizador</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Turma</th>
                <th>Desde</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar initials={u.avatar_initials} url={u.avatar_url} size="sm" />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.turmas?.name || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(u.created_at), 'dd/MM/yy')}</td>
                  <td>
                    <span className={`badge badge-${u.active !== false ? 'green' : 'red'}`}>
                      {u.active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u.id, u.active !== false)}
                      title={u.active ? 'Desativar' : 'Ativar'}>
                      {u.active !== false ? <ToggleRight size={18} style={{ color: 'var(--green)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Turmas */}
      {tab === 'turmas' && (
        <div className="grid-2" style={{ gap: 16 }}>
          {turmas.map(t => (
            <div key={t.id} className="card card-sm">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t.description}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    👩‍🏫 {t.profiles?.name || 'Sem professor'}
                  </p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteTurma(t.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                {projects.filter(p => p.turma_id === t.id).length} projeto(s)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Projects */}
      {tab === 'projects' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{p.title}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.profiles?.name}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.turmas?.name || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.empresa || '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(p.updated_at || p.created_at), 'dd/MM/yy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTurmaModal && (
        <NewTurmaModal
          professors={users.filter(u => u.role === 'professor')}
          onClose={() => setShowTurmaModal(false)}
          onCreated={(t) => { setTurmas(prev => [...prev, t]); setShowTurmaModal(false); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function NewTurmaModal({ professors, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', professor_id: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const t = await turmasApi.create(form);
      toast.success('Turma criada!');
      onCreated(t);
    } catch { toast.error('Erro ao criar turma'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Nova Turma</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Nome da Turma *</label>
            <input className="input" placeholder="TPSI-A 2025/26" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Descrição</label>
            <input className="input" placeholder="Tecnologias e Programação..." value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="field">
            <label>Professor Tutor</label>
            <select className="input" value={form.professor_id} onChange={e => setForm(f => ({ ...f, professor_id: e.target.value }))}>
              <option value="">Sem professor</option>
              {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'A criar...' : 'Criar Turma'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
