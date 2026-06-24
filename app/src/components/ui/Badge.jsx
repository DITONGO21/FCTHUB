export default function Badge({ children, variant = 'muted' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    em_progresso: { label: 'Em Progresso', variant: 'blue' },
    concluido:    { label: 'Concluído',     variant: 'green' },
    pendente:     { label: 'Pendente',      variant: 'yellow' },
    cancelado:    { label: 'Cancelado',     variant: 'red' },
    aprovado:     { label: 'Aprovado',      variant: 'green' },
    rejeitado:    { label: 'Rejeitado',     variant: 'red' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'muted' };
  return <span className={`badge badge-${variant}`}>{label}</span>;
}

export function RoleBadge({ role }) {
  const map = {
    admin:     { label: 'Admin',     variant: 'purple' },
    professor: { label: 'Professor', variant: 'blue' },
    aluno:     { label: 'Aluno',     variant: 'muted' },
  };
  const { label, variant } = map[role] || { label: role, variant: 'muted' };
  return <span className={`badge badge-${variant}`}>{label}</span>;
}
