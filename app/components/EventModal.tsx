"use client";

import React from 'react';
import { DecisionPrompt } from '../utils/gameData';
import { AlertTriangle } from 'lucide-react';

interface EventModalProps {
  activePrompt: DecisionPrompt | null;
  showPromptOutcome: string | null;
  handleDecision: (choiceIndex: number) => void;
  closeOutcomeModal: () => void;
  playerCash: number;
}

export function EventModal({
  activePrompt,
  showPromptOutcome,
  handleDecision,
  closeOutcomeModal,
  playerCash
}: EventModalProps) {
  if (!activePrompt && !showPromptOutcome) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="absolute inset-0 scanline pointer-events-none opacity-10"></div>
      
      {/* Outcome Mode */}
      {showPromptOutcome && (
        <div className="bg-zinc-950 border-2 border-cyan-500/80 p-8 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.25)] relative flex flex-col gap-6 animate-scale-up">
          <div>
            <h2 className="text-sm font-black font-mono tracking-widest text-cyan-400 uppercase">Transmission Confirmed</h2>
            <div className="h-0.5 bg-zinc-800 my-3 w-full"></div>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed bg-zinc-900 border border-zinc-850 p-4 rounded-xl">
              {showPromptOutcome}
            </p>
          </div>

          <button
            onClick={closeOutcomeModal}
            className="w-full bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 font-bold font-mono py-3 rounded-xl text-sm transition-all uppercase tracking-wider shadow-inner"
          >
            Acknowledge & Continue
          </button>
        </div>
      )}

      {/* Decision Prompt Mode */}
      {activePrompt && !showPromptOutcome && (() => {
        const noneAffordable = activePrompt.choices.every(choice => playerCash < choice.cost);
        return (
          <div className="bg-zinc-950 border-2 border-indigo-500/80 p-8 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(99,102,241,0.25)] relative flex flex-col gap-6 animate-scale-up">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black font-mono tracking-widest text-indigo-400 uppercase">Incoming Decision Directive</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold font-mono animate-pulse">ACTION REQUIRED</span>
              </div>
              
              <h2 className="text-xl font-black text-white mt-2 font-mono uppercase tracking-tight">{activePrompt.title}</h2>
              <div className="h-0.5 bg-zinc-800 my-4 w-full"></div>
              
              {noneAffordable && (
                <div className="bg-rose-950/50 border border-rose-800/85 rounded-xl p-3.5 text-rose-200 text-[11px] font-mono mb-4 animate-pulse flex items-start gap-2.5">
                  <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-400 block uppercase mb-0.5">Liquidity Crunch Flagged</span>
                    You have insufficient liquid cash to cover any action. The system will force funding via a high-interest margin loan.
                  </div>
                </div>
              )}

              <p className="text-sm text-zinc-300 font-mono leading-relaxed bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl">
                {activePrompt.description}
              </p>
            </div>

            {/* Choices Grid */}
            <div className="flex flex-col gap-3">
              {activePrompt.choices.map((choice, idx) => {
                const canAfford = playerCash >= choice.cost;
                const allowedToChoose = canAfford || noneAffordable;
                const forcesDebt = !canAfford && noneAffordable;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleDecision(idx)}
                    disabled={!allowedToChoose}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-mono transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${
                      allowedToChoose
                        ? forcesDebt
                          ? 'bg-rose-950/10 border-rose-900/60 hover:bg-rose-900/25 hover:border-rose-500/85 hover:shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 hover:border-indigo-500/60 hover:shadow-md'
                        : 'bg-zinc-950/20 border-zinc-900 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <span className={`font-bold flex-1 ${allowedToChoose ? (forcesDebt ? 'text-rose-200' : 'text-zinc-200') : 'text-zinc-600'}`}>{choice.text}</span>
                    
                    <div className="flex gap-3 text-[10px] font-bold">
                      {choice.cost > 0 && (
                        <span className={forcesDebt ? 'text-rose-400 font-bold' : (canAfford ? 'text-cyan-400' : 'text-zinc-600')}>
                          {forcesDebt ? `FORCED DEBT: +$${(choice.cost - playerCash).toLocaleString()}` : `COST: $${choice.cost.toLocaleString()}`}
                        </span>
                      )}
                      {choice.effects.reputationChange && (
                        <span className={choice.effects.reputationChange > 0 ? 'text-emerald-400' : 'text-rose-500'}>
                          REP: {choice.effects.reputationChange > 0 ? '+' : ''}{choice.effects.reputationChange}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
