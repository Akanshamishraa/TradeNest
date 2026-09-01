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

import { useTrading } from './services/tradingStore';

function AppContent() {
  const { theme, isAuthenticated } = useTrading();
  const isLight = theme === 'light';

  const [isStockSearchOpen, setIsStockSearchOpen] = useState(false);

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

      {/* Main Workspace: Full-Width Chart + Right Side Panels */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Center Main Chart Area (Full-Width Dedicated chart canvas) */}
        <main className={`flex-1 min-h-0 h-full flex flex-col ${isLight ? 'border-r border-slate-200 bg-white' : 'border-r border-[#2a2e39] bg-[#131722]'} overflow-hidden`}>
          <div className="flex-1 min-h-0 relative">
            <TradingViewChart />
          </div>
          {/* Timeframe & Date Range Toolbar (TradingView standard bottom dock) */}
          <TimeframeSelector />
        </main>

        {/* Right Multi-Panel Sidebar (Dedicated independent vertical scroll) */}
        <aside className={`w-64 lg:w-72 ${isLight ? 'bg-slate-100/70 border-l border-slate-200' : 'bg-[#1e222d]'} h-full min-h-0 overflow-y-auto p-2 space-y-2.5 shrink-0`}>
          {/* Support & Resistance Engine Card */}
          <SupportResistancePanel />

          {/* Stock Overview Card */}
          <StockOverviewCard />
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
