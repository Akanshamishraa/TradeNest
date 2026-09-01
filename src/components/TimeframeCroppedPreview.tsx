import React, { useEffect, useRef, useState } from 'react';
import { useTrading } from '../services/tradingStore';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  LineStyle,
  ColorType,
  IChartApi
} from 'lightweight-charts';
import {
  X,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Shield,
  Activity,
  Layers,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { calculateSMA, calculateRegressionTrendline } from '../services/marketDataEngine';
import { ChartType } from '../types/stock';

export const TimeframeCroppedPreview: React.FC = () => {
  const {
    croppedTimeframePreview,
    setCroppedTimeframePreview,
    activeStock,
    theme,
    supportResistanceLevels
  } = useTrading();

  const isLight = theme === 'light';
  const modalChartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const smaSeriesRef = useRef<any>(null);

  const [modalChartType, setModalChartType] = useState<ChartType>('candlestick');
  const [hoveredOHLC, setHoveredOHLC] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
  } | null>(null);

  const candles = croppedTimeframePreview?.candles || [];

  // Metrics calculation
  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];
  const returnAmt = firstCandle && lastCandle ? lastCandle.close - firstCandle.open : 0;
  const returnPct = firstCandle && firstCandle.open ? (returnAmt / firstCandle.open) * 100 : 0;
  const highest = candles.length > 0 ? Math.max(...candles.map(c => c.high)) : 0;
  const lowest = candles.length > 0 ? Math.min(...candles.map(c => c.low)) : 0;
  const totalVol = candles.reduce((s, c) => s + (c.volume || 0), 0);

  // Initialize and update the Lightweight Chart in the modal
  useEffect(() => {
    if (!croppedTimeframePreview?.active || !modalChartContainerRef.current || candles.length === 0) {
      return;
    }

    const parseChartTime = (time: string | number) => {
      if (typeof time === 'number') return time as any;
      if (typeof time === 'string' && /^\d+$/.test(time)) return parseInt(time, 10) as any;
      return time as any;
    };

    try {
      const container = modalChartContainerRef.current;
      container.innerHTML = '';

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: isLight ? '#ffffff' : '#131722' },
          textColor: isLight ? '#334155' : '#d1d4dc',
          fontFamily: "'Inter', sans-serif",
          fontSize: 11
        },
        grid: {
          vertLines: { color: isLight ? '#f1f5f9' : '#1e222d' },
          horzLines: { color: isLight ? '#f1f5f9' : '#1e222d' }
        },
        crosshair: {
          mode: 1,
          vertLine: { color: isLight ? '#94a3b8' : '#758696', style: LineStyle.Dashed },
          horzLine: { color: isLight ? '#94a3b8' : '#758696', style: LineStyle.Dashed }
        },
        rightPriceScale: {
          borderColor: isLight ? '#e2e8f0' : '#2a2e39',
          scaleMargins: { top: 0.1, bottom: 0.2 }
        },
        timeScale: {
          borderColor: isLight ? '#e2e8f0' : '#2a2e39',
          timeVisible: true,
          secondsVisible: false
        }
      });

      chartApiRef.current = chart;

      // Remove any injected TradingView logo element
      setTimeout(() => {
        container.querySelectorAll('a[href*="tradingview"], #tv-attr-logo, [class*="logo"]').forEach(el => (el as HTMLElement).style.display = 'none');
      }, 20);

      // 1. Add Main Series (Candlestick / Line / Area)
      let mainSeries: any;
      if (modalChartType === 'candlestick') {
        mainSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#f23645',
          borderVisible: false,
          wickUpColor: '#089981',
          wickDownColor: '#f23645'
        });
        mainSeries.setData(
          candles.map(c => ({
            time: parseChartTime(c.time),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          }))
        );
      } else if (modalChartType === 'area') {
        mainSeries = chart.addSeries(AreaSeries, {
          topColor: isLight ? 'rgba(37, 99, 235, 0.35)' : 'rgba(41, 98, 255, 0.4)',
          bottomColor: isLight ? 'rgba(37, 99, 235, 0.02)' : 'rgba(41, 98, 255, 0.0)',
          lineColor: '#2563eb',
          lineWidth: 2
        });
        mainSeries.setData(candles.map(c => ({ time: parseChartTime(c.time), value: c.close })));
      } else {
        mainSeries = chart.addSeries(LineSeries, {
          color: '#2563eb',
          lineWidth: 2
        });
        mainSeries.setData(candles.map(c => ({ time: parseChartTime(c.time), value: c.close })));
      }
      mainSeriesRef.current = mainSeries;

      // 2. Add Volume Histogram
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume_scale'
      });
      chart.priceScale('volume_scale').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0.0 }
      });
      volumeSeries.setData(
        candles.map(c => ({
          time: parseChartTime(c.time),
          value: c.volume || 1000,
          color: c.close >= c.open ? (isLight ? 'rgba(8, 153, 129, 0.35)' : 'rgba(8, 153, 129, 0.45)') : (isLight ? 'rgba(242, 54, 69, 0.35)' : 'rgba(242, 54, 69, 0.45)')
        }))
      );
      volumeSeriesRef.current = volumeSeries;

      // 3. Add SMA 20 Trendline
      const smaData = calculateSMA(candles, 20);
      if (smaData.length > 0) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          title: 'SMA 20'
        });
        smaSeries.setData(smaData.map(s => ({ time: parseChartTime(s.time), value: s.value })));
        smaSeriesRef.current = smaSeries;
      }

    // 4. Add Dynamic Support (Green) & Resistance (Red) price lines
    supportResistanceLevels.filter(lvl => lvl.active).forEach(lvl => {
      const isRes = lvl.type === 'resistance';
      mainSeries.createPriceLine({
        price: lvl.price,
        color: isRes ? '#f23645' : '#089981',
        lineWidth: lvl.strength >= 3 ? 2 : 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: lvl.label.includes('Resistance') || lvl.label.includes('Support')
          ? lvl.label
          : `${lvl.label} (${isRes ? 'Resistance' : 'Support'})`
      });
    });

    // 5. Crosshair move tooltip listener
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredOHLC(null);
        return;
      }
      const data: any = param.seriesData.get(mainSeries);
      if (data) {
        const o = data.open ?? data.value;
        const h = data.high ?? data.value;
        const l = data.low ?? data.value;
        const c = data.close ?? data.value;
        const chg = c - o;
        const pct = o ? (chg / o) * 100 : 0;
        setHoveredOHLC({
          open: o,
          high: h,
          low: l,
          close: c,
          change: chg,
          changePercent: pct
        });
      }
    });

    // Set well-proportioned candle spacing (never over-stretched)
    if (candles.length > 30) {
      chart.timeScale().fitContent();
    } else {
      chart.timeScale().applyOptions({
        barSpacing: 18,
        minBarSpacing: 6,
        rightOffset: 8
      });
    }

    // Resize observer for responsive modal resizing
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0 && chartApiRef.current) {
        const { width, height } = entries[0].contentRect;
        chartApiRef.current.applyOptions({ width, height });
      }
    });
      return () => {
        resizeObserver.disconnect();
        try {
          chart.remove();
        } catch (e) {}
        chartApiRef.current = null;
      };
    } catch (e) {
      console.error('Error initializing modal chart:', e);
    }
  }, [croppedTimeframePreview?.active, modalChartType, isLight, candles]);

  if (!croppedTimeframePreview || !croppedTimeframePreview.active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className={`${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]'} border rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95`}>
        
        {/* Modal Header */}
        <div className={`p-3.5 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#2a2e39] bg-[#1a1e28]'} flex items-center justify-between flex-wrap gap-2`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
              <Maximize2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activeStock.symbol} — Detailed Timeframe Analysis
                </h2>
                <span className="text-[11px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                  {croppedTimeframePreview.label}
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                {activeStock.name} • {candles.length} Candles in this timeframe period
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Style switcher inside modal */}
            <div className={`flex items-center ${isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-[#131722] border-[#2a2e39]'} p-0.5 rounded-lg border text-xs font-semibold`}>
              <button
                onClick={() => setModalChartType('candlestick')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  modalChartType === 'candlestick' ? 'bg-blue-600 text-white shadow-xs' : (isLight ? 'text-slate-600' : 'text-gray-400')
                }`}
              >
                Candles
              </button>
              <button
                onClick={() => setModalChartType('line')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  modalChartType === 'line' ? 'bg-blue-600 text-white shadow-xs' : (isLight ? 'text-slate-600' : 'text-gray-400')
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setModalChartType('area')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  modalChartType === 'area' ? 'bg-blue-600 text-white shadow-xs' : (isLight ? 'text-slate-600' : 'text-gray-400')
                }`}
              >
                Area
              </button>
            </div>

            <button
              onClick={() => setCroppedTimeframePreview(null)}
              className={`p-1.5 rounded-lg ${isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-900' : 'hover:bg-[#2a2e39] text-gray-400 hover:text-white'} transition cursor-pointer`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 ${isLight ? 'bg-slate-50 border-b border-slate-200' : 'bg-[#131722] border-b border-[#2a2e39]'} text-xs`}>
          <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-[#1e222d] border-[#2a2e39]'} p-2.5 rounded-lg border flex items-center justify-between`}>
            <div>
              <span className={`${isLight ? 'text-slate-500' : 'text-gray-400'} block text-[10px]`}>Timeframe Return</span>
              <span className={`font-mono font-bold text-xs flex items-center gap-1 ${
                returnAmt >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')
              }`}>
                {returnAmt >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {returnAmt >= 0 ? '+' : ''}{returnAmt.toFixed(2)} ({returnPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-[#1e222d] border-[#2a2e39]'} p-2.5 rounded-lg border`}>
            <span className={`${isLight ? 'text-slate-500' : 'text-gray-400'} block text-[10px]`}>Timeframe High (Peak)</span>
            <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'} text-xs`}>
              {activeStock.currency} {highest.toLocaleString()}
            </span>
          </div>

          <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-[#1e222d] border-[#2a2e39]'} p-2.5 rounded-lg border`}>
            <span className={`${isLight ? 'text-slate-500' : 'text-gray-400'} block text-[10px]`}>Timeframe Low (Trough)</span>
            <span className={`font-mono font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'} text-xs`}>
              {activeStock.currency} {lowest.toLocaleString()}
            </span>
          </div>

          <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-[#1e222d] border-[#2a2e39]'} p-2.5 rounded-lg border`}>
            <span className={`${isLight ? 'text-slate-500' : 'text-gray-400'} block text-[10px]`}>Total Volume</span>
            <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'} text-xs`}>
              {totalVol.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Floating OHLC Tooltip */}
        <div className={`px-4 py-1.5 ${isLight ? 'bg-slate-100/90 border-b border-slate-200 text-slate-800' : 'bg-[#181c27] border-b border-[#2a2e39] text-gray-200'} text-xs flex items-center justify-between font-mono`}>
          <div className="flex items-center gap-3">
            {hoveredOHLC ? (
              <>
                <span>O: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{hoveredOHLC.open.toFixed(2)}</strong></span>
                <span>H: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{hoveredOHLC.high.toFixed(2)}</strong></span>
                <span>L: <strong className={isLight ? 'text-rose-700' : 'text-rose-400'}>{hoveredOHLC.low.toFixed(2)}</strong></span>
                <span>C: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{hoveredOHLC.close.toFixed(2)}</strong></span>
                <span className={`font-bold ${hoveredOHLC.change >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
                  {hoveredOHLC.change >= 0 ? '+' : ''}{hoveredOHLC.change.toFixed(2)} ({hoveredOHLC.changePercent.toFixed(2)}%)
                </span>
              </>
            ) : (
              <span className={`${isLight ? 'text-slate-500' : 'text-gray-400'} text-[11px]`}>Hover over chart to view exact candlestick values</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f23645]"></span> Resistance</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#089981]"></span> Support</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> SMA 20</span>
          </div>
        </div>

        {/* Interactive Chart Canvas Container */}
        <div className="flex-1 w-full relative min-h-[300px] overflow-hidden">
          <div ref={modalChartContainerRef} className="w-full h-full cursor-crosshair" />
        </div>

        {/* Modal Footer */}
        <div className={`p-3 ${isLight ? 'bg-slate-50 border-t border-slate-200' : 'bg-[#131722] border-t border-[#2a2e39]'} flex items-center justify-end text-xs`}>
          <button
            onClick={() => setCroppedTimeframePreview(null)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-xs"
          >
            Close Pop-out Window
          </button>
        </div>
      </div>
    </div>
  );
};
