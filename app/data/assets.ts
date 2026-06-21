export interface AssetConfig {
  id: string;
  name: string;
  ticker: string;
  type: 'Stock' | 'Commodity' | 'Crypto';
  sector: 'Tech' | 'AI' | 'Biotech' | 'Energy' | 'Agriculture' | 'Crypto' | 'SafeHaven';
  description: string;
  basePrice: number;
  baseVolatility: number;
  drift: number;
  // Stock specific details
  totalShares?: number;
  initialCash?: number;
  initialDebt?: number;
}

export const EXPANDED_ASSETS: AssetConfig[] = [
  // TECH SECTOR (Stocks)
  {
    id: 'FRUT',
    name: 'Fruit Inc.',
    ticker: 'FRUT',
    type: 'Stock',
    sector: 'Tech',
    description: 'Global consumer electronics giant. Enormous cash reserves and loyal brand following, but exposed to supply chain delays.',
    basePrice: 170.0,
    baseVolatility: 0.012,
    drift: 0.0004,
    totalShares: 10000000,
    initialCash: 120000000,
    initialDebt: 15000000
  },
  {
    id: 'NEXA',
    name: 'NexaTech Systems',
    ticker: 'NEXA',
    type: 'Stock',
    sector: 'Tech',
    description: 'Enterprise cloud grid architecture and cybersecurity contractor. Stable enterprise revenues.',
    basePrice: 120.0,
    baseVolatility: 0.015,
    drift: 0.0006,
    totalShares: 8000000,
    initialCash: 60000000,
    initialDebt: 10000000
  },
  {
    id: 'OLDX',
    name: 'Old-School Machines',
    ticker: 'OLDX',
    type: 'Stock',
    sector: 'Tech',
    description: 'Legacy mainframes and server hardware. Slow growth, high dividends, low risk, but struggles to innovate.',
    basePrice: 65.0,
    baseVolatility: 0.009,
    drift: 0.0001,
    totalShares: 12000000,
    initialCash: 45000000,
    initialDebt: 30000000
  },
  {
    id: 'CHIP',
    name: 'NanoChip Tech',
    ticker: 'CHIP',
    type: 'Stock',
    sector: 'Tech',
    description: 'Micro-cap circuit board printer. High risk penny stock, cheap tech component maker.',
    basePrice: 4.20,
    baseVolatility: 0.035,
    drift: 0.0002,
    totalShares: 25000000,
    initialCash: 1500000,
    initialDebt: 800000
  },

  // AI SECTOR (Stocks)
  {
    id: 'COGN',
    name: 'Cognitive AI',
    ticker: 'COGN',
    type: 'Stock',
    sector: 'AI',
    description: 'Premier generative intelligence frontier model provider. Massively hyped, extremely volatile cash-burner.',
    basePrice: 85.0,
    baseVolatility: 0.038,
    drift: 0.0018,
    totalShares: 5000000,
    initialCash: 25000000,
    initialDebt: 12000000
  },
  {
    id: 'SYNX',
    name: 'Synergy Labs',
    ticker: 'SYNX',
    type: 'Stock',
    sector: 'AI',
    description: 'Specializes in autonomous corporate agent workflows and automated factory operations integration.',
    basePrice: 48.0,
    baseVolatility: 0.028,
    drift: 0.001,
    totalShares: 7500000,
    initialCash: 18000000,
    initialDebt: 5000000
  },
  {
    id: 'MIND',
    name: 'MindLink Neural',
    ticker: 'MIND',
    type: 'Stock',
    sector: 'AI',
    description: 'Direct brain-computer interfaces and neuro-computational interfaces. Wildly speculative speculative tech.',
    basePrice: 32.0,
    baseVolatility: 0.048,
    drift: 0.0025,
    totalShares: 6000000,
    initialCash: 10000000,
    initialDebt: 8000000
  },
  {
    id: 'TINY',
    name: 'TinyBot Robotics',
    ticker: 'TINY',
    type: 'Stock',
    sector: 'AI',
    description: 'Micro educational robotic kits. Speculative AI hardware penny stock.',
    basePrice: 2.50,
    baseVolatility: 0.045,
    drift: 0.0003,
    totalShares: 30000000,
    initialCash: 800000,
    initialDebt: 450000
  },

  // BIOTECH SECTOR (Stocks)
  {
    id: 'BGEN',
    name: 'BioGen Labs',
    ticker: 'BGEN',
    type: 'Stock',
    sector: 'Biotech',
    description: 'Advanced clinical trials, vaccines, and immunotherapy. Performs exceptionally well during health crises.',
    basePrice: 45.0,
    baseVolatility: 0.022,
    drift: 0.0008,
    totalShares: 9000000,
    initialCash: 35000000,
    initialDebt: 18000000
  },
  {
    id: 'HELX',
    name: 'Helix Genomics',
    ticker: 'HELX',
    type: 'Stock',
    sector: 'Biotech',
    description: 'Focuses on CRISPR gene editing and synthetic organ manufacturing. Subject to sudden FDA trial swings.',
    basePrice: 55.0,
    baseVolatility: 0.032,
    drift: 0.0012,
    totalShares: 7000000,
    initialCash: 22000000,
    initialDebt: 6000000
  },
  {
    id: 'VIRA',
    name: 'ViraTech Solutions',
    ticker: 'VIRA',
    type: 'Stock',
    sector: 'Biotech',
    description: 'Antiviral research grids and biosensor systems. Moves on pandemic outbreaks and medical panic.',
    basePrice: 38.0,
    baseVolatility: 0.028,
    drift: 0.0006,
    totalShares: 8500000,
    initialCash: 14000000,
    initialDebt: 4000000
  },
  {
    id: 'GENE',
    name: 'GeneClone Clinic',
    ticker: 'GENE',
    type: 'Stock',
    sector: 'Biotech',
    description: 'Micro gene therapies and wellness clinic franchise. Low cost biotech penny stock.',
    basePrice: 3.80,
    baseVolatility: 0.038,
    drift: 0.0001,
    totalShares: 20000000,
    initialCash: 1200000,
    initialDebt: 900000
  },

  // ENERGY SECTOR (CRDE is a commodity, SOLR & NUKE are Stocks)
  {
    id: 'SOLR',
    name: 'Solaris Renewable',
    ticker: 'SOLR',
    type: 'Stock',
    sector: 'Energy',
    description: 'High-capacity solar grids and battery storage. Moves up on carbon tax lobbies and expensive oil shocks.',
    basePrice: 40.0,
    baseVolatility: 0.024,
    drift: 0.0007,
    totalShares: 10000000,
    initialCash: 30000000,
    initialDebt: 12000000
  },
  {
    id: 'NUKE',
    name: 'AtomPower Grid',
    ticker: 'NUKE',
    type: 'Stock',
    sector: 'Energy',
    description: 'Nuclear energy utility company. High capital barriers, secure long-term utility revenues.',
    basePrice: 90.0,
    baseVolatility: 0.014,
    drift: 0.0003,
    totalShares: 5000000,
    initialCash: 80000000,
    initialDebt: 65000000
  },
  {
    id: 'WIND',
    name: 'WindyPower Corp',
    ticker: 'WIND',
    type: 'Stock',
    sector: 'Energy',
    description: 'Local wind turbine grids. Cheap green utility penny stock.',
    basePrice: 1.90,
    baseVolatility: 0.025,
    drift: 0.0002,
    totalShares: 40000000,
    initialCash: 600000,
    initialDebt: 300000
  },

  // COMMODITIES (Commodity type - no shares/boardrooms)
  {
    id: 'CRDE',
    name: 'Crude Oil Brent',
    ticker: 'CRDE',
    type: 'Commodity',
    sector: 'Energy',
    description: 'Brent crude petroleum commodity. Moves on supply blockades, pipeline hacks, and economic health shifts.',
    basePrice: 78.0,
    baseVolatility: 0.018,
    drift: 0.0002
  },
  {
    id: 'GOLD',
    name: 'Gold Spot',
    ticker: 'GOLD',
    type: 'Commodity',
    sector: 'SafeHaven',
    description: 'Physical gold bullion hedge. Safe haven that surges during high inflation, panic, and banking stress.',
    basePrice: 200.0,
    baseVolatility: 0.007,
    drift: 0.0001
  },
  {
    id: 'WHT',
    name: 'Wheat Futures',
    ticker: 'WHT',
    type: 'Commodity',
    sector: 'Agriculture',
    description: 'Agricultural soft commodity benchmark. Highly sensitive to extreme climate changes and droughts.',
    basePrice: 25.0,
    baseVolatility: 0.016,
    drift: 0.0002
  },
  {
    id: 'CORN',
    name: 'Corn Futures',
    ticker: 'CORN',
    type: 'Commodity',
    sector: 'Agriculture',
    description: 'Core feed and biofuel commodity. Responds to general farming output and fertilizer supply costs.',
    basePrice: 18.0,
    baseVolatility: 0.014,
    drift: 0.0001
  },
  {
    id: 'SOY',
    name: 'Soybeans Futures',
    ticker: 'SOY',
    type: 'Commodity',
    sector: 'Agriculture',
    description: 'Global agricultural supply. Moves on trade war tariffs and South American weather conditions.',
    basePrice: 30.0,
    baseVolatility: 0.015,
    drift: 0.00015
  },
  {
    id: 'SOIL',
    name: 'Nitrogen Soil',
    ticker: 'SOIL',
    type: 'Commodity',
    sector: 'Agriculture',
    description: 'Cheap bio-enriched fertilizer and farming topsoil. Highly cheap base agri commodity.',
    basePrice: 5.50,
    baseVolatility: 0.015,
    drift: 0.00005
  },

  // CRYPTO SECTOR (Crypto type - no shares/boardrooms)
  {
    id: 'BYTE',
    name: 'ByteCoin Core',
    ticker: 'BYTE',
    type: 'Crypto',
    sector: 'Crypto',
    description: 'Decentralized digital currency ledger. High volatility, moves on general cash liquidity and tech enthusiasm.',
    basePrice: 420.0,
    baseVolatility: 0.045,
    drift: 0.001
  },
  {
    id: 'DOGG',
    name: 'DogeGold Meme',
    ticker: 'DOGG',
    type: 'Crypto',
    sector: 'Crypto',
    description: 'Speculative meme coin. Heavily driven by online community hype and influencer social media threads.',
    basePrice: 1.5,
    baseVolatility: 0.09,
    drift: -0.0008
  },
  {
    id: 'STBL',
    name: 'StableDollar Coin',
    ticker: 'STBL',
    type: 'Crypto',
    sector: 'Crypto',
    description: 'Algorithmic stablecoin targeting $1.00 peg. Low volatility, but can de-peg and crash during severe crypto panics.',
    basePrice: 1.0,
    baseVolatility: 0.001,
    drift: 0.0
  },
  {
    id: 'MEME',
    name: 'CatShiba Coin',
    ticker: 'MEME',
    type: 'Crypto',
    sector: 'Crypto',
    description: 'Ultra cheap sub-penny micro cryptocurrency. Extreme volatility, moves on pure retail hype waves.',
    basePrice: 0.05,
    baseVolatility: 0.15,
    drift: -0.005
  }
];

export const ANALYST_NAMES = [
  'Goldman Analyst',
  'Bloomberg Terminal Intel',
  'JPMorgan Advisor',
  'Reddit WallStreet Rumors',
  'CNBC Market Expert',
  'MorganStanley Capital',
  'Crypto whale watcher'
];
