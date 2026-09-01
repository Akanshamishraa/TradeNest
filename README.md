# TradeNest — Real-Time Stock Market Trading Terminal

A modern, high-performance financial market charting and technical analysis terminal built with **React, TypeScript, Lightweight Charts v5, TailwindCSS**, and a **Node.js/Express** backend powered by Yahoo Finance.

---

## 🚀 Features

- **Interactive Financial Charts**: Powered by TradingView Lightweight Charts (Candlestick, Line, Area, and Bar charts).
- **Timeframe & Granularity Engine**: Multi-horizon ranges (1D, 5D, 1M, 3M, 6M, 1Y, 5Y, ALL) and custom date range picker.
- **Technical Indicators**:
  - Support & Resistance Engine (Dynamic Pivot Points, Key Demand/Supply Zones, and custom price levels).
  - Moving Averages: SMA 20, SMA 50, SMA 200, and EMA 9.
  - RSI (14) Momentum Subplot & MACD Trend Oscillator.
  - Bollinger Bands & Linear Regression Trendline / Noise Filter.
- **Pop-out Detailed Chart View**: Dedicated focus modal for granular timeframe inspection.
- **Live Simulator & Backend Live Market Data**: Yahoo Finance integration for real-time NSE/BSE and global quotes.
- **Paper Trading & Virtual Portfolio**: Risk-free order execution with real-time P&L tracking.
- **Themes**: Crisp Light Theme and Midnight Dark Theme.

---

## 🛠️ Architecture & Tech Stack

```text
TradeNest/
├── backend/                  # Node.js + Express Backend Server
│   ├── src/
│   │   ├── controllers/      # Yahoo Finance data fetching & formatting
│   │   └── routes/           # REST endpoints (/api/stocks)
│   ├── server.js             # Express entrypoint (Port 5000)
│   └── package.json
│
├── src/                      # React 19 + TypeScript Frontend
│   ├── components/           # UI Components (Charts, Modals, Toolbars)
│   ├── data/                 # Stock list & market presets
│   ├── services/             # Market data engine & React state store
│   ├── types/                # TypeScript interfaces & types
│   ├── App.tsx               # Main layout container
│   ├── index.css             # Tailwind v4 styling
│   └── main.tsx              # React root mount
│
├── public/                   # Static assets & SVG icons
├── start.bat                 # 1-Click Launch Script (Backend + Frontend)
├── package.json              # Frontend dependencies
└── vite.config.ts            # Vite configuration
```

---

## ⚡ Quick Start

### 1. One-Click Launch (Windows)
Double-click `start.bat` in the root folder to start both Backend (`:5000`) and Frontend (`:5173`) automatically.

### 2. Manual Start

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Production Build

```bash
npm run build
```
