"use client";

import React, { useState } from 'react';
import { GameState } from '../lib/simulationEngine';
import { EXPANDED_ASSETS, AssetConfig } from '../data/assets';

interface AssetTickerProps {
  state: GameState;
  selectedAssetId: string;
  onSelectAssetId: (id: string) => void;
}

export function AssetTicker({ state, selectedAssetId, onSelectAssetId }: AssetTickerProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'Stock' | 'Commodity' | 'Crypto'>('ALL');
  const [filterSector, setFilterSector] = useState<string>('ALL');

  const sectors = ['ALL', 'Tech', 'AI', 'Biotech', 'Energy', 'Agriculture', 'Crypto'];

  const filteredAssets = EXPANDED_ASSETS.filter(asset => {
    if (filterType !== 'ALL' && asset.type !== filterType) return false;
    if (filterSector !== 'ALL' && asset.sector !== filterSector) return false;
    if (asset.type === 'Stock' && state.companies[asset.id]?.isPrivate) return false;
    return true;
  });

  // Small SVG Sparkline Component
  const renderSparkline = (history: number[], isUp: boolean) => {
    const data = history.slice(-10); // last 10 points
    if (data.length < 2) return null;

    const w = 50;
    const h = 18;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const pts = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isUp ? '#10b981' : '#f43f5e';

    return (
      <svg width={w} height={h} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    );
  };

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-md glow-blue flex flex-col h-full overflow-hidden select-none">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      <h2 className="text-xs font-bold text-zinc-400 font-mono mb-3 uppercase tracking-wider">Market Terminal</h2>
      
      {/* Type filters */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-2 select-none border-b border-zinc-900">
        {(['ALL', 'Stock', 'Commodity', 'Crypto'] as any[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold whitespace-nowrap transition-colors ${
              filterType === t
                ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-inner'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'Stock' ? 'STOCKS' : t === 'Commodity' ? 'COMMODITIES' : t === 'Crypto' ? 'CRYPTO' : 'ALL TYPES'}
          </button>
        ))}
      </div>

      {/* Sector filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-zinc-900 mb-3 select-none">
        {sectors.map((sec) => (
          <button
            key={sec}
            onClick={() => setFilterSector(sec)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold whitespace-nowrap transition-colors ${
              filterSector === sec
                ? 'bg-zinc-850 text-cyan-400 border border-zinc-850 shadow-inner'
                : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {sec.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Asset rows */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5">
        {(() => {
          const getAssetMoney = (assetId: string, assetType: string) => {
            if (assetType === 'Stock') {
              const comp = state.companies[assetId];
              return comp ? comp.cash : 0;
            }
            return state.currentPrices[assetId] || 0;
          };

          // Compute absolute company ranks by cash
          const companyRanks: Record<string, number> = {};
          const stocks = EXPANDED_ASSETS.filter(a => a.type === 'Stock');
          const sortedStocks = [...stocks].sort((a, b) => {
            const cashA = state.companies[a.id]?.cash || 0;
            const cashB = state.companies[b.id]?.cash || 0;
            return cashB - cashA;
          });
          sortedStocks.forEach((stock, idx) => {
            companyRanks[stock.id] = idx + 1;
          });

          const formatCash = (val: number) => {
            if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
            if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
            if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
            return `$${val}`;
          };

          const sortedAssets = [...filteredAssets].sort((a, b) => {
            const moneyA = getAssetMoney(a.id, a.type);
            const moneyB = getAssetMoney(b.id, b.type);
            if (moneyB !== moneyA) {
              return moneyB - moneyA;
            }
            return a.ticker.localeCompare(b.ticker);
          });

          return sortedAssets.map((asset) => {
            const price = state.currentPrices[asset.id] || asset.basePrice;
            const history = state.marketHistory[asset.id] || [];
          
          const sharesOwned = state.holdings[asset.id] || 0;
          const shortQty = state.shortPositions[asset.id] || 0;

          // Calculate short term direction
          const previousPrice = history.length > 1 ? history[history.length - 2] : price;
          const isUp = price >= previousPrice;
          const percentChange = (((price - previousPrice) / (previousPrice || 1)) * 100);

          const isSelected = selectedAssetId === asset.id;

          // Ownership percentage for stocks
          let ownershipLabel = '';
          if (asset.type === 'Stock') {
            const comp = state.companies[asset.id];
            if (comp) {
              const ownershipPercent = (sharesOwned / comp.totalShares) * 100;
              if (ownershipPercent > 0) {
                ownershipLabel = `Own: ${ownershipPercent.toFixed(1)}%`;
              }
              if (comp.isPrivate) {
                ownershipLabel = 'PRIVATE';
              }
            }
          }

          return (
            <button
              key={asset.id}
              onClick={() => onSelectAssetId(asset.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex justify-between items-center relative overflow-hidden ${
                isSelected
                  ? 'bg-zinc-900 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-scale-up'
                  : 'bg-zinc-900/40 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800'
              }`}
            >
              {/* Card content */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-white">{asset.ticker}</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-zinc-850 text-zinc-400 font-mono font-bold uppercase">{asset.sector}</span>
                  {asset.type === 'Stock' && (
                    <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-900/40 text-cyan-400 font-mono font-bold" title="Company Wealth Rank">
                      #{companyRanks[asset.id]}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold max-w-[110px] truncate">{asset.name}</span>
                {asset.type === 'Stock' && state.companies[asset.id] && (
                  <span className="text-[9px] text-zinc-500 font-mono">
                    Cash: {formatCash(state.companies[asset.id].cash)}
                  </span>
                )}
                
                {/* Positions metrics */}
                {sharesOwned > 0 && (
                  <span className="text-[9px] font-mono text-cyan-400 font-semibold">
                    Long: {sharesOwned.toLocaleString()} {ownershipLabel ? `(${ownershipLabel})` : ''}
                  </span>
                )}
                {shortQty > 0 && (
                  <span className="text-[9px] font-mono text-rose-400 font-semibold">
                    Short: {shortQty.toLocaleString()} @ ${state.shortPositionsEntryPrice[asset.id]?.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Sparkline & Quotes */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  {renderSparkline(history, isUp)}
                </div>
                
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-mono font-black text-xs text-white">${price.toFixed(2)}</span>
                  <span className={`text-[9px] font-mono font-bold ${percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {percentChange >= 0 ? '▲' : '▼'}{Math.abs(percentChange).toFixed(1)}%
                  </span>
                </div>
              </div>
            </button>
          );
        });
      })()}
      </div>
    </div>
  );
}
