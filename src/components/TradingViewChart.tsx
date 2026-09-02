import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries,
  LineStyle,
  ColorType,
  IChartApi
} from 'lightweight-charts';
import { useTrading } from '../services/tradingStore';
import { Loader2 } from 'lucide-react';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateRegressionTrendline
} from '../services/marketDataEngine';

export const TradingViewChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const chartApiRef = useRef<IChartApi | null>(null);
  const rsiChartApiRef = useRef<IChartApi | null>(null);
  const macdChartApiRef = useRef<IChartApi | null>(null);

  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const sma20Ref = useRef<any>(null);
  const sma50Ref = useRef<any>(null);
  const sma200Ref = useRef<any>(null);
  const ema9Ref = useRef<any>(null);
  const bbUpperRef = useRef<any>(null);
  const bbMidRef = useRef<any>(null);
  const bbLowerRef = useRef<any>(null);
  const trendRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  const rsiSeriesRef = useRef<any>(null);
  const macdLineRef = useRef<any>(null);
  const macdSigRef = useRef<any>(null);
  const macdHistRef = useRef<any>(null);
  const fibLinesRef = useRef<any[]>([]);

  const {
    activeStock,
    candles,
    timeframe,
    setTimeframe,
    chartType,
    indicators,
    supportResistanceLevels,
    activeDrawingTool,
    setActiveDrawingTool,
    addManualSRLevel,
    theme,
    marketStatus,
    isLoadingChartData
  } = useTrading();

  const activeDrawingToolRef = useRef<string>(activeDrawingTool);
  useEffect(() => {
    activeDrawingToolRef.current = activeDrawingTool;
  }, [activeDrawingTool]);

  const isLight = theme === 'light';

  const [hoveredOHLC, setHoveredOHLC] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    change: number;
    changePercent: number;
  } | null>(null);

  // 1. Initialize Main Chart Structure (Runs on mount, theme change, chartType, or indicator layout changes)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    container.innerHTML = ''; // Clean previous DOM to avoid duplicates

    const chartBg = isLight ? '#ffffff' : '#131722';
    const chartText = isLight ? '#334155' : '#9ea3af';
    const gridLine = isLight ? 'rgba(226, 232, 240, 0.9)' : 'rgba(42, 46, 57, 0.45)';
    const borderLine = isLight ? '#e2e8f0' : '#2a2e39';
    const crosshair = isLight ? '#94a3b8' : '#758696';
    const crosshairBg = isLight ? '#1e293b' : '#2a2e39';

    try {
      const chart = createChart(container, {
        width: container.clientWidth || 800,
        height: container.clientHeight || 400,
        layout: {
          background: { type: ColorType.Solid, color: chartBg },
          textColor: chartText,
          fontSize: 11,
        },
        grid: {
          vertLines: { color: gridLine },
          horzLines: { color: gridLine },
        },
        crosshair: {
          vertLine: { color: crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: crosshairBg },
          horzLine: { color: crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: crosshairBg },
        },
        rightPriceScale: {
          borderColor: borderLine,
          scaleMargins: { top: 0.08, bottom: 0.08 },
        },
        timeScale: {
          borderColor: borderLine,
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 14,
          minBarSpacing: 4,
          rightOffset: 4,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: false,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      chartApiRef.current = chart;

      // Remove any injected TradingView logo element
      setTimeout(() => {
        container.querySelectorAll('a[href*="tradingview"], #tv-attr-logo, [class*="logo"]').forEach(el => (el as HTMLElement).style.display = 'none');
      }, 20);

      // Add main price series
      let mainSeries: any;
      if (chartType === 'candlestick' || chartType === 'heikin-ashi') {
        mainSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#f23645',
          borderVisible: false,
          wickUpColor: '#089981',
          wickDownColor: '#f23645',
        });
      } else if (chartType === 'line') {
        mainSeries = chart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2 });
      } else if (chartType === 'area') {
        mainSeries = chart.addSeries(AreaSeries, {
          topColor: 'rgba(41, 98, 255, 0.35)',
          bottomColor: 'rgba(41, 98, 255, 0.01)',
          lineColor: '#2962ff',
          lineWidth: 2,
        });
      } else if (chartType === 'bar') {
        mainSeries = chart.addSeries(BarSeries, { upColor: '#089981', downColor: '#f23645' });
      }
      mainSeriesRef.current = mainSeries;

      // Volume Series
      if (indicators.showVolume) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: { type: 'volume' },
          priceScaleId: '',
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeriesRef.current = volumeSeries;
      } else {
        volumeSeriesRef.current = null;
      }

      // SMA 20
      if (indicators.showSMA20) {
        sma20Ref.current = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2, title: 'SMA 20' });
      } else {
        sma20Ref.current = null;
      }

      // SMA 50
      if (indicators.showSMA50) {
        sma50Ref.current = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, title: 'SMA 50' });
      } else {
        sma50Ref.current = null;
      }

      // SMA 200
      if (indicators.showSMA200) {
        sma200Ref.current = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2, title: 'SMA 200' });
      } else {
        sma200Ref.current = null;
      }

      // EMA 9
      if (indicators.showEMA9) {
        ema9Ref.current = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, title: 'EMA 9' });
      } else {
        ema9Ref.current = null;
      }

      // Bollinger Bands
      if (indicators.showBollingerBands) {
        bbUpperRef.current = chart.addSeries(LineSeries, { color: 'rgba(59, 130, 246, 0.6)', lineWidth: 1, lineStyle: LineStyle.Dotted, title: 'BB Upper' });
        bbMidRef.current = chart.addSeries(LineSeries, { color: 'rgba(59, 130, 246, 0.8)', lineWidth: 1, title: 'BB Mid' });
        bbLowerRef.current = chart.addSeries(LineSeries, { color: 'rgba(59, 130, 246, 0.6)', lineWidth: 1, lineStyle: LineStyle.Dotted, title: 'BB Lower' });
      } else {
        bbUpperRef.current = null;
        bbMidRef.current = null;
        bbLowerRef.current = null;
      }

      // Regression Trendline
      if (indicators.showNoiseReduction) {
        trendRef.current = chart.addSeries(LineSeries, { color: '#ec4899', lineWidth: 2, lineStyle: LineStyle.Solid, title: 'Linear Regression Trend' });
      } else {
        trendRef.current = null;
      }

      // Crosshair handler
      chart.subscribeCrosshairMove(param => {
        if (!param || !param.time || !param.seriesData.get(mainSeries)) {
          return;
        }
        const data: any = param.seriesData.get(mainSeries);
        if (data) {
          const open = data.open !== undefined ? data.open : data.value;
          const close = data.close !== undefined ? data.close : data.value;
          const high = data.high !== undefined ? data.high : data.value;
          const low = data.low !== undefined ? data.low : data.value;
          const diff = close - open;
          setHoveredOHLC({
            open,
            high,
            low,
            close,
            volume: data.volume,
            change: parseFloat(diff.toFixed(2)),
            changePercent: parseFloat(((diff / (open || 1)) * 100).toFixed(2)),
          });
        }
      });

      // Interactive Click to Place Custom Level
      chart.subscribeClick(param => {
        if (!param || !param.point || !mainSeriesRef.current) return;
        const clickedPrice = mainSeriesRef.current.coordinateToPrice(param.point.y);
        if (!clickedPrice || isNaN(clickedPrice)) return;

        const tool = activeDrawingToolRef.current;
        if (tool === 'horizontal_line') {
          addManualSRLevel(clickedPrice, 'support', 'Horizontal Ray');
        } else if (tool === 'resistance_line') {
          addManualSRLevel(clickedPrice, 'resistance', 'Manual Resistance');
        } else if (tool === 'support_line') {
          addManualSRLevel(clickedPrice, 'support', 'Manual Support');
        }
      });

      const handleResize = () => {
        if (chartContainerRef.current && chartApiRef.current) {
          chartApiRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && chartApiRef.current) {
            chartApiRef.current.applyOptions({ width, height });
          }
        }
      });
      resizeObserver.observe(container);

      return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
        try {
          chart.remove();
        } catch (e) {
          // ignore cleanup errors
        }
        chartApiRef.current = null;
        container.innerHTML = '';
      };
    } catch (err) {
      console.error('Error initializing main chart:', err);
    }
  }, [theme, timeframe, chartType, indicators.showVolume, indicators.showSMA20, indicators.showSMA50, indicators.showSMA200, indicators.showEMA9, indicators.showBollingerBands, indicators.showNoiseReduction]);

  // 2. Safe Data Feed Effect (Updates data smoothly on price tick without recreating canvas)
  useEffect(() => {
    if (!mainSeriesRef.current || candles.length === 0) return;

    const parseChartTime = (time: string | number) => {
      if (typeof time === 'number') return time as any;
      if (typeof time === 'string' && /^\d+$/.test(time)) return parseInt(time, 10) as any;
      return time as any;
    };

    try {
      // Set main series data
      if (chartType === 'candlestick' || chartType === 'heikin-ashi' || chartType === 'bar') {
        mainSeriesRef.current.setData(
          candles.map(c => ({
            time: parseChartTime(c.time),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
      } else {
        mainSeriesRef.current.setData(candles.map(c => ({ time: parseChartTime(c.time), value: c.close })));
      }

      // Update volume
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(
          candles.map(c => ({
            time: parseChartTime(c.time),
            value: c.volume || 1000,
            color: c.close >= c.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
          }))
        );
      }

      // Update SMA 20
      if (sma20Ref.current && indicators.showSMA20) {
        const sma20 = calculateSMA(candles, 20);
        sma20Ref.current.setData(sma20.map(s => ({ time: parseChartTime(s.time), value: s.value })));
      }

      // Update SMA 50
      if (sma50Ref.current && indicators.showSMA50) {
        const sma50 = calculateSMA(candles, 50);
        sma50Ref.current.setData(sma50.map(s => ({ time: parseChartTime(s.time), value: s.value })));
      }

      // Update SMA 200
      if (sma200Ref.current && indicators.showSMA200) {
        const sma200 = calculateSMA(candles, 200);
        sma200Ref.current.setData(sma200.map(s => ({ time: parseChartTime(s.time), value: s.value })));
      }

      // Update EMA 9
      if (ema9Ref.current && indicators.showEMA9) {
        const ema9 = calculateEMA(candles, 9);
        ema9Ref.current.setData(ema9.map(s => ({ time: parseChartTime(s.time), value: s.value })));
      }

      // Update Bollinger Bands
      if (bbUpperRef.current && indicators.showBollingerBands) {
        const bb = calculateBollingerBands(candles, 20, 2);
        bbUpperRef.current.setData(bb.upper.map(b => ({ time: parseChartTime(b.time), value: b.value })));
        bbMidRef.current?.setData(bb.middle.map(b => ({ time: parseChartTime(b.time), value: b.value })));
        bbLowerRef.current?.setData(bb.lower.map(b => ({ time: parseChartTime(b.time), value: b.value })));
      }

      // Update Regression Trendline
      if (trendRef.current && indicators.showNoiseReduction) {
        const trend = calculateRegressionTrendline(candles);
        trendRef.current.setData(trend.map(t => ({ time: parseChartTime(t.time), value: t.value })));
      }

      // Default last candle display
      const last = candles[candles.length - 1];
      if (last) {
        const diff = last.close - last.open;
        setHoveredOHLC({
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
          volume: last.volume,
          change: parseFloat(diff.toFixed(2)),
          changePercent: parseFloat(((diff / (last.open || 1)) * 100).toFixed(2)),
        });
      }

      // Automatically fit all historical candles into the screen (Zero scroll needed!)
      chartApiRef.current?.timeScale().fitContent();
    } catch (e) {
      console.warn('Error updating chart series data:', e);
    }
  }, [candles, chartType, indicators]);

  // 3. Support & Resistance Price Lines Effect
  useEffect(() => {
    if (!mainSeriesRef.current) return;

    try {
      // Remove old price lines
      priceLinesRef.current.forEach(line => {
        try {
          mainSeriesRef.current.removePriceLine(line);
        } catch (e) {}
      });
      priceLinesRef.current = [];

      // Create new lines if enabled
      if (indicators.showSupportResistance) {
        supportResistanceLevels.forEach(level => {
          if (level.active) {
            const cleanTitle = level.label.toLowerCase().includes('custom')
              ? (level.type === 'resistance' ? 'R (Custom)' : 'S (Custom)')
              : level.label.toUpperCase();

            const line = mainSeriesRef.current.createPriceLine({
              price: level.price,
              color: level.color,
              lineWidth: level.strength >= 4 ? 2 : 1,
              lineStyle: LineStyle.Solid,
              axisLabelVisible: true,
              title: cleanTitle,
            });
            priceLinesRef.current.push(line);
          }
        });
      }
    } catch (e) {
      console.warn('Error updating SR price lines:', e);
    }
  }, [supportResistanceLevels, indicators.showSupportResistance]);

  // 3.5 Fibonacci Retracement Effect
  useEffect(() => {
    if (!mainSeriesRef.current) return;

    fibLinesRef.current.forEach(line => {
      try { mainSeriesRef.current.removePriceLine(line); } catch (e) {}
    });
    fibLinesRef.current = [];

    if (indicators.showFibonacci && candles.length > 5) {
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      const high = Math.max(...highs);
      const low = Math.min(...lows);
      const diff = high - low;

      if (diff > 0) {
        const fibRatios = [
          { ratio: 1.0, label: 'Fib 100% (High)', color: '#818cf8' },
          { ratio: 0.786, label: 'Fib 78.6%', color: '#a78bfa' },
          { ratio: 0.618, label: 'Fib 61.8% (Golden)', color: '#fbbf24' },
          { ratio: 0.500, label: 'Fib 50.0% (Equilibrium)', color: '#38bdf8' },
          { ratio: 0.382, label: 'Fib 38.2%', color: '#34d399' },
          { ratio: 0.236, label: 'Fib 23.6%', color: '#4ade80' },
          { ratio: 0.0, label: 'Fib 0.0% (Low)', color: '#94a3b8' }
        ];

        fibRatios.forEach(fib => {
          const price = low + diff * fib.ratio;
          const line = mainSeriesRef.current.createPriceLine({
            price: parseFloat(price.toFixed(2)),
            color: fib.color,
            lineWidth: fib.ratio === 0.618 || fib.ratio === 0.5 ? 2 : 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: fib.label
          });
          fibLinesRef.current.push(line);
        });
      }
    }
  }, [indicators.showFibonacci, candles]);

  // 4. RSI Subplot Chart Lifecycle
  useEffect(() => {
    if (!indicators.showRSI || !rsiContainerRef.current) {
      if (rsiChartApiRef.current) {
        try { rsiChartApiRef.current.remove(); } catch(e) {}
        rsiChartApiRef.current = null;
      }
      return;
    }

    const container = rsiContainerRef.current;
    container.innerHTML = '';

    const chartBg = isLight ? '#ffffff' : '#131722';
    const chartText = isLight ? '#334155' : '#9ea3af';
    const gridLine = isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(42, 46, 57, 0.3)';
    const borderLine = isLight ? '#e2e8f0' : '#2a2e39';

    try {
      const rsiChart = createChart(container, {
        width: container.clientWidth || 800,
        height: container.clientHeight || 120,
        layout: {
          background: { type: ColorType.Solid, color: chartBg },
          textColor: chartText,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: gridLine },
          horzLines: { color: gridLine },
        },
        rightPriceScale: { borderColor: borderLine, scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: borderLine, visible: false },
      });

      rsiChartApiRef.current = rsiChart;

      const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2, title: 'RSI (14)' });
      rsiSeriesRef.current = rsiSeries;

      rsiSeries.createPriceLine({ price: 70, color: '#f23645', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OB 70' });
      rsiSeries.createPriceLine({ price: 30, color: '#089981', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'OS 30' });
      rsiSeries.createPriceLine({ price: 50, color: isLight ? '#94a3b8' : '#4b5563', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false });

      if (candles.length > 14) {
        const rsiData = calculateRSI(candles, 14);
        rsiSeries.setData(rsiData.map(r => ({ time: r.time as any, value: r.value })));
      }

      return () => {
        try { rsiChart.remove(); } catch(e) {}
        rsiChartApiRef.current = null;
        container.innerHTML = '';
      };
    } catch(e) {
      console.warn('RSI chart error:', e);
    }
  }, [theme, indicators.showRSI]);

  // Update RSI Data
  useEffect(() => {
    if (rsiSeriesRef.current && indicators.showRSI && candles.length > 14) {
      try {
        const rsiData = calculateRSI(candles, 14);
        rsiSeriesRef.current.setData(rsiData.map(r => ({ time: r.time as any, value: r.value })));
      } catch (e) {}
    }
  }, [candles, indicators.showRSI]);

  // 5. MACD Subplot Chart Lifecycle
  useEffect(() => {
    if (!indicators.showMACD || !macdContainerRef.current) {
      if (macdChartApiRef.current) {
        try { macdChartApiRef.current.remove(); } catch(e) {}
        macdChartApiRef.current = null;
      }
      return;
    }

    const container = macdContainerRef.current;
    container.innerHTML = '';

    const chartBg = isLight ? '#ffffff' : '#131722';
    const chartText = isLight ? '#334155' : '#9ea3af';
    const gridLine = isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(42, 46, 57, 0.3)';
    const borderLine = isLight ? '#e2e8f0' : '#2a2e39';

    try {
      const macdChart = createChart(container, {
        width: container.clientWidth || 800,
        height: container.clientHeight || 120,
        layout: {
          background: { type: ColorType.Solid, color: chartBg },
          textColor: chartText,
          fontSize: 10,
        },
        grid: {
          vertLines: { color: gridLine },
          horzLines: { color: gridLine },
        },
        rightPriceScale: { borderColor: borderLine },
        timeScale: { borderColor: borderLine, visible: false },
      });

      macdChartApiRef.current = macdChart;

      macdHistRef.current = macdChart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' } });
      macdLineRef.current = macdChart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, title: 'MACD' });
      macdSigRef.current = macdChart.addSeries(LineSeries, { color: '#f97316', lineWidth: 2, title: 'Signal' });

      if (candles.length > 26) {
        const { macdLine, signalLine, histogram } = calculateMACD(candles);
        macdHistRef.current.setData(histogram.map(h => ({ time: h.time as any, value: h.value, color: h.color })));
        macdLineRef.current.setData(macdLine.map(m => ({ time: m.time as any, value: m.value })));
        macdSigRef.current.setData(signalLine.map(s => ({ time: s.time as any, value: s.value })));
      }

      return () => {
        try { macdChart.remove(); } catch(e) {}
        macdChartApiRef.current = null;
        container.innerHTML = '';
      };
    } catch(e) {
      console.warn('MACD chart error:', e);
    }
  }, [theme, indicators.showMACD]);

  // Update MACD Data
  useEffect(() => {
    if (macdLineRef.current && indicators.showMACD && candles.length > 26) {
      try {
        const { macdLine, signalLine, histogram } = calculateMACD(candles);
        macdHistRef.current?.setData(histogram.map(h => ({ time: h.time as any, value: h.value, color: h.color })));
        macdLineRef.current?.setData(macdLine.map(m => ({ time: m.time as any, value: m.value })));
        macdSigRef.current?.setData(signalLine.map(s => ({ time: s.time as any, value: s.value })));
      } catch (e) {}
    }
  }, [candles, indicators.showMACD]);

  return (
    <div className={`flex-1 min-h-0 flex flex-col relative h-full w-full ${isLight ? 'bg-white' : 'bg-[#131722]'} overflow-hidden`}>
      
      {/* Top Floating TradingView-style Inline Legend */}
      <div className={`absolute top-2 left-3 z-20 flex items-center gap-2 pointer-events-none select-none ${
        isLight
          ? 'bg-white/95 border-slate-200/90 text-slate-800 shadow-sm'
          : 'bg-[#131722]/95 border-[#2a2e39] text-gray-200 shadow-md'
      } border backdrop-blur-md px-3 py-1.5 rounded-lg max-w-[calc(100%-24px)] flex-wrap text-xs`}>
        {/* Symbol & Exchange Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${marketStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border shrink-0 ${
            marketStatus.isOpen 
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}>
            {marketStatus.label}
          </span>
          <span className="font-extrabold tracking-wide font-mono px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[11px] border border-blue-500/20">
            {activeStock.symbol}
          </span>
          <span className="font-bold text-xs truncate max-w-[130px] md:max-w-none">
            {activeStock.name}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">({activeStock.exchange})</span>
        </div>

        <div className={`h-3 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-[#2a2e39]'} shrink-0 hidden sm:block`} />

        {/* Live OHLC Data Chips */}
        {hoveredOHLC && (
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] shrink-0 flex-wrap">
            <span className="text-gray-400 hidden sm:inline">
              O <strong className={isLight ? 'text-slate-900' : 'text-white'}>{hoveredOHLC.open.toFixed(2)}</strong>
            </span>
            <span className="text-gray-400 hidden sm:inline">
              H <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{hoveredOHLC.high.toFixed(2)}</strong>
            </span>
            <span className="text-gray-400 hidden sm:inline">
              L <strong className="text-rose-600 dark:text-rose-400 font-bold">{hoveredOHLC.low.toFixed(2)}</strong>
            </span>
            <span className="text-gray-400">
              <span className="hidden sm:inline">C </span><strong className={isLight ? 'text-slate-900' : 'text-white'}>{activeStock.currency}{hoveredOHLC.close.toFixed(2)}</strong>
            </span>
            <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] sm:text-[10px] ${
              hoveredOHLC.change >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              {hoveredOHLC.change >= 0 ? '+' : ''}{hoveredOHLC.change.toFixed(2)} ({hoveredOHLC.changePercent.toFixed(2)}%)
            </span>
            {indicators.showVolume && typeof hoveredOHLC.volume === 'number' && hoveredOHLC.volume > 0 && (
              <span className="text-gray-400 hidden lg:inline">
                Vol <strong className={isLight ? 'text-slate-700' : 'text-gray-300'}>
                  {hoveredOHLC.volume > 1000000
                    ? `${(hoveredOHLC.volume / 1000000).toFixed(2)}M`
                    : hoveredOHLC.volume > 1000
                    ? `${(hoveredOHLC.volume / 1000).toFixed(2)}K`
                    : hoveredOHLC.volume.toLocaleString()}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Active Measurement Ruler HUD */}
      {activeDrawingTool === 'measure' && candles.length > 0 && (() => {
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const high = Math.max(...highs);
        const low = Math.min(...lows);
        const diff = high - low;
        const pct = low > 0 ? (diff / low) * 100 : 0;
        return (
          <div className="absolute top-14 left-3 z-20 flex items-center gap-2.5 bg-blue-600 text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg border border-blue-400/40 backdrop-blur-xs select-none">
            <span className="font-bold">📏 RULER ACTIVE:</span>
            <span>Range: <strong>{activeStock.currency}{low.toFixed(2)}</strong> → <strong>{activeStock.currency}{high.toFixed(2)}</strong></span>
            <span className="text-emerald-300 font-bold">Spread: +{activeStock.currency}{diff.toFixed(2)} (+{pct.toFixed(2)}%)</span>
            <span className="text-blue-200">({candles.length} bars)</span>
          </div>
        );
      })()}

      {/* Interactive Click Tip */}
      {(activeDrawingTool === 'horizontal_line' || activeDrawingTool === 'resistance_line' || activeDrawingTool === 'support_line') && (
        <div className="absolute top-14 left-3 z-20 flex items-center gap-2 bg-slate-900/90 text-white text-xs font-mono px-3 py-1 rounded-lg shadow-md border border-slate-700/80 select-none">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>Click anywhere on chart to place {activeDrawingTool === 'horizontal_line' ? 'Horizontal Ray' : activeDrawingTool === 'resistance_line' ? 'Resistance' : 'Support'}</span>
        </div>
      )}

      {/* Real-time Live API Data Loading Overlay */}
      {isLoadingChartData && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[1px] pointer-events-none transition-opacity">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${
            isLight ? 'bg-white/95 text-slate-800 border-slate-200' : 'bg-[#181c27]/95 text-white border-[#2a2e39]'
          } border shadow-2xl text-xs font-semibold select-none`}>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
            <span>Fetching Live Market API Data ({activeStock.symbol})...</span>
          </div>
        </div>
      )}

      {/* Primary Candle/Line Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full flex-1 min-h-0 relative cursor-crosshair"
      />

      {/* RSI Subplot Chart */}
      {indicators.showRSI && (
        <div className={`h-[110px] w-full border-t ${isLight ? 'border-slate-200 bg-white' : 'border-[#2a2e39] bg-[#131722]'} relative`}>
          <div className={`absolute top-1 left-3 z-10 text-[10px] font-bold ${isLight ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-purple-400 bg-[#1e222d]/80 border-[#2a2e39]'} px-2 py-0.5 rounded border`}>
            RSI (14) — Momentum
          </div>
          <div ref={rsiContainerRef} className="w-full h-full" />
        </div>
      )}

      {/* MACD Subplot Chart */}
      {indicators.showMACD && (
        <div className={`h-[120px] w-full border-t ${isLight ? 'border-slate-200 bg-white' : 'border-[#2a2e39] bg-[#131722]'} relative`}>
          <div className={`absolute top-1 left-3 z-10 text-[10px] font-bold ${isLight ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-blue-400 bg-[#1e222d]/80 border-[#2a2e39]'} px-2 py-0.5 rounded border`}>
            MACD (12, 26, 9) — Trend Oscillator
          </div>
          <div ref={macdContainerRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};
