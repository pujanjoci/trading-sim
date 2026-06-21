"use client";

import React, { useState, useRef, useEffect } from 'react';

interface MarketChartProps {
  history: number[];
  assetName: string;
  ticker: string;
  currentPrice: number;
  avgBuyPrice?: number;
  difficulty?: string;
}

export function MarketChart({ history, assetName, ticker, currentPrice, avgBuyPrice = 0, difficulty = 'NORMAL' }: MarketChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<number>(30); // 15, 30, or 60 days
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });

  const isDefaultVisible = difficulty === 'EASY' || difficulty === 'NORMAL';
  const [showBuyPriceLine, setShowBuyPriceLine] = useState(isDefaultVisible);

  // Sync state when difficulty or ticker changes
  useEffect(() => {
    setShowBuyPriceLine(difficulty === 'EASY' || difficulty === 'NORMAL');
  }, [difficulty, ticker]);

  // Update SVG sizing on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 320
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartData = history.slice(-timeframe);
  if (chartData.length === 0) return <div className="h-[320px] flex items-center justify-center text-zinc-500">No chart data available</div>;

  const pricesToBound = [...chartData];
  if (avgBuyPrice && avgBuyPrice > 0 && showBuyPriceLine) {
    pricesToBound.push(avgBuyPrice);
  }
  const minPrice = Math.min(...pricesToBound) * 0.98;
  const maxPrice = Math.max(...pricesToBound) * 1.02;
  const priceRange = maxPrice - minPrice || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const graphWidth = dimensions.width - padding.left - padding.right;
  const graphHeight = dimensions.height - padding.top - padding.bottom;

  // Calculate coordinates
  const points = chartData.map((price, idx) => {
    const x = padding.left + (idx / (chartData.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((price - minPrice) / priceRange) * graphHeight;
    return { x, y, price, index: idx };
  });

  const buyPriceY = padding.top + graphHeight - ((avgBuyPrice - minPrice) / priceRange) * graphHeight;

  // SVG Line path string
  let linePath = '';
  let areaPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;
  }

  // Determine trend color
  const isUp = chartData[chartData.length - 1] >= chartData[0];
  const strokeColor = isUp ? '#10b981' : '#f43f5e'; // emerald vs rose
  const gradientId = `chart-gradient-${ticker}`;

  // Y-axis gridlines
  const gridLinesCount = 5;
  const gridLines = Array.from({ length: gridLinesCount }).map((_, i) => {
    const price = minPrice + (i / (gridLinesCount - 1)) * priceRange;
    const y = padding.top + graphHeight - (i / (gridLinesCount - 1)) * graphHeight;
    return { price, y };
  });

  // Handle hover tracker
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padding.left;
    const idx = Math.round((mouseX / graphWidth) * (chartData.length - 1));
    if (idx >= 0 && idx < chartData.length) {
      setHoverIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="flex flex-col bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-md glow-blue relative overflow-hidden" ref={containerRef}>
      {/* Background scanlines */}
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100">{assetName}</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{ticker}</span>
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-white mt-1">
            ${currentPrice.toFixed(2)}
            <span className={`text-xs ml-2 font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? '▲' : '▼'} {(((chartData[chartData.length - 1] - chartData[0]) / (chartData[0] || 1)) * 100).toFixed(2)}%
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {avgBuyPrice > 0 && (
            <button
              onClick={() => setShowBuyPriceLine(!showBuyPriceLine)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all font-bold ${
                showBuyPriceLine
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Buy Line: {showBuyPriceLine ? 'ON' : 'OFF'}
            </button>
          )}

          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            {[15, 30, 60].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-md font-mono transition-all ${
                  timeframe === t
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-inner'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}D
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative h-[320px] w-full z-10 select-none">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-visible cursor-crosshair"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={dimensions.width - padding.right}
                y2={line.y}
                stroke="#1f2937"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={line.y + 4}
                textAnchor="end"
                fill="#9ca3af"
                className="text-[10px] font-mono fill-zinc-500 font-semibold"
              >
                ${line.price.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X Axis ticks */}
          <line
            x1={padding.left}
            y1={dimensions.height - padding.bottom}
            x2={dimensions.width - padding.right}
            y2={dimensions.height - padding.bottom}
            stroke="#374151"
            strokeWidth="1.5"
          />

          {/* Time ticks labels */}
          <text
            x={padding.left}
            y={dimensions.height - 15}
            textAnchor="start"
            fill="#6b7280"
            className="text-[10px] font-mono fill-zinc-500"
          >
            -{timeframe} Days Ago
          </text>
          <text
            x={dimensions.width - padding.right}
            y={dimensions.height - 15}
            textAnchor="end"
            fill="#6b7280"
            className="text-[10px] font-mono fill-zinc-500"
          >
            Live Terminal
          </text>

          {/* Area Fill */}
          {points.length > 0 && (
            <path d={areaPath} fill={`url(#${gradientId})`} />
          )}

          {/* Line Plot */}
          {points.length > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]"
            />
          )}

          {/* Buy Price Line */}
          {avgBuyPrice && avgBuyPrice > 0 && showBuyPriceLine && (
            <g>
              <line
                x1={padding.left}
                y1={buyPriceY}
                x2={dimensions.width - padding.right}
                y2={buyPriceY}
                stroke="#eab308"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
              <rect
                x={padding.left + 10}
                y={buyPriceY - 18}
                width={120}
                height={16}
                rx={4}
                fill="#713f12"
                stroke="#eab308"
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={padding.left + 15}
                y={buyPriceY - 6}
                fill="#fef08a"
                className="text-[9px] font-bold font-mono"
              >
                Bought @ ${avgBuyPrice.toFixed(2)}
              </text>
            </g>
          )}

          {/* Hover Crosshair */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={dimensions.height - padding.bottom}
                stroke="#4b5563"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={activePoint.y}
                x2={dimensions.width - padding.right}
                y2={activePoint.y}
                stroke="#4b5563"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill={strokeColor}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="animate-pulse"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Card */}
        {activePoint && (
          <div
            className="absolute bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg shadow-xl text-xs z-30 pointer-events-none flex flex-col font-mono"
            style={{
              left: `${activePoint.x - 50}px`,
              top: `${activePoint.y - 60}px`,
              transform: 'translateY(-10px)'
            }}
          >
            <span className="text-zinc-400 font-semibold">Price: ${activePoint.price.toFixed(2)}</span>
            <span className="text-[10px] text-zinc-500">Day -{timeframe - activePoint.index}</span>
          </div>
        )}
      </div>
      {/* Legend for Average Buy Price */}
      {avgBuyPrice > 0 && showBuyPriceLine && (
        <div className="flex items-center gap-2 text-[10px] text-amber-400 font-mono mt-3 select-none">
          <span className="w-4 h-0.5 border-t border-dashed border-amber-500 inline-block"></span>
          <span>Average Buy Price: ${avgBuyPrice.toFixed(2)} (Dash Yellow Line)</span>
        </div>
      )}
    </div>
  );
}
