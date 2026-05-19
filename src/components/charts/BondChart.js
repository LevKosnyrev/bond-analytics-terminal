import React, { useEffect, useRef } from 'react';
// Добавили импорт CandlestickSeries для новой версии библиотеки
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

const BondChart = ({ data, secid }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        borderColor: '#2a2e39',
      },
    });

    // НОВЫЙ СИНТАКСИС ДЛЯ ВЕРСИИ 5.0+
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#f23645',
      borderVisible: false,
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });

    candlestickSeries.setData(data);

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data]);

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <h5 style={{ color: 'var(--accent-green)', marginBottom: '20px' }}>График цены: {secid}</h5>
      <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default BondChart;