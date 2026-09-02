// Helper to map symbol aliases to Yahoo Finance standard symbols
const getYahooSymbol = (symbol) => {
  if (!symbol) return '^NSEI';
  const clean = decodeURIComponent(symbol).toUpperCase().trim();

  // Known Index mappings
  if (clean === 'SENSEX' || clean === 'BSE:SENSEX' || clean === 'BSESN') return '^BSESN';
  if (clean === 'NIFTY50' || clean === 'NSE:NIFTY50' || clean === 'NIFTY') return '^NSEI';
  if (clean === 'BANKNIFTY' || clean === 'NSE:BANKNIFTY') return '^NSEBANK';
  if (clean === 'NIFTYIT' || clean === 'NSE:NIFTYIT') return '^CNXIT';

  // Commodities & Forex mappings
  if (clean === 'GOLD') return 'GC=F';
  if (clean === 'CRUDEOIL' || clean === 'CRUDE') return 'CL=F';
  if (clean === 'USDINR' || clean === 'USD/INR') return 'INR=X';

  // Crypto mappings
  if (clean === 'BTC' || clean === 'BITCOIN') return 'BTC-USD';
  if (clean === 'ETH' || clean === 'ETHEREUM') return 'ETH-USD';

  // US Tech stocks
  const usStocks = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'];
  if (usStocks.includes(clean)) return clean;

  // Clean exchange prefixes
  if (clean.startsWith('NSE:')) {
    return `${clean.replace('NSE:', '')}.NS`;
  }
  if (clean.startsWith('BSE:')) {
    return `${clean.replace('BSE:', '')}.BO`;
  }

  // If already contains suffix
  if (clean.endsWith('.NS') || clean.endsWith('.BO') || clean.includes('=')) {
    return clean;
  }

  // Default Indian NSE stock mapping
  return `${clean}.NS`;
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/*
  GET CURRENT QUOTE
  GET /api/stocks/quote/:symbol
*/
export const getQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const ySymbol = getYahooSymbol(symbol);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?range=1d&interval=1d`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Yahoo Finance API error for '${symbol}' (${response.statusText})`
      });
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result || !result.meta) {
      return res.status(404).json({
        success: false,
        message: `Stock '${symbol}' not found`
      });
    }

    const meta = result.meta;
    const quoteData = result.indicators?.quote?.[0] || {};

    const price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
    const prevClose = meta.chartPreviousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose ? ((change / prevClose) * 100) : 0;

    const latestIdx = (quoteData.close && quoteData.close.length > 0) ? quoteData.close.length - 1 : 0;
    const open = quoteData.open?.[latestIdx] || meta.regularMarketPrice || price;
    const high = meta.regularMarketDayHigh || quoteData.high?.[latestIdx] || price;
    const low = meta.regularMarketDayLow || quoteData.low?.[latestIdx] || price;
    const volume = meta.regularMarketVolume || quoteData.volume?.[latestIdx] || 0;

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        yahooSymbol: meta.symbol || ySymbol,
        name: meta.longName || meta.shortName || symbol,
        exchange: meta.exchangeName || 'NSE',
        price: parseFloat(price.toFixed(2)),
        previousClose: parseFloat(prevClose.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        volume,
        marketCap: 'N/A',
        peRatio: 0,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ? parseFloat(meta.fiftyTwoWeekHigh.toFixed(2)) : price * 1.2,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow ? parseFloat(meta.fiftyTwoWeekLow.toFixed(2)) : price * 0.8,
        currency: meta.currency === 'USD' ? '$' : '₹',
        marketState: 'REGULAR'
      }
    });
  } catch (error) {
    console.error(`Error in getQuote for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch stock data',
      error: error.message
    });
  }
};

/*
  GET HISTORICAL CANDLESTICK DATA
  GET /api/stocks/history/:symbol?range=1mo&interval=1d
*/
export const getHistoricalData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const {
      range = '1mo',
      interval = '1d'
    } = req.query;

    const ySymbol = getYahooSymbol(symbol);

    // Map range to Yahoo Finance standard ranges
    const validRanges = {
      '1d': '1d',
      '1D': '1d',
      '5d': '5d',
      '5D': '5d',
      '1m': '1mo',
      '1M': '1mo',
      '1mo': '1mo',
      '3m': '3mo',
      '3M': '3mo',
      '3mo': '3mo',
      '6m': '6mo',
      '6M': '6mo',
      '6mo': '6mo',
      '1y': '1y',
      '1Y': '1y',
      '5y': '5y',
      '5Y': '5y',
      'all': 'max',
      'ALL': 'max',
      'max': 'max'
    };
    const yahooRange = validRanges[range] || '1mo';

    // Map interval to Yahoo Finance standard intervals
    let effectiveInterval = interval;
    if (!req.query.interval) {
      if (yahooRange === '1d') effectiveInterval = '1m';
      else if (yahooRange === '5d') effectiveInterval = '5m';
      else if (yahooRange === '1mo') effectiveInterval = '60m';
      else effectiveInterval = '1d';
    }

    const validIntervals = {
      '1m': '1m',
      '2m': '2m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '60m': '60m',
      '1h': '60m',
      '1d': '1d',
      '1wk': '1wk',
      '1mo': '1mo'
    };
    const yahooInterval = validIntervals[effectiveInterval] || '1d';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?range=${yahooRange}&interval=${yahooInterval}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Yahoo Finance API error (${response.statusText})`
      });
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result || !result.timestamp || result.timestamp.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No historical chart data returned'
      });
    }

    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0] || {};
    const isIntraday = ['1m', '2m', '5m', '15m', '30m', '60m', '1h'].includes(yahooInterval);

    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quotes.open?.[i];
      const high = quotes.high?.[i];
      const low = quotes.low?.[i];
      const close = quotes.close?.[i];
      const volume = quotes.volume?.[i] || 0;

      if (open != null && high != null && low != null && close != null && !isNaN(open) && !isNaN(close)) {
        const timeVal = isIntraday
          ? timestamps[i]
          : new Date(timestamps[i] * 1000).toISOString().split('T')[0];

        candles.push({
          time: timeVal,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: volume || 0
        });
      }
    }

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      yahooSymbol: ySymbol,
      range: yahooRange,
      interval: yahooInterval,
      count: candles.length,
      data: candles
    });
  } catch (error) {
    console.error(`Error in getHistoricalData for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch historical chart data',
      error: error.message
    });
  }
};

/*
  SEARCH STOCKS
  GET /api/stocks/search?q=reliance
*/
export const searchStocks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      return res.json({ success: true, data: [] });
    }

    const json = await response.json();
    const stocks = (json.quotes || []).map(item => ({
      symbol: item.symbol,
      name: item.longname || item.shortname || item.symbol,
      exchange: item.exchange || 'NSE',
      type: item.quoteType || 'EQUITY'
    }));

    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error(`Error in searchStocks for ${req.query.q}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};
