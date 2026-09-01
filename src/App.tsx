import React, { useState } from 'react';
import { TradingProvider } from './services/tradingStore';
import { Navbar } from './components/Navbar';
import { StockDropdownModal } from './components/StockDropdownModal';
import { TimeframeSelector } from './components/TimeframeSelector';
import { TradingViewChart } from './components/TradingViewChart';
import { SupportResistancePanel } from './components/SupportResistancePanel';
import { StockOverviewCard } from './components/StockOverviewCard';
import { TimeframeCroppedPreview } from './components/TimeframeCroppedPreview';
import { BottomMarketTicker } from './components/BottomMarketTicker';
import { AuthPage } from './components/AuthPage';
import { CandlestickChart, Shield, BarChart3 } from 'lucide-react';
import { useTrading } from './services/tradingStore';

function AppContent() {
  const { theme, isAuthenticated } = useTrading();
  const isLight = theme === 'light';

  const [isStockSearchOpen, setIsStockSearchOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chart' | 'sr' | 'overview'>('chart');

  // If user is not logged in and not in guest mode, show the TradingView Auth & News Landing page
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className={`h-screen max-h-screen overflow-hidden ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#131722] text-[#d1d4dc]'} flex flex-col font-sans select-none`}>
      {/* Top Navbar with Ticker Tape */}
      <Navbar
        onOpenStockSearch={() => setIsStockSearchOpen(true)}
      />

      {/* Mobile Tab Switcher (Visible only on mobile screens) */}
      <div className={`md:hidden flex items-center justify-around border-b ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1e222d] border-[#2a2e39] text-gray-300'} px-2 py-1 text-xs font-bold shrink-0 gap-1`}>
        <button
          onClick={() => setMobileTab('chart')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg transition cursor-pointer text-[11px] ${
            mobileTab === 'chart'
              ? 'bg-blue-600 text-white shadow-xs'
              : isLight
              ? 'hover:bg-slate-100 text-slate-600'
              : 'hover:bg-white/5 text-gray-400'
          }`}
        >
          <CandlestickChart className="w-3.5 h-3.5" />
          <span>Chart</span>
        </button>

        <button
          onClick={() => setMobileTab('sr')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg transition cursor-pointer text-[11px] ${
            mobileTab === 'sr'
              ? 'bg-blue-600 text-white shadow-xs'
              : isLight
              ? 'hover:bg-slate-100 text-slate-600'
              : 'hover:bg-white/5 text-gray-400'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>S&R Levels</span>
        </button>

        <button
          onClick={() => setMobileTab('overview')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg transition cursor-pointer text-[11px] ${
            mobileTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : isLight
              ? 'hover:bg-slate-100 text-slate-600'
              : 'hover:bg-white/5 text-gray-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>
      </div>

      {/* Main Workspace: Full-Width Chart + Right Side Panels */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Center Main Chart Area (Full-Width Dedicated chart canvas) */}
        <main className={`${mobileTab === 'chart' ? 'flex' : 'hidden md:flex'} flex-1 min-h-0 h-full flex-col ${isLight ? 'border-r border-slate-200 bg-white' : 'border-r border-[#2a2e39] bg-[#131722]'} overflow-hidden`}>
          <div className="flex-1 min-h-0 relative">
            <TradingViewChart />
          </div>
          {/* Timeframe & Date Range Toolbar (TradingView standard bottom dock) */}
          <TimeframeSelector />
        </main>

        {/* Right Multi-Panel Sidebar (Desktop side-by-side OR Mobile full tab view) */}
        <aside className={`${mobileTab !== 'chart' ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-64 lg:w-72 ${isLight ? 'bg-slate-100/70 md:border-l border-slate-200' : 'bg-[#1e222d]'} h-full min-h-0 overflow-y-auto p-2 space-y-2.5 shrink-0`}>
          <div className={`${mobileTab === 'sr' || mobileTab === 'chart' ? 'block' : 'hidden md:block'}`}>
            <SupportResistancePanel />
          </div>

          <div className={`${mobileTab === 'overview' || mobileTab === 'chart' ? 'block' : 'hidden md:block'}`}>
            <StockOverviewCard />
          </div>
        </aside>
      </div>

      {/* Bottom Live Auto-scrolling Market Ticker */}
      <BottomMarketTicker />

      {/* Modals and Overlays */}
      <StockDropdownModal
        isOpen={isStockSearchOpen}
        onClose={() => setIsStockSearchOpen(false)}
      />

      <TimeframeCroppedPreview />
    </div>
  );
}

export default function App() {
  return (
    <TradingProvider>
      <AppContent />
    </TradingProvider>
  );
}
