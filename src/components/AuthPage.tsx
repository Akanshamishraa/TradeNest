import React, { useState, useEffect, useRef } from 'react';
import { useTrading } from '../services/tradingStore';
import { 
  Search, 
  Sun, 
  Moon, 
  ArrowRight, 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Flame,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  Sparkles,
  UserCheck
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { 
    stocks,
    setActiveStock,
    login, 
    register, 
    enterAsGuest, 
    theme, 
    toggleTheme, 
    news 
  } = useTrading();

  const isLight = theme === 'light';
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Market Movers Tab State
  const [marketTab, setMarketTab] = useState<'TOP' | 'GAINERS' | 'LOSERS' | 'INDICES'>('TOP');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('NSE:NIFTY50');


  const newsScrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const container = newsScrollRef.current;
    if (!container) return;

    let scrollAmount = 0;
    const speed = 0.65;
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
    const resume = () => { animationId = requestAnimationFrame(autoScroll); };

    container.addEventListener('mouseenter', pause);
    container.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(animationId);
      if (container) {
        container.removeEventListener('mouseenter', pause);
        container.removeEventListener('mouseleave', resume);
      }
    };
  }, [news]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMessage(res.message);
        } else {
          setSuccessMessage(res.message);
          setTimeout(() => setIsAuthModalOpen(false), 500);
        }
      } else {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name');
          setIsSubmitting(false);
          return;
        }
        const res = await register(name, email, password);
        if (!res.success) {
          setErrorMessage(res.message);
        } else {
          setSuccessMessage(res.message);
          setTimeout(() => setIsAuthModalOpen(false), 500);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = () => {
    setAuthMode('login');
    setEmail('trader@tradenest.com');
    setPassword('trader123');
    setErrorMessage(null);
  };

  // Filter stocks by market movers
  const filteredStocks = stocks.filter(st => {
    if (marketTab === 'GAINERS') return st.changePercent > 0;
    if (marketTab === 'LOSERS') return st.changePercent < 0;
    if (marketTab === 'INDICES') return st.category === 'INDICES';
    return true;
  });

  const selectedStock = stocks.find(s => s.symbol === selectedStockSymbol) || stocks[0];

  const getRelativeTime = (timeStr: string) => {
    try {
      const diffMs = Date.now() - new Date(timeStr).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col bg-[url('/auth-bg.jpg')] bg-cover bg-center bg-fixed ${isLight ? 'text-slate-900' : 'text-gray-100'} transition-colors duration-300 relative overflow-hidden select-none`}>
      {/* Dynamic Ambient Vignette Overlay (Crisp Light / Deep Dark) */}
      <div className={`absolute inset-0 ${isLight ? 'bg-slate-100/80 backdrop-blur-[2px]' : 'bg-[#060911]/88 backdrop-blur-[1.5px]'} z-0 pointer-events-none transition-colors duration-300`} />

      {/* TOP NAVIGATION BAR */}
      <header className={`w-full h-14 border-b ${isLight ? 'bg-white/90 border-slate-200/80 shadow-xs' : 'bg-[#0f1422]/90 border-white/10'} backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-30 shrink-0 transition-colors duration-300`}>
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={enterAsGuest}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/25 border border-blue-400/30">
              TN
            </div>
            <div className="flex flex-col">
              <span className={`font-extrabold text-base tracking-tight font-mono ${isLight ? 'text-slate-900' : 'text-white'} leading-tight`}>TradeNest</span>
              <span className={`text-[9px] uppercase tracking-wider ${isLight ? 'text-blue-600' : 'text-blue-400'} font-bold`}>Institutional Terminal</span>
            </div>
          </div>

          {/* Quick Engine Badges */}
          <div className={`hidden lg:flex items-center gap-2 pl-4 border-l ${isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-gray-400'} text-[11px] font-medium`}>
            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-emerald-500" /> Auto S&R Radar</span>
            <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>•</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> Multi-Timeframe</span>
            <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>•</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Algorithmic Precision</span>
          </div>
        </div>

        {/* Right: Guest Demo & Theme Switcher */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={enterAsGuest}
            title="Enter directly as a guest trader"
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-xs'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guest Demo</span>
            <span className="sm:hidden">Guest</span>
          </button>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'} transition cursor-pointer`}
            title="Toggle Theme"
          >
            {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN SPLIT VIEWPORT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden z-10 min-h-0">
        
        {/* LEFT / CENTER HERO SECTION */}
        <div className="flex-1 flex flex-col justify-between p-5 sm:p-8 lg:p-8 overflow-y-auto lg:overflow-hidden relative min-h-0">
          
          {/* Hero Content */}
          <div className="max-w-2xl mt-1 sm:mt-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'} border text-[11px] font-bold uppercase tracking-wider mb-3`}>
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Next-Generation Financial Radar</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'} leading-tight`}>
              Trade With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400">Institutional Precision</span>.<br />
              Zero Guesswork.
            </h1>
            
            <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-gray-300'} mt-2.5 font-normal max-w-xl leading-relaxed`}>
              Automated Support & Resistance clustering, live bounce-frequency strength scoring, and multi-timeframe analytics engineered for high-conviction traders.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer flex items-center gap-2 border border-blue-400/30"
              >
                <span>Launch Trade Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                className={`px-5 py-2.5 rounded-xl ${isLight ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-xs' : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'} border font-bold text-xs sm:text-sm backdrop-blur-md transition cursor-pointer`}
              >
                Create Account
              </button>

              <button
                onClick={enterAsGuest}
                className={`px-5 py-2.5 rounded-xl ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-xs'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                } border font-bold text-xs sm:text-sm backdrop-blur-md transition cursor-pointer flex items-center gap-2 active:scale-95`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Explore as Guest</span>
              </button>
            </div>
          </div>

          {/* AUTO-SCROLLING SQUARE NEWS INTELLIGENCE STREAM */}
          <div className={`mt-4 pt-3 border-t ${isLight ? 'border-slate-200/80' : 'border-white/10'} shrink-0`}>
            {/* Horizontal Auto-Scrolling Container */}
            <div 
              ref={newsScrollRef}
              className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1"
              style={{ scrollBehavior: 'auto' }}
            >
              {[...news, ...news].map((article, idx) => {
                const isPos = article.sentiment === 'positive';
                const isNeg = article.sentiment === 'negative';

                return (
                  <a
                    key={`${article.id}_${idx}`}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-64 h-36 shrink-0 rounded-xl ${isLight ? 'bg-white/95 hover:bg-white border-slate-200/90 shadow-sm' : 'bg-[#0f1422]/90 hover:bg-[#182035] border-white/10 shadow-md'} border hover:border-blue-500/50 p-3 flex flex-col justify-between transition-all duration-200 group cursor-pointer backdrop-blur-md`}
                  >
                    <div>
                      {/* Top: Category & Sentiment */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/15 text-blue-400 border-blue-500/20'} border truncate max-w-[100px]`}>
                          {article.category}
                        </span>
                        
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isPos 
                            ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-400') 
                            : isNeg 
                            ? (isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/20 text-rose-400') 
                            : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-gray-500/20 text-gray-400')
                        }`}>
                          {isPos ? '▲ Bullish' : isNeg ? '▼ Bearish' : '● Neutral'}
                        </span>
                      </div>

                      {/* Headline */}
                      <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900 group-hover:text-blue-600' : 'text-gray-100 group-hover:text-blue-400'} transition-colors line-clamp-2 leading-snug`}>
                        {article.title}
                      </h4>
                    </div>

                    {/* Bottom: Publisher & Time */}
                    <div className={`pt-1.5 border-t ${isLight ? 'border-slate-100 text-slate-500' : 'border-white/5 text-gray-400'} flex items-center justify-between text-[10px] font-mono`}>
                      <span className="truncate max-w-[100px]">{article.publisher}</span>
                      <span>{getRelativeTime(article.providerPublishTime)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR: MARKET MOVERS & WATCHLIST RADAR */}
        <aside className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l ${isLight ? 'bg-white/95 border-slate-200 shadow-xl' : 'bg-[#0f1422]/95 border-white/10'} backdrop-blur-xl flex flex-col shrink-0 h-full overflow-hidden transition-colors duration-300`}>
          
          {/* Header & Tabs */}
          <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>Market Movers & Radar</span>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} font-mono`}>{filteredStocks.length} Assets</span>
            </div>

            <div className={`grid grid-cols-4 gap-1 p-1 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070a11] border-white/5'} rounded-lg border text-[11px] font-bold`}>
              {(['TOP', 'GAINERS', 'LOSERS', 'INDICES'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMarketTab(tab)}
                  className={`py-1 rounded text-center transition cursor-pointer ${
                    marketTab === tab 
                      ? (isLight ? 'bg-white text-blue-600 shadow-xs' : 'bg-[#222a3d] text-blue-400 shadow-xs') 
                      : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-gray-400 hover:text-gray-200')
                  }`}
                >
                  {tab === 'TOP' ? 'Top' : tab === 'GAINERS' ? 'Gainers' : tab === 'LOSERS' ? 'Losers' : 'Indices'}
                </button>
              ))}
            </div>
          </div>

          {/* Table Headers */}
          <div className={`grid grid-cols-12 px-4 py-1.5 text-[10px] uppercase font-bold ${isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-[#090d16]/70 text-gray-400 border-white/5'} border-b font-mono`}>
            <span className="col-span-5">Asset</span>
            <span className="col-span-3 text-right">Price</span>
            <span className="col-span-2 text-right">Chg</span>
            <span className="col-span-2 text-right">Chg%</span>
          </div>

          {/* Rows */}
          <div className={`flex-1 overflow-y-auto divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'} pr-1`}>
            {filteredStocks.map(stock => {
              const isPos = stock.change >= 0;
              const isSelected = stock.symbol === selectedStockSymbol;

              return (
                <div
                  key={stock.symbol}
                  onClick={() => {
                    setSelectedStockSymbol(stock.symbol);
                    setActiveStock(stock);
                  }}
                  className={`grid grid-cols-12 items-center px-4 py-2 text-xs transition cursor-pointer ${
                    isSelected 
                      ? (isLight ? 'bg-blue-50/90 border-l-2 border-blue-600 font-semibold' : 'bg-blue-600/15 border-l-2 border-blue-500 font-semibold') 
                      : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5')
                  }`}
                >
                  {/* Symbol */}
                  <div className="col-span-5 min-w-0 pr-1">
                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'} font-mono truncate`}>{stock.symbol}</div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'} truncate`}>{stock.name}</div>
                  </div>

                  {/* Price */}
                  <div className={`col-span-3 text-right font-mono ${isLight ? 'text-slate-800 font-semibold' : 'text-gray-200 font-semibold'}`}>
                    {stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Chg */}
                  <div className={`col-span-2 text-right font-mono text-[11px] ${isPos ? (isLight ? 'text-emerald-600 font-semibold' : 'text-emerald-400') : (isLight ? 'text-rose-600 font-semibold' : 'text-rose-400')}`}>
                    {isPos ? '+' : ''}{stock.change.toFixed(1)}
                  </div>

                  {/* Chg% */}
                  <div className={`col-span-2 text-right font-mono text-[11px] font-bold ${isPos ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')}`}>
                    {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Asset Focus Card */}
          <div className={`p-4 border-t ${isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#090d16]/95 border-white/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'} font-mono`}>{selectedStock.symbol}</span>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'} ml-1.5`}>• {selectedStock.exchange}</span>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                selectedStock.changePercent >= 0 
                  ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400') 
                  : (isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400')
              }`}>
                {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {selectedStock.currency}{selectedStock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-mono font-semibold ${selectedStock.change >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-rose-600' : 'text-rose-400')}`}>
                {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => {
                setActiveStock(selectedStock);
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-1.5 border border-blue-400/30"
            >
              <span>Analyze in Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </aside>

      </div>

      {/* AUTHENTICATION POPUP MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f1422] border-[#222a3d] text-white'} border shadow-2xl p-6 sm:p-8 relative`}>
            
            {/* Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-white/10'} transition cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Tabs */}
            <div className={`grid grid-cols-2 p-1 rounded-xl mb-6 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070a11] border-[#222a3d]'} border`}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'login' 
                    ? (isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-[#1e2638] text-blue-400 shadow-md') 
                    : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white')
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'register' 
                    ? (isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-[#1e2638] text-blue-400 shadow-md') 
                    : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white')
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Modal Title */}
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'} font-mono mb-4`}>
              {authMode === 'login' ? 'Sign In to TradeNest' : 'Create TradeNest Account'}
            </h3>

            {/* Feedback */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'} mb-1`}>Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="tn_name_field"
                      autoComplete="off"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Akansha Mishra"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-[#222a3d] bg-[#141b2d] text-white'} text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'} mb-1`}>Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="tn_email_field"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-[#222a3d] bg-[#141b2d] text-white'} text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'} mb-1`}>Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="tn_password_field"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-[#222a3d] bg-[#141b2d] text-white'} text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? 'Sign In to Terminal' : 'Create Account')}
              </button>

              {/* Instant Guest Access Divider & Button */}
              <div className="relative flex py-1.5 items-center">
                <div className={`flex-grow border-t ${isLight ? 'border-slate-200' : 'border-[#222a3d]'}`}></div>
                <span className="flex-shrink mx-2 text-[10px] text-gray-400 uppercase font-mono font-semibold">Or Instant Access</span>
                <div className={`flex-grow border-t ${isLight ? 'border-slate-200' : 'border-[#222a3d]'}`}></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  enterAsGuest();
                  setIsAuthModalOpen(false);
                }}
                className={`w-full py-2.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Continue as Guest Trader (No Password Needed)</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
