import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Stock, Candle, SupportResistanceLevel, IndicatorSettings, ChartType, Timeframe, Granularity, DrawingTool, DrawingItem, Order, Position, User, NewsArticle } from '../types/stock';
import { STOCKS_DATA } from '../data/stocksData';
import {
  generateHistoricalCandles,
  detectSupportResistanceLevels,
  fetchLiveQuoteFromBackend,
  fetchLiveHistoricalDataFromBackend,
  generateContinuousCandles
} from './marketDataEngine';
import { format, subDays } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

interface TradingContextType {
  stocks: Stock[];
  activeStock: Stock;
  setActiveStock: (stock: Stock) => void;
  candles: Candle[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  applyCustomDateRange: (start: string, end: string) => void;
  isCustomRange: boolean;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  // Continuous Chart Mode (TradingView 1! / Futures Rollover)
  isContinuousMode: boolean;
  setIsContinuousMode: (val: boolean) => void;
  toggleContinuousMode: () => void;
  indicators: IndicatorSettings;
  toggleIndicator: (key: keyof IndicatorSettings) => void;
  supportResistanceLevels: SupportResistanceLevel[];
  addManualSRLevel: (price: number, type: 'support' | 'resistance', label?: string) => void;
  toggleSRLevel: (id: string) => void;
  removeSRLevel: (id: string) => void;
  resetAutoSRLevels: () => void;
  activeDrawingTool: DrawingTool;
  setActiveDrawingTool: (tool: DrawingTool) => void;
  drawings: DrawingItem[];
  addDrawing: (drawing: DrawingItem) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  // Paper Trading
  balance: number;
  positions: Position[];
  orders: Order[];
  executeTrade: (type: 'BUY' | 'SELL', orderType: 'MARKET' | 'LIMIT', shares: number, limitPrice?: number) => boolean;
  resetPortfolio: () => void;
  // Watchlist
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  // Live Streaming
  isLiveStreaming: boolean;
  setIsLiveStreaming: (live: boolean) => void;
  latestPrice: number;
  priceFlash: 'up' | 'down' | null;
  // Cropped View Feature
  croppedTimeframePreview: { active: boolean; label: string; candles: Candle[] } | null;
  setCroppedTimeframePreview: (preview: { active: boolean; label: string; candles: Candle[] } | null) => void;
  // Theme State
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  // Authentication State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  enterAsGuest: () => void;
  // Financial Market News
  news: NewsArticle[];
  isLoadingNews: boolean;
  fetchNews: (category?: string) => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const INITIAL_BALANCE = 1000000; // 10 Lakhs Virtual Cash

export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme defaults to 'light' (White Theme)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tradenest_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });
  const [stocks, setStocks] = useState<Stock[]>(STOCKS_DATA);
  const [activeStock, setActiveStockState] = useState<Stock>(() => {
    const savedSymbol = localStorage.getItem('tradenest_active_stock');
    if (savedSymbol) {
      const found = STOCKS_DATA.find(s => s.symbol === savedSymbol);
      if (found) return found;
    }
    return STOCKS_DATA[0];
  });

  const [timeframe, setTimeframeState] = useState<Timeframe>(() => {
    const saved = localStorage.getItem('tradenest_timeframe') as Timeframe;
    return saved || '1Y';
  });

  const [granularity, setGranularity] = useState<Granularity>('1D');
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const defaultStartStr = format(subDays(new Date(), 365), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);

  const [chartType, setChartTypeState] = useState<ChartType>(() => {
    const saved = localStorage.getItem('tradenest_chart_type') as ChartType;
    return saved || 'candlestick';
  });
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(false);
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    showSMA20: false,
    showSMA50: false,
    showSMA200: false,
    showEMA9: false,
    showEMA21: false,
    showRSI: false,
    showMACD: false,
    showBollingerBands: false,
    showNoiseReduction: false,
    showSupportResistance: true, // Only Support & Resistance
    showVolume: true,            // And Volume
    showFibonacci: false
  });

  const [candles, setCandles] = useState<Candle[]>([]);
  const [supportResistanceLevels, setSupportResistanceLevels] = useState<SupportResistanceLevel[]>([]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('cursor');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);

  // Paper Trading State
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('tradenest_balance');
    return saved ? parseFloat(saved) : INITIAL_BALANCE;
  });
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('tradenest_positions');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('tradenest_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Watchlist State
  const [watchlist, setWatchlist] = useState<string[]>(['BSE:SENSEX', 'NSE:NIFTY50', 'RELIANCE', 'TCS', 'AAPL', 'NVDA', 'CRYPTO:BTC']);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tradenest_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('tradenest_token');
  });
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('tradenest_guest') === 'true';
  });

  // News State
  const [news, setNews] = useState<NewsArticle[]>([
    {
      id: 'news_1',
      title: 'BSE Sensex Surges Past 82,000 as FII Inflows Boost Banking & IT Bluechips',
      publisher: 'Economic Times',
      link: 'https://economictimes.indiatimes.com/markets',
      providerPublishTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      category: 'Indian Markets',
      sentiment: 'positive',
      snippet: 'Indian benchmark indices rallied over 650 points led by robust buying in Reliance, HDFC Bank and Infosys.'
    },
    {
      id: 'news_2',
      title: 'Nvidia Unveils Next-Gen AI Silicon Architecture; Tech Sector Gains Worldwide',
      publisher: 'Reuters Markets',
      link: 'https://www.reuters.com/technology',
      providerPublishTime: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      category: 'Global Tech',
      sentiment: 'positive',
      snippet: 'Wall Street chipmaker Nvidia rallied 3.8% in pre-market trade following breakthrough AI compute benchmarks.'
    },
    {
      id: 'news_3',
      title: 'RBI Monetary Policy Committee Maintains Repo Rate at 6.5%, Upgrades GDP Outlook to 7.2%',
      publisher: 'Bloomberg Financial',
      link: 'https://www.bloomberg.com/markets',
      providerPublishTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      category: 'Economy',
      sentiment: 'neutral',
      snippet: 'Reserve Bank of India Governor highlighted strong rural consumption and manufacturing resilience.'
    },
    {
      id: 'news_4',
      title: 'Reliance Industries Clean Energy & 5G Rollout Expands Operating Margins',
      publisher: 'Business Standard',
      link: 'https://www.business-standard.com',
      providerPublishTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      category: 'Indian Markets',
      sentiment: 'positive',
      snippet: 'Mukesh Ambani-led conglomerate Reliance Industries reported record quarterly digital services revenue.'
    },
    {
      id: 'news_5',
      title: 'Bitcoin Consolidates Above $68,000 as Institutional Spot ETF Accumulation Accelerates',
      publisher: 'CoinDesk',
      link: 'https://www.coindesk.com',
      providerPublishTime: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      category: 'Crypto',
      sentiment: 'positive',
      snippet: 'Net inflows into global spot Bitcoin exchange-traded funds surpassed $420 million over the past 48 hours.'
    },
    {
      id: 'news_6',
      title: 'TCS and Tata Motors Lead Auto & IT Export Momentum in European Markets',
      publisher: 'LiveMint',
      link: 'https://www.livemint.com',
      providerPublishTime: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
      category: 'Indian Markets',
      sentiment: 'positive',
      snippet: 'Automotive and software exports showed robust resilience in Q3 results.'
    }
  ]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);

  const fetchNews = async (category: string = 'all') => {
    setIsLoadingNews(true);
    try {
      const res = await fetch(`${API_BASE_URL}/news?category=${encodeURIComponent(category)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setNews(json.data);
        }
      }
    } catch (err) {
      console.warn('News fetch notice (using high-fidelity fallback):', err);
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchNews('all');
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        setToken(data.data.token || null);
        setIsGuestMode(false);
        localStorage.setItem('tradenest_user', JSON.stringify(data.data));
        if (data.data.token) localStorage.setItem('tradenest_token', data.data.token);
        localStorage.removeItem('tradenest_guest');
        if (Array.isArray(data.data.watchlist) && data.data.watchlist.length > 0) {
          setWatchlist(data.data.watchlist);
        }
        return { success: true, message: data.message || 'Login successful!' };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error connecting to backend' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        setToken(data.data.token || null);
        setIsGuestMode(false);
        localStorage.setItem('tradenest_user', JSON.stringify(data.data));
        if (data.data.token) localStorage.setItem('tradenest_token', data.data.token);
        localStorage.removeItem('tradenest_guest');
        return { success: true, message: data.message || 'Registration successful!' };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error connecting to backend' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuestMode(false);
    localStorage.removeItem('tradenest_user');
    localStorage.removeItem('tradenest_token');
    localStorage.removeItem('tradenest_guest');
  };

  const enterAsGuest = () => {
    const guestUser: User = {
      _id: 'guest_' + Date.now(),
      name: 'Guest Trader',
      email: 'guest@tradenest.com',
      watchlist: ['BSE:SENSEX', 'NSE:NIFTY50', 'RELIANCE', 'TCS', 'AAPL', 'NVDA']
    };
    setUser(guestUser);
    setIsGuestMode(true);
    localStorage.setItem('tradenest_guest', 'true');
    localStorage.setItem('tradenest_user', JSON.stringify(guestUser));
  };

  // Live Streaming & Ticking State
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [latestPrice, setLatestPrice] = useState<number>(activeStock.currentPrice);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  // Cropped View state
  const [croppedTimeframePreview, setCroppedTimeframePreview] = useState<{ active: boolean; label: string; candles: Candle[] } | null>(null);

  const toggleContinuousMode = () => {
    setIsContinuousMode(prev => !prev);
  };

  // Refresh historical candles whenever active stock, timeframe, continuous mode, or custom date range changes
  useEffect(() => {
    let isCancelled = false;

    // 1. Immediate local render for instantaneous zero-latency response
    setLatestPrice(activeStock.currentPrice);
    let rawCandles = generateHistoricalCandles(
      activeStock,
      timeframe,
      granularity,
      isCustomRange ? startDate : undefined,
      isCustomRange ? endDate : undefined
    );

    if (isContinuousMode) {
      rawCandles = generateContinuousCandles(rawCandles);
    }

    setCandles(rawCandles);
    const detectedSR = detectSupportResistanceLevels(rawCandles, activeStock.currentPrice);
    setSupportResistanceLevels(detectedSR);

    // 2. Fetch real live historical candles from Node.js Yahoo Finance Backend
    async function loadLiveBackendData() {
      try {
        const [liveCandles, liveQuote] = await Promise.all([
          fetchLiveHistoricalDataFromBackend(activeStock.symbol, timeframe, granularity),
          fetchLiveQuoteFromBackend(activeStock.symbol)
        ]);

        if (isCancelled) return;

        if (liveQuote && liveQuote.price) {
          setLatestPrice(liveQuote.price);
          setActiveStockState(prev => ({
            ...prev,
            currentPrice: liveQuote.price,
            previousClose: liveQuote.previousClose || prev.previousClose,
            change: liveQuote.change || prev.change,
            changePercent: liveQuote.changePercent || prev.changePercent,
            open: liveQuote.open || prev.open,
            high: Math.max(liveQuote.high || 0, prev.high),
            low: Math.min(liveQuote.low || Infinity, prev.low),
            volume: liveQuote.volume || prev.volume,
            marketCap: liveQuote.marketCap || prev.marketCap,
            peRatio: liveQuote.peRatio || prev.peRatio
          }));

          // Synchronize the master stocks array so ticker tape matches the chart price
          setStocks(prev =>
            prev.map(s =>
              s.symbol === activeStock.symbol
                ? {
                    ...s,
                    currentPrice: liveQuote.price,
                    previousClose: liveQuote.previousClose || s.previousClose,
                    change: liveQuote.change || s.change,
                    changePercent: liveQuote.changePercent || s.changePercent,
                    open: liveQuote.open || s.open,
                    high: Math.max(liveQuote.high || 0, s.high),
                    low: Math.min(liveQuote.low || Infinity, s.low),
                    volume: liveQuote.volume || s.volume,
                    marketCap: liveQuote.marketCap || s.marketCap,
                    peRatio: liveQuote.peRatio || s.peRatio
                  }
                : s
            )
          );
        }

        if (liveCandles && liveCandles.length > 0) {
          const finalCandles = isContinuousMode ? generateContinuousCandles(liveCandles) : liveCandles;
          setCandles(finalCandles);
          const liveSR = detectSupportResistanceLevels(finalCandles, liveQuote?.price || activeStock.currentPrice);
          setSupportResistanceLevels(liveSR);
        }
      } catch (e) {
        // Fallback silently if offline
      }
    }

    loadLiveBackendData();

    return () => {
      isCancelled = true;
    };
  }, [activeStock.symbol, timeframe, granularity, isCustomRange, startDate, endDate, isContinuousMode]);

  // Persist paper trading to local storage
  useEffect(() => {
    localStorage.setItem('tradenest_balance', balance.toString());
    localStorage.setItem('tradenest_positions', JSON.stringify(positions));
    localStorage.setItem('tradenest_orders', JSON.stringify(orders));
  }, [balance, positions, orders]);

  // Live price simulator tick
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setActiveStockState(prevStock => {
        const volatility = 0.0012;
        const deltaPercent = (Math.random() - 0.49) * volatility;
        const newPrice = parseFloat((prevStock.currentPrice * (1 + deltaPercent)).toFixed(2));
        const direction = newPrice >= prevStock.currentPrice ? 'up' : 'down';

        setLatestPrice(newPrice);
        setPriceFlash(direction);
        setTimeout(() => setPriceFlash(null), 400);

        setCandles(prevCandles => {
          if (prevCandles.length === 0) return prevCandles;
          const lastIdx = prevCandles.length - 1;
          const last = prevCandles[lastIdx];
          const updatedLast: Candle = {
            ...last,
            close: newPrice,
            high: Math.max(last.high, newPrice),
            low: Math.min(last.low, newPrice),
            volume: (last.volume || 1000) + Math.floor(Math.random() * 40)
          };
          const next = [...prevCandles];
          next[lastIdx] = updatedLast;
          return next;
        });

        return {
          ...prevStock,
          currentPrice: newPrice,
          change: parseFloat((newPrice - prevStock.previousClose).toFixed(2)),
          changePercent: parseFloat((((newPrice - prevStock.previousClose) / prevStock.previousClose) * 100).toFixed(2)),
          high: Math.max(prevStock.high, newPrice),
          low: Math.min(prevStock.low, newPrice)
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const setActiveStock = (stock: Stock) => {
    setActiveStockState(stock);
    setLatestPrice(stock.currentPrice);
    if (stock && stock.symbol) {
      localStorage.setItem('tradenest_active_stock', stock.symbol);
    }
  };

  const setTimeframe = (tf: Timeframe) => {
    setIsCustomRange(false);
    setTimeframeState(tf);
    localStorage.setItem('tradenest_timeframe', tf);
  };

  const setChartType = (ct: ChartType) => {
    setChartTypeState(ct);
    localStorage.setItem('tradenest_chart_type', ct);
  };

  const applyCustomDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setIsCustomRange(true);
  };

  const toggleIndicator = (key: keyof IndicatorSettings) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addManualSRLevel = (price: number, type: 'support' | 'resistance', label?: string) => {
    const newLevel: SupportResistanceLevel = {
      id: 'manual-' + Date.now(),
      price: parseFloat(price.toFixed(2)),
      type,
      label: label || (type === 'resistance' ? 'Custom Resistance' : 'Custom Support'),
      strength: 5,
      touches: 1,
      isManual: true,
      color: type === 'resistance' ? '#f23645' : '#089981',
      active: true
    };
    setSupportResistanceLevels(prev => [newLevel, ...prev]);
  };

  const toggleSRLevel = (id: string) => {
    setSupportResistanceLevels(prev =>
      prev.map(lvl => (lvl.id === id ? { ...lvl, active: !lvl.active } : lvl))
    );
  };

  const removeSRLevel = (id: string) => {
    setSupportResistanceLevels(prev => prev.filter(lvl => lvl.id !== id));
  };

  const resetAutoSRLevels = () => {
    const detectedSR = detectSupportResistanceLevels(candles, activeStock.currentPrice);
    setSupportResistanceLevels(detectedSR);
  };

  const addDrawing = (drawing: DrawingItem) => {
    setDrawings(prev => [...prev, drawing]);
  };

  const removeDrawing = (id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
  };

  const clearDrawings = () => {
    setDrawings([]);
    setSupportResistanceLevels(prev => prev.filter(l => !l.isManual));
    setIndicators(prev => ({ ...prev, showFibonacci: false }));
    setActiveDrawingTool('cursor');
  };

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  // Paper Trading Order Execution
  const executeTrade = (
    type: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT',
    shares: number,
    limitPrice?: number
  ): boolean => {
    const execPrice = orderType === 'MARKET' ? latestPrice : (limitPrice || latestPrice);
    const totalCost = execPrice * shares;

    if (type === 'BUY') {
      if (totalCost > balance) {
        alert('Insufficient virtual balance! Available: ' + activeStock.currency + ' ' + balance.toLocaleString());
        return false;
      }

      setBalance(prev => prev - totalCost);

      setPositions(prev => {
        const existing = prev.find(p => p.symbol === activeStock.symbol);
        if (existing) {
          const newShares = existing.shares + shares;
          const newTotalCost = existing.totalCost + totalCost;
          const newAvgPrice = newTotalCost / newShares;
          return prev.map(p =>
            p.symbol === activeStock.symbol
              ? {
                  ...p,
                  shares: newShares,
                  avgPrice: parseFloat(newAvgPrice.toFixed(2)),
                  totalCost: newTotalCost,
                  currentValue: newShares * latestPrice,
                  pnl: (latestPrice - newAvgPrice) * newShares,
                  pnlPercent: parseFloat((((latestPrice - newAvgPrice) / newAvgPrice) * 100).toFixed(2))
                }
              : p
          );
        } else {
          const newPos: Position = {
            symbol: activeStock.symbol,
            name: activeStock.name,
            shares,
            avgPrice: execPrice,
            currentPrice: latestPrice,
            totalCost,
            currentValue: totalCost,
            pnl: 0,
            pnlPercent: 0,
            currency: activeStock.currency
          };
          return [newPos, ...prev];
        }
      });
    } else {
      // SELL
      const existing = positions.find(p => p.symbol === activeStock.symbol);
      if (!existing || existing.shares < shares) {
        alert('Cannot sell more shares than currently holding!');
        return false;
      }

      const revenue = execPrice * shares;
      setBalance(prev => prev + revenue);

      setPositions(prev => {
        return prev
          .map(p => {
            if (p.symbol === activeStock.symbol) {
              const remainingShares = p.shares - shares;
              if (remainingShares <= 0) return null;
              const remainingCost = p.avgPrice * remainingShares;
              return {
                ...p,
                shares: remainingShares,
                totalCost: remainingCost,
                currentValue: remainingShares * latestPrice,
                pnl: (latestPrice - p.avgPrice) * remainingShares,
                pnlPercent: parseFloat((((latestPrice - p.avgPrice) / p.avgPrice) * 100).toFixed(2))
              };
            }
            return p;
          })
          .filter(Boolean) as Position[];
      });
    }

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      symbol: activeStock.symbol,
      stockName: activeStock.name,
      type,
      orderType,
      shares,
      price: execPrice,
      total: totalCost,
      timestamp: format(new Date(), 'HH:mm:ss dd MMM yyyy'),
      status: 'EXECUTED'
    };

    setOrders(prev => [newOrder, ...prev]);
    return true;
  };

  const resetPortfolio = () => {
    setBalance(INITIAL_BALANCE);
    setPositions([]);
    setOrders([]);
    localStorage.removeItem('tradenest_balance');
    localStorage.removeItem('tradenest_positions');
    localStorage.removeItem('tradenest_orders');
  };

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('tradenest_theme', t);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  // Sync theme with document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <TradingContext.Provider
      value={{
        stocks,
        activeStock,
        setActiveStock,
        candles,
        timeframe,
        setTimeframe,
        granularity,
        setGranularity,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        applyCustomDateRange,
        isCustomRange,
        chartType,
        setChartType,
        isContinuousMode,
        setIsContinuousMode,
        toggleContinuousMode,
        indicators,
        toggleIndicator,
        supportResistanceLevels,
        addManualSRLevel,
        toggleSRLevel,
        removeSRLevel,
        resetAutoSRLevels,
        activeDrawingTool,
        setActiveDrawingTool,
        drawings,
        addDrawing,
        removeDrawing,
        clearDrawings,
        balance,
        positions,
        orders,
        executeTrade,
        resetPortfolio,
        watchlist,
        toggleWatchlist,
        isLiveStreaming,
        setIsLiveStreaming,
        latestPrice,
        priceFlash,
        croppedTimeframePreview,
        setCroppedTimeframePreview,
        theme,
        setTheme,
        toggleTheme,
        // Auth & News
        user,
        token,
        isAuthenticated: !!user || isGuestMode,
        isGuestMode,
        login,
        register,
        logout,
        enterAsGuest,
        news,
        isLoadingNews,
        fetchNews
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
