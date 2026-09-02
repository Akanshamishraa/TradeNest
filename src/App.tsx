import React, { useState, useEffect, useCallback } from 'react';
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

  // VS Code style resizable panel width state (default 340px, min 300px, max 600px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('tradenest_sidebar_width');
    return saved ? Math.max(300, Math.min(600, parseInt(saved, 10))) : 340;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 290 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('tradenest_sidebar_width', sidebarWidth.toString());
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  const toggleExpand = () => {
    setSidebarWidth(prev => {
      const next = prev > 360 ? 320 : 450;
      localStorage.setItem('tradenest_sidebar_width', next.toString());
      return next;
    });
  };

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
        <main className={`${mobileTab === 'chart' ? 'flex' : 'hidden md:flex'} flex-1 min-h-0 h-full flex-col ${isLight ? 'border-r border-slate-200 bg-white' : 'border-r border-[#2a2e39] bg-[#131722]'} overflow-hidden`}>
          <div className="flex-1 min-h-0 relative">
            <TradingViewChart />
          </div>
          {/* Timeframe & Date Range Toolbar (TradingView standard bottom dock) */}
          <TimeframeSelector />
        </main>

        {/* VS Code Style Draggable Resizer Divider (Desktop only) */}
        <div
          onMouseDown={startResizing}
          onDoubleClick={toggleExpand}
          className={`hidden md:flex w-2.5 -ml-1.5 z-30 cursor-col-resize items-center justify-center group transition-all select-none relative ${
            isResizing
              ? 'bg-blue-500 shadow-md shadow-blue-500/50'
              : 'hover:bg-blue-500/60 bg-transparent'
          }`}
          title="Drag to resize Support & Resistance panel | Double-click to toggle expand/collapse"
        >
          <div className={`w-[2px] h-10 rounded-full transition-colors ${
            isResizing ? 'bg-white' : 'bg-transparent group-hover:bg-white'
          }`} />
        </div>

        {/* Right Multi-Panel Sidebar (Desktop side-by-side OR Mobile full tab view) */}
        <aside 
          className={`${mobileTab !== 'chart' ? 'flex w-full' : 'hidden md:flex'} flex-col ${isLight ? 'bg-slate-100/70 md:border-l border-slate-200' : 'bg-[#1e222d]'} h-full min-h-0 overflow-y-auto p-2 space-y-2.5 shrink-0`}
          style={{ width: isDesktop ? `${sidebarWidth}px` : undefined }}
        >
          <div className={`${mobileTab === 'sr' ? 'block' : 'hidden md:block'}`}>
            <SupportResistancePanel 
              isExpanded={sidebarWidth > 360} 
              onToggleExpand={toggleExpand} 
            />
          </div>

          <div className={`${mobileTab === 'overview' ? 'block' : 'hidden md:block'}`}>
            <StockOverviewCard />
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar (Docked at bottom like TradingView & Zerodha) */}
      <div className={`md:hidden flex items-center justify-around border-t ${isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-[#1e222d] border-[#2a2e39] shadow-2xl'} px-2 py-1.5 shrink-0 z-30`}>
        <button
          onClick={() => setMobileTab('chart')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition cursor-pointer ${
            mobileTab === 'chart'
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10'
              : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
          }`}
        >
          <CandlestickChart className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Chart</span>
        </button>

        <button
          onClick={() => setMobileTab('sr')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition cursor-pointer ${
            mobileTab === 'sr'
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10'
              : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">S&R Levels</span>
        </button>

        <button
          onClick={() => setMobileTab('overview')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition cursor-pointer ${
            mobileTab === 'overview'
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10'
              : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Overview</span>
        </button>
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
