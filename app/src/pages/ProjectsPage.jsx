import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsApi, turmasApi, activityApi } from '../lib/api';
import { Plus, Search, Filter, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import toast from 'react-hot-toast';

const STATUS_OPTS = [
  { value: '', label: 'Todos os estados' },
  { value: 'em_progresso', label: 'Em Progresso' },
  { value: 'concluido',    label: 'Concluído' },
  { value: 'pendente',     label: 'Pendente' },
  { value: 'cancelado',    label: 'Cancelado' },
];

export default function ProjectsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: '',
    turmaId: '',
  });

  useEffect(() => {
    loadAll();
    turmasApi.getAll().then(setTurmas).catch(console.error);
  }, [profile]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const f = profile?.role === 'aluno' ? { authorId: profile.id } : {};
      const data = await projectsApi.getAll(f);
      setProjects(data);
    } catch (e) { toast.error('Erro ao carregar projetos'); }
    finally { setLoading(false); }
  };

  const filtered = projects.filter(p => {
    if (filters.search && !p.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.turmaId && p.turma_id !== filters.turmaId) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projetos FCT</h1>
          <p className="page-sub">{filtered.length} projeto(s) encontrado(s)</p>
        </div>
        {profile?.role === 'aluno' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Novo Projeto
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Pesquisar projetos..."
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="input" style={{ width: 180 }} value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {profile?.role !== 'aluno' && (
          <select className="input" style={{ width: 200 }} value={filters.turmaId}
            onChange={e => setFilters(f => ({ ...f, turmaId: e.target.value }))}>
            <option value="">Todas as turmas</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="spinner-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <p className="empty-state-title">Nenhum projeto encontrado</p>
          <p className="empty-state-sub">Tenta ajustar os filtros ou cria um novo projeto.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          turmas={turmas}
          profileId={profile.id}
          turmaId={profile.turma_id}
          onClose={() => setShowModal(false)}
          onCreated={(p) => { setProjects(prev => [p, ...prev]); setShowModal(false); navigate(`/projects/${p.id}`); }}
        />
      )}
    </div>
  );
}

function ProjectCard({ project: p, onClick }) {
  const tags = Array.isArray(p.tags) ? p.tags : [];
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, flex: 1, marginRight: 8 }}>{p.title}</h3>
        <StatusBadge status={p.status} />
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {p.description}
      </p>
      {p.empresa && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>🏢 {p.empresa}</p>
      )}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {tags.map(tag => (
            <span key={tag} className="badge badge-muted">{tag}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>👤 {p.profiles?.name || 'Desconhecido'}</span>
        <span>{formatDistanceToNow(new Date(p.updated_at || p.created_at), { addSuffix: true, locale: pt })}</span>
      </div>
    </div>
  );
}

function NewProjectModal({ turmas, profileId, turmaId, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', empresa: '', tags: '', turma_id: turmaId || '',
  });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = await projectsApi.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        author_id: profileId,
        status: 'pendente',
      });
      await activityApi.log({ user_id: profileId, type: 'create', text: 'criou o projeto', target: form.title, target_id: p.id });
      toast.success('Projeto criado!');
      onCreated(p);
    } catch (err) { toast.error('Erro ao criar projeto'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Novo Projeto FCT</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Título do Projeto *</label>
            <input className="input" name="title" placeholder="Ex: Sistema de Gestão de Inventário" value={form.title} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea className="input" name="description" rows={3} placeholder="Descreve o projeto..." value={form.description} onChange={handleChange} style={{ resize: 'vertical' }} />
          </div>
          <div className="field">
            <label>Empresa de Acolhimento</label>
            <input className="input" name="empresa" placeholder="Nome da empresa" value={form.empresa} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Tags (separadas por vírgula)</label>
            <input className="input" name="tags" placeholder="React, Node.js, MySQL" value={form.tags} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Turma</label>
            <select className="input" name="turma_id" value={form.turma_id} onChange={handleChange}>
              <option value="">Sem turma</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'A criar...' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
