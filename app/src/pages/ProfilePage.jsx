import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profilesApi } from '../lib/api';
import { User, Save, Key, Camera } from 'lucide-react';
import { RoleBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { profile, setProfile, user } = useAuth();
  const [form, setForm] = useState({ name: profile?.name || '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const initials = form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const updated = await profilesApi.update(profile.id, { name: form.name, avatar_initials: initials });
      setProfile(updated);
      toast.success('Perfil atualizado!');
    } catch { toast.error('Erro ao atualizar perfil'); }
    finally { setLoading(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('A carregar imagem...');
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${profile.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      const updated = await profilesApi.update(profile.id, { avatar_url: publicUrl });
      setProfile(updated);
      toast.success('Imagem de perfil atualizada!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar imagem: ' + (err.message || ''), { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error('As passwords não coincidem'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Password demasiado curta'); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      toast.success('Password alterada!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { toast.error(err.message || 'Erro ao alterar password'); }
    finally { setPwLoading(false); }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Perfil</h1>
          <p className="page-sub">Gere as tuas informações de conta</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-upload').click()}>
            <Avatar initials={profile?.avatar_initials} url={profile?.avatar_url} size="lg" />
            <div style={{
              position: 'absolute', bottom: -2, right: -2, background: 'var(--accent)',
              borderRadius: '50%', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg-surface)', width: 22, height: 22
            }}>
              <Camera size={12} style={{ color: '#fff' }} />
            </div>
          </div>
          <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={uploading} />

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{profile?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user?.email}</p>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <RoleBadge role={profile?.role} />
              {uploading && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>A carregar...</span>}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
            {profile?.created_at && <p>Membro desde {format(new Date(profile.created_at), 'MMM yyyy')}</p>}
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Nome completo</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" value={user?.email} disabled style={{ opacity: .6 }} />
            <span className="field-hint">O email não pode ser alterado aqui.</span>
          </div>
          <div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <Save size={14} /> {loading ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Password card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Key size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Alterar Password</h3>
        </div>
        <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Nova Password</label>
            <input className="input" type="password" placeholder="mínimo 6 caracteres"
              value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Confirmar Nova Password</label>
            <input className="input" type="password" placeholder="repete a nova password"
              value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <div>
            <button className="btn btn-secondary" type="submit" disabled={pwLoading}>
              {pwLoading ? 'A alterar...' : 'Alterar Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
