"use client";

import { useState, useEffect, useRef } from 'react';
import { EXPANDED_ASSETS, AssetConfig, ANALYST_NAMES } from '../data/assets';
import { PLAYER_BACKGROUNDS, PlayerBackground } from '../data/playerBackgrounds';
import { DIFFICULTY_MODES, DifficultyConfig } from '../data/difficultyModes';
import { executeGameTick, GameState, OptionContract, BondHolding, CompanyState, SentimentState } from '../lib/simulationEngine';

const INITIAL_DATE = '2030-01-01';

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  pwd?: string;
  avatar: string;
  createdAt: string;
  gameState: GameState | null;
}

function randomNormal(mean = 0, stddev = 1) {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return mean + stddev * randStdNormal;
}

export function useGameState() {
  const [state, setState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activePrompt, setActivePrompt] = useState<any | null>(null);
  const [showPromptOutcome, setShowPromptOutcome] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Separate speed from tick state to keep intervals smooth
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const gameSpeedRef = useRef<number>(1);
  gameSpeedRef.current = gameSpeed;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and load session
  useEffect(() => {
    setMounted(true);
    const savedUserId = localStorage.getItem('tradingSimCurrentUser');
    const usersJson = localStorage.getItem('tradingSimUsers');
    if (savedUserId && usersJson) {
      const users = JSON.parse(usersJson);
      const user = users.find((u: any) => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
        if (user.gameState) {
          const loadedState = { ...user.gameState };
          if (!loadedState.inbox) loadedState.inbox = [];
          if (!loadedState.cooldowns) loadedState.cooldowns = { global: 0 };
          if (!loadedState.activeEventChains) loadedState.activeEventChains = {};
          setState(loadedState);
        }
      }
    }
    // Clean up old state keys if they exist
    localStorage.removeItem('ultra_trading_sim_state');
  }, []);

  // Save changes
  useEffect(() => {
    if (mounted && currentUser) {
      const usersJson = localStorage.getItem('tradingSimUsers');
      const users = usersJson ? JSON.parse(usersJson) : [];
      const updatedUsers = users.map((u: any) => {
        if (u.id === currentUser.id) {
          return { ...u, gameState: state };
        }
        return u;
      });
      localStorage.setItem('tradingSimUsers', JSON.stringify(updatedUsers));
    }
  }, [state, mounted, currentUser]);

  const startNewGame = (bgId: string, diffId: string, goalId: string) => {
    const bg = PLAYER_BACKGROUNDS.find(b => b.id === bgId) || PLAYER_BACKGROUNDS[0];
    const diff = DIFFICULTY_MODES.find(d => d.id === diffId) || DIFFICULTY_MODES[1];

    const initialPrices: Record<string, number> = {};
    const initialHistory: Record<string, number[]> = {};
    const initialHoldings: Record<string, number> = {};
    const initialHoldingsAvgPrice: Record<string, number> = {};
    const initialShortPositions: Record<string, number> = {};
    const initialShortEntryPrice: Record<string, number> = {};
    const initialSentiment: Record<string, SentimentState> = {};
    const initialCompanies: Record<string, CompanyState> = {};

    EXPANDED_ASSETS.forEach(asset => {
      // Randomize initial price by +/- 20% to avoid starting at exact same values on reload
      const randomFactor = 0.8 + Math.random() * 0.4; // between 0.8 and 1.2
      const startingPrice = parseFloat((asset.basePrice * randomFactor).toFixed(2));

      initialPrices[asset.id] = startingPrice;
      initialHoldings[asset.id] = 0;
      initialHoldingsAvgPrice[asset.id] = 0;
      initialShortPositions[asset.id] = 0;
      initialShortEntryPrice[asset.id] = 0;
      initialSentiment[asset.id] = 'Neutral';

      // Prepopulate mini historical lines
      const hist: number[] = [];
      let temp = startingPrice * 0.92;
      for (let i = 0; i < 30; i++) {
        temp = temp * (1 + randomNormal(0.0002, asset.baseVolatility));
        hist.push(parseFloat(temp.toFixed(2)));
      }
      hist.push(startingPrice);
      initialHistory[asset.id] = hist;

      // Populate companies for Stocks
      if (asset.type === 'Stock') {
        const initialRev = Math.round(asset.basePrice * (asset.totalShares || 1000000) * 0.05);
        initialCompanies[asset.id] = {
          id: asset.id,
          name: asset.name,
          ticker: asset.ticker,
          totalShares: asset.totalShares || 5000000,
          cash: asset.initialCash || 20000000,
          debt: asset.initialDebt || 5000000,
          rdSpending: 'Medium',
          costCutting: 'None',
          financials: {
            revenue: initialRev,
            profit: Math.round(initialRev * 0.15),
            debt: asset.initialDebt || 5000000,
            growthRate: 4.5,
            guidance: 'Neutral'
          },
          analystRating: 'Hold',
          ceoReputation: 60,
          strikeRisk: 5,
          strategyShift: 'DEFAULT',
          isPrivate: false
        };
      }
    });

    const startingCash = bg.startingCash * diff.startingCashMultiplier;
    
    // Apply Tech perk (starts with 5% Cognitive AI ownership)
    if (bg.id === 'TECH_FOUNDER' && initialCompanies['COGN']) {
      const sharesToGive = Math.round(initialCompanies['COGN'].totalShares * 0.05);
      initialHoldings['COGN'] = sharesToGive;
      initialHoldingsAvgPrice['COGN'] = initialPrices['COGN'];
    }

    const startState: GameState = {
      date: INITIAL_DATE,
      turn: 1,
      cash: startingCash,
      debt: 0,
      savings: 0,
      interestRate: 0.045, // 4.5% starting rate
      reputationPublic: bg.startingPublicRep,
      reputationCorporate: bg.startingCorporateRep,
      reputationPolitical: bg.startingPoliticalRep,
      legalRisk: 0,
      mediaSuspicion: 0,
      politicalLevel: bg.id === 'POLITICAL_INSIDER' ? 'Lobbyist' : 'Donor',
      politicalInfluence: bg.id === 'POLITICAL_INSIDER' ? 15 : 0,
      holdings: initialHoldings,
      holdingsAvgPrice: initialHoldingsAvgPrice,
      shortPositions: initialShortPositions,
      shortPositionsEntryPrice: initialShortEntryPrice,
      currentPrices: initialPrices,
      marketHistory: initialHistory,
      socialSentiment: initialSentiment,
      companies: initialCompanies,
      activeOptions: [],
      bonds: [],
      activeEvents: [],
      passedBills: [],
      eventLogs: [
        {
          date: INITIAL_DATE,
          headline: `GAME LOADED: Background - ${bg.name}`,
          description: `Initialized account: Starting cash $${startingCash.toLocaleString()} on ${diff.name} rules.`
        }
      ],
      economicCycle: 'Expansion',
      cycleTurnsRemaining: 40,
      geopoliticalMetrics: {
        globalTension: 20,
        pandemicLevel: 0,
        economicHealth: 60,
        inflation: 2.0
      },
      insiderInfo: [],
      ledger: [
        {
          id: `start_tx`,
          date: INITIAL_DATE,
          type: 'EVENT',
          cashChange: startingCash,
          description: `Initial funding credited: $${startingCash.toLocaleString()} (${bg.name})`
        }
      ],
      background: bgId,
      difficulty: diffId,
      goal: goalId,
      xp: 0,
      tutorialStep: 0, // Starts at choose background setup, advances to 1
      tutorialCompleted: false,
      tradesCount: 0,
      inbox: [],
      cooldowns: { global: 0 },
      activeEventChains: {}
    };

    setState(startState);
    setGameSpeed(1); // Set default speed to 1x on starting game
  };

  // Time Tick Loops
  const performTick = () => {
    setState(prev => {
      if (!prev) return null;

      // Execute mathematical tick computations
      const nextState = executeGameTick(prev);
      
      // Calculate Net Worth
      let totalAssetValue = 0;
      EXPANDED_ASSETS.forEach(asset => {
        const qty = nextState.holdings[asset.id] || 0;
        totalAssetValue += qty * nextState.currentPrices[asset.id];
      });
      let shortLiabilities = 0;
      Object.keys(nextState.shortPositions).forEach(id => {
        shortLiabilities += nextState.shortPositions[id] * nextState.currentPrices[id];
      });
      const netWorth = nextState.cash + nextState.savings + totalAssetValue - nextState.debt - shortLiabilities;

      // Check automated margin call
      if (netWorth < 0 && nextState.debt > 0) {
        // Force sell holdings starting from stocks
        let recoveredCash = 0;
        const nextHoldings = { ...nextState.holdings };
        const sortedAssets = Object.keys(nextHoldings).sort((a, b) => {
          return (nextHoldings[b] * nextState.currentPrices[b]) - (nextHoldings[a] * nextState.currentPrices[a]);
        });

        for (const assetId of sortedAssets) {
          const qty = nextHoldings[assetId];
          if (qty > 0) {
            const price = nextState.currentPrices[assetId];
            const value = qty * price;
            recoveredCash += value;
            nextHoldings[assetId] = 0;
            nextState.holdingsAvgPrice[assetId] = 0;

            nextState.ledger.unshift({
              id: `liq_asset_${assetId}_${nextState.turn}`,
              date: nextState.date,
              type: 'LIQUIDATION',
              cashChange: value,
              description: `MARGIN FORCE LIQUIDATE: Sold ${qty} shares of ${assetId} at $${price} to cover debt.`
            });
            if (nextState.cash + recoveredCash - nextState.debt >= 0) break;
          }
        }

        nextState.cash += recoveredCash;
        if (nextState.cash >= nextState.debt) {
          nextState.cash -= nextState.debt;
          nextState.debt = 0;
        } else {
          nextState.debt -= nextState.cash;
          nextState.cash = 0;
        }

        // Check if insolvency remains
        if (nextState.cash + nextState.savings - nextState.debt < 0) {
          if (prev.goal !== 'SANDBOX') {
            nextState.gameStatus = 'BANKRUPTCY';
          } else {
            // Player completely bankrupt. Clear debt. Rescue grant.
            nextState.debt = 0;
            nextState.cash = 5000; // bankruptcy lifeline
            nextState.eventLogs.unshift({
              date: nextState.date,
              headline: 'BANK DEBT WRITTEN OFF: Insolvent corporate relief',
              description: 'Credit courts have restructured your accounts. Asset holdings liquidated, rescue fund of $5,000 credited.'
            });
          }
        }
      }

      // Check for margin warning counts if they have debt and net worth is very low relative to debt
      const postNetWorth = nextState.cash + nextState.savings + Object.keys(nextState.holdings).reduce((sum, id) => sum + (nextState.holdings[id] * nextState.currentPrices[id]), 0) - nextState.debt - Object.keys(nextState.shortPositions).reduce((sum, id) => sum + (nextState.shortPositions[id] * nextState.currentPrices[id]), 0);
      const isMarginCallRisk = nextState.debt > 0 && (postNetWorth / nextState.debt) * 100 < 50;

      if (prev.goal !== 'SANDBOX') {
        if (isMarginCallRisk) {
          nextState.debtWarningTurns = (prev.debtWarningTurns || 0) + 1;
          nextState.eventLogs.unshift({
            date: nextState.date,
            headline: `⚠️ BANK DEBT WARNING: Margin call delinquency (Day ${nextState.debtWarningTurns}/10)`,
            description: `Repay your loans or increase asset collateral immediately. The credit courts will file for bankruptcy in ${10 - nextState.debtWarningTurns} days.`,
            isUrgent: true
          });
          if (nextState.debtWarningTurns >= 10) {
            nextState.gameStatus = 'BANKRUPTCY';
          }
        } else {
          nextState.debtWarningTurns = 0;
        }
      }
      return nextState;
    });
  };

  // Timer runner
  useEffect(() => {
    if (gameSpeedRef.current > 0 && state?.gameStatus !== 'VICTORY' && state?.gameStatus !== 'BANKRUPTCY') {
      const intervalMs = 1000 / gameSpeedRef.current;
      timerRef.current = setInterval(() => {
        performTick();
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameSpeed, state?.gameStatus]);

  // Victory state watcher
  useEffect(() => {
    if (!state || state.gameStatus === 'VICTORY' || state.gameStatus === 'BANKRUPTCY') return;

    // Calculate net worth
    let totalAssetValue = 0;
    EXPANDED_ASSETS.forEach(asset => {
      const qty = state.holdings[asset.id] || 0;
      totalAssetValue += qty * state.currentPrices[asset.id];
    });
    let shortLiabilities = 0;
    Object.keys(state.shortPositions).forEach(id => {
      shortLiabilities += state.shortPositions[id] * state.currentPrices[id];
    });
    const netWorth = state.cash + state.savings + totalAssetValue - state.debt - shortLiabilities;

    // Check victory goals
    let isWin = false;
    if (state.goal === 'NET_WORTH' && netWorth >= 1000000000) {
      isWin = true;
    } else if (state.goal === 'PRESIDENT' && state.politicalLevel === 'President/PM') {
      isWin = true;
    } else if (state.goal === 'AGI_MONOPOLY') {
      const cognComp = state.companies['COGN'];
      const cognShares = state.holdings['COGN'] || 0;
      const cognOwnership = cognComp ? (cognShares / cognComp.totalShares) * 100 : 0;
      if (cognOwnership >= 50) {
        isWin = true;
      }
    }

    if (isWin) {
      setGameSpeed(0);
      setState(prev => prev ? { ...prev, gameStatus: 'VICTORY' } : null);
    }
  }, [state, setGameSpeed]);

  // Watch for incoming critical messages to launch blocking modals
  useEffect(() => {
    if (!state) return;
    
    // Find any unread critical message that is not actioned or expired
    const criticalMsg = (state.inbox || []).find(msg => 
      msg.urgency === 'critical' && !msg.isActioned && !msg.isExpired && !msg.isRead
    );

    if (criticalMsg && !activePrompt) {
      // Pause simulation
      setGameSpeed(0);
      setActivePrompt({
        id: criticalMsg.id,
        title: criticalMsg.subject,
        description: criticalMsg.body,
        choices: criticalMsg.choices || []
      });
    }
  }, [state, activePrompt]);

  // Trading functions
  const buyAsset = (assetId: string, quantity: number) => {
    if (!state || quantity <= 0) return;
    const price = state.currentPrices[assetId];
    if (price <= 0) {
      alert(`Asset price error. Operations halted.`);
      return;
    }
    const cost = price * quantity;

    const diffConfig = DIFFICULTY_MODES.find(d => d.id === state.difficulty) || DIFFICULTY_MODES[1];
    
    // Leverage cap check
    let totalAssetValue = 0;
    EXPANDED_ASSETS.forEach(asset => {
      totalAssetValue += (state.holdings[asset.id] || 0) * state.currentPrices[asset.id];
    });
    let shortLiabilities = 0;
    Object.keys(state.shortPositions).forEach(id => {
      shortLiabilities += state.shortPositions[id] * state.currentPrices[id];
    });
    const netWorth = state.cash + state.savings + totalAssetValue - state.debt - shortLiabilities;

    // Banker perk increases leverage cap
    const maxLeverageScale = state.background === 'EX_BANKER' ? 4.0 : diffConfig.leverageMaxMultiplier;
    const maxAllowedDebt = netWorth * maxLeverageScale;
    const isLeveragedBuy = cost > state.cash;
    const debtIncrease = isLeveragedBuy ? cost - state.cash : 0;

    if (state.debt + debtIncrease > maxAllowedDebt && isLeveragedBuy) {
      alert(`INSUFFICIENT LEVERAGE COLLATERAL. Max spending power exceeded.`);
      return;
    }

    setState(prev => {
      if (!prev) return null;

      const nextHoldings = { ...prev.holdings };
      const currentQty = prev.holdings[assetId] || 0;
      const currentAvg = prev.holdingsAvgPrice[assetId] || 0;

      const newQty = currentQty + quantity;
      const newAvg = ((currentQty * currentAvg) + cost) / newQty;

      nextHoldings[assetId] = newQty;
      prev.holdingsAvgPrice[assetId] = parseFloat(newAvg.toFixed(2));

      let finalCash = prev.cash - cost;
      let finalDebt = prev.debt;
      if (finalCash < 0) {
        finalDebt += Math.abs(finalCash);
        finalCash = 0;
      }

      // Market momentum shock
      const nextPrices = { ...prev.currentPrices };
      const shockScale = prev.background === 'CRYPTO_INFLUENCER' && (assetId === 'DOGG' || assetId === 'BYTE' || assetId === 'MEME') ? 0.005 : 0.002;
      const marketImpact = (cost / 15000) * shockScale;
      const rawPrice = nextPrices[assetId] * (1 + marketImpact);
      const floor = assetId === 'MEME' ? 0.005 : 0.10;
      nextPrices[assetId] = parseFloat(Math.max(floor, Math.min(9999, rawPrice)).toFixed(2));

      // Advance tutorial if on buy step
      let nextTutorial = prev.tutorialStep;
      if (prev.tutorialStep === 1) {
        nextTutorial = 2; // proceed to clock tick tutorial
      }

      return {
        ...prev,
        cash: parseFloat(finalCash.toFixed(2)),
        debt: parseFloat(finalDebt.toFixed(2)),
        holdings: nextHoldings,
        currentPrices: nextPrices,
        tutorialStep: nextTutorial,
        tradesCount: (prev.tradesCount || 0) + 1,
        ledger: [
          {
            id: `buy_${assetId}_${Date.now()}`,
            date: prev.date,
            type: 'BUY',
            cashChange: -cost,
            description: `Bought ${quantity} shares/contracts of ${assetId} @ $${price.toFixed(2)}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  const sellAsset = (assetId: string, quantity: number) => {
    if (!state || quantity <= 0) return;
    const price = state.currentPrices[assetId];
    if (price <= 0) {
      alert(`Asset price error. Operations halted.`);
      return;
    }
    const currentQty = state.holdings[assetId] || 0;
    if (currentQty < quantity) return;

    const revenue = price * quantity;

    setState(prev => {
      if (!prev) return null;

      const nextHoldings = { ...prev.holdings };
      const nextQty = currentQty - quantity;
      nextHoldings[assetId] = nextQty;

      if (nextQty === 0) {
        prev.holdingsAvgPrice[assetId] = 0;
      }

      let finalDebt = prev.debt;
      let finalCash = prev.cash;

      if (finalDebt > 0) {
        if (revenue >= finalDebt) {
          finalCash += (revenue - finalDebt);
          finalDebt = 0;
        } else {
          finalDebt -= revenue;
        }
      } else {
        finalCash += revenue;
      }

      const nextPrices = { ...prev.currentPrices };
      const marketImpact = (revenue / 15000) * 0.002;
      const rawPrice = nextPrices[assetId] * (1 - marketImpact);
      const floor = assetId === 'MEME' ? 0.005 : 0.10;
      nextPrices[assetId] = parseFloat(Math.max(floor, Math.min(9999, rawPrice)).toFixed(2));

      // Advance tutorial if on sell step
      let nextTutorial = prev.tutorialStep;
      if (prev.tutorialStep === 5) {
        nextTutorial = 6; // completed shorting step, explain political
      }

      return {
        ...prev,
        cash: parseFloat(finalCash.toFixed(2)),
        debt: parseFloat(finalDebt.toFixed(2)),
        holdings: nextHoldings,
        currentPrices: nextPrices,
        tutorialStep: nextTutorial,
        tradesCount: (prev.tradesCount || 0) + 1,
        ledger: [
          {
            id: `sell_${assetId}_${Date.now()}`,
            date: prev.date,
            type: 'SELL',
            cashChange: revenue,
            description: `Sold ${quantity} shares/contracts of ${assetId} @ $${price.toFixed(2)}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Short Selling
  const sellShort = (assetId: string, quantity: number) => {
    if (!state || quantity <= 0) return;
    const price = state.currentPrices[assetId];
    if (price <= 0) {
      alert(`Asset price error. Operations halted.`);
      return;
    }
    const revenue = price * quantity;

    setState(prev => {
      if (!prev) return null;

      const currentShort = prev.shortPositions[assetId] || 0;
      const currentEntry = prev.shortPositionsEntryPrice[assetId] || 0;

      const nextShorts = { ...prev.shortPositions };
      nextShorts[assetId] = currentShort + quantity;

      const newEntry = ((currentShort * currentEntry) + revenue) / nextShorts[assetId];
      prev.shortPositionsEntryPrice[assetId] = parseFloat(newEntry.toFixed(2));

      // Crediting short revenue directly to cash, but increases short position liability
      return {
        ...prev,
        cash: parseFloat((prev.cash + revenue).toFixed(2)),
        shortPositions: nextShorts,
        tradesCount: (prev.tradesCount || 0) + 1,
        ledger: [
          {
            id: `short_${assetId}_${Date.now()}`,
            date: prev.date,
            type: 'SHORT',
            cashChange: revenue,
            description: `Opened Short: Sold ${quantity} shares of ${assetId} @ $${price.toFixed(2)} (liab credit)`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  const coverShort = (assetId: string, quantity: number) => {
    if (!state || quantity <= 0) return;
    const price = state.currentPrices[assetId];
    if (price <= 0) {
      alert(`Asset price error. Operations halted.`);
      return;
    }
    const currentShort = state.shortPositions[assetId] || 0;
    if (currentShort < quantity) return;

    const cost = price * quantity;

    if (state.cash < cost) {
      alert(`INSUFFICIENT LIQUID CASH. Covering short requires $${cost.toFixed(2)} cash to purchase back shares.`);
      return;
    }

    setState(prev => {
      if (!prev) return null;

      const nextShorts = { ...prev.shortPositions };
      const nextQty = currentShort - quantity;
      nextShorts[assetId] = nextQty;

      if (nextQty === 0) {
        prev.shortPositionsEntryPrice[assetId] = 0;
      }

      // Advance tutorial if on shorting cover step
      let nextTutorial = prev.tutorialStep;
      if (prev.tutorialStep === 5) {
        nextTutorial = 6;
      }

      return {
        ...prev,
        cash: parseFloat((prev.cash - cost).toFixed(2)),
        shortPositions: nextShorts,
        tutorialStep: nextTutorial,
        tradesCount: (prev.tradesCount || 0) + 1,
        ledger: [
          {
            id: `cover_${assetId}_${Date.now()}`,
            date: prev.date,
            type: 'COVER',
            cashChange: -cost,
            description: `Covered Short: Bought back ${quantity} shares of ${assetId} @ $${price.toFixed(2)}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Credit lines loans
  const borrowCash = (amount: number) => {
    if (amount <= 0 || !state) return;

    let totalAssetValue = 0;
    EXPANDED_ASSETS.forEach(asset => {
      totalAssetValue += (state.holdings[asset.id] || 0) * state.currentPrices[asset.id];
    });
    let shortLiabs = 0;
    Object.keys(state.shortPositions).forEach(id => {
      shortLiabs += state.shortPositions[id] * state.currentPrices[id];
    });
    const netWorth = state.cash + state.savings + totalAssetValue - state.debt - shortLiabs;

    const diffConfig = DIFFICULTY_MODES.find(d => d.id === state.difficulty) || DIFFICULTY_MODES[1];
    const maxLeverageScale = state.background === 'EX_BANKER' ? 4.0 : diffConfig.leverageMaxMultiplier;
    const maxAllowedDebt = netWorth * maxLeverageScale;

    if (state.debt + amount > maxAllowedDebt) {
      alert(`BORROW EXCEEDS BANK RISK THRESHOLD. Maximum borrowing limit: ${maxLeverageScale}x net worth.`);
      return;
    }

    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: parseFloat((prev.cash + amount).toFixed(2)),
        debt: parseFloat((prev.debt + amount).toFixed(2)),
        ledger: [
          {
            id: `borrow_${Date.now()}`,
            date: prev.date,
            type: 'EVENT',
            cashChange: amount,
            description: `Secured commercial bank credit loan: +$${amount.toLocaleString()}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  const repayDebt = (amount: number) => {
    if (amount <= 0 || !state || state.cash <= 0 || state.debt <= 0) return;
    const payment = Math.min(amount, state.cash, state.debt);

    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: parseFloat((prev.cash - payment).toFixed(2)),
        debt: parseFloat((prev.debt - payment).toFixed(2)),
        ledger: [
          {
            id: `repay_${Date.now()}`,
            date: prev.date,
            type: 'EVENT',
            cashChange: -payment,
            description: `Repaid bank loan balance: -$${payment.toLocaleString()}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Bonds & T-Bills
  const buyBond = (bondType: 'TreasuryBill' | 'GovBond' | 'CorpBond', faceValue: number) => {
    if (!state || faceValue <= 0) return;
    if (state.cash < faceValue) {
      alert(`INSUFFICIENT FUNDS. Face value purchase requires $${faceValue.toLocaleString()}`);
      return;
    }

    let yieldRate = 0.05; // default 5%
    let duration = 30; // turns

    if (bondType === 'TreasuryBill') {
      yieldRate = state.interestRate - 0.005; // slightly under CB rate
      duration = 30;
    } else if (bondType === 'GovBond') {
      yieldRate = state.interestRate + 0.01; // slightly over CB rate
      duration = 60;
    } else {
      yieldRate = 0.085; // high corporate risk yield
      duration = 90;
    }

    setState(prev => {
      if (!prev) return null;

      const newBond: BondHolding = {
        id: `bond_${Date.now()}`,
        type: bondType,
        faceValue,
        yieldRate,
        purchaseTurn: prev.turn,
        maturityTurn: prev.turn + duration
      };

      return {
        ...prev,
        cash: parseFloat((prev.cash - faceValue).toFixed(2)),
        bonds: [...prev.bonds, newBond],
        ledger: [
          {
            id: `bond_buy_${newBond.id}`,
            date: prev.date,
            type: 'BONDS',
            cashChange: -faceValue,
            description: `Purchased ${bondType}: Face $${faceValue.toLocaleString()} | Yield ${(yieldRate * 100).toFixed(2)}% | Maturity Day ${prev.turn + duration}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Savings liquidity
  const depositSavings = (amount: number) => {
    if (!state || amount <= 0 || state.cash < amount) return;
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: parseFloat((prev.cash - amount).toFixed(2)),
        savings: parseFloat((prev.savings + amount).toFixed(2)),
        ledger: [
          {
            id: `savings_dep_${Date.now()}`,
            date: prev.date,
            type: 'SAVINGS',
            cashChange: -amount,
            description: `Deposited $${amount.toLocaleString()} into Treasury Vault.`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  const withdrawSavings = (amount: number) => {
    if (!state || amount <= 0 || state.savings < amount) return;
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: parseFloat((prev.cash + amount).toFixed(2)),
        savings: parseFloat((prev.savings - amount).toFixed(2)),
        ledger: [
          {
            id: `savings_wdr_${Date.now()}`,
            date: prev.date,
            type: 'SAVINGS',
            cashChange: amount,
            description: `Withdrew $${amount.toLocaleString()} from Treasury Vault.`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Options trading
  const buyOption = (assetId: string, type: 'Call' | 'Put', strikePrice: number, quantity: number, premium: number, duration: number) => {
    if (!state || quantity <= 0) return;
    
    // Premium checks
    const totalPremiumCost = premium * quantity;

    if (state.cash < totalPremiumCost) {
      alert(`INSUFFICIENT FUNDS. Premium cost of $${totalPremiumCost.toFixed(2)} exceeds cash.`);
      return;
    }

    setState(prev => {
      if (!prev) return null;

      const contract: OptionContract = {
        id: `opt_${Date.now()}`,
        assetId,
        type,
        strikePrice,
        quantity,
        premium: totalPremiumCost,
        expiryTurn: prev.turn + duration
      };

      return {
        ...prev,
        cash: parseFloat((prev.cash - totalPremiumCost).toFixed(2)),
        activeOptions: [...prev.activeOptions, contract],
        tradesCount: (prev.tradesCount || 0) + 1,
        ledger: [
          {
            id: `opt_buy_${contract.id}`,
            date: prev.date,
            type: 'OPTIONS',
            cashChange: -totalPremiumCost,
            description: `Bought ${type} option on ${assetId}: ${quantity} contracts @ strike $${strikePrice.toFixed(2)} (Expiry Day ${prev.turn + duration})`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Boardroom commands
  const executeBoardroomAction = (
    assetId: string,
    action: 'RD' | 'COST' | 'BUYBACK' | 'ISSUE' | 'STRATEGY' | 'PRIVATE',
    value?: any
  ) => {
    if (!state) return;
    const comp = state.companies[assetId];
    if (!comp) return;

    setState(prev => {
      if (!prev) return null;
      const nextCompanies = { ...prev.companies };
      const compState = { ...nextCompanies[assetId] };
      const prices = { ...prev.currentPrices };

      if (action === 'RD') {
        compState.rdSpending = value;
        prev.eventLogs.unshift({
          date: prev.date,
          headline: `BOARD DIRECTIVE: ${comp.name} R&D Strategy Shift`,
          description: `Research budget set to ${value}. Shifting product cycles.`
        });
      } else if (action === 'COST') {
        compState.costCutting = value;
        if (value === 'Aggressive') {
          // triggers high strike risk
          compState.strikeRisk = Math.min(100, compState.strikeRisk + 40);
          prev.reputationPublic = Math.max(0, prev.reputationPublic - 15);
        }
        prev.eventLogs.unshift({
          date: prev.date,
          headline: `BOARD DIRECTIVE: ${comp.name} cost directives`,
          description: `Cost control set to ${value}. Personnel metrics flagged.`
        });
      } else if (action === 'STRATEGY') {
        compState.strategyShift = value;
        prev.eventLogs.unshift({
          date: prev.date,
          headline: `BOARD DIRECTIVE: ${comp.name} strategic focus`,
          description: `Corporate focus shifted to ${value} R&D.`
        });
      } else if (action === 'BUYBACK') {
        const cost = compState.cash * 0.25; // spend 25% cash
        compState.cash -= cost;
        compState.totalShares = Math.round(compState.totalShares * 0.95); // reduce float
        const rawPrice = prices[assetId] * 1.06;
        const floor = assetId === 'MEME' ? 0.005 : 0.10;
        prices[assetId] = parseFloat(Math.max(floor, Math.min(9999, rawPrice)).toFixed(2)); // boost stock price
        
        prev.eventLogs.unshift({
          date: prev.date,
          headline: `SHARE BUYBACK: ${comp.name}`,
          description: `Bought back 5% of outstanding float. Stock price rises.`
        });
      } else if (action === 'ISSUE') {
        const cashAdded = prices[assetId] * (compState.totalShares * 0.08);
        compState.cash += cashAdded;
        compState.totalShares = Math.round(compState.totalShares * 1.08); // dilutes share count
        const rawPrice = prices[assetId] * 0.94;
        const floor = assetId === 'MEME' ? 0.005 : 0.10;
        prices[assetId] = parseFloat(Math.max(floor, Math.min(9999, rawPrice)).toFixed(2)); // drops price

        prev.eventLogs.unshift({
          date: prev.date,
          headline: `EQUITY ISSUANCE: ${comp.name}`,
          description: `Issued 8% additional shares. Added $${Math.round(cashAdded).toLocaleString()} cash reserves.`
        });
      } else if (action === 'PRIVATE') {
        // take private: liquidates shares at current price, removes from terminal list
        const sharesHeld = prev.holdings[assetId] || 0;
        const buyoutCash = sharesHeld * prices[assetId];
        prev.holdings[assetId] = 0;
        prev.holdingsAvgPrice[assetId] = 0;
        compState.isPrivate = true;

        prev.eventLogs.unshift({
          date: prev.date,
          headline: `CORPORATE DELIST: ${comp.name} taken private`,
          description: `delisted from market grid. Owner holdings liquidated into cash: +$${buyoutCash.toLocaleString()}`
        });

        return {
          ...prev,
          cash: parseFloat((prev.cash + buyoutCash).toFixed(2)),
          companies: {
            ...prev.companies,
            [assetId]: compState
          },
          ledger: [
            {
              id: `private_${assetId}_${Date.now()}`,
              date: prev.date,
              type: 'DIVIDEND',
              cashChange: buyoutCash,
              description: `Taken private: liquidated ${sharesHeld} shares of ${assetId}`
            },
            ...prev.ledger
          ].slice(0, 100)
        };
      }

      return {
        ...prev,
        currentPrices: prices,
        companies: {
          ...prev.companies,
          [assetId]: compState
        }
      };
    });
  };

  // Political career operations
  const advancePoliticalCareer = () => {
    if (!state) return;
    
    const careerLadder: GameState['politicalLevel'][] = [
      'Donor', 'Lobbyist', 'Local Candidate', 'Mayor', 'Senator/MP', 'Finance Minister', 'President/PM'
    ];

    const currentIdx = careerLadder.indexOf(state.politicalLevel);
    if (currentIdx === careerLadder.length - 1) {
      alert("YOU ARE ALREADY PRESIDENT/PM. ULTIMATE AUTHORITY.");
      return;
    }

    const nextRank = careerLadder[currentIdx + 1];
    
    // Requirements checklist
    let cashReq = 50000;
    let netWorthReq = 50000;
    let repReq = 55;

    if (nextRank === 'Lobbyist') { cashReq = 120000; repReq = 50; }
    else if (nextRank === 'Local Candidate') { cashReq = 250000; netWorthReq = 350000; repReq = 60; }
    else if (nextRank === 'Mayor') { cashReq = 500000; netWorthReq = 1000000; repReq = 65; }
    else if (nextRank === 'Senator/MP') { cashReq = 1500000; netWorthReq = 3000000; repReq = 70; }
    else if (nextRank === 'Finance Minister') { cashReq = 4000000; netWorthReq = 8000000; repReq = 75; }
    else if (nextRank === 'President/PM') { cashReq = 10000000; netWorthReq = 20000000; repReq = 85; }

    const totalAssetValue = Object.keys(state.holdings).reduce((sum, id) => {
      return sum + (state.holdings[id] * state.currentPrices[id]);
    }, 0);
    let shortLiabs = 0;
    Object.keys(state.shortPositions).forEach(id => {
      shortLiabs += state.shortPositions[id] * state.currentPrices[id];
    });
    const playerNetWorth = state.cash + state.savings + totalAssetValue - state.debt - shortLiabs;

    if (state.cash < cashReq) {
      alert(`INSUFFICIENT CAMPAIGN CASH. Advancing to ${nextRank} requires $${cashReq.toLocaleString()} liquid cash.`);
      return;
    }
    if (playerNetWorth < netWorthReq) {
      alert(`INSUFFICIENT CORPORATE NET WORTH. Advancing to ${nextRank} requires $${netWorthReq.toLocaleString()} Net Worth.`);
      return;
    }
    if (state.reputationPolitical < repReq) {
      alert(`INSUFFICIENT POLITICAL INFLUENCE reputation. Advancing to ${nextRank} requires ${repReq}% Political Reputation.`);
      return;
    }

    setState(prev => {
      if (!prev) return null;
      
      prev.eventLogs.unshift({
        date: prev.date,
        headline: `CAMPAIGN VICTORY: Promoted to ${nextRank}`,
        description: `Secured legislative funding grid. Advanced political authority.`
      });

      return {
        ...prev,
        cash: parseFloat((prev.cash - cashReq).toFixed(2)),
        politicalLevel: nextRank,
        politicalInfluence: prev.politicalInfluence + 10,
        ledger: [
          {
            id: `pol_adv_${nextRank}_${Date.now()}`,
            date: prev.date,
            type: 'EVENT',
            cashChange: -cashReq,
            description: `Financed political campaign: advanced to ${nextRank}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Political action lobbyists
  const voteLegislativeAction = (actionId: string) => {
    if (!state) return;

    if (state.passedBills?.includes(actionId)) {
      return;
    }
    
    // Check influence levels or cash costs
    // Political insider gets 40% lobbying cost discount
    const isInsider = state.background === 'POLITICAL_INSIDER';
    const costScale = isInsider ? 0.6 : 1.0;

    let cashCost = 40000 * costScale;
    let polInfluenceCost = 4;
    let logString = '';
    let metricShift = {};
    let priceShocks: Record<string, number> = {};

    if (actionId === 'TAX_CUT_TECH') {
      cashCost = 80000 * costScale; polInfluenceCost = 5;
      logString = 'Passed Tech Corporate Tax Credit: Sector stocks NEXA, FRUT jump +18%.';
      priceShocks = { FRUT: 0.18, NEXA: 0.18, OLDX: 0.1 };
    } else if (actionId === 'MILITARY_EMBARGO') {
      cashCost = 150000 * costScale; polInfluenceCost = 8;
      logString = 'Enacted Foreign Arms Embargo: Apex Defense contracts surge +30%. Brent Crude jumps +22%.';
      priceShocks = { APEX: 0.3, CRDE: 0.22 };
      metricShift = { globalTension: 15 };
    } else if (actionId === 'AI_BAN') {
      cashCost = 200000 * costScale; polInfluenceCost = 10;
      logString = 'Passed Neural AI Restructuring Bill: Banned speculative computing nodes. COGN collapses -45%. NEXA cybersecurity jumps +20%.';
      priceShocks = { COGN: -0.45, NEXA: 0.2, SYNX: -0.2 };
    } else if (actionId === 'AGRI_TARIFFS') {
      cashCost = 60000 * costScale; polInfluenceCost = 3;
      logString = 'Tariffs enacted on foreign grains. Wheat futures rise +25%.';
      priceShocks = { WHT: 0.25, CORN: 0.15, SOY: 0.15 };
    }

    if (state.cash < cashCost) {
      alert(`INSUFFICIENT CAMPAIGN CASH. Action requires $${cashCost.toLocaleString()}`);
      return;
    }
    if (state.politicalInfluence < polInfluenceCost) {
      alert(`INSUFFICIENT POLITICAL INFLUENCE. Requires ${polInfluenceCost} influence points.`);
      return;
    }

    setState(prev => {
      if (!prev) return null;
      if (prev.passedBills?.includes(actionId)) {
        return prev;
      }

      const nextPrices = { ...prev.currentPrices };
      Object.keys(priceShocks).forEach(id => {
        const rawPrice = nextPrices[id] * (1 + priceShocks[id]);
        const floor = id === 'MEME' ? 0.005 : 0.10;
        nextPrices[id] = parseFloat(Math.max(floor, Math.min(9999, rawPrice)).toFixed(2));
      });

      const nextPassed = prev.passedBills ? [...prev.passedBills] : [];
      if (!nextPassed.includes(actionId)) {
        nextPassed.push(actionId);
      }

      prev.eventLogs.unshift({
        date: prev.date,
        headline: `LEGISLATIVE BILL PASSED: ${actionId.replace(/_/g, ' ')}`,
        description: logString
      });

      return {
        ...prev,
        cash: parseFloat((prev.cash - cashCost).toFixed(2)),
        politicalInfluence: prev.politicalInfluence - polInfluenceCost,
        currentPrices: nextPrices,
        passedBills: nextPassed,
        ledger: [
          {
            id: `pol_vote_${actionId}_${Date.now()}`,
            date: prev.date,
            type: 'LOBBY',
            cashChange: -cashCost,
            description: `Sponsored Legislative Directive: ${logString}`
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });
  };

  // Onboarding tutorial progress
  const advanceTutorial = (step: number) => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tutorialStep: step
      };
    });
  };

  const completeTutorial = () => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tutorialCompleted: true
      };
    });
  };

  const triggerCheat = (type: string, value?: any) => {
    if (type === 'FORCE_PROMPT') {
      const promptTemplates = require('../utils/gameData').DECISION_PROMPTS;
      const selected = value ? promptTemplates.find((p: any) => p.id === value) : promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
      setGameSpeed(0);
      setActivePrompt(selected);
      return;
    }

    setState(prev => {
      if (!prev) return null;
      const next = { ...prev };
      
      if (type === 'ADD_CASH') {
        const amount = value || 500000;
        next.cash = parseFloat((next.cash + amount).toFixed(2));
        next.ledger = [
          {
            id: `cheat_cash_${Date.now()}`,
            date: prev.date,
            type: 'EVENT',
            cashChange: amount,
            description: `DEBUG CHEAT: Credited +$${amount.toLocaleString()} cash`
          },
          ...prev.ledger
        ].slice(0, 100);
      } else if (type === 'CLEAR_DEBT') {
        next.debt = 0;
        next.ledger = [
          {
            id: `cheat_debt_${Date.now()}`,
            date: prev.date,
            type: 'EVENT',
            cashChange: 0,
            description: `DEBUG CHEAT: Settled all liabilities & bank debt to $0`
          },
          ...prev.ledger
        ].slice(0, 100);
      } else if (type === 'MAX_POLITICS') {
        next.politicalLevel = 'President/PM';
        next.politicalInfluence = 100;
        next.reputationPolitical = 100;
        next.eventLogs.unshift({
          date: prev.date,
          headline: 'DEBUG CHEAT: SEIZED TOTAL EXECUTIVE POWER',
          description: 'Promoted to President/PM with max influence.'
        });
      } else if (type === 'RESET_REPUTATION') {
        next.reputationPublic = 100;
        next.reputationCorporate = 100;
        next.reputationPolitical = 100;
        next.legalRisk = 0;
        next.mediaSuspicion = 0;
      } else if (type === 'FORCE_AI_BREAKTHROUGH') {
        const events = require('../utils/gameData').WORLD_EVENTS;
        const AGI_EVENT = events.find((e: any) => e.id === 'AI_BREAKTHROUGH');
        if (AGI_EVENT && !next.activeEvents.some(e => e.id === 'AI_BREAKTHROUGH')) {
          next.activeEvents = [...next.activeEvents, { id: 'AI_BREAKTHROUGH', name: AGI_EVENT.name, remainingDuration: AGI_EVENT.duration }];
          next.eventLogs.unshift({
            date: prev.date,
            headline: `DEBUG SHOCK: ${AGI_EVENT.newsHeadline}`,
            description: AGI_EVENT.description
          });
        }
      } else if (type === 'FORCE_EVENT') {
        const events = require('../utils/gameData').WORLD_EVENTS;
        const randomEv = events[Math.floor(Math.random() * events.length)];
        if (!next.activeEvents.some(e => e.id === randomEv.id)) {
          next.activeEvents = [...next.activeEvents, { id: randomEv.id, name: randomEv.name, remainingDuration: randomEv.duration }];
          next.eventLogs.unshift({
            date: prev.date,
            headline: `DEBUG SHOCK: ${randomEv.newsHeadline}`,
            description: randomEv.description
          });
        }
      }
      
      return next;
    });
  };

  const handleDecision = (choiceIndex: number) => {
    if (!activePrompt || !state) return;
    
    // Check if the prompt is an inbox message
    if (activePrompt.id && activePrompt.id.startsWith('msg_')) {
      actionInboxMessage(activePrompt.id, choiceIndex);
      return;
    }

    const choice = activePrompt.choices[choiceIndex];

    const noneAffordable = activePrompt.choices.every((c: any) => state.cash < c.cost);

    if (state.cash < choice.cost && !noneAffordable) {
      alert(`INSUFFICIENT FUNDS to execute this option.`);
      return;
    }

    setState(prev => {
      if (!prev) return null;

      const diffConfig = DIFFICULTY_MODES.find(d => d.id === prev.difficulty) || DIFFICULTY_MODES[1];
      let nextCash = prev.cash + (choice.effects.cashChange || 0);
      let nextReputation = prev.reputationPublic + (choice.effects.reputationChange || 0);
      
      let nextDebt = prev.debt;
      if (nextCash < 0) {
        nextDebt += Math.abs(nextCash);
        nextCash = 0;
      }

      // Apply price shocks
      const nextPrices = { ...prev.currentPrices };
      if (choice.effects.assetPriceShocks) {
        Object.keys(choice.effects.assetPriceShocks).forEach(assetId => {
          const shock = choice.effects.assetPriceShocks![assetId];
          const rawPrice = nextPrices[assetId] * (1 + shock);
          const floor = assetId === 'MEME' ? 0.005 : 0.10;
          nextPrices[assetId] = parseFloat(Math.max(floor, Math.min(9999, rawPrice)).toFixed(2));
        });
      }

      // Apply metric changes
      const tension = prev.geopoliticalMetrics.globalTension + (choice.effects.metricChanges?.globalTension || 0);
      const pandemic = prev.geopoliticalMetrics.pandemicLevel + (choice.effects.metricChanges?.pandemicLevel || 0);
      const health = prev.geopoliticalMetrics.economicHealth + (choice.effects.metricChanges?.economicHealth || 0);
      const inflation = prev.geopoliticalMetrics.inflation + (choice.effects.metricChanges?.inflation || 0);

      // Unlocked insider info
      const nextInsider = [...prev.insiderInfo];
      if (choice.effects.unlockedInsiderInfo) {
        nextInsider.unshift({
          text: choice.effects.unlockedInsiderInfo,
          dateAdded: prev.date
        });
      }

      // Legal risk increases from shady decisions
      let nextLegalRisk = prev.legalRisk;
      if (choice.text.toLowerCase().includes('bribe') || choice.text.toLowerCase().includes('insider') || choice.text.toLowerCase().includes('shady')) {
        nextLegalRisk += 25 * (diffConfig.legalRiskMultiplier);
      }

      prev.eventLogs.unshift({
        date: prev.date,
        headline: `DECISION DIRECTIVE: ${activePrompt.title}`,
        description: choice.outcomeDescription
      });

      return {
        ...prev,
        cash: parseFloat(nextCash.toFixed(2)),
        debt: parseFloat(nextDebt.toFixed(2)),
        reputationPublic: Math.max(0, Math.min(100, nextReputation)),
        legalRisk: Math.max(0, Math.min(100, nextLegalRisk)),
        currentPrices: nextPrices,
        insiderInfo: nextInsider,
        geopoliticalMetrics: {
          globalTension: Math.max(0, Math.min(100, tension)),
          pandemicLevel: Math.max(0, Math.min(100, pandemic)),
          economicHealth: Math.max(0, Math.min(100, health)),
          inflation: parseFloat(Math.max(-5.0, Math.min(25.0, inflation)).toFixed(2))
        },
        ledger: [
          {
            id: `dec_${activePrompt.id}_${Date.now()}`,
            date: prev.date,
            type: 'EVENT',
            cashChange: choice.effects.cashChange || -choice.cost,
            description: choice.outcomeDescription
          },
          ...prev.ledger
        ].slice(0, 100)
      };
    });

    setShowPromptOutcome(choice.outcomeDescription);
    setActivePrompt(null);
  };

  const actionInboxMessage = (messageId: string, choiceIndex: number) => {
    setState(prev => {
      if (!prev) return null;
      const msg = (prev.inbox || []).find(m => m.id === messageId);
      if (!msg || !msg.choices) return prev;

      const choice = msg.choices[choiceIndex];
      const cost = choice.cost;

      // Apply cost to cash. If insufficient, add to debt (margin borrow)
      let nextCash = prev.cash - cost;
      let nextDebt = prev.debt;
      if (nextCash < 0) {
        nextDebt += Math.abs(nextCash);
        nextCash = 0;
      }

      // Apply other effects
      const effects = choice.effects;
      let nextReputationPublic = Math.max(0, Math.min(100, prev.reputationPublic + (effects.reputationPublicChange || 0)));
      let nextReputationCorporate = Math.max(0, Math.min(100, prev.reputationCorporate + (effects.reputationCorporateChange || 0)));
      let nextReputationPolitical = Math.max(0, Math.min(100, prev.reputationPolitical + (effects.reputationPoliticalChange || 0)));
      
      const diffConfig = DIFFICULTY_MODES.find(d => d.id === prev.difficulty) || DIFFICULTY_MODES[1];
      let nextLegalRisk = prev.legalRisk + (effects.legalRiskChange || 0) * diffConfig.legalRiskMultiplier;
      // Add bribe extra risk check
      if (choice.text.toLowerCase().includes('bribe') || choice.text.toLowerCase().includes('insider') || choice.text.toLowerCase().includes('shady')) {
        nextLegalRisk += 25 * diffConfig.legalRiskMultiplier;
      }
      nextLegalRisk = Math.max(0, Math.min(100, nextLegalRisk));

      let nextMediaSuspicion = Math.max(0, Math.min(100, prev.mediaSuspicion + (effects.mediaSuspicionChange || 0)));
      let nextPoliticalInfluence = Math.max(0, prev.politicalInfluence + (effects.politicalInfluenceChange || 0));

      // Apply price shocks
      const nextPrices = { ...prev.currentPrices };
      if (effects.assetPriceShocks) {
        Object.keys(effects.assetPriceShocks).forEach(assetId => {
          const shock = effects.assetPriceShocks![assetId];
          const rawPrice = nextPrices[assetId] * (1 + shock);
          const floor = assetId === 'MEME' ? 0.005 : 0.10;
          nextPrices[assetId] = parseFloat(Math.max(floor, Math.min(9999, rawPrice)).toFixed(2));
        });
      }

      // Geopolitical metric changes
      const tension = prev.geopoliticalMetrics.globalTension + (effects.metricChanges?.globalTension || 0);
      const pandemic = prev.geopoliticalMetrics.pandemicLevel + (effects.metricChanges?.pandemicLevel || 0);
      const health = prev.geopoliticalMetrics.economicHealth + (effects.metricChanges?.economicHealth || 0);
      const inflation = prev.geopoliticalMetrics.inflation + (effects.metricChanges?.inflation || 0);

      // Unlocked insider info
      const nextInsider = [...prev.insiderInfo];
      if (effects.unlockedInsiderInfo) {
        nextInsider.unshift({
          text: effects.unlockedInsiderInfo,
          dateAdded: prev.date
        });
      }

      // Add to active event chains if chain triggered
      const nextChains = { ...prev.activeEventChains };
      if (effects.triggerEventChainId) {
        nextChains[effects.triggerEventChainId] = {
          triggerTurn: prev.turn + (effects.triggerEventChainDelay || 5)
        };
      }

      // Add event log
      const nextEventLogs = [...prev.eventLogs];
      nextEventLogs.unshift({
        date: prev.date,
        headline: `DIRECTIVE DECISION: ${msg.subject}`,
        description: choice.outcomeDescription
      });

      // Update message status in the inbox
      const nextInbox = prev.inbox.map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            isActioned: true,
            isRead: true,
            selectedChoiceIndex: choiceIndex
          };
        }
        return m;
      });

      return {
        ...prev,
        cash: parseFloat(nextCash.toFixed(2)),
        debt: parseFloat(nextDebt.toFixed(2)),
        reputationPublic: nextReputationPublic,
        reputationCorporate: nextReputationCorporate,
        reputationPolitical: nextReputationPolitical,
        legalRisk: nextLegalRisk,
        mediaSuspicion: nextMediaSuspicion,
        politicalInfluence: nextPoliticalInfluence,
        currentPrices: nextPrices,
        insiderInfo: nextInsider,
        activeEventChains: nextChains,
        geopoliticalMetrics: {
          globalTension: Math.max(0, Math.min(100, tension)),
          pandemicLevel: Math.max(0, Math.min(100, pandemic)),
          economicHealth: Math.max(0, Math.min(100, health)),
          inflation: parseFloat(Math.max(-5.0, Math.min(25.0, inflation)).toFixed(2))
        },
        eventLogs: nextEventLogs,
        ledger: [
          {
            id: `msg_action_${messageId}_${Date.now()}`,
            date: prev.date,
            type: 'EVENT',
            cashChange: -cost,
            description: choice.outcomeDescription
          },
          ...prev.ledger
        ].slice(0, 100),
        inbox: nextInbox
      };
    });

    // Adapt EventModal's state so we show outcome descriptions
    const msg = state?.inbox.find(m => m.id === messageId);
    if (msg && msg.choices) {
      setShowPromptOutcome(msg.choices[choiceIndex].outcomeDescription);
    }
    setActivePrompt(null);
  };

  const archiveInboxMessage = (messageId: string) => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inbox: (prev.inbox || []).map(msg => 
          msg.id === messageId ? { ...msg, isArchived: true } : msg
        )
      };
    });
  };

  const readInboxMessage = (messageId: string) => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inbox: (prev.inbox || []).map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      };
    });
  };

  const closeOutcomeModal = () => {
    setShowPromptOutcome(null);
    setGameSpeed(1); // resume
  };

  const registerUser = (fullName: string, username: string, email: string, pwdVal: string, avatar: string) => {
    const usersJson = localStorage.getItem('tradingSimUsers');
    const users = usersJson ? JSON.parse(usersJson) : [];
    if (users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username already exists.");
    }
    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      fullName,
      username,
      email,
      pwd: pwdVal,
      avatar,
      createdAt: new Date().toLocaleDateString(),
      gameState: null
    };
    users.push(newUser);
    localStorage.setItem('tradingSimUsers', JSON.stringify(users));
    localStorage.setItem('tradingSimCurrentUser', newUser.id);
    setCurrentUser(newUser);
    setState(null);
  };

  const loginUser = (username: string, pwdVal: string) => {
    const usersJson = localStorage.getItem('tradingSimUsers');
    const users = usersJson ? JSON.parse(usersJson) : [];
    const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error("Wrong username or password.");
    }
    if (user.pwd !== pwdVal) {
      throw new Error("Wrong username or password.");
    }
    localStorage.setItem('tradingSimCurrentUser', user.id);
    setCurrentUser(user);
    if (user.gameState) {
      setState(user.gameState);
    } else {
      setState(null);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('tradingSimCurrentUser');
    setCurrentUser(null);
    setState(null);
    setGameSpeed(0);
  };

  const resetUserProgress = () => {
    if (!currentUser) return;
    setState(null);
    setGameSpeed(0);
    const usersJson = localStorage.getItem('tradingSimUsers');
    const users = usersJson ? JSON.parse(usersJson) : [];
    const updatedUsers = users.map((u: any) => {
      if (u.id === currentUser.id) {
        return { ...u, gameState: null };
      }
      return u;
    });
    localStorage.setItem('tradingSimUsers', JSON.stringify(updatedUsers));
  };

  const resetGame = () => {
    resetUserProgress();
  };

  return {
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
    setStateOverride: setState
  };
}
