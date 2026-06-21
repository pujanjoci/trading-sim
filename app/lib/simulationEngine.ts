import { AssetConfig, EXPANDED_ASSETS, ANALYST_NAMES } from '../data/assets';
import { PLAYER_BACKGROUNDS } from '../data/playerBackgrounds';
import { DIFFICULTY_MODES } from '../data/difficultyModes';

// Normal distribution random generator
function randomNormal(mean = 0, stddev = 1) {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return mean + stddev * randStdNormal;
}

export type EconomicCycle = 'Expansion' | 'Euphoria' | 'Slowdown' | 'Recession' | 'Depression' | 'Recovery';
export type SentimentState = 'Fear' | 'Neutral' | 'Hype' | 'Mania' | 'Panic';

export interface CompanyFinancials {
  revenue: number;
  profit: number;
  debt: number;
  growthRate: number;
  guidance: 'Bullish' | 'Neutral' | 'Bearish';
}

export interface CompanyState {
  id: string;
  name: string;
  ticker: string;
  totalShares: number;
  cash: number;
  debt: number;
  rdSpending: 'Low' | 'Medium' | 'High';
  costCutting: 'None' | 'Low' | 'Aggressive';
  financials: CompanyFinancials;
  analystRating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  ceoReputation: number;
  strikeRisk: number;
  strategyShift: 'DEFAULT' | 'AI' | 'DEFENSE' | 'GREEN' | 'BIOTECH' | 'COMMODITY' | 'CRYPTO';
  isPrivate: boolean;
}

export interface OptionContract {
  id: string;
  assetId: string;
  type: 'Call' | 'Put';
  strikePrice: number;
  quantity: number;
  premium: number;
  expiryTurn: number;
}

export interface BondHolding {
  id: string;
  type: 'TreasuryBill' | 'GovBond' | 'CorpBond';
  issuerId?: string; // empty for government
  faceValue: number;
  yieldRate: number;
  purchaseTurn: number;
  maturityTurn: number;
}

export interface GameState {
  date: string;
  turn: number;
  cash: number;
  debt: number;
  savings: number; // floating rate savings
  interestRate: number;
  reputationPublic: number;
  reputationCorporate: number;
  reputationPolitical: number;
  legalRisk: number;
  mediaSuspicion: number;
  politicalLevel: 'Donor' | 'Lobbyist' | 'Local Candidate' | 'Mayor' | 'Senator/MP' | 'Finance Minister' | 'President/PM';
  politicalInfluence: number;
  holdings: Record<string, number>; // assetId -> quantity
  holdingsAvgPrice: Record<string, number>; // assetId -> avg price
  shortPositions: Record<string, number>; // assetId -> quantity
  shortPositionsEntryPrice: Record<string, number>; // assetId -> avg price
  currentPrices: Record<string, number>;
  marketHistory: Record<string, number[]>;
  socialSentiment: Record<string, SentimentState>;
  companies: Record<string, CompanyState>;
  activeOptions: OptionContract[];
  bonds: BondHolding[];
  activeEvents: { id: string; name: string; remainingDuration: number }[];
  eventLogs: { date: string; headline: string; description: string; isUrgent?: boolean }[];
  passedBills: string[];
  economicCycle: EconomicCycle;
  cycleTurnsRemaining: number;
  geopoliticalMetrics: {
    globalTension: number;
    pandemicLevel: number;
    economicHealth: number;
    inflation: number;
  };
  insiderInfo: { text: string; dateAdded: string }[];
  ledger: { id: string; date: string; type: string; cashChange: number; description: string }[];
  background: string;
  difficulty: string;
  goal: string;
  xp: number;
  tutorialStep: number;
  tutorialCompleted: boolean;
  tradesCount: number;
  gameStatus?: 'PLAYING' | 'VICTORY' | 'BANKRUPTCY';
  debtWarningTurns?: number;
}

// Math logic to advance the simulation clock by 1 tick (day)
export function executeGameTick(prev: GameState): GameState {
  const nextTurn = prev.turn + 1;
  const difficultyConfig = DIFFICULTY_MODES.find(d => d.id === prev.difficulty) || DIFFICULTY_MODES[1];
  const backgroundConfig = PLAYER_BACKGROUNDS.find(b => b.id === prev.background);

  const formattedDate = incrementDateString(prev.date, 1);
  const ledgerEntries: any[] = [];
  const eventLogs = [...prev.eventLogs];

  // 1. Manage Economic Cycle
  let nextCycle = prev.economicCycle;
  let nextCycleTurns = prev.cycleTurnsRemaining - 1;

  if (nextCycleTurns <= 0) {
    const cycles: EconomicCycle[] = ['Expansion', 'Euphoria', 'Slowdown', 'Recession', 'Depression', 'Recovery'];
    const currentIdx = cycles.indexOf(prev.economicCycle);
    const nextIdx = (currentIdx + 1) % cycles.length;
    nextCycle = cycles[nextIdx];
    nextCycleTurns = Math.round(30 + Math.random() * 40); // 30 - 70 turns per cycle

    eventLogs.unshift({
      date: formattedDate,
      headline: `MACRO SHIFT: Global economy enters ${nextCycle.toUpperCase()} phase.`,
      description: `Market drift parameters, growth indexes, and general credit parameters have adjusted.`,
      isUrgent: true
    });
  }

  // 2. Accrue Interest on Debt & Savings
  let nextDebt = prev.debt;
  let nextCash = prev.cash;
  let nextSavings = prev.savings;

  // Banker perk discount on borrowing interest
  const bankerRateDiscount = prev.background === 'EX_BANKER' ? 0.7 : 1.0;
  const adjustedDebtRate = (prev.interestRate + difficultyConfig.baseInterestRateMarkup) * bankerRateDiscount;
  
  if (nextDebt > 0) {
    const dailyInterest = nextDebt * (adjustedDebtRate / 365.0);
    nextDebt += dailyInterest;

    if (nextTurn % 10 === 0) {
      ledgerEntries.push({
        id: `interest_debt_${nextTurn}`,
        date: formattedDate,
        type: 'INTEREST',
        cashChange: -dailyInterest * 10,
        description: `10-Day corporate credit interest accrued: -$${(dailyInterest * 10).toFixed(2)}`
      });
    }
  }

  // Savings yields floating rate (Interest rate - 1.5%)
  if (nextSavings > 0) {
    const savingsYield = Math.max(0.005, prev.interestRate - 0.015);
    const dailySavingsYield = nextSavings * (savingsYield / 365.0);
    nextSavings += dailySavingsYield;

    if (nextTurn % 10 === 0) {
      ledgerEntries.push({
        id: `interest_savings_${nextTurn}`,
        date: formattedDate,
        type: 'SAVINGS_INTEREST',
        cashChange: dailySavingsYield * 10,
        description: `10-Day Treasury Cash deposit yield: +$${(dailySavingsYield * 10).toFixed(2)}`
      });
    }
  }

  // 3. Option Settlements
  const nextOptions: OptionContract[] = [];
  prev.activeOptions.forEach(opt => {
    if (nextTurn >= opt.expiryTurn) {
      // Option expired! Settle immediately.
      const currentPrice = prev.currentPrices[opt.assetId];
      let payout = 0;
      if (opt.type === 'Call') {
        payout = Math.max(0, currentPrice - opt.strikePrice) * opt.quantity;
      } else {
        payout = Math.max(0, opt.strikePrice - currentPrice) * opt.quantity;
      }

      nextCash += payout;
      
      ledgerEntries.push({
        id: `settle_opt_${opt.id}`,
        date: formattedDate,
        type: 'OPTIONS',
        cashChange: payout,
        description: `Option Expired [${opt.type} ${opt.assetId} @ Strike $${opt.strikePrice.toFixed(2)}]: Payout +$${payout.toFixed(2)} (Premium paid: $${opt.premium.toFixed(2)})`
      });

      eventLogs.unshift({
        date: formattedDate,
        headline: `OPTION EXPIRED: ${opt.type} on ${opt.assetId}`,
        description: `Contract settled at strike $${opt.strikePrice.toFixed(2)}. Spot: $${currentPrice.toFixed(2)}. Net payout: $${payout.toFixed(2)}.`
      });
    } else {
      nextOptions.push(opt);
    }
  });

  // 4. Bond Coupon Interest & Maturities
  const nextBonds: BondHolding[] = [];
  prev.bonds.forEach(bond => {
    if (nextTurn >= bond.maturityTurn) {
      // Bond matured. Repay face value.
      nextCash += bond.faceValue;
      // Calculate total accrued interest
      const durationDays = bond.maturityTurn - bond.purchaseTurn;
      const totalYield = bond.faceValue * (bond.yieldRate * (durationDays / 365.0));
      nextCash += totalYield;

      ledgerEntries.push({
        id: `bond_mature_${bond.id}`,
        date: formattedDate,
        type: 'BONDS',
        cashChange: bond.faceValue + totalYield,
        description: `Bond Matured [${bond.type}]: Returned Face Value $${bond.faceValue.toLocaleString()} + Yield $${totalYield.toFixed(2)}`
      });

      eventLogs.unshift({
        date: formattedDate,
        headline: `BOND MATURITY: ${bond.type}`,
        description: `A bond holding has reached maturity. Received $${(bond.faceValue + totalYield).toLocaleString()} total.`
      });
    } else {
      nextBonds.push(bond);
    }
  });

  // 5. Short Positions daily borrow fees
  let totalShortLiability = 0;
  const nextShorts = { ...prev.shortPositions };
  Object.keys(nextShorts).forEach(assetId => {
    const qty = nextShorts[assetId];
    if (qty > 0) {
      const price = prev.currentPrices[assetId];
      totalShortLiability += qty * price;
      // charge daily borrow fee of 5% annual rate
      const dailyBorrowFee = (qty * price) * (0.05 / 365.0);
      nextCash -= dailyBorrowFee;

      if (nextTurn % 10 === 0) {
        ledgerEntries.push({
          id: `short_fee_${assetId}_${nextTurn}`,
          date: formattedDate,
          type: 'SHORT_FEE',
          cashChange: -dailyBorrowFee * 10,
          description: `10-Day Short borrow fee for ${assetId}: -$${(dailyBorrowFee * 10).toFixed(2)}`
        });
      }
    }
  });

  // 6. Decays for Reputations and Legal Risk
  const reputationPublic = Math.max(0, Math.min(100, prev.reputationPublic + (50 - prev.reputationPublic) * 0.01));
  const reputationCorporate = Math.max(0, Math.min(100, prev.reputationCorporate + (50 - prev.reputationCorporate) * 0.008));
  const reputationPolitical = Math.max(0, Math.min(100, prev.reputationPolitical + (50 - prev.reputationPolitical) * 0.008));
  // Legal risk and media suspicion decay slowly over time
  const legalRisk = Math.max(0, prev.legalRisk - 0.25);
  const mediaSuspicion = Math.max(0, prev.mediaSuspicion - 0.25);

  // 7. Update Event Durations
  const nextActiveEvents = prev.activeEvents
    .map(ae => ({ ...ae, remainingDuration: ae.remainingDuration - 1 }))
    .filter(ae => ae.remainingDuration > 0);

  prev.activeEvents.forEach(ae => {
    if (ae.remainingDuration === 1) {
      eventLogs.unshift({
        date: formattedDate,
        headline: `EVENT RESOLVED: ${ae.name}`,
        description: `Market indices and sector multipliers for ${ae.name} have returned to baseline trends.`
      });
    }
  });

  // 8. Update Geopolitical Metrics
  // Natural drift to equilibrium
  let globalTension = prev.geopoliticalMetrics.globalTension + (20 - prev.geopoliticalMetrics.globalTension) * 0.02;
  let pandemicLevel = prev.geopoliticalMetrics.pandemicLevel + (0 - prev.geopoliticalMetrics.pandemicLevel) * 0.03;
  let economicHealth = prev.geopoliticalMetrics.economicHealth + (60 - prev.geopoliticalMetrics.economicHealth) * 0.02;
  let inflation = prev.geopoliticalMetrics.inflation + (2.0 - prev.geopoliticalMetrics.inflation) * 0.02;

  // Apply cycle influences
  if (nextCycle === 'Euphoria') {
    economicHealth = Math.min(100, economicHealth + 0.3);
    inflation = Math.min(10, inflation + 0.1);
  } else if (nextCycle === 'Recession') {
    economicHealth = Math.max(10, economicHealth - 0.4);
    inflation = Math.max(-1, inflation - 0.08);
  } else if (nextCycle === 'Depression') {
    economicHealth = Math.max(5, economicHealth - 0.7);
    inflation = Math.max(-3, inflation - 0.15);
  } else if (nextCycle === 'Recovery') {
    economicHealth = Math.min(100, economicHealth + 0.2);
    inflation = Math.min(5, inflation + 0.05);
  }

  // Apply active event metrics
  nextActiveEvents.forEach(ae => {
    if (ae.id === 'PANDEMIC') {
      pandemicLevel = Math.min(100, pandemicLevel + 2.5);
      economicHealth = Math.max(10, economicHealth - 1.5);
    } else if (ae.id === 'MIDDLE_EAST_WAR') {
      globalTension = Math.min(100, globalTension + 3.0);
      inflation = Math.min(15, inflation + 0.2);
    } else if (ae.id === 'CYBER_ATTACK') {
      economicHealth = Math.max(10, economicHealth - 1.2);
    } else if (ae.id === 'INFLATION_SPIKE') {
      inflation = Math.min(25, inflation + 0.6);
    }
  });

  // Calculate interest rate based on inflation & economic health
  let interestRate = 0.03 + (inflation / 100.0) * 0.5;
  if (economicHealth < 40) {
    interestRate = Math.max(0.005, interestRate - 0.025); // cut rates during recession
  }
  interestRate = parseFloat(Math.max(0.005, Math.min(0.25, interestRate)).toFixed(4));

  // 9. Update Crypto & Meme social sentiment
  const nextSentiment = { ...prev.socialSentiment };
  const sentiments: SentimentState[] = ['Fear', 'Neutral', 'Hype', 'Mania', 'Panic'];
  
  Object.keys(nextSentiment).forEach(assetId => {
    // Speculative tech/crypto sentiment drifts randomly or on events
    if (Math.random() < 0.05) {
      let currentIdx = sentiments.indexOf(prev.socialSentiment[assetId]);
      let shift = Math.random() < 0.5 ? -1 : 1;
      
      // Events dictate sentiment shifts
      if (nextActiveEvents.some(ae => ae.id === 'MEME_MANIA') && (assetId === 'DOGG' || assetId === 'MEME')) {
        shift = 1;
      }
      if (nextActiveEvents.some(ae => ae.id === 'CRYPTO_CRACKDOWN') && (assetId === 'BYTE' || assetId === 'DOGG' || assetId === 'MEME')) {
        shift = -1;
      }
      
      const newIdx = Math.max(0, Math.min(sentiments.length - 1, currentIdx + shift));
      nextSentiment[assetId] = sentiments[newIdx];
    }
  });

  // 10. Update Company States (Quarterly financials & strategy inputs)
  const nextCompanies = { ...prev.companies };
  Object.keys(nextCompanies).forEach(compId => {
    const comp = nextCompanies[compId];
    let compCash = comp.cash;
    let compDebt = comp.debt;

    // Apply corporate strategy costs
    let rdCostMultiplier = comp.rdSpending === 'High' ? 1.3 : comp.rdSpending === 'Low' ? 0.8 : 1.0;
    let costCutMultiplier = comp.costCutting === 'Aggressive' ? 0.75 : comp.costCutting === 'Low' ? 0.9 : 1.0;
    
    // Earnings reports check (triggered every 90 turns)
    if (nextTurn % 90 === 0) {
      const scale = comp.isPrivate ? 0.7 : 1.0;
      
      // Base growth modified by economic health and R&D spending
      const baseGrowth = (economicHealth / 100) * 0.12 - 0.04;
      const strategyBonus = comp.rdSpending === 'High' ? 0.05 : 0;
      const actualGrowth = baseGrowth + strategyBonus + (comp.strategyShift === 'AI' && nextCycle === 'Euphoria' ? 0.08 : 0);

      // Quarterly revenue calculation
      const revenue = Math.max(500000, comp.financials.revenue * (1 + actualGrowth) * scale);
      
      // Profit margins
      const baseMargin = 0.15;
      const costMarginBonus = comp.costCutting === 'Aggressive' ? 0.12 : comp.costCutting === 'Low' ? 0.04 : 0;
      const actualMargin = (baseMargin + costMarginBonus) * (1 - (comp.rdSpending === 'High' ? 0.08 : 0));
      const profit = revenue * actualMargin;

      // Adjust company balance sheet
      compCash += profit;
      if (compCash < 0) {
        compDebt += Math.abs(compCash);
        compCash = 0;
      }

      // Analyst evaluation
      let analyst: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' = 'Hold';
      if (actualGrowth > 0.08 && profit > 0) analyst = 'Strong Buy';
      else if (actualGrowth > 0.02) analyst = 'Buy';
      else if (actualGrowth < -0.05 || profit < 0) analyst = 'Strong Sell';
      else if (actualGrowth < 0) analyst = 'Sell';

      const nextFinancials: CompanyFinancials = {
        revenue: Math.round(revenue),
        profit: Math.round(profit),
        debt: Math.round(compDebt),
        growthRate: parseFloat((actualGrowth * 100).toFixed(2)),
        guidance: actualGrowth > 0.03 ? 'Bullish' : actualGrowth < -0.02 ? 'Bearish' : 'Neutral'
      };

      nextCompanies[compId] = {
        ...comp,
        cash: compCash,
        debt: compDebt,
        financials: nextFinancials,
        analystRating: analyst
      };

      eventLogs.unshift({
        date: formattedDate,
        headline: `EARNINGS REPORT: ${comp.name} (${comp.ticker})`,
        description: `Reported Q revenue of $${Math.round(revenue).toLocaleString()} and net income of $${Math.round(profit).toLocaleString()}. Guidance is ${nextFinancials.guidance}. Analysts rate: ${analyst}.`
      });

      // Price shock from earnings surprise!
      // If surprise matches guidance, shift stock price
      const priceShock = actualGrowth > 0.04 ? 0.15 : actualGrowth < -0.02 ? -0.12 : 0.02;
      prev.currentPrices[compId] = parseFloat((prev.currentPrices[compId] * (1 + priceShock)).toFixed(2));
    }
  });

  // 11. Run Asset Prices Log-Normal Walks
  const nextPrices = { ...prev.currentPrices };
  const nextHistory = { ...prev.marketHistory };

  EXPANDED_ASSETS.forEach(asset => {
    let price = prev.currentPrices[asset.id] || asset.basePrice;
    let volatility = asset.baseVolatility * difficultyConfig.marketVolatilityMultiplier;
    let drift = asset.drift;

    // Apply economic cycle drift shifts
    if (nextCycle === 'Expansion') {
      if (asset.sector === 'Tech' || asset.sector === 'AI') drift += 0.0006;
    } else if (nextCycle === 'Euphoria') {
      volatility *= 1.3;
      if (asset.sector === 'Crypto') drift += 0.0028;
      if (asset.sector === 'AI') drift += 0.0018;
    } else if (nextCycle === 'Recession') {
      if (asset.sector === 'Tech' || asset.sector === 'AI' || asset.sector === 'Crypto') drift -= 0.0015;
      if (asset.id === 'GOLD') drift += 0.0008; // safe haven support
    } else if (nextCycle === 'Depression') {
      volatility *= 1.4;
      drift -= 0.0028;
      if (asset.id === 'GOLD') drift += 0.0015;
    } else if (nextCycle === 'Recovery') {
      drift += 0.0004;
    }

    // Apply Social Sentiment volatility & drift modifiers for Cryptos/Meme AI
    if (asset.type === 'Crypto' || asset.id === 'COGN' || asset.id === 'DOGG' || asset.id === 'MEME') {
      const sentiment = nextSentiment[asset.id] || 'Neutral';
      if (sentiment === 'Mania') {
        volatility *= 2.8;
        drift += 0.006;
      } else if (sentiment === 'Hype') {
        volatility *= 1.8;
        drift += 0.002;
      } else if (sentiment === 'Fear') {
        drift -= 0.0018;
      } else if (sentiment === 'Panic') {
        volatility *= 3.0;
        drift -= 0.007;
      }
    }

    // Apply Commodity Supply/Demand logic
    if (asset.type === 'Commodity') {
      if (asset.id === 'CRDE') {
        // Oil increases with economic health (industrial demand)
        const demandFactor = (economicHealth - 60) * 0.0001;
        drift += demandFactor;
        // jumps on global tension (war risks)
        if (globalTension > 40) {
          drift += (globalTension - 40) * 0.00008;
        }
      } else if (asset.id === 'GOLD') {
        // Gold rises on tension, inflation, and public panic
        const tensionFactor = (globalTension - 20) * 0.0001;
        const inflationFactor = Math.max(0, (inflation - 2) * 0.0002);
        drift += tensionFactor + inflationFactor;
        if (nextCycle === 'Depression') {
          drift += 0.0008;
        }
      } else if (asset.id === 'WHT' || asset.id === 'CORN' || asset.id === 'SOY') {
        // agricultural commodities spike on droughts or climate storm logs
        if (nextActiveEvents.some(ae => ae.id === 'DROUGHT_SHOCK')) {
          drift += 0.0035;
        }
        if (globalTension > 50) {
          drift += 0.0006; // border blocks push wheat prices up
        }
      }
    }

    // Apply active global event modifiers
    nextActiveEvents.forEach(ae => {
      if (ae.id === 'PANDEMIC') {
        if (asset.id === 'BGEN' || asset.id === 'VIRA') drift += 0.0045; // Vaccines surge
        if (asset.id === 'CRDE') drift -= 0.0035; // Oil plunges (no transit)
      } else if (ae.id === 'CYBER_ATTACK') {
        if (asset.id === 'NEXA') drift += 0.003; // Cyber contractor demand rises
        if (asset.sector === 'Crypto') drift -= 0.004; // Hack scares off crypto deposits
      } else if (ae.id === 'AI_EMBARGO') {
        if (asset.id === 'COGN' || asset.id === 'MIND') drift -= 0.005;
      }
    }
    );

    // Apply company strategic moves (R&D or Cost Cuts)
    if (asset.type === 'Stock') {
      const comp = nextCompanies[asset.id];
      if (comp) {
        if (comp.rdSpending === 'High') drift += 0.0003;
        if (comp.strategyShift === 'AI') drift += 0.0002;
        if (comp.strategyShift === 'DEFENSE' && globalTension > 40) drift += 0.0008;
      }
    }

    // Apply Box-Muller standard normal walk step
    const step = randomNormal(drift, volatility);
    price = price * (1 + step);

    // Hard bounds
    const floor = asset.id === 'MEME' ? 0.005 : 0.10;
    if (price < floor) price = floor;
    if (price > 9999) price = 9999;

    nextPrices[asset.id] = parseFloat(price.toFixed(2));

    // Save historical log
    const hist = [...(prev.marketHistory[asset.id] || [])];
    hist.push(nextPrices[asset.id]);
    if (hist.length > HISTORY_LIMIT) {
      hist.shift();
    }
    nextHistory[asset.id] = hist;
  });

  // 12. Trigger Rare & Common Events
  // Pandemics are ultra-rare (once every 80-120 years: ~30,000 to 45,000 turns)
  // Let's set pandemic trigger rate to 0.003% per turn (~1 in 33,000 turns)
  if (pandemicLevel === 0 && Math.random() < 0.00003) {
    nextActiveEvents.push({
      id: 'PANDEMIC',
      name: 'X-27 Pandemic',
      remainingDuration: 40
    });
    eventLogs.unshift({
      date: formattedDate,
      headline: 'BLACK SWAN: Severe X-27 bio-pandemic announced by WHO.',
      description: 'Quarantines announced. Global logistics suspended. Biotech sectors are racing to develop clinical counter-measures.',
      isUrgent: true
    });
  }

  // Trigger common and uncommon events
  const commonEvents = [
    { id: 'MIDDLE_EAST_WAR', name: 'Middle East Blockade', duration: 25, chance: 0.008, log: 'GEOPOLITICAL WAR: Straits of Hormuz blocked. Global crude supply impacted.' },
    { id: 'CYBER_ATTACK', name: 'Global Banking Hack', duration: 15, chance: 0.01, log: 'CYBER ALARM: Core server grids compromised. Electronic banking systems freeze.' },
    { id: 'DROUGHT_SHOCK', name: 'El Niño Harvest Drought', duration: 30, chance: 0.009, log: 'CLIMATE ALERT: Record heat desiccates global grain crops. Wheat supply collapsing.' },
    { id: 'INFLATION_SPIKE', name: 'Runaway CPI Inflation Report', duration: 15, chance: 0.012, log: 'MACRO NEWS: CPI spikes +8.8%. Yield curves rising, safe-haven bullion surges.' },
    { id: 'MEME_MANIA', name: 'Social Hype Wave', duration: 8, chance: 0.015, log: 'HYPE SIGNAL: Viral celebrity tweets DogeGold meme. Retail volume surges +600%.' },
    { id: 'CRYPTO_CRACKDOWN', name: 'Central Bank Crypto Embargo', duration: 18, chance: 0.007, log: 'REGULATORY CRISIS: Central banks ban stablecoin liquidity pools. Speculative assets plummet.' },
    { id: 'AI_EMBARGO', name: 'High-Tech Hardware Sanctions', duration: 20, chance: 0.008, log: 'TRADE BLOCK: Superpowers lock export limits on advanced processors. AI sector down.' }
  ];

  if (nextActiveEvents.length < 2 && Math.random() < 0.05) {
    const inactiveOptions = commonEvents.filter(ce => !nextActiveEvents.some(ae => ae.id === ce.id));
    if (inactiveOptions.length > 0) {
      const selected = inactiveOptions[Math.floor(Math.random() * inactiveOptions.length)];
      if (Math.random() < selected.chance * 10) { // scale up slightly for gameplay pacing
        nextActiveEvents.push({
          id: selected.id,
          name: selected.name,
          remainingDuration: selected.duration
        });
        eventLogs.unshift({
          date: formattedDate,
          headline: selected.log.split(': ')[0],
          description: selected.log.split(': ')[1],
          isUrgent: true
        });
      }
    }
  }

  // 13. Trigger Legal Risk Scandals
  if (legalRisk > 30 && Math.random() < (legalRisk / 1500) * difficultyConfig.legalRiskMultiplier) {
    // Audit check triggers!
    let fineAmount = Math.round(prev.cash * 0.15 + 10000);
    nextCash -= fineAmount;
    
    eventLogs.unshift({
      date: formattedDate,
      headline: 'SEC AUDIT PENALTY: Regulatory compliance breach',
      description: `Auditors discovered questionable leverage margins or lobbying logs. Surcharged $${fineAmount.toLocaleString()} administrative penalties. Public trust damaged.`,
      isUrgent: true
    });

    ledgerEntries.push({
      id: `audit_fine_${nextTurn}`,
      date: formattedDate,
      type: 'LEGAL_FINE',
      cashChange: -fineAmount,
      description: `SEC compliance audit penalty. Asset seizure fine: -$${fineAmount.toLocaleString()}`
    });
  }

  return {
    ...prev,
    date: formattedDate,
    turn: nextTurn,
    cash: parseFloat(nextCash.toFixed(2)),
    debt: parseFloat(nextDebt.toFixed(2)),
    savings: parseFloat(nextSavings.toFixed(2)),
    interestRate,
    reputationPublic,
    reputationCorporate,
    reputationPolitical,
    legalRisk,
    mediaSuspicion,
    currentPrices: nextPrices,
    marketHistory: nextHistory,
    socialSentiment: nextSentiment,
    companies: nextCompanies,
    activeOptions: nextOptions,
    bonds: nextBonds,
    activeEvents: nextActiveEvents,
    eventLogs,
    economicCycle: nextCycle,
    cycleTurnsRemaining: nextCycleTurns,
    geopoliticalMetrics: {
      globalTension: Math.round(globalTension),
      pandemicLevel: Math.round(pandemicLevel),
      economicHealth: Math.round(economicHealth),
      inflation: parseFloat(inflation.toFixed(2))
    },
    ledger: [...ledgerEntries, ...prev.ledger].slice(0, 100)
  };
}

// Utility to increment dates: "2030-01-01" -> "2030-01-02"
function incrementDateString(dateStr: string, addDays: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + addDays);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Fit chart view settings
const HISTORY_LIMIT = 60;
