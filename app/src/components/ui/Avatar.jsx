export default function Avatar({ initials = '?', size = 'md', url, color }) {
  const cls = size === 'sm' ? 'avatar avatar-sm' : size === 'lg' ? 'avatar avatar-lg' : 'avatar';
  return (
    <div className={cls} style={{ ...(color ? { background: color } : {}), overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url ? (
        <img src={url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </div>
  );
}
