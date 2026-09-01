import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Helper to map symbol aliases to Yahoo Finance standard symbols
const getYahooSymbol = (symbol) => {
  const clean = symbol.toUpperCase().trim();

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

  // If already contains suffix
  if (clean.endsWith('.NS') || clean.endsWith('.BO') || clean.includes('=')) {
    return clean;
  }

  // Default Indian NSE stock mapping
  return `${clean}.NS`;
};

// Calculate period start date based on range
const getPeriodStart = (range) => {
  const now = new Date();

  switch (range) {
    case '1d':
    case '1D':
      return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    case '5d':
    case '5D':
      return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    case '1mo':
    case '1M':
      return new Date(now.setMonth(now.getMonth() - 1));
    case '3mo':
    case '3M':
      return new Date(now.setMonth(now.getMonth() - 3));
    case '6mo':
    case '6M':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1y':
    case '1Y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case '5y':
    case '5Y':
      return new Date(now.setFullYear(now.getFullYear() - 5));
    case 'all':
    case 'ALL':
    case 'max':
      return new Date('2000-01-01');
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
};

/*
  GET CURRENT QUOTE
  GET /api/stocks/quote/:symbol
*/
export const getQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const ySymbol = getYahooSymbol(symbol);

    const quote = await yahooFinance.quote(ySymbol);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: `Stock '${symbol}' not found on Yahoo Finance`
      });
    }

    const price = quote.regularMarketPrice || quote.bid || quote.ask || 0;
    const prevClose = quote.regularMarketPreviousClose || price;
    const change = quote.regularMarketChange ?? (price - prevClose);
    const changePercent = quote.regularMarketChangePercent ?? (prevClose ? ((change / prevClose) * 100) : 0);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        yahooSymbol: quote.symbol,
        name: quote.longName || quote.shortName || symbol,
        exchange: quote.exchange || 'NSE',
        price,
        previousClose: prevClose,
        change,
        changePercent,
        open: quote.regularMarketOpen || price,
        high: quote.regularMarketDayHigh || price,
        low: quote.regularMarketDayLow || price,
        marketCap: quote.marketCap ? (
          (quote.currency === 'USD' || !ySymbol.endsWith('.NS'))
            ? `$${(quote.marketCap / 1e12).toFixed(1)}T`
            : (quote.marketCap >= 1e12 ? `₹${(quote.marketCap / 1e12).toFixed(1)}T` : `₹${(quote.marketCap / 1e7).toFixed(1)} Cr`)
        ) : 'N/A',
        peRatio: quote.trailingPE || quote.forwardPE || 0,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || price * 1.2,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || price * 0.8,
        currency: quote.currency === 'USD' || !ySymbol.endsWith('.NS') ? '$' : '₹',
        marketState: quote.marketState || 'REGULAR'
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
    const startDate = getPeriodStart(range);

    // Determine appropriate interval if not explicitly provided
    let effectiveInterval = interval;
    if (!req.query.interval) {
      if (range.toLowerCase() === '1d') effectiveInterval = '1m';
      else if (range.toLowerCase() === '5d') effectiveInterval = '5m';
      else if (range.toLowerCase() === '1mo' || range.toLowerCase() === '1m') effectiveInterval = '60m';
      else effectiveInterval = '1d';
    }

    // Map interval to valid yahoo interval
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

    // Fetch chart data from Yahoo Finance
    const chartResult = await yahooFinance.chart(ySymbol, {
      period1: startDate,
      interval: yahooInterval
    });

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No historical chart data returned'
      });
    }

    const isIntraday = ['1m', '5m', '15m', '30m', '60m', '1h'].includes(effectiveInterval);

    // Format into Lightweight Charts OHLC candle objects
    const candles = chartResult.quotes
      .filter(item => item.open !== null && item.close !== null && !isNaN(item.open) && !isNaN(item.close))
      .map(item => {
        const d = new Date(item.date);
        // For intraday, Lightweight Charts requires UNIX timestamp in seconds
        const timeVal = isIntraday ? Math.floor(d.getTime() / 1000) : d.toISOString().split('T')[0];

        return {
          time: timeVal,
          open: parseFloat(item.open.toFixed(2)),
          high: parseFloat(item.high.toFixed(2)),
          low: parseFloat(item.low.toFixed(2)),
          close: parseFloat(item.close.toFixed(2)),
          volume: item.volume || 0
        };
      });

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      yahooSymbol: ySymbol,
      range,
      interval,
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

    const result = await yahooFinance.search(q);

    const stocks = (result.quotes || [])
      .map(item => ({
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
