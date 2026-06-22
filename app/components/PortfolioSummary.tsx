"use client";

import React, { useState } from 'react';
import { GameState } from '../lib/simulationEngine';
import { DIFFICULTY_MODES } from '../data/difficultyModes';
import {
  LogOut,
  Pause,
  Briefcase,
  BarChart3,
  Landmark,
  Building2,
  Gauge,
  TrendingUp,
  TrendingDown,
  Bot,
  UserCircle
} from 'lucide-react';
import { InboxNotificationBell } from './inbox/InboxNotificationBell';

const AVATAR_ICON_MAP: Record<string, React.ComponentType<{size?: number; className?: string}>> = {
  briefcase: Briefcase,
  barchart: BarChart3,
  landmark: Landmark,
  building: Building2,
  gauge: Gauge,
  trendingup: TrendingUp,
  trendingdown: TrendingDown,
  bot: Bot
};

function getAvatarIcon(avatarId: string, size = 16, className = 'text-cyan-400') {
  const key = avatarId.split(':')[0];
  const IconComp = AVATAR_ICON_MAP[key] || UserCircle;
  return <IconComp size={size} className={className} />;
}

function formatCurrencyLarge(value: number): string {
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absVal >= 1e15) {
    return `${sign}$${(absVal / 1e15).toFixed(2)}Q`; // Quadrillion
  }
  if (absVal >= 1e12) {
    return `${sign}$${(absVal / 1e12).toFixed(2)}T`; // Trillion
  }
  if (absVal >= 1e9) {
    return `${sign}$${(absVal / 1e9).toFixed(2)}B`; // Billion
  }
  if (absVal >= 1e6) {
    return `${sign}$${(absVal / 1e6).toFixed(2)}M`; // Million
  }
  return `${sign}$${absVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface PortfolioSummaryProps {
  state: GameState;
  gameSpeed: number;
  setGameSpeed: (speed: number) => void;
  borrowCash: (amount: number) => void;
  repayDebt: (amount: number) => void;
  buyBond: (bondType: 'TreasuryBill' | 'GovBond' | 'CorpBond', faceValue: number) => void;
  depositSavings: (amount: number) => void;
  withdrawSavings: (amount: number) => void;
  resetGame: () => void;
  currentUser: any;
  logoutUser: () => void;
  setActiveConsoleTab?: (tab: 'TRADE' | 'OPTIONS' | 'BOARDROOM' | 'POLITICS' | 'ACCOUNT' | 'DEBUG' | 'INBOX') => void;
}

export function PortfolioSummary({
  state,
  gameSpeed,
  setGameSpeed,
  borrowCash,
  repayDebt,
  buyBond,
  depositSavings,
  withdrawSavings,
  resetGame,
  currentUser,
  logoutUser,
  setActiveConsoleTab
}: PortfolioSummaryProps) {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState<string>('25000');
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState<string>('15000');
  const [showBondsModal, setShowBondsModal] = useState(false);
  const [bondFaceValue, setBondFaceValue] = useState<string>('50000');
  const [bondType, setBondType] = useState<'TreasuryBill' | 'GovBond' | 'CorpBond'>('TreasuryBill');

  // Net worth calculation including savings, cash, long assets, short liabilities, and debt
  const totalLongValue = Object.keys(state.holdings).reduce((sum, id) => {
    return sum + ((state.holdings[id] || 0) * (state.currentPrices[id] || 0));
  }, 0);

  let totalShortLiab = 0;
  Object.keys(state.shortPositions).forEach(id => {
    totalShortLiab += (state.shortPositions[id] || 0) * (state.currentPrices[id] || 0);
  });

  const netWorth = state.cash + state.savings + totalLongValue - state.debt - totalShortLiab;
  const diffConfig = DIFFICULTY_MODES.find(d => d.id === state.difficulty) || DIFFICULTY_MODES[1];
  const maxDebtLimit = netWorth * (state.background === 'EX_BANKER' ? 4.0 : diffConfig.leverageMaxMultiplier);
  const isMarginCallRisk = state.debt > 0 && (netWorth / state.debt) * 100 < 50;

  return (
    <div className="bg-zinc-950 border-b border-zinc-800 p-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative select-none">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Title & Time controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:justify-start lg:gap-8 z-10">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Trading Sim
          </h1>
          <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase mt-0.5">Realistic Market & Crisis Simulator</p>
        </div>

        {/* Speed controls */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 rounded-lg p-1">
            <span className="text-[9px] text-zinc-500 font-mono font-bold px-1.5 uppercase">TICK</span>
            {[
              { label: 'Pause', val: 0, isPause: true },
              { label: '1x', val: 1 },
              { label: '2x', val: 2 },
              { label: '5x', val: 5 }
            ].map((sp) => (
              <button
                key={sp.val}
                onClick={() => setGameSpeed(sp.val)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                  gameSpeed === sp.val
                    ? 'bg-zinc-850 text-cyan-400 border border-zinc-700 shadow-inner'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {'isPause' in sp && sp.isPause ? <><Pause size={11} /> Pause</> : sp.label}
              </button>
            ))}
          </div>
          <span className="text-[8px] text-zinc-500 font-mono pl-1">
            Time Scale: 1 market day = 1 second at 1x speed
          </span>
        </div>
      </div>

      {/* Main Account details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 lg:max-w-4xl z-10">
        {/* Net Worth */}
        <div className={`p-4 rounded-xl border bg-zinc-900/40 backdrop-blur-md transition-all ${
          isMarginCallRisk ? 'border-rose-900/80 shadow-[0_0_15px_rgba(244,63,94,0.12)] animate-pulse' : 'border-zinc-800/80 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
        }`}>
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
            <span>Net Worth</span>
            {isMarginCallRisk && <span className="text-rose-400 text-[8px] animate-pulse">LIQUIDATION RISKS</span>}
          </div>
          <p className={`text-lg font-black font-mono mt-1 ${netWorth >= 100000 ? 'text-cyan-400' : 'text-zinc-100'}`}>
            {formatCurrencyLarge(netWorth)}
          </p>
        </div>

        {/* Cash & Savings */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md relative">
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
            <span>Treasury Funds</span>
            <button
              onClick={() => { setShowSavingsModal(!showSavingsModal); setShowLoanModal(false); setShowBondsModal(false); }}
              className="text-[8px] text-cyan-400 font-bold font-mono underline hover:text-cyan-300"
            >
              DEPOSIT
            </button>
          </div>
          <p className="text-sm font-black font-mono text-zinc-100 mt-1">
            Cash: {formatCurrencyLarge(state.cash)}
          </p>
          <p className="text-[10px] font-mono text-zinc-400 font-semibold">
            Savings: {formatCurrencyLarge(state.savings)}
          </p>

          {/* Savings Modal */}
          {showSavingsModal && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-40 w-64 flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center font-bold text-zinc-300 uppercase text-[10px]">
                <span>Treasury Vault Cash</span>
                <button onClick={() => setShowSavingsModal(false)} className="text-zinc-500 hover:text-zinc-300">✕</button>
              </div>
              <input
                type="number"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 font-mono text-white text-xs focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { depositSavings(parseFloat(savingsAmount)); setShowSavingsModal(false); }}
                  className="flex-1 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 py-1 rounded font-bold"
                >
                  DEPOSIT
                </button>
                <button
                  onClick={() => { withdrawSavings(parseFloat(savingsAmount)); setShowSavingsModal(false); }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 py-1 rounded font-bold"
                >
                  WITHDRAW
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 leading-snug">Savings accumulate daily interest indexed to central bank rates (less 1.5% commission). 100% risk free.</span>
            </div>
          )}
        </div>

        {/* Debt & Bonds */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md relative">
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
            <span>Debt & Bonds</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setShowLoanModal(!showLoanModal); setShowSavingsModal(false); setShowBondsModal(false); }}
                className="text-[8px] text-cyan-400 font-bold font-mono underline hover:text-cyan-300"
              >
                LOAN
              </button>
              <button
                onClick={() => { setShowBondsModal(!showBondsModal); setShowSavingsModal(false); setShowLoanModal(false); }}
                className="text-[8px] text-emerald-400 font-bold font-mono underline hover:text-emerald-300"
              >
                BONDS
              </button>
            </div>
          </div>
          <p className="text-sm font-black font-mono text-zinc-100 mt-1">
            Debt: {formatCurrencyLarge(state.debt)}
          </p>
          <p className="text-[10px] font-mono text-zinc-400 font-semibold">
            Bonds Active: {state.bonds.length} holdings
          </p>

          {/* Debt Modal */}
          {showLoanModal && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-40 w-64 flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center font-bold text-zinc-300 uppercase text-[10px]">
                <span>Corporate credit desk</span>
                <button onClick={() => setShowLoanModal(false)} className="text-zinc-500 hover:text-zinc-300">✕</button>
              </div>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 font-mono text-white text-xs focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { borrowCash(parseFloat(loanAmount)); setShowLoanModal(false); }}
                  className="flex-1 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 py-1 rounded font-bold"
                >
                  BORROW
                </button>
                <button
                  onClick={() => { repayDebt(parseFloat(loanAmount)); setShowLoanModal(false); }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 py-1 rounded font-bold"
                >
                  REPAY
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 leading-snug">Max borrowing capacity: {diffConfig.leverageMaxMultiplier}x net worth. Interest charged daily. Low reputation raises rate markup.</span>
            </div>
          )}

          {/* Bonds Modal */}
          {showBondsModal && (
            <div className="absolute top-full right-0 mt-2 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-40 w-72 flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center font-bold text-zinc-300 uppercase text-[10px]">
                <span>Purchase Treasury Bonds</span>
                <button onClick={() => setShowBondsModal(false)} className="text-zinc-500 hover:text-zinc-300">✕</button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-500 uppercase">Bond type</span>
                <select
                  value={bondType}
                  onChange={(e) => setBondType(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-850 p-1.5 rounded text-white text-xs"
                >
                  <option value="TreasuryBill">30d Govt T-Bill (Yield: {(state.interestRate * 100 - 0.5).toFixed(1)}%)</option>
                  <option value="GovBond">60d Govt Bond (Yield: {(state.interestRate * 100 + 1.0).toFixed(1)}%)</option>
                  <option value="CorpBond">90d Corporate Bond (Yield: 8.5%)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-500 uppercase">Face Value Amount ($)</span>
                <input
                  type="number"
                  value={bondFaceValue}
                  onChange={(e) => setBondFaceValue(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 p-1.5 rounded text-white text-xs text-right"
                />
              </div>
              <button
                onClick={() => { buyBond(bondType, parseFloat(bondFaceValue)); setShowBondsModal(false); }}
                className="w-full bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 py-1.5 rounded font-bold uppercase text-[10px] tracking-wider"
              >
                PROHIBIT MATURITY CONTRACT
              </button>

              {/* List active bonds */}
              <div className="border-t border-zinc-800 pt-2 flex flex-col gap-1 max-h-[120px] overflow-y-auto">
                <span className="text-[8px] text-zinc-400 font-bold uppercase">Active Holdings:</span>
                {state.bonds.length === 0 ? (
                  <span className="text-[9px] text-zinc-600 italic">No bonds locked.</span>
                ) : (
                  state.bonds.map((b) => (
                    <div key={b.id} className="flex justify-between text-[9px] text-zinc-400 border-b border-zinc-900 pb-1">
                      <span>{b.type.replace('Gov', 'Govt')} (${b.faceValue.toLocaleString()})</span>
                      <span className="text-emerald-400">{(b.yieldRate * 100).toFixed(1)}% | Mat: Day {b.maturityTurn}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reputation Multi-Metrics */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md relative group select-none">
          <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Compliance Indexes</span>
          
          <div className="flex flex-col gap-1 mt-1 font-mono text-[9px] text-zinc-400 leading-none">
            <div className="flex justify-between">
              <span>Public Rep:</span>
              <span className="text-white font-bold">{Math.round(state.reputationPublic)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Corp Rep:</span>
              <span className="text-white font-bold">{Math.round(state.reputationCorporate)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Pol Rep:</span>
              <span className="text-white font-bold">{Math.round(state.reputationPolitical)}%</span>
            </div>
            <div className={`flex justify-between ${state.legalRisk > 40 ? 'text-rose-400 font-bold animate-pulse' : ''}`}>
              <span>Legal Risk:</span>
              <span>{Math.round(state.legalRisk)}%</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2.5 text-[9px] font-mono text-zinc-500 font-bold">
            <span>DAY {state.turn}</span>
            <span>{state.date}</span>
          </div>
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="flex items-center justify-between lg:justify-end gap-4 z-10 select-none">
        {state && state.inbox && setActiveConsoleTab && (
          <InboxNotificationBell
            unreadCount={state.inbox.filter(m => !m.isRead && !m.isArchived).length}
            onClick={() => setActiveConsoleTab('INBOX')}
          />
        )}
        {currentUser && (
          <div className="flex items-center gap-2.5 bg-zinc-900/40 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-sm font-sans flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-800/40">
              {getAvatarIcon(currentUser.avatar, 16, 'text-cyan-400')}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-zinc-200 font-bold tracking-tight leading-none mb-0.5">{currentUser.username}</span>
              <span className="text-[8px] text-zinc-500 font-semibold">{currentUser.fullName}</span>
            </div>
            <button
              onClick={() => {
                if (confirm('Logout of active trading session?')) {
                  logoutUser();
                }
              }}
              className="ml-2 px-2.5 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/60 hover:border-rose-800 text-rose-400 hover:text-rose-300 transition-all uppercase text-[9px] font-black tracking-wider flex items-center gap-1"
            >
              <LogOut size={10} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
