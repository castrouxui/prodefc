export default function Avatar({ src, name, size = 32 }) {
  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?'

  const fallbackStyle = {
    width: size, height: size, borderRadius: '50%',
    background: 'var(--accent-dim)', border: '1.5px solid var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35, fontWeight: 700, color: 'var(--accent-text)',
    flexShrink: 0,
  }

  if (src) {
    return (
      <>
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          style={{ borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent)', flexShrink: 0 }}
          onError={e => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextSibling.style.display = 'flex'
          }}
        />
        <div style={{ ...fallbackStyle, display: 'none' }}>{initials}</div>
      </>
    )
  }

  return <div style={fallbackStyle}>{initials}</div>
}
