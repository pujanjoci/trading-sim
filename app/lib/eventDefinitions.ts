import { GameState } from './simulationEngine';
import { 
  canReceivePoliticalMessage, 
  isEligibleForGovMilitaryDemand, 
  checkAuditEligibility, 
  getCompanyOwnership 
} from './eventEligibility';

export interface EventEffect {
  cashChange?: number;
  reputationPublicChange?: number;
  reputationCorporateChange?: number;
  reputationPoliticalChange?: number;
  legalRiskChange?: number;
  mediaSuspicionChange?: number;
  politicalInfluenceChange?: number;
  assetPriceShocks?: Record<string, number>;
  unlockedInsiderInfo?: string;
  metricChanges?: {
    globalTension?: number;
    pandemicLevel?: number;
    economicHealth?: number;
    inflation?: number;
  };
  triggerEventChainId?: string; // Next event in the chain to add
  triggerEventChainDelay?: number; // Delay in turns before next step fires
}

export interface EventAction {
  text: string;
  cost: number;
  effects: EventEffect;
  outcomeDescription: string;
}

export type EventCategory =
  | 'Market Alert'
  | 'Political Message'
  | 'Company Board'
  | 'Legal Notice'
  | 'Audit Notice'
  | 'Loan / Bank Message'
  | 'Intelligence Tip'
  | 'News Briefing'
  | 'Social Sentiment'
  | 'System Tutorial'
  | 'Debug/Test Message';

export type EventUrgency = 'low' | 'medium' | 'high' | 'critical';
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export interface GameEventTemplate {
  id: string;
  category: EventCategory;
  sender: string;
  subject: string;
  body: string;
  urgency: EventUrgency;
  priority: EventPriority;
  expiresInDays?: number;
  cooldown?: number; // Cooldown in turns before it can trigger again
  condition: (state: GameState) => boolean;
  choices?: EventAction[];
  triggerReason?: string; // Populated dynamically or statically
}

export const GAME_EVENT_TEMPLATES: GameEventTemplate[] = [
  // --- REWRITTEN ORIGINAL PROMPTS ---
  {
    id: 'INSIDER_DEAL',
    category: 'Intelligence Tip',
    sender: 'DB_Architect_Encrypt',
    subject: 'Fruit Inc. (FRUT) Leaked chip logs - confidential offer',
    body: 'An encrypted message arrives from an anonymous database engineer at Fruit Inc.: "I have found a severe hardware chip flaw in the upcoming FRUT mobile phone chip. Recalls hit next week. Pay $15,000 for the leaked code logs and diagnostic files."',
    urgency: 'high',
    priority: 'high',
    expiresInDays: 3,
    cooldown: 30,
    condition: (state) => {
      // Must own FRUT or have watchlist activity
      const ownsFrut = (state.holdings['FRUT'] || 0) > 0;
      return ownsFrut || state.cash > 25000;
    },
    choices: [
      {
        text: 'Pay $15,000 for the tip',
        cost: 15000,
        effects: {
          cashChange: -15000,
          reputationCorporateChange: -10,
          legalRiskChange: 20,
          unlockedInsiderInfo: 'WARNING: Fruit Inc. (FRUT) chips are flawed. It will crash next week.'
        },
        outcomeDescription: 'You pay the engineer. They send log sheets verifying the chip failure. Short FRUT immediately before the public recall.'
      },
      {
        text: 'Report the tip to the SEC',
        cost: 0,
        effects: {
          reputationPublicChange: 15,
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
    category: 'Political Message',
    sender: 'Lobbyist Alliance Corp',
    subject: 'Offshore Drilling Initiative Bill Support',
    body: 'An oil lobbyist offers you a partnership: "Contribute $40,000 to our offshore drilling initiative. We have senators ready to bypass environmental checks, raising Brent Crude extraction yields, but it will upset environmental NGOs."',
    urgency: 'medium',
    priority: 'medium',
    expiresInDays: 5,
    cooldown: 40,
    condition: (state) => canReceivePoliticalMessage(state) && state.cash >= 40000,
    choices: [
      {
        text: 'Sponsor drilling bill ($40,000)',
        cost: 40000,
        effects: {
          cashChange: -40000,
          reputationPublicChange: -15,
          reputationPoliticalChange: 15,
          assetPriceShocks: { CRDE: 0.25 },
          metricChanges: { globalTension: 5 }
        },
        outcomeDescription: 'The bill clears regulatory committees. Crude Oil prices jump 25% due to expansion projects, but environmental NGOs blast your fund, dropping public reputation.'
      },
      {
        text: 'Fund Green Energy Ads ($15,000)',
        cost: 15000,
        effects: {
          cashChange: -15000,
          reputationPublicChange: 15,
          assetPriceShocks: { CRDE: -0.15 }
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
    id: 'PANDEMIC_DONATE',
    category: 'Company Board',
    sender: 'BioGen Labs CEO',
    subject: 'Urgent: Phase 3 Trial Funding Request',
    body: 'During this public health period, BioGen Labs requests a private research grant of $60,000 to expedite Phase 3 clinical trials. They offer equity options as collateral.',
    urgency: 'high',
    priority: 'high',
    expiresInDays: 4,
    cooldown: 35,
    condition: (state) => {
      // Trigger when pandemic levels are non-zero or player owns BioGen shares
      const ownsBio = (state.holdings['BGEN'] || 0) > 0;
      return (state.geopoliticalMetrics.pandemicLevel > 10 || ownsBio) && state.cash >= 60000;
    },
    choices: [
      {
        text: 'Fund the vaccine ($60,000)',
        cost: 60000,
        effects: {
          cashChange: -60000,
          reputationPublicChange: 30,
          assetPriceShocks: { BGEN: 0.40 }
        },
        outcomeDescription: 'Your funding completes the vaccine. BioGen stock surges 40% and your name is lauded in global health outlets (+30 Public Reputation).'
      },
      {
        text: 'Decline and short biotech',
        cost: 0,
        effects: {
          reputationPublicChange: -10,
          assetPriceShocks: { BGEN: -0.15 }
        },
        outcomeDescription: 'You decline. Vaccine efforts are stalled, dropping BioGen price by 15%. Medical analysts express disappointment in private investment.'
      }
    ]
  },
  {
    id: 'MILITARY_CONTRACT',
    category: 'Political Message',
    sender: 'MOD Procurement Desk',
    subject: 'Tactical Drone Contract Sponsorship Offer',
    body: 'An army General approaches you: "Sponsor our defense drone program ($35,000) and we will award a massive procurement contract directly to Apex Arms/NexaTech, boosting tactical hardware margins and shipping volume."',
    urgency: 'high',
    priority: 'medium',
    expiresInDays: 5,
    cooldown: 50,
    condition: (state) => isEligibleForGovMilitaryDemand(state) && state.cash >= 35000,
    choices: [
      {
        text: 'Finance drone development ($35,000)',
        cost: 35000,
        effects: {
          cashChange: -35000,
          reputationPublicChange: -10,
          reputationPoliticalChange: 15,
          assetPriceShocks: { NEXA: 0.15 }, // NexaTech cybersecurity rises
          metricChanges: { globalTension: 8 }
        },
        outcomeDescription: 'The defense contractor wins the contract. Stocks jump on news of military supply pipelines. Global tension raises slightly.'
      },
      {
        text: 'Decline procurement bid',
        cost: 0,
        effects: {},
        outcomeDescription: 'You refuse the bid. The general seeks support from competing defense holding groups.'
      }
    ]
  },

  // --- NEW EVENT CHAINS ---

  // 1. Political Campaign Event Chain
  {
    id: 'POLITICS_CHAIN_1',
    category: 'Political Message',
    sender: 'Campaign Committee',
    subject: 'Political Campaign: Donor Network Invitation [Step 1/5]',
    body: 'Greetings. The political action committee has noticed your growing net worth. We invite you to sponsor our private PAC dinner ($50,000) to network with campaign managers. This unlocks a political event chain.',
    urgency: 'medium',
    priority: 'high',
    expiresInDays: 7,
    condition: (state) => canReceivePoliticalMessage(state) && state.cash >= 50000,
    choices: [
      {
        text: 'Sponsor PAC Dinner ($50,000)',
        cost: 50000,
        effects: {
          cashChange: -50000,
          reputationPoliticalChange: 15,
          politicalInfluenceChange: 5,
          triggerEventChainId: 'POLITICS_CHAIN_2',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'You sponsored the dinner. Senders note your backing. Expect media reactions soon.'
      },
      {
        text: 'Decline Invitation',
        cost: 0,
        effects: {},
        outcomeDescription: 'You declined the campaign managers. They will look for other financial donors.'
      }
    ]
  },
  {
    id: 'POLITICS_CHAIN_2',
    category: 'Political Message',
    sender: 'Campaign Manager',
    subject: 'Political Campaign: Public Reaction Review [Step 2/5]',
    body: 'The media has published photos of you at the private PAC dinner. Retail activist groups are labeling you an oligarch, but corporate leaders praise your ambition. How do we spin this?',
    urgency: 'medium',
    priority: 'medium',
    condition: (state) => true,
    choices: [
      {
        text: 'Launch PR Campaign ($30,000)',
        cost: 30000,
        effects: {
          cashChange: -30000,
          reputationPublicChange: 10,
          reputationPoliticalChange: 5,
          triggerEventChainId: 'POLITICS_CHAIN_3',
          triggerEventChainDelay: 6
        },
        outcomeDescription: 'The PR campaign spins your involvement as "supporting infrastructure and jobs". Public reputation is saved.'
      },
      {
        text: 'Double down on pro-business ads ($20,000)',
        cost: 20000,
        effects: {
          cashChange: -20000,
          reputationPublicChange: -15,
          reputationCorporateChange: 20,
          triggerEventChainId: 'POLITICS_CHAIN_3',
          triggerEventChainDelay: 6
        },
        outcomeDescription: 'You cater to the corporate boardroom. Corporate reputation climbs, but public trust drops.'
      }
    ]
  },
  {
    id: 'POLITICS_CHAIN_3',
    category: 'Political Message',
    sender: 'Campaign Manager',
    subject: 'Political Campaign: Opposition Criticism Response [Step 3/5]',
    body: 'The opposition candidate has targeted your investments in a new TV commercial. They accuse you of conflicts of interest. What is our counter-strategy?',
    urgency: 'high',
    priority: 'medium',
    condition: (state) => true,
    choices: [
      {
        text: 'Fund opposition attack ads ($60,000)',
        cost: 60000,
        effects: {
          cashChange: -60000,
          reputationPoliticalChange: 20,
          legalRiskChange: 10,
          triggerEventChainId: 'POLITICS_CHAIN_4',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'Attack ads suppress the opposition\'s claims, gaining you political points, though legal experts raise questions.'
      },
      {
        text: 'Release formal audit records',
        cost: 0,
        effects: {
          reputationPublicChange: 10,
          reputationPoliticalChange: -10,
          triggerEventChainId: 'POLITICS_CHAIN_4',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'You cooperate with transparency requests. Your public image is squeaky clean, but legislative insiders find it weak.'
      }
    ]
  },
  {
    id: 'POLITICS_CHAIN_4',
    category: 'Political Message',
    sender: 'Debate Committee',
    subject: 'Political Campaign: Election Debate Prep [Step 4/5]',
    body: 'The crucial campaign debate is tomorrow. Your team needs campaign resources to secure debate prep specialists and buy speechwriters.',
    urgency: 'high',
    priority: 'high',
    condition: (state) => true,
    choices: [
      {
        text: 'Hire premium consultants ($80,000)',
        cost: 80000,
        effects: {
          cashChange: -80000,
          politicalInfluenceChange: 10,
          reputationPoliticalChange: 15,
          triggerEventChainId: 'POLITICS_CHAIN_5',
          triggerEventChainDelay: 4
        },
        outcomeDescription: 'Consultants rehearse responses. You dominate the debate. Election results will be finalized next week.'
      },
      {
        text: 'Rely on standard prep',
        cost: 0,
        effects: {
          politicalInfluenceChange: -5,
          triggerEventChainId: 'POLITICS_CHAIN_5',
          triggerEventChainDelay: 4
        },
        outcomeDescription: 'You give a mediocre debate performance. The race remains tight.'
      }
    ]
  },
  {
    id: 'POLITICS_CHAIN_5',
    category: 'Political Message',
    sender: 'Election Commission',
    subject: 'ELECTION RESULT CONFIRMED [Step 5/5]',
    body: 'The ballots are counted. Thanks to your campaign machinery and PAC backing, we have confirmed the results. Click below to receive the election verdict.',
    urgency: 'critical',
    priority: 'critical', // Will fire a blocking modal!
    condition: (state) => true,
    choices: [
      {
        text: 'Claim Legislative Mandate (+20 Influence)',
        cost: 0,
        effects: {
          politicalInfluenceChange: 20,
          reputationPoliticalChange: 25,
          cashChange: 15000 // Victory donor gift
        },
        outcomeDescription: 'ELECTION VICTORY: You win the seat! Legislative influence has surged +20, and campaign contributions are credited.'
      }
    ]
  },

  // 2. Company Audit Chain
  {
    id: 'AUDIT_CHAIN_1',
    category: 'Audit Notice',
    sender: 'Market Conduct Authority',
    subject: 'Compliance Warning: Audit Notice Issued [Step 1/4]',
    body: 'The regulator has flagged unusual activity. Your controlled boardroom cash reserves and buyback trades show a high variance. An audit process is initiated.',
    urgency: 'medium',
    priority: 'high',
    condition: (state) => checkAuditEligibility(state).eligible,
    choices: [
      {
        text: 'Approve cooperation protocols',
        cost: 0,
        effects: {
          reputationPublicChange: 5,
          triggerEventChainId: 'AUDIT_CHAIN_2',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'You submit to basic records retrieval. Auditors will request documents soon.'
      },
      {
        text: 'Instruct lawyers to block review ($30,000)',
        cost: 30000,
        effects: {
          cashChange: -30000,
          legalRiskChange: -10,
          mediaSuspicionChange: 15,
          triggerEventChainId: 'AUDIT_CHAIN_2',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'Lawyers file injunctions. Legal risks decrease temporarily, but journalists report your attempts to stall.'
      }
    ]
  },
  {
    id: 'AUDIT_CHAIN_2',
    category: 'Audit Notice',
    sender: 'Senior Auditor Office',
    subject: 'Audit Review: Request for Information [Step 2/4]',
    body: 'Auditors request details regarding controlled corporate ledger transactions and offshore holding structures. Discrepancies are being inspected.',
    urgency: 'high',
    priority: 'medium',
    condition: (state) => true,
    choices: [
      {
        text: 'Submit full transaction ledgers',
        cost: 0,
        effects: {
          legalRiskChange: 10,
          reputationPublicChange: 5,
          triggerEventChainId: 'AUDIT_CHAIN_3',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'Records are sent. The regulatory board will inspect the details and release findings.'
      },
      {
        text: 'Bribe secondary audit inspector ($40,000)',
        cost: 40000,
        effects: {
          cashChange: -40000,
          legalRiskChange: 25,
          reputationCorporateChange: -10,
          triggerEventChainId: 'AUDIT_CHAIN_3',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'You bribe the inspector. The files are partially redacted, but if you are caught, risks will jump.'
      }
    ]
  },
  {
    id: 'AUDIT_CHAIN_3',
    category: 'Audit Notice',
    sender: 'Regulatory Board',
    subject: 'Audit Findings Report: Enforcement Verdict [Step 3/4]',
    body: 'The audit panel has compiled its initial draft report. It states that compliance breaches and mismanaged company cash reserves occurred. They propose a settlement.',
    urgency: 'high',
    priority: 'high',
    condition: (state) => true,
    choices: [
      {
        text: 'Settle and pay fine ($50,000)',
        cost: 50000,
        effects: {
          cashChange: -50000,
          legalRiskChange: -30,
          reputationPublicChange: -20,
          triggerEventChainId: 'AUDIT_CHAIN_4',
          triggerEventChainDelay: 4
        },
        outcomeDescription: 'You pay the administrative fine to close the case. Your legal risk decays but public trust drops.'
      },
      {
        text: 'Contest audit in corporate court ($90,000)',
        cost: 90000,
        effects: {
          cashChange: -90000,
          legalRiskChange: 15,
          reputationPoliticalChange: 10,
          triggerEventChainId: 'AUDIT_CHAIN_4',
          triggerEventChainDelay: 4
        },
        outcomeDescription: 'Your lawyers counter-sue, contesting the regulatory authority in federal court.'
      }
    ]
  },
  {
    id: 'AUDIT_CHAIN_4',
    category: 'Legal Notice',
    sender: 'Ministry of Justice',
    subject: 'AUDIT CASE RESOLUTION [Step 4/4]',
    body: 'The litigation over your corporate audit has reached its final settlement stage. Click below to close the regulatory investigation file.',
    urgency: 'critical',
    priority: 'critical', // Critical modal!
    condition: (state) => true,
    choices: [
      {
        text: 'Accept court clearance & close case',
        cost: 0,
        effects: {
          legalRiskChange: -50,
          reputationPublicChange: 10
        },
        outcomeDescription: 'LITIGATION RESOLVED: The court files are sealed. The compliance audit is closed and you are cleared of charges.'
      }
    ]
  },

  // 3. Biotech FDA Chain
  {
    id: 'BIOTECH_CHAIN_1',
    category: 'News Briefing',
    sender: 'BioGen Labs R&D',
    subject: 'Biotech Update: Breakthrough Research Report [Step 1/4]',
    body: 'BioGen Labs (BGEN) researchers have published paper details on a vaccine candidate targeting the X-27 strain. They seek investors to sponsor Phase 1 trials.',
    urgency: 'low',
    priority: 'medium',
    condition: (state) => {
      // Must own BGEN shares or have active pandemic
      return (state.holdings['BGEN'] || 0) > 0 || state.geopoliticalMetrics.pandemicLevel > 10;
    },
    choices: [
      {
        text: 'Fund Phase 1 clinical trial ($20,000)',
        cost: 20000,
        effects: {
          cashChange: -20000,
          assetPriceShocks: { BGEN: 0.10 },
          triggerEventChainId: 'BIOTECH_CHAIN_2',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'You sponsored the Phase 1 trial. Initial bio-safety data will arrive soon.'
      },
      {
        text: 'Ignore research paper',
        cost: 0,
        effects: {},
        outcomeDescription: 'You decline to invest. The researchers seek alternative capital structures.'
      }
    ]
  },
  {
    id: 'BIOTECH_CHAIN_2',
    category: 'Market Alert',
    sender: 'BioGen Labs R&D',
    subject: 'Biotech Update: Trial Phase 2 Update [Step 2/4]',
    body: 'BioGen Labs has finished its Phase 2 human safety tests. The vaccine is show-casing high efficacy, but they require a heavy clinical scale-up injection ($50,000).',
    urgency: 'medium',
    priority: 'medium',
    condition: (state) => true,
    choices: [
      {
        text: 'Sponsor Phase 2 Scale-Up ($50,000)',
        cost: 50000,
        effects: {
          cashChange: -50000,
          assetPriceShocks: { BGEN: 0.15 },
          triggerEventChainId: 'BIOTECH_CHAIN_3',
          triggerEventChainDelay: 6
        },
        outcomeDescription: 'The cash is deployed. Preparations for the crucial FDA safety panel reviews are underway.'
      },
      {
        text: 'Sell current BioGen holdings',
        cost: 0,
        effects: {
          assetPriceShocks: { BGEN: -0.05 }
        },
        outcomeDescription: 'You pull backing. BioGen stock drops 5% due to reduced funding confidence.'
      }
    ]
  },
  {
    id: 'BIOTECH_CHAIN_3',
    category: 'Legal Notice',
    sender: 'FDA Compliance Office',
    subject: 'Biotech Update: Regulatory Decision Approaching [Step 3/4]',
    body: 'The FDA has scheduled its safety advisory committee vote for BioGen vaccine approval. Corporate lobbyists suggestion: a $30,000 funding contribution could speed up the final board review.',
    urgency: 'high',
    priority: 'high',
    condition: (state) => true,
    choices: [
      {
        text: 'Lobby FDA Review panel ($30,000)',
        cost: 30000,
        effects: {
          cashChange: -30000,
          legalRiskChange: 15,
          triggerEventChainId: 'BIOTECH_CHAIN_4',
          triggerEventChainDelay: 4
        },
        outcomeDescription: 'Lobbyists accelerate the calendar. The FDA panel decision is fast-tracked.'
      },
      {
        text: 'Submit to standard review schedule',
        cost: 0,
        effects: {
          triggerEventChainId: 'BIOTECH_CHAIN_4',
          triggerEventChainDelay: 6
        },
        outcomeDescription: 'The review goes through standard bureaucracy channels.'
      }
    ]
  },
  {
    id: 'BIOTECH_CHAIN_4',
    category: 'News Briefing',
    sender: 'FDA Press Room',
    subject: 'BIOTECH FDA DECISION: Vaccine Trial Approved! [Step 4/4]',
    body: 'BREAKING: FDA safety panel has confirmed approval of the BioGen vaccine. Click below to view the global clinical verdict and market impact.',
    urgency: 'critical',
    priority: 'critical', // Critical modal!
    condition: (state) => true,
    choices: [
      {
        text: 'Approve Vaccine Distribution (+35% BGEN)',
        cost: 0,
        effects: {
          assetPriceShocks: { BGEN: 0.35 },
          reputationPublicChange: 15,
          metricChanges: { pandemicLevel: -25 }
        },
        outcomeDescription: 'CLINICAL VERDICT APPROVED: BioGen stock surges +35% on heavy volumes. Pandemic levels are dropping. Public reputation rises.'
      }
    ]
  },

  // 4. Defense/Government Event Chain
  {
    id: 'DEFENSE_CHAIN_1',
    category: 'Intelligence Tip',
    sender: 'MOD Insider',
    subject: 'Defense Project: Procurement Rumors [Step 1/4]',
    body: 'Whispers from the Ministry of Defense: A multi-billion tactical drone contract is in design. NexaTech (NEXA) or other defense software contractors are prime targets. A consulting retainer ($30,000) will purchase the RFP specs.',
    urgency: 'medium',
    priority: 'high',
    condition: (state) => {
      // Must be politically involved or own NEXA
      return isEligibleForGovMilitaryDemand(state) || (state.holdings['NEXA'] || 0) > 0;
    },
    choices: [
      {
        text: 'Retain consulting agency ($30,000)',
        cost: 30000,
        effects: {
          cashChange: -30000,
          unlockedInsiderInfo: 'CONFIDENTIAL: MOD tactical drone RFP requirements favor NexaTech systems.',
          triggerEventChainId: 'DEFENSE_CHAIN_2',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'You secure the details. Expect the official bidding invitation letter within a week.'
      },
      {
        text: 'Ignore the rumors',
        cost: 0,
        effects: {},
        outcomeDescription: 'You pass on the RFP. The intelligence is archive-purged.'
      }
    ]
  },
  {
    id: 'DEFENSE_CHAIN_2',
    category: 'Political Message',
    sender: 'MOD Procurement Desk',
    subject: 'Defense Project: Bid Invitation [Step 2/4]',
    body: 'The MOD has released the request for proposal (RFP) for the drone software network. To submit a bid, you must pledge $40,000 for integration lab setups.',
    urgency: 'high',
    priority: 'medium',
    condition: (state) => true,
    choices: [
      {
        text: 'Pledge lab setup fee ($40,000)',
        cost: 40000,
        effects: {
          cashChange: -40000,
          reputationCorporateChange: 10,
          triggerEventChainId: 'DEFENSE_CHAIN_3',
          triggerEventChainDelay: 5
        },
        outcomeDescription: 'The lab setup is completed. The bid goes to final evaluation boards.'
      },
      {
        text: 'Decline to bid',
        cost: 0,
        effects: {},
        outcomeDescription: 'The bidding window closes. Contenders claim the market.'
      }
    ]
  },
  {
    id: 'DEFENSE_CHAIN_3',
    category: 'Political Message',
    sender: 'Senate Appropriations',
    subject: 'Defense Project: Funding Allocation Bill [Step 3/4]',
    body: 'Lobbying boards require capital backing to pass the defense appropriations bill in congress. A $50,000 contribution to the sponsor\'s election committee is required.',
    urgency: 'high',
    priority: 'high',
    condition: (state) => true,
    choices: [
      {
        text: 'Lobby Congress for bill ($50,000)',
        cost: 50000,
        effects: {
          cashChange: -50000,
          reputationPoliticalChange: 15,
          politicalInfluenceChange: 5,
          triggerEventChainId: 'DEFENSE_CHAIN_4',
          triggerEventChainDelay: 4
        },
        outcomeDescription: 'The funding is voted through committee. The final MOD contract award verdict is scheduled.'
      },
      {
        text: 'Allow bill to go to floor vote',
        cost: 0,
        effects: {
          triggerEventChainId: 'DEFENSE_CHAIN_4',
          triggerEventChainDelay: 6
        },
        outcomeDescription: 'The bill undergoes a slow, contested congressional vote.'
      }
    ]
  },
  {
    id: 'DEFENSE_CHAIN_4',
    category: 'News Briefing',
    sender: 'MOD Procurement Desk',
    subject: 'DEFENSE PROCUREMENT VERDICT [Step 4/4]',
    body: 'Official Announcement: NexaTech Systems (NEXA) has won the MOD tactical drone project! Click below to confirm implementation and review stock returns.',
    urgency: 'critical',
    priority: 'critical', // Critical modal!
    condition: (state) => true,
    choices: [
      {
        text: 'Authorize Defense Contract (+25% NEXA)',
        cost: 0,
        effects: {
          assetPriceShocks: { NEXA: 0.25 },
          metricChanges: { globalTension: 10 },
          reputationCorporateChange: 15
        },
        outcomeDescription: 'CONTRACT AWARDED: NexaTech stock jumps +25% on long-term procurement orders. Global tension metrics increase.'
      }
    ]
  }
];
