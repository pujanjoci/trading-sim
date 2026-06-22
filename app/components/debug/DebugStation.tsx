import React, { useState } from 'react';
import { GameState, CompanyState, SentimentState, EconomicCycle } from '../../lib/simulationEngine';
import { EXPANDED_ASSETS, AssetConfig } from '../../data/assets';
import { DIFFICULTY_MODES } from '../../data/difficultyModes';
import { PLAYER_BACKGROUNDS } from '../../data/playerBackgrounds';
import { GAME_EVENT_TEMPLATES, GameEventTemplate } from '../../lib/eventDefinitions';
import { checkAuditEligibility, getCompanyOwnership, canReceivePoliticalMessage, isEligibleForGovMilitaryDemand } from '../../lib/eventEligibility';
import { isCooldownActive } from '../../lib/eventCooldowns';
import { createInboxMessage } from '../../lib/inboxEngine';
import { 
  Zap, User, LineChart, Briefcase, Mail, Landmark, 
  Building2, Scale, Globe2, Save, Trash2, HelpCircle 
} from 'lucide-react';

interface DebugStationProps {
  state: GameState;
  setStateOverride: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

type DebugTab = 
  | 'ACCOUNT' 
  | 'MARKET' 
  | 'PORTFOLIO' 
  | 'EVENTS' 
  | 'INBOX' 
  | 'POLITICS' 
  | 'COMPANY' 
  | 'LEGAL' 
  | 'MACRO' 
  | 'SAVE';

export function DebugStation({
  state,
  setStateOverride,
  onClose
}: DebugStationProps) {
  const [activeTab, setActiveTab] = useState<DebugTab>('ACCOUNT');
  const [cashInput, setCashInput] = useState<string>('100000');
  const [jsonInput, setJsonInput] = useState<string>('');

  // 1. Helper to update top-level state values directly
  const updateState = (updater: (prev: GameState) => Partial<GameState>) => {
    setStateOverride(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updater(prev)
      };
    });
  };

  // Derive net worth
  let totalAssetValue = 0;
  EXPANDED_ASSETS.forEach(asset => {
    totalAssetValue += (state.holdings[asset.id] || 0) * state.currentPrices[asset.id];
  });
  let shortLiabilities = 0;
  Object.keys(state.shortPositions).forEach(id => {
    shortLiabilities += state.shortPositions[id] * state.currentPrices[id];
  });
  const netWorth = state.cash + state.savings + totalAssetValue - state.debt - shortLiabilities;
  const diffConfig = DIFFICULTY_MODES.find(d => d.id === state.difficulty) || DIFFICULTY_MODES[1];
  const maxLeverageScale = state.background === 'EX_BANKER' ? 4.0 : diffConfig.leverageMaxMultiplier;

  // Helper to inspect event eligibility details
  const getEventEligibilityInfo = (template: GameEventTemplate) => {
    const nextTurn = state.turn + 1;
    const cooldownActive = isCooldownActive(state, template);
    
    let conditionMet = false;
    let conditionDetails = 'Conditions met';

    try {
      conditionMet = template.condition(state);
      if (!conditionMet) {
        if (template.id.includes('POLITICS') && !canReceivePoliticalMessage(state)) {
          conditionDetails = 'Requires political career / influence';
        } else if (template.id.includes('DEFENSE') && !isEligibleForGovMilitaryDemand(state)) {
          conditionDetails = 'Requires government rank or 20% defense ownership';
        } else if (template.id === 'AUDIT_CHAIN_1') {
          conditionDetails = 'No audit trigger conditions met (Legal risk, debt, etc. low)';
        } else if (template.id.includes('BIOTECH') && (state.holdings['BGEN'] || 0) === 0 && state.geopoliticalMetrics.pandemicLevel <= 10) {
          conditionDetails = 'Must own BioGen stock or pandemic level > 10';
        } else {
          conditionDetails = 'Macro or capital requirements not satisfied';
        }
      }
    } catch (e) {
      conditionDetails = 'Error evaluating conditions';
    }

    const isChainedStep = /_CHAIN_[2-9]/.test(template.id);

    return {
      eligible: conditionMet && !cooldownActive && !isChainedStep,
      cooldownActive,
      conditionMet,
      conditionDetails,
      isChainedStep
    };
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 backdrop-blur-md glow-rose flex flex-col h-[520px] select-none font-mono text-left relative overflow-hidden">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4 z-10">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-rose-500 animate-pulse" />
          <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Administrative Grid Terminal</span>
        </div>
        <button
          onClick={onClose}
          className="text-[9px] px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white uppercase font-bold transition-all"
        >
          Exit Override
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-900 text-[9px] font-bold select-none z-10 gap-1.5 pb-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: 'ACCOUNT', label: '1. ACCOUNT', Icon: User },
          { id: 'MARKET', label: '2. MARKET', Icon: LineChart },
          { id: 'PORTFOLIO', label: '3. PORTFOLIO', Icon: Briefcase },
          { id: 'EVENTS', label: '4. EVENT ENG', Icon: Zap },
          { id: 'INBOX', label: '5. MAILBOX', Icon: Mail },
          { id: 'POLITICS', label: '6. POLITICS', Icon: Landmark },
          { id: 'COMPANY', label: '7. COMPANIES', Icon: Building2 },
          { id: 'LEGAL', label: '8. AUDIT', Icon: Scale },
          { id: 'MACRO', label: '9. MACRO', Icon: Globe2 },
          { id: 'SAVE', label: '10. SAVE SYS', Icon: Save }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DebugTab)}
            className={`pb-1 px-2.5 transition-all border-b-2 flex items-center gap-1 shrink-0 ${
              activeTab === tab.id
                ? 'border-rose-500 text-rose-400 font-bold'
                : 'border-transparent text-zinc-550 hover:text-zinc-300'
            }`}
          >
            <tab.Icon size={11} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Sheets Container */}
      <div className="flex-1 min-h-0 py-4 overflow-y-auto z-10 text-xs">
        
        {/* TAB 1: PLAYER ACCOUNT */}
        {activeTab === 'ACCOUNT' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850">
              <div>
                <span className="text-zinc-500">Current User:</span>
                <span className="text-white font-bold ml-1.5">{state.background}</span>
              </div>
              <div>
                <span className="text-zinc-500">Sim Date/Turn:</span>
                <span className="text-white font-bold ml-1.5">{state.date} (Day {state.turn})</span>
              </div>
              <div>
                <span className="text-zinc-500">Liquid Cash:</span>
                <span className="text-cyan-400 font-bold ml-1.5">${state.cash.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-500">Sim Net Worth:</span>
                <span className="text-emerald-400 font-bold ml-1.5">${netWorth.toLocaleString()}</span>
              </div>
            </div>

            {/* Set cash controls */}
            <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 flex flex-col gap-2">
              <span className="text-zinc-400 font-bold uppercase text-[10px]">Adjust Liquid Funds</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-zinc-300 w-32 font-mono"
                  placeholder="Cash Amount"
                />
                <button
                  onClick={() => {
                    const amt = parseFloat(cashInput);
                    if (!isNaN(amt)) {
                      updateState(prev => ({ cash: parseFloat((prev.cash + amt).toFixed(2)) }));
                    }
                  }}
                  className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded font-bold uppercase text-[10px]"
                >
                  ADD CASH
                </button>
                <button
                  onClick={() => {
                    const amt = parseFloat(cashInput);
                    if (!isNaN(amt)) {
                      updateState(prev => ({ cash: parseFloat(Math.max(0, prev.cash - amt).toFixed(2)) }));
                    }
                  }}
                  className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-bold uppercase text-[10px]"
                >
                  SUBTRACT CASH
                </button>
              </div>
            </div>

            {/* Reputation controls */}
            <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Public Rep ({state.reputationPublic.toFixed(0)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state.reputationPublic}
                  onChange={(e) => updateState(() => ({ reputationPublic: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Corp Rep ({state.reputationCorporate.toFixed(0)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state.reputationCorporate}
                  onChange={(e) => updateState(() => ({ reputationCorporate: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Pol Rep ({state.reputationPolitical.toFixed(0)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state.reputationPolitical}
                  onChange={(e) => updateState(() => ({ reputationPolitical: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MARKET DEBUG */}
        {activeTab === 'MARKET' && (
          <div className="flex flex-col gap-3 min-h-0">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Asset Shock Override Grid</span>
            <div className="max-h-[300px] overflow-y-auto border border-zinc-900 rounded-lg divide-y divide-zinc-900 bg-zinc-900/10">
              {EXPANDED_ASSETS.map(asset => {
                const price = state.currentPrices[asset.id] || asset.basePrice;
                return (
                  <div key={asset.id} className="p-2.5 flex justify-between items-center gap-4 hover:bg-zinc-900/30">
                    <div className="text-left">
                      <span className="text-white font-bold">{asset.ticker}</span>
                      <span className="text-[9px] text-zinc-500 block">{asset.name} ({asset.sector})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 font-bold">${price.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          updateState(prev => {
                            const prices = { ...prev.currentPrices };
                            prices[asset.id] = parseFloat((prices[asset.id] * 1.2).toFixed(2));
                            return { currentPrices: prices };
                          });
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 font-bold text-[9px]"
                      >
                        +20%
                      </button>
                      <button
                        onClick={() => {
                          updateState(prev => {
                            const prices = { ...prev.currentPrices };
                            prices[asset.id] = parseFloat((prices[asset.id] * 0.8).toFixed(2));
                            return { currentPrices: prices };
                          });
                        }}
                        className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-900 hover:bg-rose-900 font-bold text-[9px]"
                      >
                        -20%
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PORTFOLIO */}
        {activeTab === 'PORTFOLIO' && (
          <div className="flex flex-col gap-3">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Holdings & Leverage Matrix</span>
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850">
              <div>
                <span className="text-zinc-500">Margin Borrow Debt:</span>
                <span className="text-white font-bold ml-1.5">${state.debt.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-500">Central Bank Interest:</span>
                <span className="text-white font-bold ml-1.5">{(state.interestRate * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Treasury Vault Savings:</span>
                <span className="text-white font-bold ml-1.5">${state.savings.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-500">Leverage Cap Limit:</span>
                <span className="text-white font-bold ml-1.5">{maxLeverageScale}x net worth</span>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto border border-zinc-900 rounded-lg p-3 bg-zinc-900/10">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block border-b border-zinc-850 pb-1.5 mb-2 text-left">Active Positions</span>
              {Object.keys(state.holdings).filter(id => state.holdings[id] > 0 || (state.shortPositions[id] || 0) > 0).length === 0 ? (
                <div className="text-center italic text-zinc-650 py-4">No active stock or short positions.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {Object.keys(state.holdings).map(id => {
                    const longQty = state.holdings[id] || 0;
                    const avgLong = state.holdingsAvgPrice[id] || 0;
                    const shortQty = state.shortPositions[id] || 0;
                    const avgShort = state.shortPositionsEntryPrice[id] || 0;

                    if (longQty === 0 && shortQty === 0) return null;

                    return (
                      <div key={id} className="flex justify-between border-b border-zinc-900 pb-1 text-[11px]">
                        <span className="font-bold text-white">{id}</span>
                        <div className="flex gap-4">
                          {longQty > 0 && <span className="text-emerald-400">LONG: {longQty} (Avg: ${avgLong.toFixed(2)})</span>}
                          {shortQty > 0 && <span className="text-rose-400">SHORT: {shortQty} (Avg: ${avgShort.toFixed(2)})</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EVENT ENGINE DEBUG */}
        {activeTab === 'EVENTS' && (
          <div className="flex flex-col gap-3">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Eligibility & Cooldown Debugger</span>
            
            {/* Global cooldown metrics */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-850 text-center">
              <div>
                <span className="text-zinc-500 text-[9px] block uppercase font-bold">Global Cooldown</span>
                <span className="text-white font-extrabold text-xs">{state.cooldowns?.global || 0} Days</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[9px] block uppercase font-bold">Active Event Chains</span>
                <span className="text-white font-extrabold text-xs">{Object.keys(state.activeEventChains || {}).length}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[9px] block uppercase font-bold">Pending Messages</span>
                <span className="text-white font-extrabold text-xs">{(state.inbox || []).filter(m => !m.isRead).length} Unread</span>
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto border border-zinc-900 rounded-lg bg-zinc-900/10 divide-y divide-zinc-900">
              {GAME_EVENT_TEMPLATES.map(template => {
                const report = getEventEligibilityInfo(template);
                return (
                  <div key={template.id} className="p-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-zinc-900/20 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-2 items-center">
                        <span className="text-white font-bold truncate block">{template.id}</span>
                        {report.isChainedStep && <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-1 rounded">CHAIN STEP</span>}
                      </div>
                      <span className="text-[9px] text-zinc-500 block truncate">{template.subject}</span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {report.eligible ? (
                        <span className="text-[9px] text-emerald-400 font-extrabold bg-emerald-950/20 border border-emerald-900 px-1.5 py-0.5 rounded">
                          ELIGIBLE
                        </span>
                      ) : (
                        <span 
                          className="text-[9px] text-amber-500 font-extrabold bg-amber-950/20 border border-amber-900 px-1.5 py-0.5 rounded cursor-help"
                          title={report.cooldownActive ? 'Cooldown active' : report.conditionDetails}
                        >
                          {report.cooldownActive ? 'COOLDOWN' : 'BLOCKED'}
                        </span>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Force trigger and send message ${template.id} into player's inbox immediately?`)) {
                            const newMsg = createInboxMessage(state, template, "Manually injected via administrative override terminal.");
                            updateState(prev => ({
                              inbox: [newMsg, ...(prev.inbox || [])]
                            }));
                            alert(`Message injected: "${template.subject}"`);
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[8.5px] font-bold"
                      >
                        FORCE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: INBOX/MAIL DEBUG */}
        {activeTab === 'INBOX' && (
          <div className="flex flex-col gap-4">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Mail Queue Override Console</span>
            
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 text-left">
              <div>
                <span className="text-zinc-500">Inbox Total:</span>
                <span className="text-white font-bold ml-1.5">{(state.inbox || []).length} messages</span>
              </div>
              <div>
                <span className="text-zinc-500">Actioned:</span>
                <span className="text-white font-bold ml-1.5">{(state.inbox || []).filter(m => m.isActioned).length} messages</span>
              </div>
              <div>
                <span className="text-zinc-500">Archived:</span>
                <span className="text-white font-bold ml-1.5">{(state.inbox || []).filter(m => m.isArchived).length} messages</span>
              </div>
              <div>
                <span className="text-zinc-500">Expired:</span>
                <span className="text-white font-bold ml-1.5">{(state.inbox || []).filter(m => m.isExpired).length} messages</span>
              </div>
            </div>

            <div className="flex gap-3 mt-2 flex-wrap">
              <button
                onClick={() => {
                  if (confirm("Clear all messages in the inbox? This cannot be undone.")) {
                    updateState(() => ({ inbox: [] }));
                    alert("Inbox cleared.");
                  }
                }}
                className="px-4 py-2 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold uppercase text-[10px] flex items-center gap-1.5"
              >
                <Trash2 size={12} /> CLEAR INBOX
              </button>

              <button
                onClick={() => {
                  updateState(prev => {
                    const next = (prev.inbox || []).map(m => ({ ...m, isRead: true }));
                    return { inbox: next };
                  });
                  alert("All messages marked as read.");
                }}
                className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-805 text-zinc-300 border border-zinc-800 font-bold uppercase text-[10px]"
              >
                MARK ALL AS READ
              </button>

              <button
                onClick={() => {
                  const testMsg = {
                    id: `msg_test_${Date.now()}`,
                    sender: 'SYSTEM_ADMIN_TEST',
                    subject: 'Administrative Override Test Transmission',
                    body: 'This is a secure developer override transmission confirming that the custom inbox alert socket is correctly listening to simulated date changes.',
                    category: 'Debug/Test Message' as any,
                    urgency: 'low' as any,
                    date: state.date,
                    turnAdded: state.turn,
                    isRead: false,
                    isArchived: false,
                    isExpired: false,
                    isActioned: false
                  };
                  updateState(prev => ({ inbox: [testMsg, ...(prev.inbox || [])] }));
                  alert("Test message injected.");
                }}
                className="px-4 py-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold uppercase text-[10px]"
              >
                SEND TEST MESSAGE
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: POLITICS DEBUG */}
        {activeTab === 'POLITICS' && (
          <div className="flex flex-col gap-4">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Politics Career Overrides</span>
            
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 text-left">
              <div>
                <span className="text-zinc-500">Current Rank:</span>
                <span className="text-white font-bold ml-1.5">{state.politicalLevel}</span>
              </div>
              <div>
                <span className="text-zinc-500">Influence Points:</span>
                <span className="text-indigo-400 font-bold ml-1.5">{state.politicalInfluence} pts</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap mt-2">
              <select
                value={state.politicalLevel}
                onChange={(e) => updateState(() => ({ politicalLevel: e.target.value as any }))}
                className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 font-mono"
              >
                {['Donor', 'Lobbyist', 'Local Candidate', 'Mayor', 'Senator/MP', 'Finance Minister', 'President/PM'].map(rank => (
                  <option key={rank} value={rank}>{rank.toUpperCase()}</option>
                ))}
              </select>

              <button
                onClick={() => updateState(prev => ({ politicalInfluence: prev.politicalInfluence + 10 }))}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold uppercase text-[10px]"
              >
                +10 INFLUENCE
              </button>

              <button
                onClick={() => updateState(prev => ({ politicalInfluence: Math.max(0, prev.politicalInfluence - 10) }))}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold uppercase text-[10px]"
              >
                -10 INFLUENCE
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: COMPANY OWNERSHIP DEBUG */}
        {activeTab === 'COMPANY' && (
          <div className="flex flex-col gap-3 min-h-0">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Company Ownership Grid</span>
            <div className="max-h-[300px] overflow-y-auto border border-zinc-900 rounded-lg divide-y divide-zinc-900 bg-zinc-900/10">
              {Object.keys(state.companies).map(compId => {
                const comp = state.companies[compId];
                const sharesHeld = state.holdings[compId] || 0;
                const ownership = (sharesHeld / comp.totalShares) * 100;

                return (
                  <div key={compId} className="p-2.5 flex justify-between items-center gap-4 hover:bg-zinc-900/30 text-left">
                    <div>
                      <span className="text-white font-bold">{comp.name}</span>
                      <span className="text-[9px] text-zinc-500 block">Shares Held: {sharesHeld.toLocaleString()} ({ownership.toFixed(1)}%)</span>
                    </div>

                    <div className="flex gap-1">
                      {[5, 20, 50, 75].map(pct => (
                        <button
                          key={pct}
                          onClick={() => {
                            updateState(prev => {
                              const nextHoldings = { ...prev.holdings };
                              const nextAvg = { ...prev.holdingsAvgPrice };
                              const compState = prev.companies[compId];
                              
                              nextHoldings[compId] = Math.round(compState.totalShares * (pct / 100));
                              if (nextHoldings[compId] > 0 && !nextAvg[compId]) {
                                nextAvg[compId] = prev.currentPrices[compId];
                              }
                              return {
                                holdings: nextHoldings,
                                holdingsAvgPrice: nextAvg
                              };
                            });
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white font-bold text-[8.5px]"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 8: LEGAL / AUDIT DEBUG */}
        {activeTab === 'LEGAL' && (
          <div className="flex flex-col gap-4">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Compliance and Investigation Report</span>
            
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 text-left">
              <div>
                <span className="text-zinc-500">Legal Risk Level:</span>
                <span className="text-white font-bold ml-1.5">{state.legalRisk.toFixed(1)}/100</span>
              </div>
              <div>
                <span className="text-zinc-500">Media Suspicion:</span>
                <span className="text-white font-bold ml-1.5">{state.mediaSuspicion.toFixed(1)}/100</span>
              </div>
            </div>

            {/* Audit Checker diagnostics */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-lg text-left">
              <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider block border-b border-zinc-800 pb-1.5 mb-2">Audit Risk Diagnostics</span>
              {(() => {
                const report = checkAuditEligibility(state);
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Eligible for Audit:</span>
                      {report.eligible ? (
                        <span className="text-rose-400 font-extrabold animate-pulse">TRUE</span>
                      ) : (
                        <span className="text-zinc-500">FALSE</span>
                      )}
                    </div>
                    {report.reason && (
                      <p className="text-[10px] text-amber-400 mt-1 italic">
                        "Reason: {report.reason}"
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  updateState(() => ({ legalRisk: 0, mediaSuspicion: 0 }));
                  alert("Legal risk counters wiped clean.");
                }}
                className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold uppercase text-[10px]"
              >
                CLEAR LEGAL RISK ($0)
              </button>
            </div>
          </div>
        )}

        {/* TAB 9: MACRO DEBUG */}
        {activeTab === 'MACRO' && (
          <div className="flex flex-col gap-4">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Macroeconomics Controls</span>
            
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 text-left">
              <div>
                <span className="text-zinc-500">Economic Cycle:</span>
                <span className="text-white font-bold ml-1.5">{state.economicCycle}</span>
              </div>
              <div>
                <span className="text-zinc-500">Global Tension:</span>
                <span className="text-white font-bold ml-1.5">{state.geopoliticalMetrics.globalTension}/100</span>
              </div>
              <div>
                <span className="text-zinc-500">Inflation Rate:</span>
                <span className="text-white font-bold ml-1.5">{state.geopoliticalMetrics.inflation.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Economic Health:</span>
                <span className="text-white font-bold ml-1.5">{state.geopoliticalMetrics.economicHealth}/100</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={state.economicCycle}
                onChange={(e) => updateState(() => ({ economicCycle: e.target.value as EconomicCycle }))}
                className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 font-mono"
              >
                {['Expansion', 'Euphoria', 'Slowdown', 'Recession', 'Depression', 'Recovery'].map(cycle => (
                  <option key={cycle} value={cycle}>{cycle.toUpperCase()}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  updateState(() => ({
                    economicCycle: 'Recession',
                    cycleTurnsRemaining: 30,
                    geopoliticalMetrics: {
                      globalTension: 30,
                      pandemicLevel: state.geopoliticalMetrics.pandemicLevel,
                      economicHealth: 25,
                      inflation: 4.5
                    }
                  }));
                  alert("Recession shock initialized.");
                }}
                className="px-3 py-1.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold uppercase text-[9.5px]"
              >
                TRIGGER RECESSION
              </button>

              <button
                onClick={() => {
                  updateState(() => ({
                    economicCycle: 'Expansion',
                    cycleTurnsRemaining: 40,
                    geopoliticalMetrics: {
                      globalTension: 15,
                      pandemicLevel: state.geopoliticalMetrics.pandemicLevel,
                      economicHealth: 70,
                      inflation: 2.0
                    }
                  }));
                  alert("Expansion recovery initialized.");
                }}
                className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold uppercase text-[9.5px]"
              >
                TRIGGER RECOVERY
              </button>
            </div>
          </div>
        )}

        {/* TAB 10: SAVE SYSTEM DEBUG */}
        {activeTab === 'SAVE' && (
          <div className="flex flex-col gap-4 text-left">
            <span className="text-zinc-500 text-[10px] uppercase font-bold">Save State JSON Ledger</span>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste state JSON strings here to import direct overrides..."
              className="w-full h-24 bg-zinc-950 border border-zinc-850 rounded p-2 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-rose-500"
            />

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  // Export state as JSON string
                  setJsonInput(JSON.stringify(state));
                  alert("Game state JSON exported to text field.");
                }}
                className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold uppercase text-[10px]"
              >
                EXPORT STATE
              </button>

              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonInput);
                    if (parsed && typeof parsed === 'object' && parsed.date && parsed.turn) {
                      setStateOverride(parsed);
                      alert("Game state JSON imported successfully.");
                    } else {
                      alert("Invalid schema: Object must contain turn and date properties.");
                    }
                  } catch (e) {
                    alert("Import Error: Invalid JSON syntax.");
                  }
                }}
                className="px-4 py-2 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-bold uppercase text-[10px]"
              >
                IMPORT OVERRIDE
              </button>

              <button
                onClick={() => {
                  if (confirm("Reset current simulation data? This will wipe the active save game.")) {
                    updateState(prev => {
                      alert("State reset to start config.");
                      window.location.reload();
                      return prev; // startNewGame triggers reset
                    });
                  }
                }}
                className="px-4 py-2 rounded bg-rose-950/20 hover:bg-rose-950 border border-rose-900 text-rose-400 font-bold uppercase text-[10px]"
              >
                RESET Sim
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
