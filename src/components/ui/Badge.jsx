export default function Badge({ children, variant = 'default' }) {
  const styles = {
    default: { background: 'var(--bg-inset)',    color: 'var(--text-secondary)' },
    success: { background: 'var(--success-bg)',  color: 'var(--success-text)' },
    pending: { background: 'var(--pending-bg)',  color: 'var(--pending-text)' },
    error:   { background: 'var(--error-bg)',    color: 'var(--error-text)' },
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 9999,
      fontSize: 11, fontWeight: 700,
      ...styles[variant],
    }}>
      {children}
    </span>
  )
}
