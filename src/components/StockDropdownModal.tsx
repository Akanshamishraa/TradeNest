import React, { useState, useMemo } from 'react';
import { useTrading } from '../services/tradingStore';
import { MarketCategory, Stock } from '../types/stock';
import { Search, X, Star, TrendingUp, TrendingDown, Check, Globe, Layers, Zap, DollarSign } from 'lucide-react';

interface StockDropdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockDropdownModal: React.FC<StockDropdownModalProps> = ({ isOpen, onClose }) => {
  const { stocks, activeStock, setActiveStock, watchlist, toggleWatchlist, theme } = useTrading();
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('ALL');

  const categories: { id: MarketCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'All Assets', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'INDICES', label: 'Indices (SENSEX / NIFTY)', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'INDIAN_BLUECHIPS', label: 'Indian Bluechips', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'US_TECH', label: 'US Tech Titans', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'COMMODITIES', label: 'Commodities & Forex', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'CRYPTO', label: 'Crypto', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesCategory = activeCategory === 'ALL' || stock.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        stock.symbol.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [stocks, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelectStock = (stock: Stock) => {
    setActiveStock(stock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]'} border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
        
        {/* Header & Search */}
        <div className={`p-4 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2a2e39] bg-[#1a1e28]'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Select Stock or Market Asset</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-[#2a2e39] text-gray-400'} hover:text-slate-900 transition cursor-pointer`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-gray-400'} absolute left-3.5 top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Symbol (e.g. SENSEX, RELIANCE, TCS, AAPL, GOLD, BTC)..."
              autoFocus
              className={`w-full ${isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#131722] border-[#2a2e39] text-white placeholder-gray-500'} border focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition`}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : (isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900' : 'bg-[#131722] text-gray-400 hover:text-gray-200 hover:bg-[#2a2e39]')
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stock List Items */}
        <div className={`flex-1 overflow-y-auto p-2 divide-y ${isLight ? 'divide-slate-100' : 'divide-[#2a2e39]/50'}`}>
          {filteredStocks.length === 0 ? (
            <div className={`text-center py-12 ${isLight ? 'text-slate-500' : 'text-gray-400'} text-sm`}>
              No matching assets found for "{searchQuery}". Try searching for SENSEX, NIFTY, or RELIANCE.
            </div>
          ) : (
            filteredStocks.map(stock => {
              const isSelected = stock.symbol === activeStock.symbol;
              const isFavorited = watchlist.includes(stock.symbol);
              const isPos = stock.change >= 0;

              return (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock)}
                  className={`flex items-center justify-between p-3 rounded-lg ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#2a2e39]/70'} cursor-pointer transition group ${
                    isSelected ? (isLight ? 'bg-blue-50 border border-blue-300' : 'bg-blue-900/20 border border-blue-500/40') : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleWatchlist(stock.symbol);
                      }}
                      className="p-1 text-gray-400 hover:text-amber-500 transition cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'} font-mono group-hover:text-blue-500 transition`}>
                          {stock.symbol}
                        </span>
                        <span className={`text-[10px] ${isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#131722] text-gray-400 border-[#2a2e39]'} px-1.5 py-0.5 rounded font-mono uppercase border`}>
                          {stock.exchange}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'} mt-0.5 truncate max-w-[280px]`}>
                        {stock.name} • <span className={isLight ? 'text-slate-400' : 'text-gray-500'}>{stock.sector}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Change Details */}
                  <div className="text-right">
                    <div className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'} text-sm`}>
                      {stock.currency} {stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-mono font-semibold flex items-center justify-end gap-1 ${
                      isPos ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')
                    }`}>
                      {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isPos ? '+' : ''}{stock.change.toFixed(2)} ({isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-3 ${isLight ? 'bg-slate-50 border-t border-slate-200 text-slate-500' : 'bg-[#131722] border-t border-[#2a2e39] text-gray-400'} text-xs flex items-center justify-between`}>
          <span>Showing {filteredStocks.length} assets (Indian Bluechips, Indices, Global Tech, Crypto & Commodities)</span>
          <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-gray-500'} font-mono`}>Press ESC or click outside to close</span>
        </div>
      </div>
    </div>
  );
};
