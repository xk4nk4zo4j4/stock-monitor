import yfinance as yf
import json
import os
from datetime import datetime, timezone
import pytz

# ── 設定 ──────────────────────────────────────────────
STOCKS_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'watchlist.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'market_data.json')

INDICES = [
    {"ticker": "^VIX",  "name": "VIX 恐慌指數"},
    {"ticker": "^TWII", "name": "台灣加權指數"},
]

MA_PERIODS = [5, 20, 50, 200]
HISTORY_DAYS = "1y"   # 抓一年資料，足夠算 MA200

ET = pytz.timezone("America/New_York")

# ── 輔助函式 ────────────────────────────────────────────
def get_market_session():
    """判斷目前是正式盤 / 盤前 / 盤後 / 休市"""
    now_et = datetime.now(ET)
    weekday = now_et.weekday()  # 0=Mon, 6=Sun

    if weekday >= 5:
        return "closed"

    t = now_et.hour * 60 + now_et.minute
    if t < 240:        # < 04:00
        return "closed"
    elif t < 570:      # 04:00 – 09:30
        return "pre"
    elif t < 960:      # 09:30 – 16:00
        return "open"
    elif t < 1200:     # 16:00 – 20:00
        return "after"
    else:
        return "closed"


def calc_ma(closes, period):
    if len(closes) < period:
        return None
    return round(sum(closes[-period:]) / period, 4)


def fetch_ticker(ticker, name=None):
    try:
        tk = yf.Ticker(ticker)
        hist = tk.history(period=HISTORY_DAYS, prepost=True)

        if hist.empty:
            return None

        closes = hist["Close"].tolist()
        dates  = [d.strftime("%Y-%m-%d") for d in hist.index]

        # 最後 252 個交易日收盤（畫圖用）
        chart_closes = closes[-252:]
        chart_dates  = dates[-252:]

        # 移動平均線
        mas = {}
        for p in MA_PERIODS:
            mas[f"ma{p}"] = calc_ma(closes, p)

        # 最新資訊
        info       = tk.fast_info
        last_price = round(float(hist["Close"].iloc[-1]), 4)
        prev_close = round(float(hist["Close"].iloc[-2]), 4) if len(hist) > 1 else last_price
        change_pct = round((last_price - prev_close) / prev_close * 100, 2)

        # 盤前 / 盤後即時報價（若有）
        extended_price = None
        session = get_market_session()
        if session in ("pre", "after"):
            try:
                ext = tk.history(period="1d", interval="1m", prepost=True)
                if not ext.empty:
                    extended_price = round(float(ext["Close"].iloc[-1]), 4)
            except Exception:
                pass

        return {
            "ticker":         ticker,
            "name":           name or ticker,
            "lastPrice":      last_price,
            "prevClose":      prev_close,
            "changePct":      change_pct,
            "extendedPrice":  extended_price,
            "session":        session,
            "mas":            mas,
            "chartDates":     chart_dates,
            "chartCloses":    [round(c, 4) for c in chart_closes],
            "updatedAt":      datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        print(f"  ✗ {ticker}: {e}")
        return None


# ── 主程式 ──────────────────────────────────────────────
def main():
    # 讀取使用者股票清單
    if os.path.exists(STOCKS_FILE):
        with open(STOCKS_FILE, "r") as f:
            watchlist = json.load(f)
    else:
        watchlist = []

    all_tickers = INDICES + watchlist
    results = {"stocks": [], "indices": [], "updatedAt": datetime.now(timezone.utc).isoformat()}

    print(f"抓取 {len(all_tickers)} 個 ticker...")

    for item in all_tickers:
        ticker = item["ticker"]
        name   = item.get("name", ticker)
        print(f"  → {ticker} ({name})")
        data = fetch_ticker(ticker, name)
        if data:
            if ticker in [i["ticker"] for i in INDICES]:
                results["indices"].append(data)
            else:
                results["stocks"].append(data)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 完成，資料寫入 {OUTPUT_FILE}")
    print(f"  股票：{len(results['stocks'])} 支 / 指數：{len(results['indices'])} 個")


if __name__ == "__main__":
    main()
