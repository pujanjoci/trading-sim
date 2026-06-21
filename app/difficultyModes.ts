export interface DifficultyConfig {
  id: string;
  name: string;
  description: string;
  startingCashMultiplier: number;
  marketVolatilityMultiplier: number;
  baseInterestRateMarkup: number;
  leverageMaxMultiplier: number;
  legalRiskMultiplier: number;
  recessionSeverityMultiplier: number;
}

export const DIFFICULTY_MODES: DifficultyConfig[] = [
  {
    id: 'EASY',
    name: 'Easy Standard',
    description: 'Generous cash, relaxed loan terms, forgiving regulator eyes, and calmed market fluctuations. Ideal for beginners.',
    startingCashMultiplier: 2.0,
    marketVolatilityMultiplier: 0.75,
    baseInterestRateMarkup: 0.0,
    leverageMaxMultiplier: 4.0, // up to 5x leverage
    legalRiskMultiplier: 0.4,
    recessionSeverityMultiplier: 0.5
  },
  {
    id: 'NORMAL',
    name: 'Balanced Normal',
    description: 'Standard parameters. Balanced supply shocks, standard interest rates, and average political progression requirements.',
    startingCashMultiplier: 1.0,
    marketVolatilityMultiplier: 1.0,
    baseInterestRateMarkup: 0.0,
    leverageMaxMultiplier: 3.0,
    legalRiskMultiplier: 1.0,
    recessionSeverityMultiplier: 1.0
  },
  {
    id: 'HARD',
    name: 'Hard Pro',
    description: 'Higher borrowing costs, amplified price swings, faster reputation decay, and strict SEC audits.',
    startingCashMultiplier: 0.6,
    marketVolatilityMultiplier: 1.25,
    baseInterestRateMarkup: 0.03, // +3% markup on loans
    leverageMaxMultiplier: 2.0,
    legalRiskMultiplier: 1.5,
    recessionSeverityMultiplier: 1.4
  },
  {
    id: 'REALISTIC',
    name: 'Brutal Realistic',
    description: 'High credit interest premiums, extreme macro depressions, massive bank runs, instant liquidations, and highly aggressive media probes.',
    startingCashMultiplier: 0.35,
    marketVolatilityMultiplier: 1.55,
    baseInterestRateMarkup: 0.07, // +7% markup on loans
    leverageMaxMultiplier: 1.0,  // only 2x leverage max (no margin borrowing beyond cash equivalent)
    legalRiskMultiplier: 2.5,
    recessionSeverityMultiplier: 2.0
  }
];
