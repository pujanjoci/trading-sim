"use client";

import React from 'react';
import { GameState } from '../lib/simulationEngine';
import { Landmark } from 'lucide-react';

interface PoliticsProps {
  state: GameState;
  advancePoliticalCareer: () => void;
  voteLegislativeAction: (actionId: string) => void;
}

export function Politics({ state, advancePoliticalCareer, voteLegislativeAction }: PoliticsProps) {
  const ranks = [
    {
      id: 'Donor',
      description: 'Wealthy financier. Can donate campaign cash to secure local political goodwill.',
      cashReq: 50000,
      netWorthReq: 50000,
      repReq: 50,
      ability: 'Campaign fund access (Boosts public reputation)'
    },
    {
      id: 'Lobbyist',
      description: 'Navigates corporate interests. Can sponsor tech tax bills.',
      cashReq: 120000,
      netWorthReq: 120000,
      repReq: 50,
      ability: 'Lobby Tech Tax Credit bill'
    },
    {
      id: 'Local Candidate',
      description: 'Stands for local assembly elections. Collects public trust cards.',
      cashReq: 250000,
      netWorthReq: 350000,
      repReq: 60,
      ability: 'Collect legislative voting cards'
    },
    {
      id: 'Mayor',
      description: 'Controls regional zoning and industrial grants.',
      cashReq: 500000,
      netWorthReq: 1000000,
      repReq: 65,
      ability: 'Sponsor Agriculture Grain Tariffs'
    },
    {
      id: 'Senator/MP',
      description: 'Votes on national security budgets and foreign trade routes.',
      cashReq: 1500000,
      netWorthReq: 3000000,
      repReq: 70,
      ability: 'Sponsor Military Arms Embargoes'
    },
    {
      id: 'Finance Minister',
      description: 'Controls state debt interest thresholds.',
      cashReq: 4000000,
      netWorthReq: 8000000,
      repReq: 75,
      ability: 'Modify bank base credit rates'
    },
    {
      id: 'President/PM',
      description: 'Ultimate sovereign authority over defense, chip trade, and energy sanctions.',
      cashReq: 10000000,
      netWorthReq: 20000000,
      repReq: 85,
      ability: 'Pass AI neural node bans'
    }
  ];

  const currentRankIndex = ranks.findIndex(r => r.id === state.politicalLevel);
  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;

  // Render political policies list
  const policyBills = [
    {
      id: 'TAX_CUT_TECH',
      name: 'Tech Tax Credit Act',
      requiredRank: 'Lobbyist',
      cashCost: 80000,
      influenceCost: 5,
      description: 'Cut corporate tax margins on tech systems. Jumps tech stock prices (FRUT, NEXA, OLDX).',
      effect: 'Tech sectors jump +18%'
    },
    {
      id: 'AGRI_TARIFFS',
      name: 'Grain Export Tariff',
      requiredRank: 'Mayor',
      cashCost: 60000,
      influenceCost: 3,
      description: 'Tax foreign agricultural imports. Raises wheat, corn, and soy futures.',
      effect: 'Agri commodities rise +25%'
    },
    {
      id: 'MILITARY_EMBARGO',
      name: 'Arms Embargo Resolution',
      requiredRank: 'Senator/MP',
      cashCost: 150000,
      influenceCost: 8,
      description: 'Block weapon supply corridors. Boosts defense stock (APEX) and oil commodity, raises global tension.',
      effect: 'Defense +30% | Oil +22%'
    },
    {
      id: 'AI_BAN',
      name: 'Neural Node Restructuring Act',
      requiredRank: 'Finance Minister', // Minister or President
      cashCost: 200000,
      influenceCost: 10,
      description: 'Enact direct restriction on speculative generative computing nodes. COGN drops -45%, cyber defense NEXA rises +20%.',
      effect: 'Cognitive AI crashes -45% | Cyber NEXA rises +20%'
    }
  ];

  const checkRankAfforded = (required: string) => {
    const reqIdx = ranks.findIndex(r => r.id === required);
    return currentRankIndex >= reqIdx;
  };

  const getInsiderDiscountCost = (baseCost: number) => {
    const scale = state.background === 'POLITICAL_INSIDER' ? 0.6 : 1.0;
    return Math.round(baseCost * scale);
  };

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-md glow-blue flex flex-col gap-6 h-full select-none relative">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Header info */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-sm font-black font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5"><Landmark size={14} /> POLITICO EXECUTIVE ENGINE</h2>
          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Political Standing: {state.reputationPolitical}/100</span>
        </div>
        <span className="text-xs font-mono font-black text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
          {state.politicalLevel.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-1">
        {/* Left column: Campaign path */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wide">Political Ascension Ladder</h3>
          
          {nextRank ? (
            <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
              <div>
                <span className="text-zinc-500 font-bold uppercase">Target Rank: {nextRank.id}</span>
                <p className="text-[10px] text-zinc-400 mt-1 leading-normal">{nextRank.description}</p>
              </div>

              <div className="flex flex-col gap-1 border-t border-zinc-850 pt-2 text-[10px] font-bold">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Campaign Cash Needed:</span>
                  <span className={state.cash >= nextRank.cashReq ? 'text-emerald-400' : 'text-rose-400'}>
                    ${nextRank.cashReq.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reputation Needed:</span>
                  <span className={state.reputationPolitical >= nextRank.repReq ? 'text-emerald-400' : 'text-rose-400'}>
                    {nextRank.repReq}%
                  </span>
                </div>
              </div>

              <button
                onClick={advancePoliticalCareer}
                className="w-full py-2.5 rounded-lg border border-cyan-800 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 font-black text-xs transition-colors uppercase tracking-wider"
              >
                Launch Election Campaign
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 border-dashed p-4 rounded-xl text-center text-xs font-mono text-emerald-400 italic">
              CONGRATULATIONS. YOU OWN THE STATE. UNLOCKED ABSOLUTE PRESIDENT EXECUTIVE AUTHORITY.
            </div>
          )}

          {/* Current powers list */}
          <div className="flex flex-col gap-1.5 font-mono text-[10px] text-zinc-500 mt-2">
            <span className="font-bold text-zinc-400">Current Career Ranks status:</span>
            {ranks.map((r, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-zinc-900 pb-1">
                <span className={idx <= currentRankIndex ? 'text-zinc-300 font-bold' : 'text-zinc-600'}>
                  {idx + 1}. {r.id}
                </span>
                <span className={idx <= currentRankIndex ? 'text-emerald-400' : 'text-zinc-700'}>
                  {idx <= currentRankIndex ? '✓ Unlocked' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Unlocked policies */}
        <div className="flex flex-col gap-3 border-l border-zinc-900 pl-0 lg:pl-6">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wide">Legislative Directives</h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">Influence: {state.politicalInfluence} pts</span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px]">
            {policyBills.map((bill) => {
              const unlocked = checkRankAfforded(bill.requiredRank);
              const actualCost = getInsiderDiscountCost(bill.cashCost);
              const canAfford = state.cash >= actualCost && state.politicalInfluence >= bill.influenceCost;

              const isPassed = state.passedBills?.includes(bill.id) || false;

              return (
                <div
                  key={bill.id}
                  className={`border p-3.5 rounded-xl flex flex-col gap-3 transition-all ${
                    isPassed
                      ? 'bg-zinc-900/60 border-emerald-900/80 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : unlocked
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-zinc-950/40 border-zinc-900/60 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 font-mono uppercase">{bill.name}</h4>
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Requires: {bill.requiredRank}</span>
                    </div>
                    {unlocked && (
                      <span className={`text-[10px] font-mono font-bold ${isPassed ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {isPassed ? 'PASSED' : bill.effect}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-400 font-mono leading-normal">{bill.description}</p>

                  <div className="flex justify-between items-center border-t border-zinc-850 pt-2.5">
                    <div className="flex flex-col font-mono text-[9px] text-zinc-500 font-bold">
                      <span>Campaign cost: ${actualCost.toLocaleString()}</span>
                      <span>Influence cost: {bill.influenceCost} pts</span>
                    </div>

                    <button
                      onClick={() => voteLegislativeAction(bill.id)}
                      disabled={isPassed || !unlocked || !canAfford}
                      className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-colors ${
                        isPassed
                          ? 'bg-emerald-950/30 border border-emerald-800 text-emerald-400 cursor-not-allowed font-black'
                          : unlocked && canAfford
                            ? 'bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900'
                            : 'bg-zinc-950 border border-zinc-900 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {isPassed ? '✓ ENACTED' : !unlocked ? 'RANK LOCKED' : 'PASS BILL'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
