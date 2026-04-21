import './WatchList.css'

export default function WatchList({ stocks, selected, onSelect }) {
  return (
    <div className="watchlist">
      <div className="wl-header">
        <span>自選股</span>
        <span className="wl-count">{stocks.length}</span>
      </div>
      <div className="wl-items">
        {stocks.map(s => {
          const up = s.changePct >= 0
          const isActive = selected?.ticker === s.ticker
          const displayPrice = s.extendedPrice ?? s.lastPrice

          return (
            <div
              key={s.ticker}
              className={`wl-item${isActive ? ' active' : ''}`}
              onClick={() => onSelect(s)}
            >
              <div className="wl-left">
                <span className="wl-ticker">{s.ticker}</span>
                <span className="wl-name">{s.name}</span>
                {s.session !== 'open' && s.session !== 'closed' && (
                  <span className="wl-ext-label">
                    {s.session === 'pre' ? '盤前' : '盤後'}
                  </span>
                )}
              </div>
              <div className="wl-right">
                <span className="wl-price">{displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="wl-badge" style={{ background: up ? 'var(--green)' : 'var(--red)' }}>
                  {up ? '+' : ''}{s.changePct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
