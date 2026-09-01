import { Candle, Stock, SupportResistanceLevel, Timeframe, Granularity } from '../types/stock';
import { format, subDays, subMonths, subYears, isWeekend, addMinutes } from 'date-fns';

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateHistoricalCandles(
  stock: Stock,
  timeframe: Timeframe = '1Y',
  granularity?: Granularity,
  customStartDate?: string,
  customEndDate?: string
): Candle[] {
  const candles: Candle[] = [];
  const now = new Date();
  
  // Determine duration and resolution based on timeframe
  let daysBack = 365;
  let isIntraday = false;
  let intervalMinutes = 1440; // Daily by default

  if (customStartDate && customEndDate) {
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    daysBack = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30;
    if (daysBack <= 2) {
      isIntraday = true;
      intervalMinutes = 1;
    } else if (daysBack <= 14) {
      intervalMinutes = 60;
    } else {
      intervalMinutes = 1440;
    }
  } else {
    switch (timeframe) {
      case '1D':
        isIntraday = true;
        daysBack = 1;
        intervalMinutes = 1;
        break;
      case '5D':
        isIntraday = true;
        daysBack = 5;
        intervalMinutes = 5;
        break;
      case '1M':
        daysBack = 30;
        intervalMinutes = 240; // 4H bars or daily
        break;
      case '3M':
        daysBack = 90;
        intervalMinutes = 1440;
        break;
      case '6M':
        daysBack = 180;
        intervalMinutes = 1440;
        break;
      case '1Y':
        daysBack = 365;
        intervalMinutes = 1440;
        break;
      case '5Y':
        daysBack = 1825;
        intervalMinutes = 1440 * 3; // 3-day / weekly
        break;
      case 'ALL':
        daysBack = 3650;
        intervalMinutes = 1440 * 7; // weekly
        break;
    }
  }

  // Strictly override with selected granularity if provided by user
  if (granularity) {
    switch (granularity) {
      case '1m':
        isIntraday = true;
        intervalMinutes = 1;
        break;
      case '5m':
        isIntraday = true;
        intervalMinutes = 5;
        break;
      case '15m':
        isIntraday = true;
        intervalMinutes = 15;
        break;
      case '1h':
        isIntraday = true;
        intervalMinutes = 60;
        break;
      case '1D':
        isIntraday = false;
        intervalMinutes = 1440;
        break;
      case '1W':
        isIntraday = false;
        intervalMinutes = 1440 * 7;
        break;
    }
  }

  
  const basePrice = stock.currentPrice;
  const isCrypto = stock.category === 'CRYPTO';
  const volatility = stock.beta ? (stock.beta * 0.015) : 0.02;

  let seed = 0;
  for (let i = 0; i < stock.symbol.length; i++) {
    seed += stock.symbol.charCodeAt(i) * (i + 1);
  }


  let totalBars = 0;
  if (isIntraday) {
    if (intervalMinutes === 1) {
      totalBars = timeframe === '1D' ? 120 : 200;
    } else if (intervalMinutes === 5) {
      totalBars = timeframe === '1D' ? 75 : 150;
    } else if (intervalMinutes === 15) {
      totalBars = 60;
    } else {
      totalBars = 50;
    }
  } else {
    totalBars = Math.min(Math.max(Math.floor(daysBack / (intervalMinutes / 1440)), 30), 600);
  }

  // Back-calculate historical trajectory to land on current price
  const pricePath: number[] = [];
  let p = basePrice;
  const pathSteps = totalBars;

  
  pricePath.unshift(p);
  for (let i = 0; i < pathSteps - 1; i++) {
    const r1 = seededRandom(seed++);
    const r2 = seededRandom(seed++);
    const drift = (stock.sentiment.score > 60 ? 0.0008 : -0.0004);
    const shock = (r1 - 0.5) * volatility * 2.2;
    const factor = 1 + drift + shock;
    p = p / factor;
    // Bound price reasonably
    if (stock.low52 && p < stock.low52 * 0.85) p = stock.low52 * 0.9;
    if (stock.high52 && p > stock.high52 * 1.2) p = stock.high52 * 1.1;
    pricePath.unshift(p);
  }

  // Create timestamps
  let currentTime = new Date();
  if (customEndDate) {
    currentTime = new Date(customEndDate);
  }

  const generatedDates: Date[] = [];
  if (isIntraday) {
    // Generate intraday timestamps with EXACT intervalMinutes
    const marketStart = new Date(currentTime);
    marketStart.setHours(9, 15, 0, 0); // 9:15 AM
    for (let i = 0; i < totalBars; i++) {
      generatedDates.push(addMinutes(marketStart, i * intervalMinutes));
    }
  } else {
    // Generate daily/weekly timestamps backward
    let d = new Date(currentTime);
    while (generatedDates.length < totalBars) {
      if (isCrypto || !isWeekend(d)) {
        generatedDates.unshift(new Date(d));
      }
      d = subDays(d, 1);
    }
  }

  // Build OHLCV candles
  for (let i = 0; i < totalBars; i++) {
    const openPrice = pricePath[i];
    const nextPrice = i < totalBars - 1 ? pricePath[i + 1] : stock.currentPrice;
    const isLastBar = i === totalBars - 1;
    const closePrice = isLastBar ? stock.currentPrice : (openPrice * 0.4 + nextPrice * 0.6);

    const r3 = seededRandom(seed++);
    const r4 = seededRandom(seed++);
    const wickHigh = Math.max(openPrice, closePrice) * (1 + r3 * volatility * 0.8);
    const wickLow = Math.min(openPrice, closePrice) * (1 - r4 * volatility * 0.8);

    const baseVol = stock.avgVolume ? (stock.avgVolume / totalBars) : 50000;
    const volume = Math.round(baseVol * (0.6 + seededRandom(seed++) * 0.9));

    const dateObj = generatedDates[i] || new Date();
    
    // Lightweight charts time formatting: 'YYYY-MM-DD' for daily or number timestamp (seconds) for intraday
    let timeVal: string | number;
    if (isIntraday) {
      // UNIX timestamp in seconds (must be numeric number)
      timeVal = Math.floor(dateObj.getTime() / 1000);
    } else {
      timeVal = format(dateObj, 'yyyy-MM-dd');
    }

    candles.push({
      time: timeVal,
      open: parseFloat(openPrice.toFixed(2)),
      high: parseFloat(Math.max(wickHigh, openPrice, closePrice).toFixed(2)),
      low: parseFloat(Math.min(wickLow, openPrice, closePrice).toFixed(2)),
      close: parseFloat(closePrice.toFixed(2)),
      volume: volume
    });
  }

  return candles;
}

// Support and Resistance calculation using Swing Extrema & Density Clustering
export function detectSupportResistanceLevels(
  candles: Candle[],
  currentPrice: number
): SupportResistanceLevel[] {
  if (candles.length < 15) return [];

  const levels: SupportResistanceLevel[] = [];
  const swingLows: number[] = [];
  const swingHighs: number[] = [];
  const window = Math.max(3, Math.min(6, Math.floor(candles.length / 12))); //rolling window for swing detection

  for (let i = window; i < candles.length - window; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = i - window; j <= i + window; j++) {
      if (j === i) continue;
      if (candles[j].high > currentHigh) isHigh = false;
      if (candles[j].low < currentLow) isLow = false;
    }

    if (isHigh) swingHighs.push(currentHigh);
    if (isLow) swingLows.push(currentLow);
  }

  // Cluster nearby levels within 1.8% threshold
  const clusterLevels = (prices: number[], type: 'support' | 'resistance'): { price: number; touches: number }[] => {
    const clusters: { sum: number; count: number }[] = [];
    const threshold = 0.018; // 1.8% clustering bandwidth

    for (const p of prices) {
      let matched = false;
      for (const c of clusters) {
        const avg = c.sum / c.count;
        if (Math.abs(p - avg) / avg < threshold) {
          c.sum += p;
          c.count += 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        clusters.push({ sum: p, count: 1 });
      }
    }

    return clusters
      .map(c => ({
        price: parseFloat((c.sum / c.count).toFixed(2)),
        touches: c.count
      }))
      .sort((a, b) => (type === 'support' ? b.price - a.price : a.price - b.price));
  };

  const supportClusters = clusterLevels(swingLows, 'support')
    .filter(c => c.price < currentPrice * 0.998)
    .slice(0, 3);

  const resistanceClusters = clusterLevels(swingHighs, 'resistance')
    .filter(c => c.price > currentPrice * 1.002)
    .slice(0, 3);

  // Intelligent fallback for support if no historical cluster met strict window
  if (supportClusters.length === 0) {
    const candidateLows = candles.map(c => c.low).filter(l => l < currentPrice * 0.998);
    if (candidateLows.length > 0) {
      const lowestPoint = Math.min(...candidateLows);
      supportClusters.push({ price: parseFloat(lowestPoint.toFixed(2)), touches: 2 });
    } else {
      // Day's Low Support Projection
      const projectedSupport = currentPrice * 0.982;
      supportClusters.push({ price: parseFloat(projectedSupport.toFixed(2)), touches: 2 });
    }
  }

  
  if (resistanceClusters.length === 0) {
    const candidateHighs = candles.map(c => c.high).filter(h => h > currentPrice * 1.002);
    if (candidateHighs.length > 0) {
      const highestPoint = Math.max(...candidateHighs);
      resistanceClusters.push({ price: parseFloat(highestPoint.toFixed(2)), touches: 2 });
    } else {
      
      const projectedTarget = currentPrice * 1.018;
      resistanceClusters.push({ price: parseFloat(projectedTarget.toFixed(2)), touches: 2 });
    }
  }

  // Add Resistance Levels 
  resistanceClusters.forEach((res, idx) => {
    levels.push({
      id: `res-${idx + 1}`,
      price: res.price,
      type: 'resistance',
      label: `R${idx + 1} Resistance`,
      strength: Math.min(Math.max(res.touches + 1, 2), 5),
      touches: res.touches,
      color: '#f23645',
      active: true
    });
  });

  // Add Support Levels (Green #089981)
  supportClusters.forEach((sup, idx) => {
    levels.push({
      id: `sup-${idx + 1}`,
      price: sup.price,
      type: 'support',
      label: `S${idx + 1} Support`,
      strength: Math.min(Math.max(sup.touches + 1, 2), 5),
      touches: sup.touches,
      color: '#089981', 
      active: true
    });
  });

  // If no support/resistance detected, create standard dynamic pivot levels
  if (levels.length === 0) {
    levels.push({
      id: 'res-1',
      price: parseFloat((currentPrice * 1.025).toFixed(2)),
      type: 'resistance',
      label: 'R1 Resistance',
      strength: 4,
      touches: 3,
      color: '#f23645',
      active: true
    });
    levels.push({
      id: 'res-2',
      price: parseFloat((currentPrice * 1.055).toFixed(2)),
      type: 'resistance',
      label: 'R2 Major Resistance',
      strength: 5,
      touches: 5,
      color: '#ef5350',
      active: true
    });
    levels.push({
      id: 'sup-1',
      price: parseFloat((currentPrice * 0.975).toFixed(2)),
      type: 'support',
      label: 'S1 Support',
      strength: 4,
      touches: 4,
      color: '#089981',
      active: true
    });
    levels.push({
      id: 'sup-2',
      price: parseFloat((currentPrice * 0.945).toFixed(2)),
      type: 'support',
      label: 'S2 Major Demand',
      strength: 5,
      touches: 6,
      color: '#26a69a',
      active: true
    });
  }

  return levels;
}


 // Calculate Simple Moving Average (SMA)
  
export function calculateSMA(candles: Candle[], period: number): { time: string | number; value: number }[] {
  const result: { time: string | number; value: number }[] = [];
  if (candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    result.push({
      time: candles[i].time,
      value: parseFloat((sum / period).toFixed(2))
    });
  }
  return result;
}

 // Calculate Exponential Moving Average (EMA)

export function calculateEMA(candles: Candle[], period: number): { time: string | number; value: number }[] {
  const result: { time: string | number; value: number }[] = [];
  if (candles.length < period) return result;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let ema = sum / period;
  result.push({ time: candles[period - 1].time, value: parseFloat(ema.toFixed(2)) });

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({
      time: candles[i].time,
      value: parseFloat(ema.toFixed(2))
    });
  }
  return result;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(candles: Candle[], period: number = 14): { time: string | number; value: number }[] {
  const result: { time: string | number; value: number }[] = [];
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));

  result.push({ time: candles[period].time, value: parseFloat(rsi.toFixed(2)) });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));

    result.push({
      time: candles[i].time,
      value: parseFloat(rsi.toFixed(2))
    });
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) {
  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const macdLine: { time: string | number; value: number }[] = [];
  const slowMap = new Map(slowEMA.map(item => [item.time, item.value]));

  for (const f of fastEMA) {
    const s = slowMap.get(f.time);
    if (s !== undefined) {
      macdLine.push({
        time: f.time,
        value: parseFloat((f.value - s).toFixed(2))
      });
    }
  }

  // Signal Line (EMA of MACD line)
  const signalLine: { time: string | number; value: number }[] = [];
  const k = 2 / (signalPeriod + 1);
  if (macdLine.length >= signalPeriod) {
    let sum = 0;
    for (let i = 0; i < signalPeriod; i++) {
      sum += macdLine[i].value;
    }
    let sig = sum / signalPeriod;
    signalLine.push({ time: macdLine[signalPeriod - 1].time, value: parseFloat(sig.toFixed(2)) });

    for (let i = signalPeriod; i < macdLine.length; i++) {
      sig = macdLine[i].value * k + sig * (1 - k);
      signalLine.push({ time: macdLine[i].time, value: parseFloat(sig.toFixed(2)) });
    }
  }

  const sigMap = new Map(signalLine.map(s => [s.time, s.value]));
  const histogram: { time: string | number; value: number; color: string }[] = [];

  for (const m of macdLine) {
    const sig = sigMap.get(m.time);
    if (sig !== undefined) {
      const diff = parseFloat((m.value - sig).toFixed(2));
      histogram.push({
        time: m.time,
        value: diff,
        color: diff >= 0 ? '#089981' : '#f23645'
      });
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Bollinger Bands (20 SMA +/- 2 StdDev)
 */
export function calculateBollingerBands(candles: Candle[], period: number = 20, multiplier: number = 2) {
  const upper: { time: string | number; value: number }[] = [];
  const middle: { time: string | number; value: number }[] = [];
  const lower: { time: string | number; value: number }[] = [];

  if (candles.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    const sma = sum / period;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(candles[i - j].close - sma, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    middle.push({ time: candles[i].time, value: parseFloat(sma.toFixed(2)) });
    upper.push({ time: candles[i].time, value: parseFloat((sma + multiplier * stdDev).toFixed(2)) });
    lower.push({ time: candles[i].time, value: parseFloat((sma - multiplier * stdDev).toFixed(2)) });
  }

  return { upper, middle, lower };
}

// Linear Regression Trendline
export function calculateRegressionTrendline(candles: Candle[]): { time: string | number; value: number }[] {
  const n = candles.length;
  if (n < 5) return [];

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += candles[i].close;
    sumXY += i * candles[i].close;
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return candles.map((c, i) => ({
    time: c.time,
    value: parseFloat((slope * i + intercept).toFixed(2))
  }));
}

// Continuous Contract series adjustment
export function generateContinuousCandles(rawCandles: Candle[]): Candle[] {
  if (rawCandles.length < 2) return rawCandles;
  
  const result: Candle[] = [];
  let cumulativeAdjustment = 0;

  for (let i = 0; i < rawCandles.length; i++) {
    const c = rawCandles[i];
    if (i > 0) {
      const prev = rawCandles[i - 1];
      const gap = c.open - prev.close;
      // Rollover contract gap threshold (>0.6%)
      if (Math.abs(gap) > prev.close * 0.006) {
        cumulativeAdjustment += gap * 0.65;
      }
    }

    result.push({
      time: c.time,
      open: parseFloat(Math.max(1, c.open - cumulativeAdjustment).toFixed(2)),
      high: parseFloat(Math.max(1, c.high - cumulativeAdjustment).toFixed(2)),
      low: parseFloat(Math.max(1, c.low - cumulativeAdjustment).toFixed(2)),
      close: parseFloat(Math.max(1, c.close - cumulativeAdjustment).toFixed(2)),
      volume: c.volume
    });
  }

  return result;
}

const BACKEND_API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/stocks` : 'http://localhost:5000/api/stocks';

/**
 * Fetch live stock quote from Yahoo Finance Node.js Backend
 */
export async function fetchLiveQuoteFromBackend(symbol: string): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${BACKEND_API_URL}/quote/${encodeURIComponent(symbol)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const json = await response.json();
    return json.success ? json.data : null;
  } catch (err) {
    // Graceful fallback to local engine if backend offline
    return null;
  }
}

/**
 * Fetch live historical candlestick chart data from Yahoo Finance Node.js Backend
 */
export async function fetchLiveHistoricalDataFromBackend(
  symbol: string,
  timeframe: Timeframe = '1Y',
  granularity?: Granularity
): Promise<Candle[] | null> {
  try {
    const rangeMap: Record<Timeframe, string> = {
      '1D': '1d',
      '5D': '5d',
      '1M': '1mo',
      '3M': '3mo',
      '6M': '6mo',
      '1Y': '1y',
      '5Y': '5y',
      'ALL': 'max'
    };

    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '60m',
      '1D': '1d',
      '1W': '1wk'
    };

    const range = rangeMap[timeframe] || '1mo';
    const interval = granularity ? (intervalMap[granularity] || '1d') : (timeframe === '1D' ? '5m' : timeframe === '5D' ? '15m' : '1d');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${BACKEND_API_URL}/history/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const json = await response.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }
    return null;
  } catch (err) {
    // Graceful fallback
    return null;
  }
}

