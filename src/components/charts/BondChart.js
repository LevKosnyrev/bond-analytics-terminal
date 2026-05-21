import React, { useEffect, useRef } from 'react';
// 1. ИЗМЕНЕНИЕ: Добавляем импорт CandlestickSeries
import { createChart, CandlestickSeries } from 'lightweight-charts';

const BondChart = ({ data, secid }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      },
      autoSize: false, 
    });

    chartRef.current = chart;

    // 2. ИЗМЕНЕНИЕ: Используем новый API (версия 5+) для создания серии
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    if (data && data.length > 0) {
      candlestickSeries.setData(data);
      chart.timeScale().fitContent(); 
    }

    // ResizeObserver для идеального встраивания во Flexbox
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, secid]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={chartContainerRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0 
        }} 
      />
    </div>
  );
};

export default BondChart;