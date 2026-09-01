export type MarketCategory = 'ALL' | 'INDICES' | 'INDIAN_BLUECHIPS' | 'US_TECH' | 'COMMODITIES' | 'CRYPTO';

export type ChartType = 'candlestick' | 'line' | 'area' | 'bar' | 'heikin-ashi';

export type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export type Granularity = '1m' | '5m' | '15m' | '1h' | '1D' | '1W';

export interface Stock {
  symbol: string;
  name: string;
  exchange: 'BSE' | 'NSE' | 'NASDAQ' | 'NYSE' | 'COMMODITY' | 'CRYPTO';
  category: 'INDICES' | 'INDIAN_BLUECHIPS' | 'US_TECH' | 'COMMODITIES' | 'CRYPTO';
  currency: '₹' | '$';
  currentPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: string;
  peRatio: number | null;
  eps?: number;
  beta: number;
  high52: number;
  low52: number;
  sentiment: {
    score: number; // 0 to 100
    label: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  };
  description: string;
  sector: string;
}

export interface Candle {
  time: string | number; // 'YYYY-MM-DD' or timestamp in seconds for Lightweight Charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SupportResistanceLevel {
  id: string;
  price: number;
  type: 'support' | 'resistance';
  label: string; // 'S1', 'S2', 'S3', 'R1', 'R2', 'R3' or 'Custom'
  strength: number; // 1 to 5
  touches: number;
  isManual?: boolean;
  color: string;
  active: boolean;
}

export interface IndicatorSettings {
  showSMA20: boolean;
  showSMA50: boolean;
  showSMA200: boolean;
  showEMA9: boolean;
  showEMA21: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showBollingerBands: boolean;
  showNoiseReduction: boolean;
  showSupportResistance: boolean;
  showVolume: boolean;
  showFibonacci: boolean;
}

export type DrawingTool = 
  | 'cursor' 
  | 'trendline' 
  | 'horizontal_line' 
  | 'support_line' 
  | 'resistance_line' 
  | 'fibonacci' 
  | 'measure' 
  | 'text' 
  | 'eraser';

export interface DrawingItem {
  id: string;
  tool: DrawingTool;
  points: { timeIndex: number; price: number; timeStr?: string }[];
  color: string;
  lineWidth?: number;
  text?: string;
}

export interface Order {
  id: string;
  symbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  shares: number;
  price: number;
  total: number;
  timestamp: string;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED';
}

export interface Position {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  currency: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  isCustom: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  watchlist: string[];
  token?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  thumbnail?: string | null;
  snippet?: string;
}
