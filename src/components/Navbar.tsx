import React from 'react';
import { useTrading } from '../services/tradingStore';
import { TrendingUp, Activity, Play, Search, Star, Sun, Moon, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onOpenStockSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStockSearch
}) => {
  const {
    stocks,
    activeStock,
    setActiveStock,
    balance,
    positions,
    isLiveStreaming,
    setIsLiveStreaming,
    latestPrice,
    priceFlash,
    watchlist,
    toggleWatchlist,
    theme,
    toggleTheme,
    user,
    isGuestMode,
    logout
  } = useTrading();

  const isLight = theme === 'light';
  const positionsValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalNetWorth = balance + positionsValue;
  const isFavorited = watchlist.includes(activeStock.symbol);

  // Group stocks for dropdown
  const indices = stocks.filter(s => s.category === 'INDICES');
  const indianBluechips = stocks.filter(s => s.category === 'INDIAN_BLUECHIPS');
  const usTech = stocks.filter(s => s.category === 'US_TECH');
  const commodities = stocks.filter(s => s.category === 'COMMODITIES');
  const crypto = stocks.filter(s => s.category === 'CRYPTO');

  return (
    <header className={`${isLight ? 'bg-white border-b border-slate-200 text-slate-800 shadow-xs' : 'bg-[#1e222d] border-b border-[#2a2e39] text-[#d1d4dc]'} select-none sticky top-0 z-40`}>
      {/* Main Navbar */}
      <div className="px-3 py-1 flex items-center justify-between gap-3 flex-nowrap overflow-x-auto no-scrollbar">
        {/* Brand & Stock Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <div className="flex items-center gap-2 cursor-pointer shrink-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className={`font-bold text-sm tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>TradeNest</h1>
              <span className="text-[8px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold px-1 py-0.2 rounded border border-blue-500/30">PRO</span>
            </div>
          </div>

          <div className={`h-4 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-[#2a2e39]'} mx-0.5 hidden sm:block shrink-0`}></div>

          {/* Direct Stock Dropdown Selector + Search + Star Watchlist Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <div className={`relative flex items-center ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#131722] border-[#2a2e39]'} border hover:border-blue-500/60 rounded-md shadow-xs transition`}>
              <span className="pl-2 text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 shrink-0">STOCKS:</span>
              <select
                value={activeStock.symbol}
                onChange={e => {
                  const s = stocks.find(st => st.symbol === e.target.value);
                  if (s) setActiveStock(s);
                }}
                className={`py-1 pl-1 pr-6 text-xs font-mono font-bold bg-transparent cursor-pointer focus:outline-none appearance-none ${isLight ? 'text-slate-900' : 'text-white'}`}
              >
                <optgroup label="📊 Indices">
                  {indices.map(s => (
                    <option key={s.symbol} value={s.symbol} className={isLight ? 'bg-white text-slate-900' : 'bg-[#1e222d] text-white'}>
                      {s.symbol} — {s.name} ({s.exchange})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇮🇳 Indian Bluechips">
                  {indianBluechips.map(s => (
                    <option key={s.symbol} value={s.symbol} className={isLight ? 'bg-white text-slate-900' : 'bg-[#1e222d] text-white'}>
                      {s.symbol} — {s.name} ({s.exchange})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇺🇸 US Tech">
                  {usTech.map(s => (
                    <option key={s.symbol} value={s.symbol} className={isLight ? 'bg-white text-slate-900' : 'bg-[#1e222d] text-white'}>
                      {s.symbol} — {s.name} ({s.exchange})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🛢️ Commodities & Forex">
                  {commodities.map(s => (
                    <option key={s.symbol} value={s.symbol} className={isLight ? 'bg-white text-slate-900' : 'bg-[#1e222d] text-white'}>
                      {s.symbol} — {s.name} ({s.exchange})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="⚡ Crypto">
                  {crypto.map(s => (
                    <option key={s.symbol} value={s.symbol} className={isLight ? 'bg-white text-slate-900' : 'bg-[#1e222d] text-white'}>
                      {s.symbol} — {s.name} ({s.exchange})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className={`w-3 h-3 absolute right-1.5 pointer-events-none ${isLight ? 'text-slate-500' : 'text-gray-400'}`} />
            </div>

            {/* Quick Search Modal Button */}
            <button
              onClick={onOpenStockSearch}
              title="Search all stocks & assets"
              className={`p-1.5 rounded-md ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600' : 'bg-[#131722] hover:bg-[#2a2e39] border-[#2a2e39] text-gray-400'} border hover:text-blue-500 transition cursor-pointer shadow-xs`}
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Star Watchlist Toggle */}
            <button
              onClick={() => toggleWatchlist(activeStock.symbol)}
              title={isFavorited ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`p-1.5 rounded-md border transition cursor-pointer shadow-xs ${
                isFavorited
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                  : isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-400 hover:text-amber-500' 
                  : 'bg-[#131722] hover:bg-[#2a2e39] border-[#2a2e39] text-gray-400 hover:text-amber-400'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Real-time Ticker in header */}
          <div className={`hidden xl:flex items-center gap-2 px-2.5 py-0.5 rounded-md border border-transparent transition-all shrink-0 ${
            priceFlash === 'up' ? 'bg-emerald-500/20 border-emerald-500/50' : priceFlash === 'down' ? 'bg-rose-500/20 border-rose-500/50' : ''
          }`}>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {activeStock.currency} {latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] font-mono font-semibold ${activeStock.change >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')}`}>
              {activeStock.change >= 0 ? '+' : ''}{activeStock.change.toFixed(2)} ({activeStock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher Button (White / Dark) */}
          <button
            onClick={toggleTheme}
            title={isLight ? 'Switch to Dark Midnight Theme' : 'Switch to Crisp White Theme'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition cursor-pointer ${
              isLight
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 shadow-xs'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/60'
            }`}
          >
            {isLight ? (
              <>
                <Sun className="w-3 h-3 text-amber-600" />
                <span>LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-indigo-400" />
                <span>DARK</span>
              </>
            )}
          </button>

          {/* Live Simulator Toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            title={isLiveStreaming ? 'Pause Real-Time Tick Generator' : 'Start Real-Time Tick Generator'}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition cursor-pointer ${
              isLiveStreaming
                ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20')
                : (isLight ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' : 'bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20')
            }`}
          >
            {isLiveStreaming ? (
              <>
                <Activity className="w-3 h-3 animate-spin text-emerald-500" />
                <span className="hidden md:inline text-[11px]">LIVE TICKS</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span className="hidden md:inline text-[11px]">PAUSED</span>
              </>
            )}
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-[#2a2e39]">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131722] border-[#2a2e39]'} border`}>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className={`text-[11px] font-bold max-w-[90px] truncate ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
                {user?.name || 'Trader'}
              </span>
              {isGuestMode && (
                <span className="text-[8px] px-1 py-0.2 rounded bg-slate-500/20 text-slate-600 dark:text-slate-400 font-extrabold border border-slate-500/30">
                  GUEST
                </span>
              )}
            </div>

            <button
              onClick={logout}
              title="Log out / Switch Account"
              className={`p-1 rounded-md border transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
                  : 'bg-[#131722] hover:bg-[#2a2e39] border-[#2a2e39] text-gray-400 hover:text-rose-400'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
