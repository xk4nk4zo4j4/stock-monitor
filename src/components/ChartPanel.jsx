import { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import './ChartPanel.css'

const MA_CONFIG = [
  { key: 'ma5',   label: 'MA5',   color: '#ffd60a' },
  { key: 'ma20',  label: 'MA20',  color: '#30d158' },
  { key: 'ma50',  label: 'MA50',  color: '#0a84ff' },
  { key: 'ma200', label: 'MA200', color: '#ff9f0a' },
]

function buildMaSeries(dates, closes, period) {
  const result = []
  for (let i = period - 1; i < closes.length; i++) {
    const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push({ time: dates[i], value: parseFloat((sum / period).toFixed(4)) })
  }
  return result
}

export default function ChartPanel({ item }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const seriesRef    = useRef({})
  const [activeMAs, setActiveMAs] = useState({ ma5: true, ma20: true, ma50: true, ma200: true })

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0e0e0e' },
        textColor: '#8e8e93',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: {
        vertLine: { color: '#3a3a3c', width: 1, style: 0 },
        horzLine: { color: '#3a3a3c', width: 1, style: 0 },
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
      },
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    // Main price line
    const priceSeries = chart.addLineSeries({
      color: '#ebebf0',
      lineWidth: 1.5,
      priceLineVisible: false,
      lastValueVisible: true,
    })
    seriesRef.current.price = priceSeries

    // MA series
    MA_CONFIG.forEach(({ key, color }) => {
      const s = chart.addLineSeries({
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      })
      seriesRef.current[key] = s
    })

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)

    chartRef.current = chart
    chart.timeScale().fitContent()

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = {}
    }
  }, [])

  // Update data when item changes
  useEffect(() => {
    if (!item || !chartRef.current || !seriesRef.current.price) return

    const dates  = item.chartDates
    const closes = item.chartCloses

    const priceData = dates.map((d, i) => ({ time: d, value: closes[i] }))
    seriesRef.current.price.setData(priceData)

    MA_CONFIG.forEach(({ key }, idx) => {
      const period = [5, 20, 50, 200][idx]
      const maData = buildMaSeries(dates, closes, period)
      seriesRef.current[key]?.setData(maData)
    })

    chartRef.current.timeScale().fitContent()
  }, [item])

  // Toggle MA visibility
  useEffect(() => {
    MA_CONFIG.forEach(({ key }) => {
      seriesRef.current[key]?.applyOptions({ visible: activeMAs[key] })
    })
  }, [activeMAs])

  function toggleMA(key) {
    setActiveMAs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!item) return (
    <div className="chart-panel chart-empty">
      <p>← 點選左側股票</p>
    </div>
  )

  const up = item.changePct >= 0
  const displayPrice = item.extendedPrice ?? item.lastPrice

  return (
    <div className="chart-panel">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-info">
          <div className="cp-top">
            <span className="cp-ticker">{item.ticker}</span>
            <span className="cp-name">{item.name}</span>
            {item.session !== 'open' && item.session !== 'closed' && (
              <span className="cp-ext-tag" style={{ color: 'var(--orange)' }}>
                {item.session === 'pre' ? '盤前報價' : '盤後報價'}・流動性低
              </span>
            )}
          </div>
          <div className="cp-price-row">
            <span className="cp-price">
              ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="cp-change" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
              {up ? '▲' : '▼'} {Math.abs(item.changePct)}%
            </span>
          </div>
        </div>

        {/* MA toggles */}
        <div className="cp-ma-toggles">
          {MA_CONFIG.map(({ key, label, color }) => (
            <button
              key={key}
              className={`ma-btn${activeMAs[key] ? ' on' : ''}`}
              style={activeMAs[key] ? { borderColor: color, color } : {}}
              onClick={() => toggleMA(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* MA values */}
      <div className="cp-ma-values">
        {MA_CONFIG.map(({ key, label, color }) => (
          item.mas[key] ? (
            <span key={key} className="ma-val" style={{ color: activeMAs[key] ? color : 'var(--text3)' }}>
              {label}: {item.mas[key].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : null
        ))}
      </div>

      {/* Chart */}
      <div className="cp-chart" ref={containerRef} />

      {/* Footer */}
      <div className="cp-footer">
        <span>過去 252 交易日 · 收盤價</span>
        <span>更新：{new Date(item.updatedAt).toLocaleString('zh-TW', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
      </div>
    </div>
  )
}
