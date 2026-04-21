# 股市監控

個人化美股監控工具，搭載 MA5/MA20/MA50/MA200 移動平均線，支援 Telegram 警報（第三階段）。

## 功能

- 自選股清單（最多 50 支）
- 移動平均線圖表（MA5、MA20、MA50、MA200）
- VIX 恐慌指數 + 台灣加權指數
- 盤前/盤後價格標示
- 每 15 分鐘自動更新（正式盤）
- 完全免費：GitHub Actions + GitHub Pages

## 部署步驟

### 1. Fork / Clone 這個 repo

### 2. 啟用 GitHub Pages
Settings → Pages → Source 選 **GitHub Actions**

### 3. 第一次手動觸發資料抓取
Actions → Fetch Market Data → Run workflow

### 4. 等待部署完成
約 2 分鐘後即可在 `https://<你的帳號>.github.io/<repo名稱>` 看到

## 自訂股票清單

編輯 `public/data/watchlist.json`：

```json
[
  { "ticker": "AAPL",  "name": "Apple" },
  { "ticker": "NVDA",  "name": "NVIDIA" },
  { "ticker": "TSM",   "name": "台積電 ADR" }
]
```

## 新增指數

編輯 `scripts/fetch_data.py` 裡的 `INDICES` 清單：

```python
INDICES = [
    {"ticker": "^VIX",   "name": "VIX 恐慌指數"},
    {"ticker": "^TWII",  "name": "台灣加權指數"},
    {"ticker": "^GSPC",  "name": "S&P 500"},      # ← 新增這行
]
```

## 專案結構

```
stock-monitor/
├── scripts/
│   └── fetch_data.py          # 資料抓取腳本
├── public/
│   └── data/
│       ├── watchlist.json     # 自選股清單（你來編輯）
│       └── market_data.json   # 自動產生，勿手動編輯
├── src/
│   ├── components/
│   │   ├── IndicesBar.jsx     # 頂部指數列
│   │   ├── WatchList.jsx      # 左側股票清單
│   │   └── ChartPanel.jsx     # 右側圖表
│   └── App.jsx
└── .github/workflows/
    ├── fetch_data.yml          # 定時抓取資料
    └── deploy.yml              # 部署到 GitHub Pages
```

## 下一步（第二、三階段）

- [ ] 警報設定介面（網頁上設定，不用改程式碼）
- [ ] Telegram Bot 通知
- [ ] 均線警報（如股價跌破 MA200）
- [ ] VIX 門檻警報
