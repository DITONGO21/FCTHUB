import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

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
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label>Email</label>
              <input className="input" name="email" type="email" placeholder="email@escola.pt"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={handleChange} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4
                }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 12 }}>
          Escola Profissional Bento Jesus Caraça · Lisboa
        </p>
      </div>
    </div>
  );
}
