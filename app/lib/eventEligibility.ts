import { GameState } from './simulationEngine';

// Check if player has started or unlocked politics
export function canReceivePoliticalMessage(state: GameState): boolean {
  return (
    state.politicalLevel !== 'Donor' ||
    state.politicalInfluence > 0 ||
    state.reputationPolitical > 10
  );
}

// Check if player owns enough of a company to receive boardroom/shareholder notices
export function getCompanyOwnership(state: GameState, companyId: string): number {
  const comp = state.companies[companyId];
  if (!comp) return 0;
  const sharesHeld = state.holdings[companyId] || 0;
  return (sharesHeld / comp.totalShares) * 100;
}

// Check if the player owns 20%+ of any defense-related company
export function ownsDefenseCompany(state: GameState): boolean {
  for (const compId of Object.keys(state.companies)) {
    const comp = state.companies[compId];
    if (!comp) continue;
    const isDefense = 
      comp.id === 'APEX' || 
      comp.name.toLowerCase().includes('arms') || 
      comp.name.toLowerCase().includes('defense') || 
      comp.name.toLowerCase().includes('nexa') ||
      comp.name.toLowerCase().includes('cybersecurity');
    
    if (isDefense) {
      const ownership = getCompanyOwnership(state, compId);
      if (ownership >= 20) {
        return true;
      }
    }
  }
  return false;
}

// Check if player is eligible for government/military demands
export function isEligibleForGovMilitaryDemand(state: GameState): boolean {
  return (
    state.politicalLevel === 'Finance Minister' ||
    state.politicalLevel === 'President/PM' ||
    ownsDefenseCompany(state)
  );
}

// Check if player has audit risk and determine the exact reason
export interface AuditRiskCheck {
  eligible: boolean;
  reason?: string;
}

export function checkAuditEligibility(state: GameState): AuditRiskCheck {
  // 1. High legal risk
  if (state.legalRisk > 60) {
    return {
      eligible: true,
      reason: `High legal risk profile (${state.legalRisk.toFixed(0)}/100) triggered by aggressive lobbying or shady transactions.`
    };
  }

  // 2. Controlled company debt/cash discrepancy
  for (const compId of Object.keys(state.companies)) {
    const comp = state.companies[compId];
    const ownership = getCompanyOwnership(state, compId);
    
    // Only audits for controlled companies (50%+)
    if (ownership >= 50) {
      if (comp.debt > comp.cash * 2.0 && comp.debt > 10000000) {
        return {
          eligible: true,
          reason: `Unusual capital structure: ${comp.name} debt exceeds 200% of cash reserves while under controlling interest.`
        };
      }
      if (comp.costCutting === 'Aggressive' && comp.strikeRisk > 50) {
        return {
          eligible: true,
          reason: `Employee strike risk warning (${comp.strikeRisk}%) and aggressive labor restructuring at ${comp.name}.`
        };
      }
    }
  }

  // 3. Suspiciously low public reputation
  if (state.reputationPublic < 30) {
    return {
      eligible: true,
      reason: `Severe public reputation collapse (${state.reputationPublic.toFixed(0)}%) triggering regulatory scrutiny of asset movements.`
    };
  }

  // 4. Bribe or suspicious activity in recent ledger transactions
  const recentSuspiciousTx = state.ledger.slice(0, 10).find(tx => 
    tx.description.toLowerCase().includes('bribe') || 
    tx.description.toLowerCase().includes('insider') || 
    tx.description.toLowerCase().includes('shady')
  );
  if (recentSuspiciousTx) {
    return {
      eligible: true,
      reason: `Compliance audit flag: Recent suspicious financial transaction detected ("${recentSuspiciousTx.description}").`
    };
  }

  return { eligible: false };
}
