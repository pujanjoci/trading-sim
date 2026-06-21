export interface Asset {
  id: string;
  name: string;
  ticker: string;
  sector: 'Tech' | 'Biotech' | 'Commodity' | 'Defense' | 'Crypto';
  description: string;
  basePrice: number;
  baseVolatility: number; // base standard deviation for random walk
  drift: number; // long-term upward/downward drift trend
}

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  duration: number; // in game days/turns
  effects: {
    assetId: string;
    volatilityMultiplier: number;
    driftChange: number; // added to base drift during the event
  }[];
  metricChanges?: {
    globalTension?: number;
    pandemicLevel?: number;
    economicHealth?: number;
    inflation?: number;
  };
  newsHeadline: string;
}

export interface DecisionChoice {
  text: string;
  cost: number;
  effects: {
    cashChange?: number;
    reputationChange?: number;
    assetPriceShocks?: Record<string, number>; // percentage price shifts (e.g. +0.25)
    unlockedInsiderInfo?: string;
    metricChanges?: {
      globalTension?: number;
      pandemicLevel?: number;
      economicHealth?: number;
      inflation?: number;
    };
  };
  outcomeDescription: string;
}

export interface DecisionPrompt {
  id: string;
  title: string;
  description: string;
  choices: DecisionChoice[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'BUY' | 'SELL' | 'LIQUIDATION' | 'INTEREST' | 'EVENT' | 'LOBBY';
  assetId?: string;
  assetName?: string;
  quantity?: number;
  price?: number;
  cashChange: number;
  description: string;
}

export interface Holding {
  assetId: string;
  quantity: number;
  averageBuyPrice: number;
}

export interface GameState {
  date: string;
  turn: number;
  cash: number;
  debt: number;
  interestRate: number;
  reputation: number;
  holdings: Record<string, Holding>;
  currentPrices: Record<string, number>;
  marketHistory: Record<string, number[]>;
  activeEvents: { eventId: string; remainingDuration: number }[];
  eventLogs: { date: string; headline: string; description: string }[];
  geopoliticalMetrics: {
    globalTension: number;
    pandemicLevel: number;
    economicHealth: number;
    inflation: number;
  };
  insiderInfo: { text: string; dateAdded: string }[];
  ledger: Transaction[];
  gameSpeed: number; // 0 (pause), 1 (normal), 2 (fast), 5 (super-fast)
}

// Initial Assets
export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'AAPL',
    name: 'Fruit Inc.',
    ticker: 'FRUT',
    sector: 'Tech',
    description: 'A hardware and software behemoth. Highly stable with massive cash reserves, but susceptible to chip trade wars.',
    basePrice: 165.0,
    baseVolatility: 0.012,
    drift: 0.0005,
  },
  {
    id: 'COGN',
    name: 'Cognitive AI',
    ticker: 'COGN',
    sector: 'Tech',
    description: 'Leading artificial general intelligence lab. High growth potential, extremely volatile, sensitive to government regulation.',
    basePrice: 75.0,
    baseVolatility: 0.038,
    drift: 0.002,
  },
  {
    id: 'BGEN',
    name: 'BioGen Labs',
    ticker: 'BGEN',
    sector: 'Biotech',
    description: 'Advanced genomics and vaccine development firm. Performs exceptionally well during pandemics and health crises.',
    basePrice: 42.0,
    baseVolatility: 0.025,
    drift: 0.001,
  },
  {
    id: 'CRDE',
    name: 'Crude Oil',
    ticker: 'CRDE',
    sector: 'Commodity',
    description: 'Global Brent crude benchmark. Moves violently on Middle East geopolitical friction and green energy transition regulations.',
    basePrice: 80.0,
    baseVolatility: 0.02,
    drift: 0.0002,
  },
  {
    id: 'APEX',
    name: 'Apex Arms',
    ticker: 'APEX',
    sector: 'Defense',
    description: 'A key supplier of drones, missiles, and defense electronics. Profitable during periods of rising international tension.',
    basePrice: 110.0,
    baseVolatility: 0.015,
    drift: 0.0008,
  },
  {
    id: 'GOLD',
    name: 'Gold Spot',
    ticker: 'GOLD',
    sector: 'Commodity',
    description: 'The ultimate hedge asset. Moves up in recessions, hyperinflation, and high global military tension.',
    basePrice: 200.0,
    baseVolatility: 0.007,
    drift: 0.0001,
  },
  {
    id: 'WHT',
    name: 'Wheat Fut.',
    ticker: 'WHT',
    sector: 'Commodity',
    description: 'Global agricultural benchmark. Highly sensitive to extreme climate shifts, droughts, and border blockades.',
    basePrice: 28.0,
    baseVolatility: 0.018,
    drift: 0.0003,
  },
  {
    id: 'BYTE',
    name: 'ByteCoin',
    ticker: 'BYTE',
    sector: 'Crypto',
    description: 'The premier decentralized digital cryptocurrency asset. High volatility, moves on liquidity cycles.',
    basePrice: 380.0,
    baseVolatility: 0.045,
    drift: 0.0015,
  },
  {
    id: 'SHIB',
    name: 'DogeGold',
    ticker: 'DOGG',
    sector: 'Crypto',
    description: 'A pure speculation meme token. Subject to 10x spikes and 95% crashes. Driven by social media hype.',
    basePrice: 1.25,
    baseVolatility: 0.095,
    drift: -0.001, // default slight negative drift to model decay without hype
  }
];

// Geopolitical & World Events
export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: 'PANDEMIC',
    name: 'X-27 Global Pandemic',
    description: 'A new contagious respiratory pathogen has triggered worldwide lockdowns and supply bottlenecks.',
    duration: 35,
    effects: [
      { assetId: 'BGEN', volatilityMultiplier: 2.5, driftChange: 0.025 }, // Biotech surges
      { assetId: 'CRDE', volatilityMultiplier: 1.8, driftChange: -0.015 }, // Oil crashes (no flying/driving)
      { assetId: 'AAPL', volatilityMultiplier: 1.3, driftChange: 0.005 },  // Remote work boosts Fruit Inc.
      { assetId: 'COGN', volatilityMultiplier: 1.2, driftChange: 0.003 },
      { assetId: 'WHT', volatilityMultiplier: 1.5, driftChange: 0.008 }     // Logistics failures push wheat up
    ],
    metricChanges: {
      pandemicLevel: 65,
      globalTension: 15,
      economicHealth: -35,
      inflation: 4.5
    },
    newsHeadline: 'BREAKING: WHO declares pandemic on X-27 strain. Lockdowns initiated.'
  },
  {
    id: 'WAR_ME',
    name: 'Middle East Conflict',
    description: 'Missile exchange near key maritime transit bottlenecks threatens major oil fields and trade corridors.',
    duration: 25,
    effects: [
      { assetId: 'CRDE', volatilityMultiplier: 3.0, driftChange: 0.035 }, // Oil rockets
      { assetId: 'APEX', volatilityMultiplier: 2.2, driftChange: 0.028 }, // Defense stocks soar
      { assetId: 'GOLD', volatilityMultiplier: 1.5, driftChange: 0.012 }, // Gold rises
      { assetId: 'AAPL', volatilityMultiplier: 1.4, driftChange: -0.006 }, // General tech down
      { assetId: 'BYTE', volatilityMultiplier: 1.5, driftChange: -0.008 } // Crypto down (risk-off)
    ],
    metricChanges: {
      globalTension: 50,
      economicHealth: -15,
      inflation: 3.0
    },
    newsHeadline: 'WAR ALERT: Strait of Hormuz blocked. Brent crude skyrockets.'
  },
  {
    id: 'AI_BREAKTHROUGH',
    name: 'AGI Singularity Realized',
    description: 'Cognitive AI releases a neural engine capable of autonomous self-improvement, triggering a productivity wave.',
    duration: 30,
    effects: [
      { assetId: 'COGN', volatilityMultiplier: 3.5, driftChange: 0.045 }, // Cognitive AI surges
      { assetId: 'AAPL', volatilityMultiplier: 1.8, driftChange: 0.015 }, // Fruit Inc uses tech
      { assetId: 'BYTE', volatilityMultiplier: 2.0, driftChange: 0.018 }, // Web3 integration spikes
      { assetId: 'APEX', volatilityMultiplier: 1.5, driftChange: 0.010 }  // Military uses AI
    ],
    metricChanges: {
      globalTension: 20,
      economicHealth: 45,
      inflation: -2.0 // deflationary productivity shock
    },
    newsHeadline: 'SINGULARITY: Cognitive AI achieves intelligence parity with human brain.'
  },
  {
    id: 'CLIMATE_SUPERSTORM',
    name: 'El Niño Harvest Drought',
    description: 'Catastrophic heatwaves in crucial grain belts decimate agricultural yields globally.',
    duration: 20,
    effects: [
      { assetId: 'WHT', volatilityMultiplier: 2.8, driftChange: 0.040 }, // Wheat surges
      { assetId: 'CRDE', volatilityMultiplier: 1.3, driftChange: 0.005 }, // Energy demand for farming rises
      { assetId: 'GOLD', volatilityMultiplier: 1.2, driftChange: 0.005 }
    ],
    metricChanges: {
      globalTension: 25,
      economicHealth: -20,
      inflation: 5.5 // extreme food inflation
    },
    newsHeadline: 'FOOD CRISIS: Global grain inventories plunge to historic lows.'
  },
  {
    id: 'CHIP_SANCTIONS',
    name: 'Semiconductor Export Ban',
    description: 'Superpowers exchange severe trade bans on AI processor shipments, freezing computing supply chains.',
    duration: 25,
    effects: [
      { assetId: 'AAPL', volatilityMultiplier: 2.0, driftChange: -0.018 }, // Tech drops hard
      { assetId: 'COGN', volatilityMultiplier: 2.5, driftChange: -0.022 }, // AI drops hard due to no hardware
      { assetId: 'APEX', volatilityMultiplier: 1.5, driftChange: 0.008 },  // Defense gets government prioritised chips
      { assetId: 'GOLD', volatilityMultiplier: 1.4, driftChange: 0.008 }
    ],
    metricChanges: {
      globalTension: 40,
      economicHealth: -25,
      inflation: 2.0
    },
    newsHeadline: 'TECH CRISIS: Superpowers enact complete hardware export embargoes.'
  },
  {
    id: 'RATE_HIKE_CRASH',
    name: 'Fed Shock Rate Hike',
    description: 'The Federal Reserve aggressively raises policy interest rates by 150 bps to combat runaway global inflation.',
    duration: 15,
    effects: [
      { assetId: 'BYTE', volatilityMultiplier: 2.5, driftChange: -0.035 }, // Crypto crushed by high rates
      { assetId: 'SHIB', volatilityMultiplier: 3.5, driftChange: -0.055 }, // Memes decimated
      { assetId: 'COGN', volatilityMultiplier: 1.8, driftChange: -0.015 }, // Tech values discounted
      { assetId: 'GOLD', volatilityMultiplier: 1.3, driftChange: -0.005 } // Gold takes hit as yield climbs
    ],
    metricChanges: {
      globalTension: 5,
      economicHealth: -10,
      inflation: -4.0 // inflation controlled
    },
    newsHeadline: 'FED SHOCK: Rate hike of 1.5% enacted. High-risk assets collapse.'
  },
  {
    id: 'MEME_HYPE',
    name: 'Elon-type Tweet Storm',
    description: 'Industrial billionaire tweets: "Bought DogeGold. It is the currency of the Martian colony."',
    duration: 8,
    effects: [
      { assetId: 'SHIB', volatilityMultiplier: 5.0, driftChange: 0.085 }, // MEME coin goes vertical
      { assetId: 'BYTE', volatilityMultiplier: 1.5, driftChange: 0.010 }
    ],
    metricChanges: {
      economicHealth: 5,
      inflation: 0.5
    },
    newsHeadline: 'HYPE TWEET: "DogeGold to the Mars!" triggers retail buying mania.'
  }
];

// Interactive Event Decision Dialogs
export const DECISION_PROMPTS: DecisionPrompt[] = [
  {
    id: 'INSIDER_DEAL',
    title: 'Shady Broker Contact',
    description: 'An encrypted message arrives from an anonymous account claiming to be a database engineer: "Fruit Inc. has secretly developed a flaw in their upcoming mobile chip. The recall hits next week. Pay $15,000 for the leaked code logs."',
    choices: [
      {
        text: 'Pay $15,000 for the tip',
        cost: 15000,
        effects: {
          cashChange: -15000,
          reputationChange: -15,
          unlockedInsiderInfo: 'WARNING: Fruit Inc. (FRUT) chips are flawed. It will crash next week.'
        },
        outcomeDescription: 'You pay the engineer. They send log sheets verifying the catastrophic failure. Short FRUT immediately before the public recall.'
      },
      {
        text: 'Report the tip to the SEC',
        cost: 0,
        effects: {
          reputationChange: 15,
          cashChange: 5000 // Whistleblower bounty
        },
        outcomeDescription: 'You report the details. The agency arrests the engineer and rewards you with a $5,000 bounty. Your corporate compliance score rises.'
      },
      {
        text: 'Ignore the message',
        cost: 0,
        effects: {},
        outcomeDescription: 'You delete the message. The game continues.'
      }
    ]
  },
  {
    id: 'LOBBYIST_DRILL',
    title: 'Energy Deregulation Lobby',
    description: 'An oil lobbyist offers you a partnership: "Contribute $40,000 to our offshore drilling initiative. We have senators ready to bypass environmental checks, raising Crude extraction yields."',
    choices: [
      {
        text: 'Sponsor drilling bill ($40,000)',
        cost: 40000,
        effects: {
          cashChange: -40000,
          reputationChange: -20,
          assetPriceShocks: { CRDE: 0.25 }, // oil surges
          metricChanges: { globalTension: 5 }
        },
        outcomeDescription: 'The bill clears regulatory committees. Crude Oil prices jump 25% due to expansion projects, but environmental NGOs blast your fund, dropping reputation.'
      },
      {
        text: 'Fund Green Energy Ads ($15,000)',
        cost: 15000,
        effects: {
          cashChange: -15000,
          reputationChange: 20,
          assetPriceShocks: { CRDE: -0.15 } // oil drops
        },
        outcomeDescription: 'Your funding goes to clean power ads. Reputation surges, putting pressure on carbon fossil fuel markets (-15% Crude Oil).'
      },
      {
        text: 'Decline offer',
        cost: 0,
        effects: {},
        outcomeDescription: 'You pass. The lobbyist looks elsewhere.'
      }
    ]
  },
  {
    id: 'SEC_INVESTIGATION',
    title: 'SEC Compliance Audit',
    description: 'Auditors flag suspicious trading logs. You are accused of front-running transactions. An inspector whispers: "A $50,000 campaign contribution could settle this auditing dispute."',
    choices: [
      {
        text: 'Bribe inspector ($50,000)',
        cost: 50000,
        effects: {
          cashChange: -50000,
          reputationChange: -10
        },
        outcomeDescription: 'The files are classified as "inconclusive". The investigation is quietly dismissed. Your cash drops.'
      },
      {
        text: 'Submit to investigation and pay fine ($25,000)',
        cost: 25000,
        effects: {
          cashChange: -25000,
          reputationChange: -30
        },
        outcomeDescription: 'You accept standard administrative fines. The papers report your settlement. Reputation drops heavily.'
      },
      {
        text: 'Hire aggressive defense attorneys ($75,000)',
        cost: 75000,
        effects: {
          cashChange: -75000,
          reputationChange: 15
        },
        outcomeDescription: 'Your lawyers counter-sue, declaring the audit invalid. The charges are dropped, and you come out looking like a target of regulation. Reputation climbs.'
      }
    ]
  },
  {
    id: 'PANDEMIC_DONATE',
    title: 'BioGen Vaccine Request',
    description: 'During a public health threat, BioGen Labs requests a private research grant of $60,000 to expedite Phase 3 trials. They offer equity options as collateral.',
    choices: [
      {
        text: 'Fund the vaccine ($60,000)',
        cost: 60000,
        effects: {
          cashChange: -60000,
          reputationChange: 35,
          assetPriceShocks: { BGEN: 0.40 } // Biotech surges
        },
        outcomeDescription: 'Your funding completes the vaccine. BioGen stock surges 40% and your name is lauded in global health outlets (+35 Reputation).'
      },
      {
        text: 'Decline and short biotech',
        cost: 0,
        effects: {
          reputationChange: -15,
          assetPriceShocks: { BGEN: -0.15 } // lack of funding delays drug, drops price
        },
        outcomeDescription: 'You decline. Vaccine efforts are stalled, dropping BioGen price by 15%. Medical analysts express disappointment in private investment.'
      }
    ]
  },
  {
    id: 'MILITARY_CONTRACT',
    title: 'Defense Lobby Opportunity',
    description: 'An army General approaches you: "Sponsor our defense drone program ($35,000) and we will award a massive procurement contract directly to Apex Arms, boosting tactical hardware margins."',
    choices: [
      {
        text: 'Finance drone development ($35,000)',
        cost: 35000,
        effects: {
          cashChange: -35000,
          reputationChange: -10,
          assetPriceShocks: { APEX: 0.35 }, // Defense surges
          metricChanges: { globalTension: 10 }
        },
        outcomeDescription: 'Apex Arms wins the contract. Their stocks jump 35% on news of military supply pipelines. Global tension raises slightly.'
      },
      {
        text: 'Decline procurement bid',
        cost: 0,
        effects: {},
        outcomeDescription: 'You refuse the bid. The general seeks support from competing defense holding groups.'
      }
    ]
  }
];

// Lobbying Actions (Triggerable by player on command)
export interface LobbyAction {
  id: string;
  name: string;
  description: string;
  cost: number;
  reputationCost: number;
  effect: (prices: Record<string, number>, metrics: any) => {
    prices: Record<string, number>;
    metrics: any;
    log: string;
  };
}

export const LOBBYING_OPTIONS: LobbyAction[] = [
  {
    id: 'OIL_SUBSIDY',
    name: 'Lobby for Fossil Subsidies',
    description: 'Lobby congress to lock in oil tax credits. Pushes oil prices up.',
    cost: 30000,
    reputationCost: 15,
    effect: (prices, metrics) => {
      const nextPrices = { ...prices };
      nextPrices['CRDE'] = nextPrices['CRDE'] * 1.18;
      const nextMetrics = { ...metrics };
      nextMetrics.globalTension = Math.min(100, nextMetrics.globalTension + 2);
      return {
        prices: nextPrices,
        metrics: nextMetrics,
        log: 'Lobbying: Passed Oil Tax Incentives. Oil prices jumped +18%.'
      };
    }
  },
  {
    id: 'AI_GRANT',
    name: 'Push for AI Tech Subsidies',
    description: 'Fund government grants for large AI computing nodes. Boosts Cognitive AI.',
    cost: 45000,
    reputationCost: 5,
    effect: (prices, metrics) => {
      const nextPrices = { ...prices };
      nextPrices['COGN'] = nextPrices['COGN'] * 1.25;
      const nextMetrics = { ...metrics };
      nextMetrics.economicHealth = Math.min(100, nextMetrics.economicHealth + 5);
      return {
        prices: nextPrices,
        metrics: nextMetrics,
        log: 'Lobbying: Passed AI Supercomputing Grant. Cognitive AI prices jumped +25%.'
      };
    }
  },
  {
    id: 'FARM_SUPPORT',
    name: 'Sponsor Agricultural relief',
    description: 'Finance irrigation projects to help wheat crops. Stabilizes and drops wheat prices.',
    cost: 20000,
    reputationCost: -15, // Negative reputation cost = gain reputation!
    effect: (prices, metrics) => {
      const nextPrices = { ...prices };
      nextPrices['WHT'] = nextPrices['WHT'] * 0.85;
      const nextMetrics = { ...metrics };
      nextMetrics.inflation = Math.max(0, nextMetrics.inflation - 1.5);
      return {
        prices: nextPrices,
        metrics: nextMetrics,
        log: 'Lobbying: Sponsored Wheat Irrigation. Food price inflation reduced. Wheat cost stabilized (-15%).'
      };
    }
  },
  {
    id: 'BORDER_SECURITY',
    name: 'Finance Border Procurement',
    description: 'Fund border fence technology supply programs. Boosts Apex Arms.',
    cost: 35000,
    reputationCost: 5,
    effect: (prices, metrics) => {
      const nextPrices = { ...prices };
      nextPrices['APEX'] = nextPrices['APEX'] * 1.22;
      const nextMetrics = { ...metrics };
      nextMetrics.globalTension = Math.min(100, nextMetrics.globalTension + 8);
      return {
        prices: nextPrices,
        metrics: nextMetrics,
        log: 'Lobbying: Sponsored border surveillance logistics. Apex Arms surges +22%.'
      };
    }
  }
];

// Helper to format dates
export function formatDateString(dateStr: string, addDays: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + addDays);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
