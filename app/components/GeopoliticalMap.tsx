"use client";

import React, { useState } from 'react';
import { GameState, SentimentState } from '../lib/simulationEngine';
import { WORLD_EVENTS } from '../utils/gameData';
import { LOBBYING_OPTIONS } from '../utils/gameData';
import { Radar, Landmark, UserCircle } from 'lucide-react';

interface GeopoliticalMapProps {
  state: GameState;
  lobbyCongress: (lobbyId: string) => void;
}

export function GeopoliticalMap({ state, lobbyCongress }: GeopoliticalMapProps) {
  const [activeTab, setActiveTab] = useState<'INTEL' | 'LOBBY' | 'INSIDER'>('INTEL');

  const { globalTension, pandemicLevel, economicHealth, inflation } = state.geopoliticalMetrics;

  const getMetricColor = (val: number, type: 'TENSION' | 'PANDEMIC' | 'HEALTH' | 'INFLATION') => {
    if (type === 'HEALTH') {
      return val > 75 ? 'bg-emerald-500 font-bold' : val < 35 ? 'bg-rose-500 animate-pulse font-black' : 'bg-indigo-500';
    }
    if (type === 'INFLATION') {
      return Math.abs(val) > 7.0 ? 'bg-rose-500 animate-pulse' : Math.abs(val) > 4.0 ? 'bg-amber-500' : 'bg-emerald-500';
    }
    return val > 65 ? 'bg-rose-500 animate-pulse' : val > 30 ? 'bg-amber-500' : 'bg-emerald-500';
  };

  // Lobby cost scale
  const lobbyCostScale = state.background === 'POLITICAL_INSIDER' ? 0.6 : 1.0;
  const getAdjustedCost = (baseCost: number) => {
    const repDiscount = (50 - state.reputationPolitical) * 0.005;
    return Math.round(baseCost * (1 + repDiscount) * lobbyCostScale);
  };

  // Economic Cycle Visual Styling
  const getCycleTheme = (cycle: string) => {
    switch (cycle) {
      case 'Euphoria':
        return { text: 'text-pink-400 font-black tracking-widest animate-pulse', border: 'border-pink-500/80 shadow-[0_0_15px_rgba(236,72,153,0.15)] bg-pink-950/20' };
      case 'Expansion':
        return { text: 'text-emerald-400 font-bold', border: 'border-emerald-800/80 bg-emerald-950/10' };
      case 'Slowdown':
        return { text: 'text-amber-400 font-semibold', border: 'border-amber-800/80 bg-amber-950/10' };
      case 'Recession':
        return { text: 'text-rose-400 font-black animate-pulse', border: 'border-rose-900/60 shadow-[0_0_15px_rgba(244,63,94,0.1)] bg-rose-950/10' };
      case 'Depression':
        return { text: 'text-red-500 font-black tracking-widest animate-pulse-glow', border: 'border-red-950/80 shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-red-950/20' };
      case 'Recovery':
        return { text: 'text-cyan-400 font-bold', border: 'border-cyan-800/80 bg-cyan-950/10' };
      default:
        return { text: 'text-zinc-200', border: 'border-zinc-800' };
    }
  };

  const cycleTheme = getCycleTheme(state.economicCycle);

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md glow-blue flex flex-col h-full overflow-hidden select-none relative">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Economic Cycle status card */}
      <div className={`border p-3.5 rounded-xl mb-4 flex flex-col justify-between items-start gap-1 z-10 transition-all duration-300 ${cycleTheme.border}`}>
        <div className="flex justify-between items-center w-full">
          <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Macroeconomic Phase</span>
          <span className="text-[9px] font-mono text-zinc-500 font-semibold">{state.cycleTurnsRemaining} turns left</span>
        </div>
        <span className={`text-base font-mono uppercase ${cycleTheme.text}`}>{state.economicCycle}</span>
        <span className="text-[9px] text-zinc-400 font-mono leading-normal mt-0.5">
          {state.economicCycle === 'Expansion' && 'Tech, AI, and industrial sectors benefit from high growth.'}
          {state.economicCycle === 'Euphoria' && 'Speculative bubbles inflate. Crypto and AI soar. Volatility spiked.'}
          {state.economicCycle === 'Slowdown' && 'Productivity declines. Inflation crests. Safe-havens support starts.'}
          {state.economicCycle === 'Recession' && 'Risk assets crash. Treasury savings and Gold bullion dominate.'}
          {state.economicCycle === 'Depression' && 'Severe capital defaults. Massive market dropouts. Bonds and gold shine.'}
          {state.economicCycle === 'Recovery' && 'Productivity returns. Speculators accumulate cheap undervalued assets.'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-4 text-xs font-mono font-bold select-none z-10">
        {[
          { id: 'INTEL', label: 'VECTORS', Icon: Radar },
          { id: 'LOBBY', label: 'LOBBIES', Icon: Landmark },
          { id: 'INSIDER', label: 'TIPS', Icon: UserCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 pb-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {'Icon' in tab && tab.Icon && <tab.Icon size={12} />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto z-10 pr-1">
        {/* Tab 1: Global Intel (threat levels & active events) */}
        {activeTab === 'INTEL' && (
          <div className="flex flex-col gap-5">
            {/* Metric Gauges */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wide">Threat Indicators</h3>
              
              {/* Tension */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span className="text-zinc-400 text-[10px]">Geopolitical Tension</span>
                  <span className={globalTension > 60 ? 'text-rose-400 font-black' : 'text-zinc-200'}>{globalTension}%</span>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getMetricColor(globalTension, 'TENSION')}`}
                    style={{ width: `${globalTension}%` }}
                  />
                </div>
              </div>

              {/* Pandemic */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span className="text-zinc-400 text-[10px]">Pandemic Severity</span>
                  <span className={pandemicLevel > 50 ? 'text-rose-400 font-black' : 'text-zinc-200'}>{pandemicLevel}%</span>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getMetricColor(pandemicLevel, 'PANDEMIC')}`}
                    style={{ width: `${pandemicLevel}%` }}
                  />
                </div>
              </div>

              {/* Economic Health */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span className="text-zinc-400 text-[10px]">Industrial Growth</span>
                  <span className={economicHealth < 40 ? 'text-rose-400 font-black' : 'text-zinc-200'}>{economicHealth}%</span>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getMetricColor(economicHealth, 'HEALTH')}`}
                    style={{ width: `${economicHealth}%` }}
                  />
                </div>
              </div>

              {/* Inflation */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono font-semibold">
                  <span className="text-zinc-400 text-[10px]">CPI Inflation</span>
                  <span className={Math.abs(inflation) > 6 ? 'text-rose-400 font-black' : 'text-zinc-200'}>{inflation.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getMetricColor(Math.max(0, Math.min(100, (inflation + 5) * 5)), 'INFLATION')}`}
                    style={{ width: `${Math.max(5, Math.min(100, (inflation + 5) * 4))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Active Crises List */}
            <div className="flex flex-col gap-2 border-t border-zinc-900 pt-4">
              <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wide mb-1">Active Crises</h3>
              
              {state.activeEvents.length === 0 ? (
                <div className="text-[10px] text-zinc-600 font-mono italic p-3 border border-dashed border-zinc-800 rounded-lg text-center">
                  NO GLOBAL SYSTEM SHOCKS ACTIVE
                </div>
              ) : (
                state.activeEvents.map((ae) => {
                  const ev = WORLD_EVENTS.find(e => e.id === ae.id);
                  const name = ev ? ev.name : ae.name;
                  const desc = ev ? ev.description : 'System instability logs recorded.';

                  return (
                    <div key={ae.id} className="bg-rose-950/20 border border-rose-900/60 p-3 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs font-black text-rose-400 font-mono uppercase">
                        <span>{name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900 text-rose-200">
                          {ae.remainingDuration}d left
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{desc}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Lobbies */}
        {activeTab === 'LOBBY' && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-mono text-zinc-500 mb-2 border-b border-zinc-900 pb-2">
              Lobbying policy options are locked. Unlock them under the Politics Career screen by advancing your rank!
            </div>
            
            {LOBBYING_OPTIONS.map((opt) => {
              const actualCost = getAdjustedCost(opt.cost);
              const canAfford = state.cash >= actualCost;

              return (
                <div key={opt.id} className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between gap-3 opacity-60">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wide">{opt.name}</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{opt.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-zinc-500 font-bold">Cost: ${actualCost.toLocaleString()}</span>
                    </div>
                    <span className="text-[9px] font-mono text-rose-400 font-bold uppercase">Locked on career</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Decrypted Tips */}
        {activeTab === 'INSIDER' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wide mb-2">Decrypted Dossiers</h3>
            
            {state.insiderInfo.length === 0 ? (
              <div className="text-[10px] text-zinc-650 font-mono italic p-6 border border-dashed border-zinc-900 rounded-lg text-center leading-normal">
                NO ENCRYPTED INTELLIGENCE DOSSIERS SECURED. SECURE TIPS FROM SPONTANEOUS DIRECTIVES IN THE FIELD.
              </div>
            ) : (
              state.insiderInfo.map((info, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-850 p-3 rounded-lg flex flex-col gap-1 font-mono text-xs">
                  <span className="text-zinc-500 font-bold text-[9px] uppercase">DECRYPTED - {info.dateAdded}</span>
                  <p className="text-emerald-400 font-semibold leading-relaxed mt-0.5">{info.text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
