import React, { useState } from 'react';
import { GameState, CompanyState } from '../lib/simulationEngine';
import { AssetConfig } from '../data/assets';
import { Building2, Lock, KeyRound, ShieldCheck, Pickaxe, X } from 'lucide-react';

interface BoardroomProps {
  state: GameState;
  selectedAsset: AssetConfig;
  executeBoardroomAction: (
    assetId: string,
    action: 'RD' | 'COST' | 'BUYBACK' | 'ISSUE' | 'STRATEGY' | 'PRIVATE',
    value?: any
  ) => void;
  isDebugUnlocked: boolean;
  onUnlockDebug: () => void;
}

export function Boardroom({ 
  state, 
  selectedAsset, 
  executeBoardroomAction,
  isDebugUnlocked,
  onUnlockDebug
}: BoardroomProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPortal, setShowPortal] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'pujan-admin' && password === 'admin-pujan') {
      onUnlockDebug();
      setLoginError('');
      setUsername('');
      setPassword('');
      alert("CREDENTIALS ACCEPTED: System debug terminal protocols loaded.");
    } else {
      setLoginError("AUTHENTICATION ERROR: Access Denied.");
    }
  };
  // If it's a commodity or crypto, courtroom controls don't apply!
  if (selectedAsset.type !== 'Stock') {
    return (
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-8 backdrop-blur-md glow-blue flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Pickaxe size={28} className="text-zinc-400" />
        </div>
        <h3 className="text-sm font-bold font-mono text-zinc-400 uppercase tracking-wider">Raw Asset Ledger</h3>
        <p className="text-xs text-zinc-500 font-mono max-w-sm mt-2 leading-relaxed">
          {selectedAsset.name} is a decentralized commodity or crypto token. Boardroom controls only apply to publicly traded corporate entities.
        </p>
      </div>
    );
  }

  const comp = state.companies[selectedAsset.id];
  if (!comp) return null;

  const sharesHeld = state.holdings[selectedAsset.id] || 0;
  const ownershipPercent = (sharesHeld / comp.totalShares) * 100;

  const isUnlocked = ownershipPercent >= 50;
  const isPrivate = comp.isPrivate;

  if (isPrivate) {
    return (
      <div className="bg-zinc-950/80 border-2 border-emerald-500/60 rounded-xl p-8 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
        <div className="w-14 h-14 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center mb-4 animate-bounce">
          <Building2 size={28} className="text-emerald-400" />
        </div>
        <h3 className="text-sm font-black font-mono text-emerald-400 uppercase tracking-widest">Taken Private</h3>
        <p className="text-xs text-zinc-400 font-mono max-w-md mt-2 leading-relaxed">
          You have taken **{comp.name}** completely private. The stock is delisted from the public exchange, and 100% of corporate cash flows directly belong to your private empire holdings.
        </p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-8 backdrop-blur-md glow-blue flex flex-col items-center justify-center text-center h-full min-h-[300px] relative overflow-y-auto">
        <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
        <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 animate-pulse">
          <Lock size={28} className="text-zinc-500" />
        </div>
        <h3 className="text-sm font-bold font-mono text-zinc-400 uppercase tracking-widest">Boardroom Locked</h3>
        <p className="text-xs text-zinc-500 font-mono max-w-md mt-2 leading-relaxed">
          You must own at least **50%** of outstanding company shares to enact boardroom directives.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-2xl justify-center items-stretch font-mono">
          <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl flex-1 flex flex-col justify-center">
            <div className="flex justify-between text-xs text-zinc-400 font-bold mb-1.5">
              <span>Your holdings</span>
              <span>{sharesHeld.toLocaleString()} shares</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400 font-bold">
              <span>Ownership</span>
              <span className={ownershipPercent > 20 ? 'text-amber-400' : 'text-zinc-500'}>
                {ownershipPercent.toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full mt-3 overflow-hidden border border-zinc-800">
              <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(100, ownershipPercent * 2)}%` }} />
            </div>
            <span className="text-[9px] text-zinc-500 block mt-3 uppercase text-center font-bold">Buy more shares on the market tab to seize control</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex-1 text-left flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-3">
              <span className="text-[9px] font-black text-rose-500 tracking-wider flex items-center gap-1"><KeyRound size={10} /> INTRANET: {comp.name.toUpperCase()}</span>
              {isDebugUnlocked && <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-900">ADMIN</span>}
            </div>
            
            {isDebugUnlocked ? (
              <div className="text-center py-4 flex flex-col justify-center items-center h-full">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><ShieldCheck size={13} /> SECURE PORTAL ACTIVE</span>
                <p className="text-[9px] text-zinc-500 mt-1 uppercase">Debug panel is unlocked. Check the top console tabs.</p>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-2">
                <div>
                  <label className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="domain\employee-id"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/80 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/80 font-mono"
                  />
                </div>
                {loginError && (
                  <span className="text-[9px] text-rose-400 font-bold block mt-1">{loginError}</span>
                )}
                <button
                  type="submit"
                  className="mt-2 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-1.5 rounded text-[10px] border border-zinc-700 transition-all uppercase tracking-wider"
                >
                  Log In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-md glow-blue flex flex-col gap-6 h-full select-none relative">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-sm font-black font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5"><Building2 size={14} /> CONTROL ROOM: {comp.name}</h2>
          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Ownership: {ownershipPercent.toFixed(1)}% (Controlling Owner)</span>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setShowPortal(!showPortal)}
            className={`text-[9px] px-2 py-0.5 rounded border font-mono transition-colors ${
              isDebugUnlocked
                ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isDebugUnlocked ? <><KeyRound size={10} /> PORTAL: ADMIN</> : <><KeyRound size={10} /> PORTAL LOGIN</>}
          </button>
          <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold font-mono">ACTIVE CONTROL</span>
        </div>
      </div>

      {showPortal && (
        <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl font-mono text-left max-w-sm absolute right-6 top-16 z-25 shadow-2xl">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5 mb-2">
            <span className="text-[9px] font-black text-rose-500 uppercase">EXTRANET: {comp.name}</span>
            <button onClick={() => setShowPortal(false)} className="text-zinc-500 hover:text-zinc-300"><X size={12} /></button>
          </div>
          {isDebugUnlocked ? (
            <div className="text-center py-2 text-[10px] text-emerald-400 font-bold">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> PORTAL BYPASS ACTIVE.</span> Admin tab unlocked.
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1 text-[10px] text-zinc-300 focus:outline-none focus:border-cyan-500/80 font-mono"
                />
              </div>
              <div className="mt-1">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1 text-[10px] text-zinc-300 focus:outline-none focus:border-cyan-500/80 font-mono"
                />
              </div>
              {loginError && (
                <span className="text-[8px] text-rose-400 font-bold block mt-0.5">{loginError}</span>
              )}
              <button
                type="submit"
                className="mt-1 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-1 rounded text-[9px] border border-zinc-700 transition-all uppercase tracking-wider"
              >
                Verify
              </button>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-1">
        {/* Left Card: Strategy Dials */}
        <div className="flex flex-col gap-5">
          {/* R&D spending */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Research & Development (R&D)</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['Low', 'Medium', 'High'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => executeBoardroomAction(comp.id, 'RD', lvl)}
                  className={`py-2 rounded font-bold transition-all border ${
                    comp.rdSpending === lvl
                      ? 'bg-cyan-950 border-cyan-800 text-cyan-300 shadow-inner font-black'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lvl.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono leading-relaxed mt-0.5">
              High R&D raises quarterly cash burns but boosts long-term growth drifts and technology breakthrough chances.
            </p>
          </div>

          {/* Cost Cutting */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Cost Control Parameters</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['None', 'Low', 'Aggressive'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => executeBoardroomAction(comp.id, 'COST', lvl)}
                  className={`py-2 rounded font-bold transition-all border ${
                    comp.costCutting === lvl
                      ? 'bg-rose-950/20 border-rose-900/60 text-rose-400 shadow-inner font-black'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lvl === 'None' ? 'NONE' : lvl.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono leading-relaxed mt-0.5">
              Aggressive cost-cutting boosts quarterly margins immediately, but sparks workforce strike risks and damages public reputation.
            </p>
          </div>

          {/* Strategy focus shift */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Tactical Strategy Direction</label>
            <select
              value={comp.strategyShift}
              onChange={(e) => executeBoardroomAction(comp.id, 'STRATEGY', e.target.value)}
              className="bg-zinc-900 border border-zinc-850 rounded p-2 text-xs font-mono text-zinc-300 focus:outline-none"
            >
              <option value="DEFAULT">Default Core Focus</option>
              <option value="AI">AI Integration (Surges during AI hype)</option>
              <option value="DEFENSE">Military Supply Contractor (Beneficial in tensions)</option>
              <option value="GREEN">Green Carbon offset (Reduces public backlashes)</option>
              <option value="BIOTECH">Medical Diagnostics (Boosts pandemic resilience)</option>
            </select>
          </div>
        </div>

        {/* Right Card: Financial Operations */}
        <div className="flex flex-col gap-4 border-l border-zinc-900 pl-0 md:pl-6">
          <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wide">Treasury Operations</h3>
          
          <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Corporate Cash Balance</span>
              <span className="text-white font-bold">${comp.cash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Outstanding Float</span>
              <span className="text-white font-bold">{comp.totalShares.toLocaleString()} shares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Employee Strike Risk</span>
              <span className={`font-bold ${comp.strikeRisk > 40 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {comp.strikeRisk}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 mt-2">
            {/* Share buyback */}
            <button
              onClick={() => executeBoardroomAction(comp.id, 'BUYBACK')}
              disabled={comp.cash < 500000}
              className={`w-full py-3 rounded-lg border font-mono text-xs font-bold transition-all ${
                comp.cash >= 500000
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-850 hover:border-zinc-700'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              EXECUTE STOCK BUYBACK (Spend 25% cash)
            </button>

            {/* Share issuance */}
            <button
              onClick={() => executeBoardroomAction(comp.id, 'ISSUE')}
              className="w-full py-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-850 hover:border-zinc-700 font-mono text-xs font-bold transition-all"
            >
              ISSUE NEW EQUITY FLOAT (+8% shares dilution)
            </button>

            {/* Delist */}
            <button
              onClick={() => {
                if (confirm('De-list the company from the stock exchange and go private?')) {
                  executeBoardroomAction(comp.id, 'PRIVATE');
                }
              }}
              disabled={ownershipPercent < 75}
              className={`w-full py-3 rounded-lg border font-mono text-xs font-bold transition-all ${
                ownershipPercent >= 75
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-zinc-950 border border-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              TAKE PRIVATE (Requires 75%+ ownership)
            </button>
            {ownershipPercent < 75 && (
              <span className="text-[9px] text-zinc-500 font-mono text-center block uppercase font-semibold">Privatization locked. Own 75%+ shares to delist</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
