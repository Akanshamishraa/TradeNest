import React, { useState } from 'react';
import { useTrading } from '../services/tradingStore';
import { Shield, TrendingUp, TrendingDown, Plus, RefreshCw, Star, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export const SupportResistancePanel: React.FC = () => {
  const {
    activeStock,
    supportResistanceLevels,
    addManualSRLevel,
    toggleSRLevel,
    removeSRLevel,
    resetAutoSRLevels,
    latestPrice,
    theme
  } = useTrading();

  const isLight = theme === 'light';
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customType, setCustomType] = useState<'support' | 'resistance'>('resistance');
  const [customLabel, setCustomLabel] = useState<string>('');

  const handleAddLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(customPrice);
    if (isNaN(p) || p <= 0) return;

    addManualSRLevel(p, customType, customLabel.trim() || undefined);
    setCustomPrice('');
    setCustomLabel('');
  };

  const resistanceLevels = supportResistanceLevels
    .filter(lvl => lvl.type === 'resistance')
    .sort((a, b) => a.price - b.price);

  const supportLevels = supportResistanceLevels
    .filter(lvl => lvl.type === 'support')
    .sort((a, b) => b.price - a.price);

  const nextResistance = resistanceLevels.find(l => l.price > latestPrice && l.active);
  const nextSupport = supportLevels.find(l => l.price < latestPrice && l.active);

  return (
    <div className={`p-3 rounded-2xl border transition-all ${
      isLight 
        ? 'bg-white/95 border-slate-200/90 shadow-sm' 
        : 'bg-[#181c27]/95 border-[#2a2e39] shadow-md'
    } backdrop-blur-md space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'} text-sm leading-tight`}>
              Support & Resistance Engine
            </h3>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Dynamic Technical Key Levels
            </span>
          </div>
        </div>

        <button
          onClick={resetAutoSRLevels}
          title="Recalculate key levels from price action"
          className={`flex items-center gap-1.5 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-[#131722] hover:bg-[#2a2e39] text-gray-300 hover:text-white border-[#2a2e39]'
          } px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer active:scale-95`}
        >
          <RefreshCw className="w-3 h-3 text-blue-500" />
          <span className="hidden sm:inline">Auto-Detect</span>
        </button>
      </div>

      {/* Proximity Summary Banner - Next Target & Floor */}
      <div className="grid grid-cols-2 gap-2">
        {/* Next Resistance Target Card */}
        <div className={`flex flex-col p-2.5 rounded-xl border transition ${
          isLight
            ? 'bg-gradient-to-b from-rose-50/70 to-rose-50/20 border-rose-200/80 shadow-xs'
            : 'bg-gradient-to-b from-rose-950/20 to-[#131722] border-rose-500/30'
        }`}>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Next Resistance</span>
          </div>

          <div className="flex items-baseline justify-between mt-1 gap-1 flex-wrap">
            <span className={`font-mono font-black ${isLight ? 'text-slate-900' : 'text-white'} text-[13px] sm:text-[14px] whitespace-nowrap`}>
              {nextResistance ? `${activeStock.currency}${nextResistance.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'ATH Breakout'}
            </span>
            {nextResistance && (
              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20 shrink-0 whitespace-nowrap">
                +{(((nextResistance.price - latestPrice) / latestPrice) * 100).toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Next Support Floor Card */}
        <div className={`flex flex-col p-2.5 rounded-xl border transition ${
          isLight
            ? 'bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 border-emerald-200/80 shadow-xs'
            : 'bg-gradient-to-b from-emerald-950/20 to-[#131722] border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Next Support</span>
          </div>

          <div className="flex items-baseline justify-between mt-1 gap-1 flex-wrap">
            <span className={`font-mono font-black ${isLight ? 'text-slate-900' : 'text-white'} text-[13px] sm:text-[14px] whitespace-nowrap`}>
              {nextSupport ? `${activeStock.currency}${nextSupport.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Lowest Base'}
            </span>
            {nextSupport && (
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 shrink-0 whitespace-nowrap">
                -{(((latestPrice - nextSupport.price) / latestPrice) * 100).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Levels List */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {/* Resistance Section */}
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> RESISTANCE ZONES
            </span>
            <span className="font-mono text-gray-400 text-[10px]">{resistanceLevels.length} levels</span>
          </div>
          <div className="space-y-1.5">
            {resistanceLevels.map(lvl => (
              <div
                key={lvl.id}
                className={`flex items-center justify-between gap-2 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-rose-50/40 border-slate-200/80 hover:border-rose-300'
                    : 'bg-[#131722] hover:bg-[#1e222d] border-[#2a2e39] hover:border-rose-500/40'
                } px-2.5 py-1.5 rounded-lg border text-xs transition`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleSRLevel(lvl.id)}
                    className={`${isLight ? 'text-slate-400 hover:text-slate-800' : 'text-gray-400 hover:text-white'} transition cursor-pointer shrink-0`}
                  >
                    {lvl.active ? <Eye className="w-3.5 h-3.5 text-rose-500" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 truncate">
                    {lvl.label.replace('Manual Resistance', 'R (Custom)').replace('Custom Resistance', 'R (Custom)')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs whitespace-nowrap">
                    {activeStock.currency}{lvl.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center text-amber-400 text-[10px] shrink-0" title={`${lvl.strength}-Star Conviction`}>
                    {Array.from({ length: lvl.strength }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {lvl.isManual && (
                    <button
                      onClick={() => removeSRLevel(lvl.id)}
                      className={`${isLight ? 'text-slate-400 hover:text-rose-600' : 'text-gray-500 hover:text-rose-400'} transition cursor-pointer shrink-0 p-0.5`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="pt-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> SUPPORT ZONES
            </span>
            <span className="font-mono text-gray-400 text-[10px]">{supportLevels.length} levels</span>
          </div>
          <div className="space-y-1.5">
            {supportLevels.map(lvl => (
              <div
                key={lvl.id}
                className={`flex items-center justify-between gap-2 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-emerald-50/40 border-slate-200/80 hover:border-emerald-300'
                    : 'bg-[#131722] hover:bg-[#1e222d] border-[#2a2e39] hover:border-emerald-500/40'
                } px-2.5 py-1.5 rounded-lg border text-xs transition`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleSRLevel(lvl.id)}
                    className={`${isLight ? 'text-slate-400 hover:text-slate-800' : 'text-gray-400 hover:text-white'} transition cursor-pointer shrink-0`}
                  >
                    {lvl.active ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate">
                    {lvl.label.replace('Manual Support', 'S (Custom)').replace('Custom Support', 'S (Custom)')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                    {activeStock.currency}{lvl.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center text-amber-400 text-[10px] shrink-0" title={`${lvl.strength}-Star Conviction`}>
                    {Array.from({ length: lvl.strength }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {lvl.isManual && (
                    <button
                      onClick={() => removeSRLevel(lvl.id)}
                      className={`${isLight ? 'text-slate-400 hover:text-rose-600' : 'text-gray-500 hover:text-rose-400'} transition cursor-pointer shrink-0 p-0.5`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Support/Resistance Adder Form */}
      <form onSubmit={handleAddLevel} className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#2a2e39]'} space-y-2`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
            Add Custom Benchmark Level
          </span>
          <span className="text-[10px] text-gray-400 font-mono">Manual Placement</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setCustomType('resistance')}
            className={`py-1 rounded-lg font-bold text-[11px] border transition cursor-pointer flex items-center justify-center gap-1 ${
              customType === 'resistance'
                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : 'bg-[#131722] text-gray-400 border-[#2a2e39] hover:bg-[#2a2e39]')
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-200"></span> Resistance Line
          </button>
          <button
            type="button"
            onClick={() => setCustomType('support')}
            className={`py-1 rounded-lg font-bold text-[11px] border transition cursor-pointer flex items-center justify-center gap-1 ${
              customType === 'support'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : 'bg-[#131722] text-gray-400 border-[#2a2e39] hover:bg-[#2a2e39]')
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span> Support Line
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-400 text-xs">
              {activeStock.currency}
            </span>
            <input
              type="number"
              step="any"
              placeholder={`Price`}
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              className={`w-full pl-6 pr-2.5 py-1.5 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  : 'bg-[#131722] border-[#2a2e39] text-white focus:bg-[#1a1f2c]'
              } border rounded-lg font-mono text-xs focus:border-blue-500 focus:outline-none transition`}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-md shadow-blue-600/30 shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Place Line
          </button>
        </div>
      </form>
    </div>
  );
};
