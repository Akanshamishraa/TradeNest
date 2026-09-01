import React from 'react';
import { useTrading } from '../services/tradingStore';
import { Info, Gauge, BarChart3, TrendingUp, ShieldAlert, Award } from 'lucide-react';

export const StockOverviewCard: React.FC = () => {
  const { activeStock, latestPrice, theme } = useTrading();
  const isLight = theme === 'light';

  // 52-Week Range position percentage
  const rangeSpan = activeStock.high52 - activeStock.low52;
  const currentPos = rangeSpan > 0 ? Math.min(Math.max(((latestPrice - activeStock.low52) / rangeSpan) * 100, 0), 100) : 50;

  return (
    <div className={`${isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc] shadow-lg'} border rounded-xl p-4 flex flex-col gap-4 text-xs`}>
      {/* Header */}
      <div className={`flex items-start justify-between border-b ${isLight ? 'border-slate-200' : 'border-[#2a2e39]'} pb-3`}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'} text-base font-mono`}>{activeStock.symbol}</h2>
            <span className={`text-[10px] ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#131722] text-gray-300 border-[#2a2e39]'} px-1.5 py-0.5 rounded font-mono uppercase border`}>
              {activeStock.exchange}
            </span>
          </div>
          <p className={`${isLight ? 'text-slate-500' : 'text-gray-400'} text-xs mt-0.5`}>{activeStock.name}</p>
        </div>

        <div className="text-right">
          <div className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {activeStock.currency} {latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-xs font-mono font-semibold ${activeStock.change >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')}`}>
            {activeStock.change >= 0 ? '+' : ''}{activeStock.change.toFixed(2)} ({activeStock.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Market Sentiment Gauge */}
      <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131722] border-[#2a2e39]'} p-3 rounded-lg border`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'} flex items-center gap-1.5`}>
            <Gauge className="w-3.5 h-3.5 text-blue-500" /> Technical Sentiment
          </span>
          <span className={`font-bold font-mono text-xs ${
            activeStock.sentiment.score >= 70 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : activeStock.sentiment.score <= 40 ? (isLight ? 'text-rose-600' : 'text-rose-400') : (isLight ? 'text-amber-600' : 'text-amber-400')
          }`}>
            {activeStock.sentiment.label} ({activeStock.sentiment.score}/100)
          </span>
        </div>
        {/* Visual Meter Bar */}
        <div className={`w-full ${isLight ? 'bg-slate-200' : 'bg-[#2a2e39]'} h-2 rounded-full overflow-hidden flex`}>
          <div
            className={`h-full transition-all duration-500 ${
              activeStock.sentiment.score >= 70
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : activeStock.sentiment.score <= 40
                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                : 'bg-gradient-to-r from-amber-500 to-emerald-400'
            }`}
            style={{ width: `${activeStock.sentiment.score}%` }}
          ></div>
        </div>
      </div>

      {/* 52-Week Range Bar */}
      <div>
        <div className={`flex justify-between text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'} mb-1`}>
          <span>52W Low: <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'} font-semibold`}>{activeStock.currency}{activeStock.low52.toLocaleString()}</span></span>
          <span>52W High: <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'} font-semibold`}>{activeStock.currency}{activeStock.high52.toLocaleString()}</span></span>
        </div>
        <div className={`relative w-full ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131722] border-[#2a2e39]'} h-2.5 rounded-full overflow-visible border`}>
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
            style={{ width: `${currentPos}%` }}
          ></div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow-xs"
            style={{ left: `calc(${currentPos}% - 6px)` }}
          ></div>
        </div>
      </div>

      {/* Fundamental Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131722] border-[#2a2e39]/60'} p-2.5 rounded-lg border`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} block`}>Open Price</span>
          <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-xs`}>{activeStock.currency} {activeStock.open.toLocaleString()}</span>
        </div>

        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131722] border-[#2a2e39]/60'} p-2.5 rounded-lg border`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} block`}>Prev. Close</span>
          <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-xs`}>{activeStock.currency} {activeStock.previousClose.toLocaleString()}</span>
        </div>

        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131722] border-[#2a2e39]/60'} p-2.5 rounded-lg border`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} block`}>Day Range</span>
          <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-xs`}>
            {activeStock.low.toFixed(1)} - {activeStock.high.toFixed(1)}
          </span>
        </div>

        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131722] border-[#2a2e39]/60'} p-2.5 rounded-lg border`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} block`}>Market Cap</span>
          <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-xs`}>
            {activeStock.marketCap.replace(/^[₹$]/, activeStock.currency)}
          </span>
        </div>

        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131722] border-[#2a2e39]/60'} p-2.5 rounded-lg border`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} block`}>P/E Ratio</span>
          <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-xs`}>
            {activeStock.peRatio ? activeStock.peRatio.toFixed(1) : 'N/A'}
          </span>
        </div>

        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131722] border-[#2a2e39]/60'} p-2.5 rounded-lg border`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} block`}>Beta (Volatility)</span>
          <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-white'} text-xs`}>{activeStock.beta.toFixed(2)}</span>
        </div>
      </div>

      {/* Company Description */}
      <div className={`text-[11px] leading-relaxed pt-2 border-t ${isLight ? 'text-slate-600 border-slate-200' : 'text-gray-400 border-[#2a2e39]'}`}>
        <p className="line-clamp-3">{activeStock.description}</p>
      </div>
    </div>
  );
};
