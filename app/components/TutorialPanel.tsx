"use client";

import React from 'react';
import { GameState } from '../lib/simulationEngine';

interface TutorialPanelProps {
  state: GameState;
  advanceTutorial: (step: number) => void;
  completeTutorial: () => void;
  gameSpeed: number;
}

export function TutorialPanel({ state, advanceTutorial, completeTutorial, gameSpeed }: TutorialPanelProps) {
  if (state.tutorialCompleted) return null;

  const steps = [
    {
      step: 1,
      title: 'Step 1 — Seize Your First Position',
      instruction: 'Select any stock in the left Market Terminal (e.g. Fruit Inc. FRUT or NexaTech NEXA). Input a quantity in the order box and click Buy Long to invest. Commodities/cryptos also work!',
      check: 'Holdings value is greater than $0.',
      isMet: () => {
        let holds = 0;
        Object.keys(state.holdings).forEach(id => {
          holds += state.holdings[id] || 0;
        });
        return holds > 0;
      }
    },
    {
      step: 2,
      title: 'Step 2 — Tick the Clock Speed',
      instruction: 'The simulation is currently paused. Set the simulation clock in the top summary bar to 1x or 2x speed to let the days advance and observe live prices fluctuating.',
      check: 'Clock speed is 1x or higher.',
      isMet: () => gameSpeed > 0
    },
    {
      step: 3,
      title: 'Step 3 — Read the Global Feed',
      instruction: 'Let the simulation tick. Watch the bottom news ticker scroll, and check the TRANSACTION SHELL log at the bottom to see prices update. Let time run for a few days.',
      check: 'Reach Day 5.',
      isMet: () => state.turn >= 5
    },
    {
      step: 4,
      title: 'Step 4 — Secure Commercial Credit',
      instruction: 'Open the BANK LOAN popover by clicking the button in the top status bar. Enter $10,000 or more, and click Borrow to leverage your portfolio cash. Leverage increases buying power but charges interest!',
      check: 'Corporate debt is greater than $0.',
      isMet: () => state.debt > 0
    },
    {
      step: 5,
      title: 'Step 5 — Profit from Crashes (Shorting)',
      instruction: 'Short selling lets you sell borrowed shares to profit from price drops. Input a quantity and click Sell Close (if you own it) or go to the market desk to execute a Short Sell contract. Cover it later by buying back!',
      check: 'Short sell at least 5 shares, then Cover them.',
      isMet: () => {
        // We auto-advance this step once covered or shorted
        return state.turn >= 10;
      }
    },
    {
      step: 6,
      title: 'Step 6 — Unlock Boardrooms & Politics',
      instruction: 'Review the BOARDROOM and POLITICS tabs. Acquire 50% shares in any stock to seize control, or campaign to mayor/senator to vote on regulation. You are ready!',
      check: 'Unlock Sandbox.',
      isMet: () => false // requires clicking complete
    }
  ];

  const currentStepData = steps.find(s => s.step === state.tutorialStep);
  if (!currentStepData) {
    // If step is 0 (Character setup screen), we don't show the panel
    return null;
  }

  // Check if current step condition is met to auto-advance
  React.useEffect(() => {
    if (currentStepData && currentStepData.step < 6 && currentStepData.isMet()) {
      advanceTutorial(state.tutorialStep + 1);
    }
  }, [state.turn, state.debt, state.holdings, gameSpeed, state.tutorialStep, currentStepData, advanceTutorial]);

  const progressPct = (state.tutorialStep / steps.length) * 100;

  return (
    <div className="fixed bottom-14 left-6 right-6 md:left-auto md:right-6 md:w-[350px] bg-zinc-950/95 border-2 border-cyan-500/80 p-5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)] z-40 select-none animate-slide-up">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      <div className="flex justify-between items-start gap-4 mb-3">
        <div>
          <span className="text-[10px] font-black font-mono tracking-widest text-cyan-400 uppercase">Onboarding Directive</span>
          <h4 className="text-xs font-bold text-white font-mono uppercase mt-0.5">{currentStepData.title}</h4>
        </div>
        <button
          onClick={completeTutorial}
          className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 font-bold uppercase transition-colors"
        >
          Skip Tutorial
        </button>
      </div>

      <p className="text-[11px] text-zinc-300 font-mono leading-relaxed bg-zinc-900 border border-zinc-850 p-3 rounded-lg">
        {currentStepData.instruction}
      </p>

      {/* Progress & Actions */}
      <div className="flex justify-between items-center mt-4 border-t border-zinc-900 pt-3">
        <div className="flex flex-col gap-1 flex-1 max-w-[180px]">
          <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase">Progress: Step {state.tutorialStep} of {steps.length}</span>
          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-850">
            <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {state.tutorialStep === 6 ? (
          <button
            onClick={completeTutorial}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-850 hover:bg-cyan-900 text-cyan-300 font-mono text-[10px] font-black uppercase tracking-wider transition-colors shadow-inner"
          >
            Launch Sandbox
          </button>
        ) : (
          <span className="text-[9px] font-mono text-amber-400 font-bold animate-pulse uppercase">
            Waiting: Action...
          </span>
        )}
      </div>
    </div>
  );
}
