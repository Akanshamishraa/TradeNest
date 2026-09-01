import React from 'react';
import { useTrading } from '../services/tradingStore';
import { Shield, Activity, BarChart2 } from 'lucide-react';

export const TechnicalIndicatorsBar: React.FC = () => {
  const { indicators, toggleIndicator, theme } = useTrading();
  const isLight = theme === 'light';

  const indicatorButtons: {
    key: keyof typeof indicators;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'showSupportResistance',
      label: 'Support & Resistance',
      description: 'Auto-detect key supply & demand pivot levels',
      icon: <Shield className="w-3.5 h-3.5" />,
      color: 'text-emerald-500',
    },
    {
      key: 'showVolume',
      label: 'Volume',
      description: 'Volume Histogram Subplot',
      icon: <BarChart2 className="w-3.5 h-3.5" />,
      color: 'text-teal-500',
    },
  ];

  return (
    <div className={`${isLight ? 'bg-slate-50 border-b border-slate-200 text-slate-700' : 'bg-[#1e222d] border-b border-[#2a2e39] text-[#d1d4dc]'} px-4 py-1 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar select-none`}>
      <span className={`${isLight ? 'text-slate-500' : 'text-gray-400'} font-bold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1 mr-1`}>
        <Activity className="w-3 h-3 text-blue-500" /> Indicators:
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        {indicatorButtons.map(btn => {
          const isActive = indicators[btn.key];
          return (
            <button
              key={btn.key}
              onClick={() => toggleIndicator(btn.key)}
              title={btn.description}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition cursor-pointer ${
                isActive
                  ? (isLight ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-xs font-semibold')
                  : (isLight ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'bg-[#131722] hover:bg-[#2a2e39] text-gray-400 hover:text-gray-200 border border-[#2a2e39]')
              }`}
            >
              <span className={isActive ? (isLight ? 'text-white' : btn.color) : (isLight ? 'text-slate-500' : 'text-gray-500')}>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
