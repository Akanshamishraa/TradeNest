import React, { useState } from 'react';
import { useTrading } from '../services/tradingStore';
import { Timeframe, Granularity, ChartType } from '../types/stock';
import { Calendar, CandlestickChart, LineChart, AreaChart, BarChart2, Maximize2, Sparkles, Filter, Check } from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';

export const TimeframeSelector: React.FC = () => {
  const {
    timeframe,
    setTimeframe,
    granularity,
    setGranularity,
    startDate,
    endDate,
    applyCustomDateRange,
    isCustomRange,
    chartType,
    setChartType,
    candles,
    setCroppedTimeframePreview,
    theme
  } = useTrading();

  const isLight = theme === 'light';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const timeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];
  const granularities: Granularity[] = ['1m', '5m', '15m', '1h', '1D', '1W'];

  const chartTypes: { id: ChartType; label: string; icon: React.ReactNode }[] = [
    { id: 'candlestick', label: 'Candles', icon: <CandlestickChart className="w-3.5 h-3.5" /> },
    { id: 'line', label: 'Line', icon: <LineChart className="w-3.5 h-3.5" /> },
    { id: 'area', label: 'Area', icon: <AreaChart className="w-3.5 h-3.5" /> },
    { id: 'bar', label: 'Bars', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  const handleApplyCustom = () => {
    applyCustomDateRange(tempStart, tempEnd);
    setShowDatePicker(false);
  };

  const handleOpenCroppedPreview = () => {
    setCroppedTimeframePreview({
      active: true,
      label: isCustomRange ? `${startDate} to ${endDate}` : `${timeframe} View`,
      candles: candles
    });
  };

  return (
    <div className={`${isLight ? 'bg-white border-t border-slate-200 text-slate-700' : 'bg-[#1e222d] border-t border-[#2a2e39] text-[#d1d4dc]'} px-3 py-1 overflow-x-auto no-scrollbar flex items-center justify-between gap-3 text-xs whitespace-nowrap select-none shrink-0`}>
      
      {/* Left: Timeframe Pills + Granularity + Chart Style */}
      <div className="flex items-center gap-2.5 shrink-0">
        
        {/* Quick Timeframe Buttons (1D, 5D, 1M, 3M, 6M, 1Y, 5Y, ALL) */}
        <div className={`flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131722] border-[#2a2e39]'} p-0.5 rounded-md border`}>
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded font-semibold text-[11px] transition cursor-pointer ${
                !isCustomRange && timeframe === tf
                  ? 'bg-blue-600 text-white shadow-xs'
                  : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80' : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2e39]')
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className={`h-3.5 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-[#2a2e39]'}`} />

        {/* Granularity Buttons (1m, 5m, 15m, 1h, 1D, 1W) */}
        <div className={`flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131722] border-[#2a2e39]'} p-0.5 rounded-md border`}>
          {granularities.map(g => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-medium transition cursor-pointer ${
                granularity === g
                  ? (isLight ? 'bg-white text-blue-600 font-bold shadow-xs border border-slate-200' : 'bg-[#2a2e39] text-blue-400 font-bold border border-blue-500/40')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-gray-400 hover:text-gray-200')
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className={`h-3.5 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-[#2a2e39]'}`} />

        {/* Chart Style Switcher (Candles, Line, Area, Bars) */}
        <div className={`flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131722] border-[#2a2e39]'} p-0.5 rounded-md border`}>
          {chartTypes.map(ct => (
            <button
              key={ct.id}
              onClick={() => setChartType(ct.id)}
              title={ct.label}
              className={`p-1 rounded transition cursor-pointer ${
                chartType === ct.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2e39]')
              }`}
            >
              {ct.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Date Range Selector & Pop-out Chart (Desktop / Tablet only) */}
      <div className="hidden sm:flex items-center gap-2.5 shrink-0">
        {/* Direct Date - Date Input Boxes */}
        <div className={`flex items-center gap-1.5 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#131722] border-[#2a2e39]'} border rounded-md px-2 py-0.5 shadow-xs`}>
          <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
          <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'} shrink-0 hidden md:inline`}>Date:</span>
          <input
            type="date"
            value={tempStart}
            onChange={e => {
              setTempStart(e.target.value);
              applyCustomDateRange(e.target.value, tempEnd);
            }}
            className={`bg-transparent text-[11px] font-mono font-semibold focus:outline-none cursor-pointer ${isLight ? 'text-slate-900' : 'text-white'}`}
          />
          <span className={isLight ? 'text-slate-400' : 'text-gray-500 text-[10px]'}>→</span>
          <input
            type="date"
            value={tempEnd}
            onChange={e => {
              setTempEnd(e.target.value);
              applyCustomDateRange(tempStart, e.target.value);
            }}
            className={`bg-transparent text-[11px] font-mono font-semibold focus:outline-none cursor-pointer ${isLight ? 'text-slate-900' : 'text-white'}`}
          />
        </div>

        {/* Pop-out Detailed Chart Button */}
        <button
          onClick={handleOpenCroppedPreview}
          title="Pop-out detailed interactive chart for the selected timeframe"
          className={`flex items-center gap-1.5 ${
            isLight
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
          } px-2.5 py-1 rounded-md font-bold text-[11px] transition cursor-pointer`}
        >
          <Maximize2 className="w-3 h-3" />
          <span>Pop-out Chart</span>
        </button>
      </div>
    </div>
  );
};
