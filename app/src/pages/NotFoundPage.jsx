import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', gap: 16 }}>
      <div style={{ fontSize: 80, fontWeight: 900, background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Página não encontrada</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Esta página não existe ou não tens acesso.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Voltar ao Início</button>
    </div>
  );
}
