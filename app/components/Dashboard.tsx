"use client";

import React, { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { PortfolioSummary } from './PortfolioSummary';
import { AssetTicker } from './AssetTicker';
import { MarketChart } from './MarketChart';
import { GeopoliticalMap } from './GeopoliticalMap';
import { EventModal } from './EventModal';
import { NewsTicker } from './NewsTicker';
import { Boardroom } from './Boardroom';
import { Politics } from './Politics';
import { OptionsDesk } from './OptionsDesk';
import { TutorialPanel } from './TutorialPanel';
import { InboxPanel } from './inbox/InboxPanel';
import { InboxNotificationBell } from './inbox/InboxNotificationBell';
import { DebugStation } from './debug/DebugStation';
import { EXPANDED_ASSETS, AssetConfig } from '../data/assets';
import { GameState } from '../lib/simulationEngine';
import { PLAYER_BACKGROUNDS } from '../data/playerBackgrounds';
import { DIFFICULTY_MODES } from '../data/difficultyModes';
import {
  LayoutDashboard,
  LineChart,
  Briefcase,
  Wallet,
  Newspaper,
  Radio,
  Landmark,
  Building2,
  ShieldAlert,
  Scale,
  UserCircle,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  Clock,
  TriangleAlert,
  Lock,
  AlertTriangle,
  XCircle,
  Zap,
  BarChart3,
  Bot,
  Gauge,
  Shield,
  CircleDollarSign,
  Mail
} from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'briefcase', label: 'Broker', Icon: Briefcase },
  { id: 'barchart', label: 'Analyst', Icon: BarChart3 },
  { id: 'landmark', label: 'Senator', Icon: Landmark },
  { id: 'building', label: 'Banker', Icon: Building2 },
  { id: 'gauge', label: 'Arbitrage', Icon: Gauge },
  { id: 'trendingup', label: 'Bull', Icon: TrendingUp },
  { id: 'trendingdown', label: 'Bear', Icon: TrendingDown },
  { id: 'bot', label: 'AI Bot', Icon: Bot }
];

function AvatarIcon({ avatarId, size = 24, className = '' }: { avatarId: string; size?: number; className?: string }) {
  const avatar = AVATAR_OPTIONS.find(a => avatarId.startsWith(a.id));
  if (avatar) {
    const IconComp = avatar.Icon;
    return <IconComp size={size} className={className || 'text-cyan-400'} />;
  }
  // Fallback for legacy emoji avatars
  return <UserCircle size={size} className={className || 'text-cyan-400'} />;
}

export function Dashboard() {
  const {
    state,
    gameSpeed,
    setGameSpeed,
    activePrompt,
    showPromptOutcome,
    handleDecision,
    closeOutcomeModal,
    buyAsset,
    sellAsset,
    sellShort,
    coverShort,
    borrowCash,
    repayDebt,
    buyBond,
    depositSavings,
    withdrawSavings,
    buyOption,
    executeBoardroomAction,
    advancePoliticalCareer,
    voteLegislativeAction,
    advanceTutorial,
    completeTutorial,
    startNewGame,
    resetGame,
    triggerCheat,
    mounted,
    currentUser,
    registerUser,
    loginUser,
    logoutUser,
    resetUserProgress,
    actionInboxMessage,
    archiveInboxMessage,
    readInboxMessage,
    setStateOverride
  } = useGameState();

  // Character Setup States
  const [selectedBg, setSelectedBg] = useState<string>('RETAIL_TRADER');
  const [selectedDiff, setSelectedDiff] = useState<string>('NORMAL');
  const [selectedGoal, setSelectedGoal] = useState<string>('SANDBOX');

  // Main UI States
  const [selectedAssetId, setSelectedAssetId] = useState<string>('FRUT');
  const [tradeQuantity, setTradeQuantity] = useState<string>('50');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'TRADE' | 'OPTIONS' | 'BOARDROOM' | 'POLITICS' | 'ACCOUNT' | 'DEBUG' | 'INBOX'>('TRADE');
  const [logTab, setLogTab] = useState<'TRANSACTIONS' | 'WORLD_EVENTS'>('TRANSACTIONS');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);

  // Auth Form States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authFullName, setAuthFullName] = useState<string>('');
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPwd, setAuthPwd] = useState<string>('');
  const [authAvatar, setAuthAvatar] = useState<string>('briefcase:Broker');
  const [authError, setAuthError] = useState<string | null>(null);

  // Debug unlock state
  const [isDebugUnlocked, setIsDebugUnlocked] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('ultra_trading_sim_debug');
    if (saved === 'true') {
      setIsDebugUnlocked(true);
    }
  }, []);

  const handleUnlockDebug = () => {
    setIsDebugUnlocked(true);
    localStorage.setItem('ultra_trading_sim_debug', 'true');
  };

  // Setup options list
  const winGoals = [
    { id: 'NET_WORTH', name: 'Trillionaire Empire', desc: 'Reach $1,000,000,000 Net Worth.' },
    { id: 'PRESIDENT', name: 'Political Sovereign', desc: 'Campaign and win election to President/PM.' },
    { id: 'AGI_MONOPOLY', name: 'AI Singularity Master', desc: 'Acquire 50% shares in Cognitive AI (COGN) to lead AGI.' },
    { id: 'SANDBOX', name: 'Infinite Sandbox', desc: 'No fixed target. Accumulate money and influence at your own pace.' }
  ];

  useEffect(() => {
    if (state) {
      const isSelectedPrivate = state.companies[selectedAssetId]?.isPrivate;
      if (!selectedAssetId || isSelectedPrivate) {
        const firstActive = EXPANDED_ASSETS.find(asset => !state.companies[asset.id]?.isPrivate);
        if (firstActive) {
          setSelectedAssetId(firstActive.id);
        }
      }
    }
  }, [state, selectedAssetId]);

  // Avatar options are defined in AVATAR_OPTIONS constant at top of file

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authUsername.trim()) {
      setAuthError("Username is required.");
      return;
    }
    if (!authPwd) {
      setAuthError("Password is required.");
      return;
    }
    if (authMode === 'register') {
      if (!authFullName.trim()) {
        setAuthError("Full Name is required.");
        return;
      }
      if (!authEmail.trim() || !/\S+@\S+\.\S+/.test(authEmail)) {
        setAuthError("Please enter a valid email address.");
        return;
      }
      if (authPwd.length < 6) {
        setAuthError("Password must be at least 6 characters long.");
        return;
      }
      try {
        registerUser(authFullName, authUsername, authEmail, authPwd, authAvatar);
      } catch (err: any) {
        setAuthError(err.message || "Registration failed.");
      }
    } else {
      try {
        loginUser(authUsername, authPwd);
      } catch (err: any) {
        setAuthError(err.message || "Invalid username or password.");
      }
    }
  };

  if (mounted && !currentUser) {
    return (
      <div className="flex-1 bg-zinc-950 text-zinc-100 min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 scanline pointer-events-none opacity-25"></div>

        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-md glow-blue flex flex-col gap-6 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              Trading Sim
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-2 leading-relaxed">
              Build your market empire. Trade assets, react to crises, and grow your portfolio.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            {authError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/80 rounded-lg text-rose-400 text-xs font-mono flex items-center gap-2">
                <TriangleAlert size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authMode === 'register' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase pl-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500/80 transition-colors"
                    placeholder="e.g. Warren Buffett"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase pl-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500/80 transition-colors"
                    placeholder="e.g. warren@berkshire.com"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase pl-1">Username</label>
              <input
                type="text"
                required
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500/80 transition-colors"
                placeholder="e.g. sageofomaha"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase pl-1">Password</label>
              <input
                type="password"
                required
                value={authPwd}
                onChange={(e) => setAuthPwd(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500/80 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {authMode === 'register' && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase pl-1">Select Profile Avatar</label>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {AVATAR_OPTIONS.map((av) => {
                    const avatarKey = `${av.id}:${av.label}`;
                    const IconComp = av.Icon;
                    return (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setAuthAvatar(avatarKey)}
                        className={`p-2.5 rounded-lg border font-mono transition-all text-[11px] flex flex-col items-center gap-1.5 ${
                          authAvatar === avatarKey
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-inner'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <IconComp size={20} />
                        <span className="text-[9px] font-bold">{av.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 font-bold font-mono py-3 rounded-lg text-xs transition-all uppercase tracking-wider shadow-inner"
            >
              {authMode === 'login' ? 'Access Terminal Grid' : 'Create Simulator Profile'}
            </button>
          </form>

          <div className="flex flex-col items-center gap-3 border-t border-zinc-850 pt-4">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline focus:outline-none"
            >
              {authMode === 'login' ? "Don't have an account? Register here" : "Already have an account? Login here"}
            </button>
            <span className="text-[9px] text-zinc-500 font-mono text-center leading-normal flex items-center justify-center gap-1">
              <Lock size={10} className="text-zinc-500 shrink-0" /> Accounts and sessions are saved locally in your browser's localStorage.
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center text-cyan-400 font-mono text-sm p-8 min-h-screen">
        <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
        <div className="flex flex-col items-center gap-4">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent border-cyan-400 animate-spin"></span>
          <span className="animate-pulse tracking-widest font-black uppercase text-xs">Booting Terminal Grid...</span>
        </div>
      </div>
    );
  }

  // 1. Render Character Selection Setup screen if state is null
  if (!state) {
    return (
      <div className="flex-1 bg-zinc-950 text-zinc-100 min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 scanline pointer-events-none opacity-25"></div>

        <div className="w-full max-w-5xl bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-md glow-blue flex flex-col gap-8 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              Trading Sim
            </h1>
            <p className="text-xs text-zinc-550 font-mono uppercase tracking-widest mt-1">Configure Simulation Credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Background selection */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">Choose Career Background</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {PLAYER_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBg(bg.id)}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden ${
                      selectedBg === bg.id
                        ? 'bg-zinc-900 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                        : 'bg-zinc-900/35 border-zinc-850 hover:bg-zinc-900/50 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-black font-mono text-white">{bg.name}</span>
                      <span className="text-[9px] font-mono text-zinc-500">Cash: ${bg.startingCash.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal font-mono">{bg.description}</p>
                    <div className="text-[9px] text-cyan-400 font-semibold font-mono border-t border-zinc-850/80 pt-1.5 mt-1">
                      Perk: {bg.perkDescription}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty and Goals */}
            <div className="flex flex-col gap-6">
              
              {/* Difficulty */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">Difficulty</h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {DIFFICULTY_MODES.map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => setSelectedDiff(diff.id)}
                      className={`py-2 px-1.5 rounded-lg border font-bold transition-all ${
                        selectedDiff === diff.id
                          ? 'bg-cyan-950 border-cyan-800 text-cyan-300 shadow-inner'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={diff.description}
                    >
                      {diff.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Victory Goals */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">Imperial Victory Goal</h3>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 focus:outline-none"
                >
                  {winGoals.map((wg) => (
                    <option key={wg.id} value={wg.id}>{wg.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 leading-normal">
                  {winGoals.find(w => w.id === selectedGoal)?.desc}
                </p>
              </div>

            </div>

          </div>

          <button
            onClick={() => {
              startNewGame(selectedBg, selectedDiff, selectedGoal);
              // Set default selected asset based on expanded list
              setSelectedAssetId('FRUT');
              // Set initial tutorial step to 1
              setTimeout(() => {
                advanceTutorial(1);
              }, 100);
            }}
            className="w-full bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 font-bold font-mono py-4 rounded-xl text-sm transition-all uppercase tracking-wider shadow-inner glow-green"
          >
            INITIALIZE SIMULATION SYSTEM
          </button>
        </div>
      </div>
    );
  }

  // 2. Main Dashboard rendering
  const calculateScore = (s: GameState) => {
    let totalAssetValue = 0;
    EXPANDED_ASSETS.forEach(asset => {
      const qty = s.holdings[asset.id] || 0;
      totalAssetValue += qty * s.currentPrices[asset.id];
    });
    let shortLiabilities = 0;
    Object.keys(s.shortPositions).forEach(id => {
      shortLiabilities += s.shortPositions[id] * s.currentPrices[id];
    });
    const netWorth = s.cash + s.savings + totalAssetValue - s.debt - shortLiabilities;
    const passedBillsCount = s.passedBills ? s.passedBills.length : 0;

    // Time efficiency multiplier (completing in fewer turns adds more multiplier)
    const timeMultiplier = Math.max(1.0, parseFloat((5.0 - (s.turn / 60.0)).toFixed(2)));

    if (s.gameStatus === 'VICTORY') {
      if (s.goal === 'NET_WORTH') {
        // Goal: Trillionaire Empire. Score based on turn speed + support parameters.
        const speedBase = 5000000 / Math.max(1, s.turn);
        const influenceBonus = s.politicalInfluence * 1000;
        const repBonus = (s.reputationCorporate + s.reputationPublic) * 100;
        return Math.round((speedBase + influenceBonus + repBonus) * timeMultiplier);
      } else if (s.goal === 'PRESIDENT') {
        // Goal: Political Sovereign (PM/President). Score based on political influence, bills passed, and speed of ascendancy.
        const repSum = s.reputationPublic + s.reputationCorporate + s.reputationPolitical;
        const influencePoints = s.politicalInfluence * 5000;
        const billsBonus = passedBillsCount * 15000;
        const speedBase = 10000000 / Math.max(1, s.turn);
        return Math.round((speedBase + repSum * 500 + influencePoints + billsBonus) * timeMultiplier);
      } else if (s.goal === 'AGI_MONOPOLY') {
        // Goal: AGI Singularity Master. Score based on corporate speed, R&D, and trade activity.
        const speedBase = 6000000 / Math.max(1, s.turn);
        const corpRepBonus = s.reputationCorporate * 2000;
        const totalTradesBonus = s.tradesCount * 50;
        return Math.round((speedBase + corpRepBonus + totalTradesBonus) * timeMultiplier);
      }
    }

    // Default / Bankruptcy score: Capped net worth to prevent trillions from bloating score.
    const scaledNetWorth = netWorth > 0 ? Math.floor(netWorth / 50000) : 0;
    const defaultScore = scaledNetWorth + (s.politicalInfluence * 100) + (passedBillsCount * 1000) - (s.turn * 10);
    return Math.max(0, Math.round(defaultScore));
  };

  if (state && (state.gameStatus === 'VICTORY' || state.gameStatus === 'BANKRUPTCY')) {
    const score = calculateScore(state);
    const totalAssetValue = Object.keys(state.holdings).reduce((sum, id) => sum + (state.holdings[id] * (state.currentPrices[id] || 0)), 0);
    const shortLiabs = Object.keys(state.shortPositions).reduce((sum, id) => sum + (state.shortPositions[id] * (state.currentPrices[id] || 0)), 0);
    const netWorth = state.cash + state.savings + totalAssetValue - state.debt - shortLiabs;
    const isVictory = state.gameStatus === 'VICTORY';
    
    return (
      <div className="flex-1 bg-zinc-950 text-zinc-100 min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 scanline pointer-events-none opacity-25"></div>
        
        <div className={`w-full max-w-xl border rounded-2xl p-8 backdrop-blur-md relative z-10 flex flex-col gap-6 text-center select-none ${
          isVictory 
            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
            : 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
        }`}>
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${isVictory ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}>
              {isVictory ? 'IMPERIAL VICTORY' : 'LIQUIDATION DEFAULT'}
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">
              {isVictory ? 'Goal Accomplished Successfully' : 'Bankruptcy & Insolvency Filing'}
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-left font-mono text-xs flex flex-col gap-3">
            <h3 className="text-zinc-400 font-bold uppercase text-[10px] border-b border-zinc-800 pb-2 tracking-wider">Account Audit Breakdown</h3>
            
            <div className="flex justify-between">
              <span>Goal Selected:</span>
              <span className="text-zinc-300 font-bold">{winGoals.find(w => w.id === state.goal)?.name || 'Custom'}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Time Elapsed:</span>
              <span className="text-zinc-300 font-bold">{state.turn} Market Days</span>
            </div>
            <div className="flex justify-between border-t border-zinc-850 pt-2">
              <span>Final Net Worth:</span>
              <span className={`font-bold ${netWorth >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cash & Savings:</span>
              <span className="text-zinc-300">${(state.cash + state.savings).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Outstanding Debt:</span>
              <span className="text-rose-400">${state.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-850 pt-2">
              <span>Political Influence:</span>
              <span className="text-indigo-400 font-bold">{state.politicalInfluence} points</span>
            </div>
            <div className="flex justify-between">
              <span>Passed Legislative Bills:</span>
              <span className="text-emerald-400 font-bold">{state.passedBills ? state.passedBills.length : 0}</span>
            </div>

            <div className={`flex justify-between border-t border-zinc-800 pt-3 mt-2 text-sm font-black uppercase tracking-wider ${isVictory ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>Corporate Score:</span>
              <span>{score.toLocaleString()} PTS</span>
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-mono leading-relaxed px-4">
            {isVictory 
              ? `Congratulations, Agent. Your financial empire has achieved absolute dominance. Your credentials have been uploaded to the high-score matrix.`
              : `Your credits have defaulted. The commercial banking system has closed all active accounts and liquidated your holdings to repay outstanding liabilities.`
            }
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                resetGame();
              }}
              className={`w-full font-bold font-mono py-3 rounded-xl text-xs transition-all uppercase tracking-wider ${
                isVictory
                  ? 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300'
              }`}
            >
              Start New Simulation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedAsset = EXPANDED_ASSETS.find(a => a.id === selectedAssetId) || EXPANDED_ASSETS[0];
  const currentPrice = state.currentPrices[selectedAssetId] || selectedAsset.basePrice;
  const priceHistory = state.marketHistory[selectedAssetId] || [];

  const sharesOwned = state.holdings[selectedAssetId] || 0;
  const shortQty = state.shortPositions[selectedAssetId] || 0;

  const qty = parseInt(tradeQuantity);
  const isValidQty = !isNaN(qty) && qty > 0;
  const cost = isValidQty ? qty * currentPrice : 0;

  // Margin limits calculations
  let totalLongAssetsValue = 0;
  EXPANDED_ASSETS.forEach(asset => {
    totalLongAssetsValue += (state.holdings[asset.id] || 0) * state.currentPrices[asset.id];
  });
  let totalShortLiabs = 0;
  Object.keys(state.shortPositions).forEach(id => {
    totalShortLiabs += state.shortPositions[id] * state.currentPrices[id];
  });

  const playerNetWorth = state.cash + state.savings + totalLongAssetsValue - state.debt - totalShortLiabs;
  const diffConfig = DIFFICULTY_MODES.find(d => d.id === state.difficulty) || DIFFICULTY_MODES[1];
  const maxLeverageScale = state.background === 'EX_BANKER' ? 4.0 : diffConfig.leverageMaxMultiplier;
  const maxAllowedBorrow = playerNetWorth * maxLeverageScale;
  
  const remainingBorrowPower = Math.max(0, maxAllowedBorrow - state.debt);
  const totalBuyPower = state.cash + remainingBorrowPower;
  const maxSharesAffordable = Math.floor(totalBuyPower / currentPrice);

  const isMarginRequired = cost > state.cash;
  const isAffordable = cost <= totalBuyPower;

  const handleQuickPercent = (pct: number) => {
    const cashShare = totalBuyPower * pct;
    const count = Math.floor(cashShare / currentPrice);
    setTradeQuantity(Math.max(1, count).toString());
  };

  const handleMaxSell = () => {
    setTradeQuantity(sharesOwned.toString());
  };

  const handleMaxCover = () => {
    setTradeQuantity(shortQty.toString());
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 min-h-screen font-sans relative">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Scrolling top news ticker */}
      <NewsTicker logs={state.eventLogs} />

      {/* Header bar */}
      <PortfolioSummary
        state={state}
        gameSpeed={gameSpeed}
        setGameSpeed={setGameSpeed}
        borrowCash={borrowCash}
        repayDebt={repayDebt}
        buyBond={buyBond}
        depositSavings={depositSavings}
        withdrawSavings={withdrawSavings}
        resetGame={resetGame}
        currentUser={currentUser}
        logoutUser={logoutUser}
        setActiveConsoleTab={setActiveConsoleTab}
      />

      {/* Main dashboard grid */}
      <div className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-5 gap-6 overflow-y-auto">
        
        {/* Left Column: Asset selection sidebar */}
        <div className={`xl:col-span-1 transition-all duration-300 ${isSidebarExpanded ? 'h-[480px] xl:h-full min-h-[420px]' : 'h-auto xl:h-full'}`}>
          {/* Mobile target panel */}
          <div className="xl:hidden flex justify-between items-center mb-3 bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 font-mono">TARGET:</span>
              <span className="text-xs font-black font-mono text-cyan-400">{selectedAsset.ticker} (${currentPrice.toFixed(2)})</span>
            </div>
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="text-[10px] font-mono font-bold text-cyan-400 px-3 py-1 rounded bg-zinc-850 hover:bg-zinc-850/80 border border-zinc-700 hover:text-cyan-300 transition-colors"
            >
              {isSidebarExpanded ? 'COLLAPSE ✕' : 'SELECT ASSET ☰'}
            </button>
          </div>
          
          <div className={`${!isSidebarExpanded ? 'hidden xl:block' : 'block'} h-[430px] xl:h-full`}>
            <AssetTicker
              state={state}
              selectedAssetId={selectedAssetId}
              onSelectAssetId={(id) => {
                setSelectedAssetId(id);
                setIsSidebarExpanded(false);
              }}
            />
          </div>
        </div>

        {/* Center column: Tab sheets */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Navigation tab bar for central action consoles */}
          <div className="flex border-b border-zinc-800 text-xs font-mono font-bold select-none z-10 gap-2 flex-wrap">
            {[
              { id: 'TRADE', label: 'TRADING DESK', Icon: LineChart },
              { id: 'OPTIONS', label: 'OPTIONS CHAIN', Icon: Wallet },
              { id: 'BOARDROOM', label: 'BOARDROOM STRATEGY', Icon: Building2 },
              { id: 'POLITICS', label: 'CAMPAIGNS & BILLS', Icon: Landmark },
              { id: 'INBOX', label: 'MESSAGES', Icon: Mail, badge: state && state.inbox ? state.inbox.filter(m => !m.isRead && !m.isArchived).length : 0 },
              { id: 'ACCOUNT', label: 'MY ACCOUNT', Icon: UserCircle },
              ...(isDebugUnlocked ? [{ id: 'DEBUG', label: 'DEBUG PANEL', Icon: Settings }] : [])
            ].map((tab) => {
              const IconComponent = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveConsoleTab(tab.id as any)}
                  className={`pb-2 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
                    activeConsoleTab === tab.id
                      ? 'border-cyan-500 text-cyan-400 font-bold'
                      : 'border-transparent text-zinc-550 hover:text-zinc-300'
                  }`}
                >
                  <IconComponent size={13} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[8px] font-black text-white border border-zinc-950 animate-pulse-glow">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab sheets content */}
          <div className="flex-1 min-h-[380px]">
            {activeConsoleTab === 'TRADE' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <MarketChart
                      history={priceHistory}
                      assetName={selectedAsset.name}
                      ticker={selectedAsset.ticker}
                      currentPrice={currentPrice}
                      avgBuyPrice={state.holdingsAvgPrice[selectedAsset.id] || 0}
                      difficulty={state.difficulty}
                    />
                  </div>
                  
                  <div className="lg:col-span-1">
                    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md glow-blue flex flex-col justify-between relative overflow-hidden h-full">
                      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

                      <div>
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-3">
                          <h3 className="text-xs font-black font-mono text-zinc-400 uppercase tracking-widest">Order Entry</h3>
                          <span className="text-[9px] font-mono text-cyan-400 font-bold">{selectedAsset.ticker}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-850 p-2 rounded-lg">
                            <span className="text-xs text-zinc-400 font-mono pl-1">Shares</span>
                            <input
                              type="number"
                              min="1"
                              value={tradeQuantity}
                              onChange={(e) => setTradeQuantity(e.target.value)}
                              className="bg-transparent text-right font-mono font-black text-white text-base focus:outline-none w-24 pr-1"
                            />
                          </div>

                          {/* Hotkeys */}
                          <div className="grid grid-cols-5 gap-1 text-[8px] font-mono font-bold select-none">
                            <button onClick={() => handleQuickPercent(0.1)} className="py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300">10%</button>
                            <button onClick={() => handleQuickPercent(0.25)} className="py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300">25%</button>
                            <button onClick={() => handleQuickPercent(0.50)} className="py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300">50%</button>
                            <button onClick={handleMaxSell} className="py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-550 hover:text-zinc-305">MAX S</button>
                            <button onClick={handleMaxCover} className="py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-555 hover:text-zinc-310">MAX C</button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-3 text-[10px] font-mono text-zinc-400 select-none border-t border-zinc-850 pt-2.5">
                          <div className="flex justify-between">
                            <span>Cost:</span>
                            <span className="text-white font-bold">${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Buy Power:</span>
                            <span className="text-white font-bold">${totalBuyPower.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          {isMarginRequired && isAffordable && (
                            <div className="bg-rose-950/20 border border-rose-900/60 p-1 rounded text-[8.5px] text-rose-300 leading-snug mt-1 flex items-center gap-1">
                              <AlertTriangle size={10} className="shrink-0" /> Margin borrow: ${(cost - state.cash).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          )}
                          {!isAffordable && isValidQty && (
                            <div className="bg-rose-950/40 border border-rose-900/80 p-1 rounded text-[8.5px] text-rose-400 font-bold leading-snug mt-1 flex items-center gap-1">
                              <XCircle size={10} className="shrink-0" /> Limit: {maxSharesAffordable} shares.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Buy/Sell/Short/Cover buttons + Single Buy/Sell next to them */}
                      <div className="flex flex-col gap-2 mt-3 select-none">
                        {/* Buy Line */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => buyAsset(selectedAsset.id, qty)}
                            disabled={!isValidQty || !isAffordable}
                            className="flex-1 py-1.5 rounded bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 font-mono font-bold text-xs uppercase"
                          >
                            Buy Long ({qty})
                          </button>
                          <button
                            onClick={() => buyAsset(selectedAsset.id, 1)}
                            disabled={state.cash < currentPrice}
                            className="px-2 py-1.5 rounded bg-emerald-950/60 border border-emerald-900 hover:bg-emerald-900/80 text-emerald-400 font-mono font-bold text-xs"
                            title="Buy 1 share"
                          >
                            +1
                          </button>
                        </div>
                        
                        {/* Sell Line */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => sellAsset(selectedAsset.id, qty)}
                            disabled={!isValidQty || sharesOwned < qty}
                            className="flex-1 py-1.5 rounded bg-rose-950 border border-rose-850 hover:bg-rose-900 text-rose-300 font-mono font-bold text-xs uppercase"
                          >
                            Sell Close ({qty})
                          </button>
                          <button
                            onClick={() => sellAsset(selectedAsset.id, 1)}
                            disabled={sharesOwned < 1}
                            className="px-2 py-1.5 rounded bg-rose-950/60 border border-rose-900 hover:bg-rose-900/80 text-rose-400 font-mono font-bold text-xs"
                            title="Sell 1 share"
                          >
                            -1
                          </button>
                        </div>

                        {/* Short Line */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => sellShort(selectedAsset.id, qty)}
                            disabled={!isValidQty || !isAffordable}
                            className="flex-1 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-mono font-bold text-xs uppercase"
                          >
                            Short Sell ({qty})
                          </button>
                          <button
                            onClick={() => sellShort(selectedAsset.id, 1)}
                            disabled={!isAffordable}
                            className="px-2 py-1.5 rounded bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 text-zinc-450 font-mono font-bold text-xs"
                            title="Short 1 share"
                          >
                            -1
                          </button>
                        </div>

                        {/* Cover Line */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => coverShort(selectedAsset.id, qty)}
                            disabled={!isValidQty || shortQty < qty}
                            className="flex-1 py-1.5 rounded bg-cyan-950 border border-cyan-850 hover:bg-cyan-900 text-cyan-300 font-mono font-bold text-xs uppercase"
                          >
                            Cover Short ({qty})
                          </button>
                          <button
                            onClick={() => coverShort(selectedAsset.id, 1)}
                            disabled={shortQty < 1}
                            className="px-2 py-1.5 rounded bg-cyan-950/60 border border-cyan-900 hover:bg-cyan-900/80 text-cyan-400 font-mono font-bold text-xs"
                            title="Cover 1 share"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md glow-blue flex flex-col md:flex-row gap-6 relative overflow-hidden h-full min-h-[220px]">
                  <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

                  {/* Left Side: Selected position statistics */}
                  <div className="flex-1">
                    <h3 className="text-xs font-black font-mono text-zinc-400 uppercase tracking-widest mb-3">Holdings & Entry Brief</h3>
                    
                    <div className="flex flex-col gap-2 font-mono text-xs select-none">
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span>LONG SHARES</span>
                        <span className="text-white font-bold">{sharesOwned.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span>AVG ENTRY COST</span>
                        <span className="text-white font-bold">${(state.holdingsAvgPrice[selectedAssetId] || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span>SHORT LIABILITIES</span>
                        <span className="text-white font-bold">{shortQty.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span>SHORT ENTRY PRICE</span>
                        <span className="text-white font-bold">${(state.shortPositionsEntryPrice[selectedAssetId] || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UNREALIZED LOSS/GAIN</span>
                        {sharesOwned > 0 ? (
                          <span className={currentPrice >= (state.holdingsAvgPrice[selectedAssetId] || 0) ? 'text-emerald-400' : 'text-rose-400'}>
                            ${((currentPrice - (state.holdingsAvgPrice[selectedAssetId] || 0)) * sharesOwned).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : shortQty > 0 ? (
                          <span className={(state.shortPositionsEntryPrice[selectedAssetId] || 0) >= currentPrice ? 'text-emerald-400' : 'text-rose-400'}>
                            ${(((state.shortPositionsEntryPrice[selectedAssetId] || 0) - currentPrice) * shortQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-zinc-500">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Company Description & analyst details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 select-none h-full">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block uppercase mb-1">Company Description & Outlook</span>
                      <p className="text-[10px] text-zinc-400 leading-normal">{selectedAsset.description}</p>
                      
                      {selectedAsset.type === 'Stock' && state.companies[selectedAsset.id] && (
                        <div className="mt-3 pt-3 border-t border-zinc-850 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500 font-bold uppercase">Analyst Consensus:</span>
                          <span className={`font-black uppercase ${
                            state.companies[selectedAsset.id].analystRating.includes('Buy') ? 'text-emerald-400' :
                            state.companies[selectedAsset.id].analystRating.includes('Sell') ? 'text-rose-400' : 'text-zinc-400'
                          }`}>
                            {state.companies[selectedAsset.id].analystRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Widget */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md glow-blue relative select-none">
                  <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-3 z-10">
                    <h3 className="text-xs font-black font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Briefcase size={12} className="text-cyan-400" />
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => setActiveConsoleTab('ACCOUNT')}
                      className="text-[9px] font-mono text-cyan-400 font-bold hover:text-cyan-300 underline uppercase"
                    >
                      View Profile & Stats
                    </button>
                  </div>
                  <div className="font-mono text-[10px] leading-relaxed flex flex-col gap-1.5 pr-1 max-h-[140px] overflow-y-auto">
                    {state.ledger.filter(tx => tx.type === 'BUY' || tx.type === 'SELL' || tx.type === 'SHORT' || tx.type === 'COVER').slice(0, 5).length === 0 ? (
                      <span className="text-zinc-650 italic">No trading transactions recorded yet. Execute buys or sells on the desk.</span>
                    ) : (
                      state.ledger.filter(tx => tx.type === 'BUY' || tx.type === 'SELL' || tx.type === 'SHORT' || tx.type === 'COVER').slice(0, 5).map((tx, idx) => (
                        <div key={idx} className="flex gap-2 border-b border-zinc-900 pb-1 text-zinc-400">
                          <span className="text-zinc-600 font-semibold">[{tx.date}]</span>
                          <span className={`font-bold uppercase ${
                            tx.type === 'BUY' ? 'text-cyan-400' :
                            tx.type === 'SELL' ? 'text-emerald-400' :
                            tx.type === 'SHORT' ? 'text-rose-400 font-bold' :
                            tx.type === 'COVER' ? 'text-indigo-400 font-semibold' : 'text-zinc-300'
                          }`}>
                            {tx.type}
                          </span>
                          <span>{tx.description}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MY ACCOUNT Tab Sheet */}
            {activeConsoleTab === 'ACCOUNT' && currentUser && (() => {
              // Calculate best/worst performing asset owned
              let bestAsset = 'None';
              let bestPerf = -Infinity;
              let worstAsset = 'None';
              let worstPerf = Infinity;

              EXPANDED_ASSETS.forEach(asset => {
                const qty = state.holdings[asset.id] || 0;
                if (qty > 0) {
                  const currentVal = state.currentPrices[asset.id];
                  const avgCost = state.holdingsAvgPrice[asset.id] || currentVal;
                  const perfPct = ((currentVal - avgCost) / (avgCost || 1)) * 100;
                  if (perfPct > bestPerf) {
                    bestPerf = perfPct;
                    bestAsset = `${asset.name} (${asset.ticker}): +${perfPct.toFixed(1)}%`;
                  }
                  if (perfPct < worstPerf) {
                    worstPerf = perfPct;
                    worstAsset = `${asset.name} (${asset.ticker}): ${perfPct.toFixed(1)}%`;
                  }
                }
              });

              if (bestPerf === -Infinity) bestAsset = 'No assets owned';
              if (worstPerf === Infinity) worstAsset = 'No assets owned';

              return (
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-md glow-blue flex flex-col gap-6 relative overflow-hidden h-full">
                  <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-1">
                    <h3 className="text-xs font-black font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <UserCircle size={14} className="text-cyan-400" />
                      Account Profile Details
                    </h3>
                    <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase">Grid Online</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                    {/* Left Column: Personal info */}
                    <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
                      <div className="flex items-center gap-4 border-b border-zinc-850 pb-3">
                        <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center">
                          <AvatarIcon avatarId={currentUser.avatar} size={24} className="text-cyan-400" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-white font-bold text-sm leading-tight">{currentUser.fullName}</span>
                          <span className="text-zinc-500 text-xs mt-0.5">@{currentUser.username}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-zinc-400">
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="text-zinc-200">{currentUser.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created On:</span>
                          <span className="text-zinc-200">{currentUser.createdAt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Difficulty Rules:</span>
                          <span className="text-zinc-200 font-bold uppercase text-cyan-400">{state.difficulty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Background Path:</span>
                          <span className="text-zinc-200">
                            {PLAYER_BACKGROUNDS.find(b => b.id === state.background)?.name || state.background}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Performance and stats */}
                    <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
                      <h4 className="text-zinc-300 font-bold border-b border-zinc-850 pb-2">Simulation Performance</h4>
                      
                      <div className="flex flex-col gap-2 text-zinc-400">
                        <div className="flex justify-between">
                          <span>Net Worth:</span>
                          <span className="text-cyan-400 font-bold">${playerNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available Cash:</span>
                          <span className="text-zinc-200">${state.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Portfolio Value:</span>
                          <span className="text-zinc-200">${totalLongAssetsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trades Executed:</span>
                          <span className="text-zinc-200 font-bold">{state.tradesCount || 0}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Best Performing:</span>
                          <span className="text-emerald-400 font-bold text-right break-words max-w-[160px]">{bestAsset}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Worst Performing:</span>
                          <span className="text-rose-400 font-bold text-right break-words max-w-[160px]">{worstAsset}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reset Progress Action */}
                  <div className="mt-4 border-t border-zinc-900 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Reset Active Progress</span>
                      <p className="text-[9px] text-zinc-600">This will wipe the current user's save state and start a fresh credentials setup.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to reset your simulation progress? This cannot be undone.")) {
                          resetUserProgress();
                        }
                      }}
                      className="px-4 py-2 bg-rose-950/20 hover:bg-rose-950/55 border border-rose-900/60 hover:border-rose-700 text-rose-400 hover:text-rose-300 font-bold rounded-lg uppercase tracking-wider text-[10px] transition-colors shadow-inner"
                    >
                      Reset Sim Progress
                    </button>
                  </div>
                </div>
              );
            })()}

            {activeConsoleTab === 'OPTIONS' && (
              <OptionsDesk
                state={state}
                buyOption={buyOption}
              />
            )}

            {activeConsoleTab === 'BOARDROOM' && (
              <Boardroom
                state={state}
                selectedAsset={selectedAsset}
                executeBoardroomAction={executeBoardroomAction}
                isDebugUnlocked={isDebugUnlocked}
                onUnlockDebug={handleUnlockDebug}
              />
            )}

            {activeConsoleTab === 'INBOX' && (
              <InboxPanel
                state={state}
                onActionMessage={actionInboxMessage}
                onArchiveMessage={archiveInboxMessage}
                onReadMessage={readInboxMessage}
              />
            )}

            {activeConsoleTab === 'DEBUG' && isDebugUnlocked && (
              <DebugStation
                state={state}
                setStateOverride={setStateOverride}
                onClose={() => {
                  localStorage.removeItem('ultra_trading_sim_debug');
                  setIsDebugUnlocked(false);
                  setActiveConsoleTab('TRADE');
                }}
              />
            )}

            {activeConsoleTab === 'POLITICS' && (
              <Politics
                state={state}
                advancePoliticalCareer={advancePoliticalCareer}
                voteLegislativeAction={voteLegislativeAction}
              />
            )}
          </div>

          {/* Console Ledger Output Shell */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md glow-blue flex flex-col h-[200px] overflow-hidden relative select-none">
            <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

            <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-3 z-10 select-none">
              <div className="flex gap-4 text-xs font-mono font-bold">
                <button
                  onClick={() => setLogTab('TRANSACTIONS')}
                  className={`transition-colors ${logTab === 'TRANSACTIONS' ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  [_] TRANSACTION LOGS
                </button>
                <button
                  onClick={() => setLogTab('WORLD_EVENTS')}
                  className={`transition-colors ${logTab === 'WORLD_EVENTS' ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  [_] WORLD CRISIS LOGS
                </button>
              </div>
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">SYS ACTIVE</span>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed z-10 flex flex-col gap-1 pr-1">
              {logTab === 'TRANSACTIONS' ? (
                state.ledger.length === 0 ? (
                  <span className="text-zinc-600 italic">No transactions recorded. Buy, short, or buy options to log logs.</span>
                ) : (
                  state.ledger.map((tx, idx) => (
                    <div key={idx} className="flex gap-2 border-b border-zinc-900 pb-1 text-zinc-400">
                      <span className="text-zinc-650 font-bold">[{tx.date}]</span>
                      <span className={`font-bold ${
                        tx.type === 'BUY' ? 'text-cyan-400' :
                        tx.type === 'SELL' ? 'text-emerald-400' :
                        tx.type === 'SHORT' ? 'text-rose-400 font-bold' :
                        tx.type === 'LIQUIDATION' ? 'text-rose-500 font-black animate-pulse' : 'text-zinc-300'
                      }`}>
                        {tx.type}
                      </span>
                      <span>{tx.description}</span>
                    </div>
                  ))
                )
              ) : (
                state.eventLogs.length === 0 ? (
                  <span className="text-zinc-650 italic">No news reports recorded. Watch the economic shifts.</span>
                ) : (
                  state.eventLogs.map((log, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 border-b border-zinc-900 pb-1 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-650 font-bold">[{log.date}]</span>
                        <span className={`font-black tracking-tight ${log.isUrgent ? 'text-rose-400' : 'text-zinc-200'}`}>{log.headline.toUpperCase()}</span>
                      </div>
                      <p className="text-[9.5px] text-zinc-500 pl-4">{log.description}</p>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Geopolitical gauge metrics */}
        <div className="xl:col-span-1 h-[520px] xl:h-full min-h-[460px]">
          <GeopoliticalMap
            state={state}
            lobbyCongress={voteLegislativeAction}
          />
        </div>
      </div>



      {/* Directives popup modals */}
      <EventModal
        activePrompt={activePrompt}
        showPromptOutcome={showPromptOutcome}
        handleDecision={handleDecision}
        closeOutcomeModal={closeOutcomeModal}
        playerCash={state.cash}
      />

      {/* Onboarding guided tutorial panel */}
      <TutorialPanel
        state={state}
        advanceTutorial={advanceTutorial}
        completeTutorial={completeTutorial}
        gameSpeed={gameSpeed}
      />
    </div>
  );
}
