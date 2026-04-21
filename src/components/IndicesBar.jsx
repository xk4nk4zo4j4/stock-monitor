import './IndicesBar.css'

function SessionBadge({ session }) {
  const map = {
    open:   { label: '正式盤', color: '#30d158' },
    pre:    { label: '盤前',   color: '#ff9f0a' },
    after:  { label: '盤後',   color: '#ff9f0a' },
    closed: { label: '休市',   color: '#48484a' },
  }
  const s = map[session] || map.closed
  return (
    <span className="session-badge" style={{ color: s.color, borderColor: s.color }}>
      {s.label}
    </span>
  )
}

export default function IndicesBar({ indices }) {
  if (!indices.length) return null

  return (
    <div className="indices-bar">
      {indices.map(idx => {
        const up = idx.changePct >= 0
        return (
          <div key={idx.ticker} className="idx-item">
            <span className="idx-name">{idx.name}</span>
            <span className="idx-price">
              {idx.extendedPrice
                ? idx.extendedPrice.toLocaleString()
                : idx.lastPrice.toLocaleString()}
            </span>
            <span className="idx-change" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
              {up ? '+' : ''}{idx.changePct}%
            </span>
            <SessionBadge session={idx.session} />
          </div>
        )
      })}
    </div>
  )
}
