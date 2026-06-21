"use client";

import React, { useState } from 'react';
import { GameState, OptionContract } from '../lib/simulationEngine';
import { EXPANDED_ASSETS, AssetConfig } from '../data/assets';
import { LineChart, Lock } from 'lucide-react';

interface OptionsDeskProps {
  state: GameState;
  buyOption: (
    assetId: string,
    type: 'Call' | 'Put',
    strikePrice: number,
    quantity: number,
    premium: number,
    duration: number
  ) => void;
}

export function OptionsDesk({ state, buyOption }: OptionsDeskProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('FRUT');
  const [optionType, setOptionType] = useState<'Call' | 'Put'>('Call');
  const [strikeType, setStrikeType] = useState<'ATM' | 'OTM'>('ATM');
  const [expiryTurns, setExpiryTurns] = useState<number>(10); // 10 days or 20 days
  const [contractsQuantity, setContractsQuantity] = useState<string>('100');

  // Check unlock requirement: $50,000 net worth OR Retail background
  const totalAssetValue = Object.keys(state.holdings).reduce((sum, id) => {
    return sum + (state.holdings[id] * state.currentPrices[id]);
  }, 0);
  let shortLiabs = 0;
  Object.keys(state.shortPositions).forEach(id => {
    shortLiabs += state.shortPositions[id] * state.currentPrices[id];
  });
  const netWorth = state.cash + state.savings + totalAssetValue - state.debt - shortLiabs;

  const isUnlocked = netWorth >= 50000 || state.background === 'RETAIL_TRADER';

  if (!isUnlocked) {
    return (
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-8 backdrop-blur-md glow-blue flex flex-col items-center justify-center text-center h-full min-h-[300px] relative">
        <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
          <LineChart size={28} className="text-zinc-500" />
        </div>
        <h3 className="text-sm font-bold font-mono text-zinc-400 uppercase tracking-widest">Options Trading Locked</h3>
        <p className="text-xs text-zinc-500 font-mono max-w-md mt-2 leading-relaxed">
          Options derivatives (Calls & Puts) unlock once your Net Worth reaches **$50,000** or you start with the **Retail Trader** background.
        </p>
        <div className="bg-zinc-900 border border-zinc-850 px-4 py-3 rounded-lg mt-5 font-mono text-xs font-bold text-zinc-400">
          Current Net Worth: <span className="text-cyan-400">${Math.round(netWorth).toLocaleString()}</span>
        </div>
      </div>
    );
  }

  // Automatically redirect if selected asset was taken private
  const isSelectedPrivate = state.companies[selectedAssetId]?.isPrivate;
  if (isSelectedPrivate) {
    const firstActive = EXPANDED_ASSETS.find(asset => !state.companies[asset.id]?.isPrivate);
    if (firstActive) {
      setSelectedAssetId(firstActive.id);
    }
  }

  const selectedAsset = EXPANDED_ASSETS.find(a => a.id === selectedAssetId) || EXPANDED_ASSETS[0];
  const currentPrice = state.currentPrices[selectedAssetId] || selectedAsset.basePrice;

  // Calculate Strike & Premiums
  // ATM Call: Strike = current, Premium = 5%
  // OTM Call: Strike = current * 1.15, Premium = 1.8%
  // ATM Put: Strike = current, Premium = 5%
  // OTM Put: Strike = current * 0.85, Premium = 1.8%
  let strikePrice = currentPrice;
  let premiumPerShare = currentPrice * 0.045; // base 4.5%

  if (strikeType === 'OTM') {
    if (optionType === 'Call') {
      strikePrice = currentPrice * 1.12;
      premiumPerShare = currentPrice * 0.018;
    } else {
      strikePrice = currentPrice * 0.88;
      premiumPerShare = currentPrice * 0.018;
    }
  }

  // Crypto influencer gets 50% discount on option premiums
  if (state.background === 'CRYPTO_INFLUENCER') {
    premiumPerShare = premiumPerShare * 0.5;
  }

  const qty = parseInt(contractsQuantity.toString());
  const isValidQty = !isNaN(qty) && qty > 0;
  const totalCost = isValidQty ? qty * premiumPerShare : 0;
  const canAfford = state.cash >= totalCost;

  const handlePurchase = () => {
    if (isValidQty) {
      buyOption(selectedAssetId, optionType, strikePrice, qty, premiumPerShare, expiryTurns);
    }
  };

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-md glow-blue flex flex-col gap-6 h-full select-none relative">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-sm font-black font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5"><LineChart size={14} /> DERIVATIVES DESK (OPTIONS)</h2>
          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Call/Put option contracts</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold font-mono">UNLOCKED</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-1">
        {/* Left Form */}
        <div className="flex flex-col gap-4">
          {/* Select Asset */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Select Target Asset</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="bg-zinc-900 border border-zinc-850 rounded p-2 text-xs font-mono text-zinc-300 focus:outline-none"
            >
              {EXPANDED_ASSETS.filter(a => !state.companies[a.id]?.isPrivate).map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.ticker} - {asset.name} (${(state.currentPrices[asset.id] || asset.basePrice).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Call vs Put */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Option Type Directive</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {['Call', 'Put'].map((t) => (
                <button
                  key={t}
                  onClick={() => setOptionType(t as any)}
                  className={`py-2 rounded font-bold transition-all border ${
                    optionType === t
                      ? 'bg-cyan-950 border-cyan-800 text-cyan-300 shadow-inner font-black'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {t === 'Call' ? <><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" /> BUY CALL (Expect Rise)</> : <><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" /> BUY PUT (Expect Fall)</>}
                </button>
              ))}
            </div>
          </div>

          {/* ATM vs OTM */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Strike Distance</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { id: 'ATM', label: 'ATM (At The Money)' },
                { id: 'OTM', label: 'OTM (Out of Money)' }
              ].map((strike) => (
                <button
                  key={strike.id}
                  onClick={() => setStrikeType(strike.id as any)}
                  className={`py-2 rounded font-bold transition-all border ${
                    strikeType === strike.id
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-inner font-black'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {strike.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expiration and quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Expiration (Turns)</label>
              <select
                value={expiryTurns}
                onChange={(e) => setExpiryTurns(parseInt(e.target.value))}
                className="bg-zinc-900 border border-zinc-850 rounded p-2 text-xs font-mono text-zinc-300 focus:outline-none"
              >
                <option value={10}>10 game days (15s)</option>
                <option value={20}>20 game days (30s)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Quantity (Contracts)</label>
              <input
                type="number"
                value={contractsQuantity}
                onChange={(e) => setContractsQuantity(e.target.value)}
                className="bg-zinc-900 border border-zinc-850 rounded p-2 text-xs font-mono text-white text-right focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Info and Purchase */}
        <div className="flex flex-col justify-between border-l border-zinc-900 pl-0 md:pl-6">
          <div className="flex flex-col gap-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Contract Specifications</h3>
            
            <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex flex-col gap-2.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Spot price</span>
                <span className="text-white">${currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Strike price</span>
                <span className="text-white font-bold">${strikePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Premium / share</span>
                <span className="text-white">${premiumPerShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850 pt-2 font-bold">
                <span className="text-zinc-400">Total Premium due</span>
                <span className="text-cyan-400">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="text-[9.5px] text-zinc-500 leading-normal">
              Options represent speculative contracts. At expiration, Calls yield if Spot &gt; Strike, Puts yield if Spot &lt; Strike. Unexercised contracts yield $0. Premium is non-refundable.
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={!isValidQty || !canAfford}
            className={`w-full py-4 mt-6 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
              isValidQty && canAfford
                ? 'bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900'
                : 'bg-zinc-900 border border-zinc-850 text-zinc-600 cursor-not-allowed'
            }`}
          >
            BUY OPTION CONTRACT
          </button>
        </div>
      </div>
    </div>
  );
}
