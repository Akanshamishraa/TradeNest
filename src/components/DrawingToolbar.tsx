import React from 'react';
import { useTrading } from '../services/tradingStore';
import { DrawingTool } from '../types/stock';
import { MousePointer, Minus, TrendingUp, Trash2, Hash, Ruler } from 'lucide-react';

export const DrawingToolbar: React.FC = () => {
  const {
    activeDrawingTool,
    setActiveDrawingTool,
    clearDrawings,
    addManualSRLevel,
    latestPrice,
    toggleIndicator,
    indicators,
    theme
  } = useTrading();

  const isLight = theme === 'light';

  const tools: { id: DrawingTool; label: string; icon: React.ReactNode; active?: boolean }[] = [
    { id: 'cursor', label: 'Pointer / Crosshair', icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: 'trendline', label: 'Draw Trendline (Regression)', icon: <TrendingUp className="w-3.5 h-3.5" />, active: indicators.showNoiseReduction },
    { id: 'horizontal_line', label: 'Horizontal Ray', icon: <Minus className="w-3.5 h-3.5" /> },
    { id: 'resistance_line', label: 'Resistance Line', icon: <div className="w-2.5 h-0.5 bg-[#f23645] rounded"></div> },
    { id: 'support_line', label: 'Support Line', icon: <div className="w-2.5 h-0.5 bg-[#089981] rounded"></div> },
    { id: 'fibonacci', label: 'Fibonacci Retracement', icon: <Hash className="w-3.5 h-3.5" />, active: indicators.showFibonacci },
    { id: 'measure', label: 'Price Measure Ruler', icon: <Ruler className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside className={`w-8.5 ${isLight ? 'bg-white border-r border-slate-200 text-slate-700' : 'bg-[#1e222d] border-r border-[#2a2e39] text-[#d1d4dc]'} flex flex-col items-center py-2 gap-1.5 select-none z-30 shrink-0`}>
      {tools.map(tool => {
        const isToolActive = activeDrawingTool === tool.id || (tool.active ?? false);
        return (
          <button
            key={tool.id}
            onClick={() => {
              setActiveDrawingTool(tool.id);
              if (tool.id === 'horizontal_line') {
                addManualSRLevel(latestPrice, 'support', 'Horizontal Ray');
              } else if (tool.id === 'resistance_line') {
                addManualSRLevel(latestPrice * 1.015, 'resistance', 'Manual Resistance');
              } else if (tool.id === 'support_line') {
                addManualSRLevel(latestPrice * 0.985, 'support', 'Manual Support');
              } else if (tool.id === 'fibonacci') {
                toggleIndicator('showFibonacci');
              } else if (tool.id === 'trendline') {
                toggleIndicator('showNoiseReduction');
              }
            }}
            title={tool.label}
            className={`w-6 h-6 rounded flex items-center justify-center transition cursor-pointer ${
              isToolActive
                ? 'bg-blue-600 text-white shadow-xs'
                : (isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]')
            }`}
          >
            {tool.icon}
          </button>
        );
      })}

      <div className={`w-4 h-[1px] ${isLight ? 'bg-slate-200' : 'bg-[#2a2e39]'} my-0.5`}></div>

      {/* Clear all drawings */}
      <button
        onClick={clearDrawings}
        title="Clear custom chart drawings & reset"
        className={`w-6 h-6 rounded flex items-center justify-center ${isLight ? 'text-slate-400 hover:text-rose-600 hover:bg-slate-100' : 'text-gray-400 hover:text-rose-400 hover:bg-[#2a2e39]'} transition cursor-pointer`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
