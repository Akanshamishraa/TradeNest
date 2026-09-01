import React, { useRef, useEffect } from 'react';
import { useTrading } from '../services/tradingStore';

export const BottomMarketTicker: React.FC = () => {
  const { stocks, activeStock, setActiveStock, theme } = useTrading();
  const isLight = theme === 'light';
  const scrollRef = useRef<HTMLDivElement>(null);

  // Buttery-smooth continuous auto-scroll with requestAnimationFrame
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollAmount = 0;
    const speed = 0.75;
    let animationId: number;

    const autoScroll = () => {
      if (container) {
        scrollAmount += speed;
        if (scrollAmount >= container.scrollWidth / 2) {
          scrollAmount = 0;
          container.scrollLeft = 0;
        } else {
          container.scrollLeft = scrollAmount;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);

    const pause = () => cancelAnimationFrame(animationId);
    const resume = () => {
      animationId = requestAnimationFrame(autoScroll);
    };

    container.addEventListener('mouseenter', pause);
    container.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(animationId);
      if (container) {
        container.removeEventListener('mouseenter', pause);
        container.removeEventListener('mouseleave', resume);
      }
    };
  }, [stocks]);

  // Duplicate stocks for infinite continuous loop
  const tickerItems = [...stocks, ...stocks];

  return (
    <footer
      className={`h-7.5 shrink-0 border-t ${
        isLight
          ? 'bg-white border-slate-200/90 text-slate-700 shadow-xs'
          : 'bg-[#131722] border-[#2a2e39] text-gray-300'
      } flex items-center px-3 z-30 select-none overflow-hidden`}
    >
      {/* Static Label Badge */}
      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider shrink-0 text-[10px] pr-3 border-r border-slate-200 dark:border-[#2a2e39]">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="hidden sm:inline">LIVE TICKER</span>
        <span className="sm:hidden">TICKER</span>
      </div>

      {/* Infinite Auto-scrolling Tape */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap pl-3"
        style={{ scrollBehavior: 'auto' }}
      >
        {tickerItems.map((st, idx) => {
          const isPos = st.change >= 0;
          const isSelected = st.symbol === activeStock.symbol;

          return (
            <button
              key={`${st.symbol}_${idx}`}
              onClick={() => setActiveStock(st)}
              title={`Click to open ${st.name}`}
              className={`flex items-center gap-2 px-2 py-0.5 rounded transition cursor-pointer text-xs shrink-0 ${
                isSelected
                  ? isLight
                    ? 'bg-blue-50 border border-blue-400 font-bold'
                    : 'bg-blue-500/20 border border-blue-500/50 font-bold text-white'
                  : isLight
                  ? 'hover:bg-slate-100'
                  : 'hover:bg-[#2a2e39]'
              }`}
            >
              <span className={`font-mono font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>
                {st.symbol}
              </span>
              <span className={`font-mono text-[11px] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                {st.currency}{st.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-1 rounded ${
                  isPos
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-emerald-500/15 text-emerald-400'
                    : isLight
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {isPos ? '+' : ''}{st.changePercent.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};
