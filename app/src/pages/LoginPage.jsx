import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'aluno' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Bem-vindo ao FCTHub!');
      navigate('/');
    } catch (err) {
      toast.error('Email ou password incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(108,99,255,0.15) 0%, transparent 60%), var(--bg-base)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontSize: 48, fontWeight: 900,
            background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 8,
          }}>⬡ FCTHub</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Plataforma de Gestão de FCT — Escola Bento Jesus Caraça
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 28, gap: 4 }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 13, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
              }}>
                {t === 'login' ? 'Entrar' : 'Registar'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>Email</label>
                <input className="input" name="email" type="email" placeholder="email@escola.pt"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input className="input" name="password" type="password" placeholder="••••••••"
                  value={form.password} onChange={handleChange} required />
              </div>
              <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Entrar'}
              </button>
            </form>
          ) : (
            <RegisterForm />
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 12 }}>
          Escola Profissional Bento Jesus Caraça · Lisboa
        </p>
      </div>
    </div>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'aluno' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Conta criada! Verifica o teu email para confirmar.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Erro ao registar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="field">
        <label>Nome completo</label>
        <input className="input" name="name" placeholder="João Silva" value={form.name} onChange={handleChange} required />
      </div>
      <div className="field">
        <label>Email</label>
        <input className="input" name="email" type="email" placeholder="email@escola.pt" value={form.email} onChange={handleChange} required />
      </div>
      <div className="field">
        <label>Password</label>
        <input className="input" name="password" type="password" placeholder="mínimo 6 caracteres" value={form.password} onChange={handleChange} required minLength={6} />
      </div>
      <div className="field">
        <label>Perfil</label>
        <select className="input" name="role" value={form.role} onChange={handleChange}>
          <option value="aluno">Aluno</option>
          <option value="professor">Professor</option>
        </select>
      </div>
      <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Criar Conta'}
      </button>
    </form>
  );
}
