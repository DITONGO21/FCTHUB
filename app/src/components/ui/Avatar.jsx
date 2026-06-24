export default function Avatar({ initials = '?', size = 'md', color }) {
  const cls = size === 'sm' ? 'avatar avatar-sm' : size === 'lg' ? 'avatar avatar-lg' : 'avatar';
  return (
    <div className={cls} style={color ? { background: color } : {}}>
      {initials}
    </div>
  );
}
