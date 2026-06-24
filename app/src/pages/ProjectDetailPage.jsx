import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsApi, versionsApi, commentsApi, filesApi, notificationsApi, activityApi } from '../lib/api';
import { ArrowLeft, Plus, Check, X, Upload, MessageSquare, GitCommit, Paperclip, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [files, setFiles] = useState([]);
  const [tab, setTab] = useState('versions');
  const [loading, setLoading] = useState(true);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, v, c, f] = await Promise.all([
        projectsApi.getById(id),
        versionsApi.getByProject(id),
        commentsApi.getByProject(id),
        filesApi.getByProject(id),
      ]);
      setProject(p); setVersions(v); setComments(c); setFiles(f);
    } catch (e) { toast.error('Erro ao carregar projeto'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const handleVersionStatus = async (vId, status) => {
    try {
      const updated = await versionsApi.updateStatus(vId, status);
      setVersions(v => v.map(x => x.id === vId ? updated : x));
      // Notify student
      await notificationsApi.create({
        user_id: project.author_id,
        type: status === 'aprovado' ? 'approval' : 'rejection',
        text: `A tua versão foi ${status === 'aprovado' ? 'aprovada ✅' : 'rejeitada ❌'} pelo professor.`,
        link: id,
      });
      toast.success(`Versão ${status === 'aprovado' ? 'aprovada' : 'rejeitada'}`);
    } catch { toast.error('Erro ao atualizar estado'); }
  };

  const handleStatusChange = async (status) => {
    try {
      const updated = await projectsApi.update(id, { status });
      setProject(updated);
      toast.success('Estado atualizado');
    } catch { toast.error('Erro ao atualizar estado'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const c = await commentsApi.create({ project_id: id, author_id: profile.id, content: commentText });
      setComments(prev => [...prev, c]);
      setCommentText('');
      if (profile.role === 'professor') {
        await notificationsApi.create({ user_id: project.author_id, type: 'comment', text: `${profile.name} comentou no teu projeto.`, link: id });
      }
      await activityApi.log({ user_id: profile.id, type: 'comment', text: 'comentou em', target: project.title, target_id: id });
    } catch { toast.error('Erro ao comentar'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Ficheiro demasiado grande (máx 10MB)'); return; }
    try {
      toast.loading('A carregar ficheiro...', { id: 'upload' });
      const f = await filesApi.upload(id, profile.id, file);
      setFiles(prev => [f, ...prev]);
      toast.success('Ficheiro carregado!', { id: 'upload' });
    } catch (err) { toast.error('Erro ao carregar ficheiro', { id: 'upload' }); }
  };

  const handleDeleteFile = async (fileId, storagePath) => {
    if (!confirm('Eliminar ficheiro?')) return;
    try {
      await filesApi.delete(fileId, storagePath);
      setFiles(f => f.filter(x => x.id !== fileId));
      toast.success('Ficheiro eliminado');
    } catch { toast.error('Erro ao eliminar'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!project) return null;

  const canManage = profile?.role === 'professor' || profile?.role === 'admin';
  const isAuthor  = profile?.id === project.author_id;

  const TABS = [
    { key: 'versions', label: 'Versões', icon: <GitCommit size={15} /> },
    { key: 'comments', label: `Comentários (${comments.length})`, icon: <MessageSquare size={15} /> },
    { key: 'files',    label: `Ficheiros (${files.length})`, icon: <Paperclip size={15} /> },
  ];

  return (
    <div>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={15} /> Voltar aos Projetos
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>{project.description}</p>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {project.empresa && <span>🏢 {project.empresa}</span>}
              <span>👤 {project.profiles?.name}</span>
              <span>📚 {project.turmas?.name}</span>
              <span>📅 {format(new Date(project.created_at), 'dd/MM/yyyy')}</span>
            </div>
            {Array.isArray(project.tags) && project.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                {project.tags.map(t => <span key={t} className="badge badge-purple">{t}</span>)}
              </div>
            )}
          </div>

          {canManage && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="input" style={{ width: 160 }} value={project.status} onChange={e => handleStatusChange(e.target.value)}>
                <option value="pendente">Pendente</option>
                <option value="em_progresso">Em Progresso</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, fontWeight: 600,
            color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}

        {isAuthor && tab === 'versions' && (
          <button className="btn btn-primary btn-sm ml-auto" onClick={() => setShowVersionModal(true)}>
            <Plus size={14} /> Nova Versão
          </button>
        )}
        {isAuthor && tab === 'files' && (
          <label className="btn btn-secondary btn-sm ml-auto" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> Upload
            <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        )}
      </div>

      {/* Versions Tab */}
      {tab === 'versions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {versions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-title">Sem versões ainda</p>
              {isAuthor && <p className="empty-state-sub">Submete a primeira versão do teu projeto.</p>}
            </div>
          ) : versions.map(v => (
            <div key={v.id} className="card card-sm">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <GitCommit size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{v.title}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{v.description}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {format(new Date(v.created_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                {canManage && v.status === 'pendente' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleVersionStatus(v.id, 'aprovado')}>
                      <Check size={13} /> Aprovar
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleVersionStatus(v.id, 'rejeitado')}>
                      <X size={13} /> Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments Tab */}
      {tab === 'comments' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {comments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <p className="empty-state-title">Sem comentários</p>
              </div>
            ) : comments.map(c => (
              <div key={c.id} className="card card-sm" style={{ display: 'flex', gap: 12 }}>
                <Avatar initials={c.profiles?.avatar_initials} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13 }}>{c.profiles?.name}</strong>
                    <span className={`badge badge-${c.profiles?.role === 'professor' ? 'blue' : 'muted'}`} style={{ fontSize: 10 }}>{c.profiles?.role}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: pt })}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 10 }}>
            <textarea className="input" style={{ flex: 1, resize: 'none' }} rows={2}
              placeholder="Escreve um comentário..." value={commentText}
              onChange={e => setCommentText(e.target.value)} />
            <button className="btn btn-primary" type="submit" disabled={!commentText.trim()}>Enviar</button>
          </form>
        </div>
      )}

      {/* Files Tab */}
      {tab === 'files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📎</div>
              <p className="empty-state-title">Sem ficheiros</p>
              {isAuthor && <p className="empty-state-sub">Carrega documentos, relatórios ou imagens.</p>}
            </div>
          ) : files.map(f => (
            <div key={f.id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{getFileIcon(f.type)}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(f.size)} · {format(new Date(f.created_at), 'dd/MM/yyyy')}</p>
              </div>
              <a href={f.public_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Abrir</a>
              {(isAuthor || canManage) && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFile(f.id, f.storage_path)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showVersionModal && (
        <NewVersionModal
          projectId={id}
          authorId={profile.id}
          onClose={() => setShowVersionModal(false)}
          onCreated={(v) => { setVersions(prev => [v, ...prev]); setShowVersionModal(false); }}
        />
      )}
    </div>
  );
}

function NewVersionModal({ projectId, authorId, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const v = await versionsApi.create({ ...form, project_id: projectId, author_id: authorId, status: 'pendente' });
      toast.success('Versão submetida!');
      onCreated(v);
    } catch { toast.error('Erro ao submeter versão'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Nova Versão</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Título da Versão *</label>
            <input className="input" placeholder="v1.3 – Módulo de relatórios" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea className="input" rows={4} placeholder="O que foi implementado nesta versão..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'A submeter...' : 'Submeter Versão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const getFileIcon = (type = '') => {
  if (type.includes('pdf'))   return '📄';
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎥';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel'))   return '📊';
  return '📎';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
