import RankRow from './RankRow'

export default function RankingTable({ entries = [], limit }) {
  const rows = limit ? entries.slice(0, limit) : entries

  if (!rows.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
        Aún no hay pronósticos en el grupo.
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {rows.map(entry => (
        <RankRow key={entry.user_id} entry={entry} />
      ))}
    </div>
  )
}
