export interface PlayerBackground {
  id: string;
  name: string;
  description: string;
  startingCash: number;
  startingPublicRep: number;
  startingCorporateRep: number;
  startingPoliticalRep: number;
  perkDescription: string;
  idBonus: string;
}

export const PLAYER_BACKGROUNDS: PlayerBackground[] = [
  {
    id: 'RETAIL_TRADER',
    name: 'Retail Trader',
    description: 'A day trader working from their bedroom. Excellent at reading retail momentum, but starting with very limited capital.',
    startingCash: 15000,
    startingPublicRep: 60,
    startingCorporateRep: 40,
    startingPoliticalRep: 30,
    perkDescription: 'Sentiment Mastery (DOGG/BYTE sentiment analysis is highly transparent. Options trading is unlocked from Day 1).',
    idBonus: 'RETAIL_PERK'
  },
  {
    id: 'EX_BANKER',
    name: 'Ex-Investment Banker',
    description: 'Former Wall Street analyst. Understands institutional credit systems and starts with deep pockets, though public trust is low.',
    startingCash: 250000,
    startingPublicRep: 20,
    startingCorporateRep: 85,
    startingPoliticalRep: 40,
    perkDescription: 'Institutional Credit (Debt interest rates are reduced by 30%. Maximum leverage is expanded to 4x instead of 3x).',
    idBonus: 'BANKER_PERK'
  },
  {
    id: 'TECH_FOUNDER',
    name: 'Tech Founder',
    description: 'Bootstrapped an software agency. Heavily connected in Silicon Valley; starts with a noticeable equity slice of AI.',
    startingCash: 80000,
    startingPublicRep: 55,
    startingCorporateRep: 70,
    startingPoliticalRep: 35,
    perkDescription: 'Equity Insider (Starts with 5% ownership of Cognitive AI (COGN) for free. R&D strategies are 20% more effective).',
    idBonus: 'TECH_PERK'
  },
  {
    id: 'POLITICAL_INSIDER',
    name: 'Political Insider',
    description: 'Former campaign manager and policy aide. Knows how to navigate capital hill, starting with a leg up in government.',
    startingCash: 35000,
    startingPublicRep: 40,
    startingCorporateRep: 50,
    startingPoliticalRep: 80,
    perkDescription: 'Capitol Connection (Lobbying actions cost 40% less. Starts at "Lobbyist" career level, bypassing starting Donor caps).',
    idBonus: 'POLITICAL_PERK'
  },
  {
    id: 'COMMODITY_BROKER',
    name: 'Commodity Broker',
    description: 'Experienced pit trader in agricultural futures and crude benchmarks. Strong supply chain prediction skills.',
    startingCash: 60000,
    startingPublicRep: 45,
    startingCorporateRep: 60,
    startingPoliticalRep: 40,
    perkDescription: 'Supply Flow (Raw commodities volatility is reduced by 25% for you. Advanced warning logs on droughts/embargoes are 2x as common).',
    idBonus: 'COMMODITY_PERK'
  },
  {
    id: 'CRYPTO_INFLUENCER',
    name: 'Crypto Influencer',
    description: 'A social media personality with a massive retail following. Starts with almost nothing but carries powerful hype power.',
    startingCash: 8000,
    startingPublicRep: 75,
    startingCorporateRep: 25,
    startingPoliticalRep: 20,
    perkDescription: 'Hype Accelerator (DOGG and BYTE purchases trigger 2x the market momentum shock. Option premium costs are cut by 50%).',
    idBonus: 'CRYPTO_PERK'
  }
];
