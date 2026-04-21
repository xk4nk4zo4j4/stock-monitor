import { useState, useEffect } from 'react'
import WatchList from './components/WatchList.jsx'
import ChartPanel from './components/ChartPanel.jsx'
import IndicesBar from './components/IndicesBar.jsx'
import './App.css'

export default function App() {
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 60_000) // re-check every minute
    return () => clearInterval(iv)
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('./data/market_data.json?t=' + Date.now())
      if (!res.ok) throw new Error('資料載入失敗')
      const json = await res.json()
      setData(json)
      setError(null)
      if (!selected && json.stocks?.length > 0) {
        setSelected(json.stocks[0])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(item) {
    // refresh selected from latest data
    setSelected(item)
  }

  if (loading) return (
    <div className="splash">
      <div className="spinner" />
      <p>載入市場資料中...</p>
    </div>
  )

  if (error) return (
    <div className="splash">
      <p className="err">⚠ {error}</p>
      <p style={{color:'var(--text2)',fontSize:13,marginTop:8}}>請確認 GitHub Actions 已執行過一次</p>
    </div>
  )

  return (
    <div className="layout">
      <header className="header">
        <span className="header-title">股市監控</span>
        <span className="header-updated">
          更新於 {data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('zh-TW', {hour:'2-digit',minute:'2-digit'}) : '--'}
        </span>
      </header>

      <IndicesBar indices={data?.indices || []} />

      <div className="main">
        <WatchList
          stocks={data?.stocks || []}
          selected={selected}
          onSelect={handleSelect}
        />
        <ChartPanel item={selected} />
      </div>
    </div>
  )
}
