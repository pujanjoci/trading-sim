import { GameState } from './simulationEngine';
import { GAME_EVENT_TEMPLATES, GameEventTemplate, EventAction } from './eventDefinitions';

export interface InboxMessage {
  id: string;
  templateId?: string;
  sender: string;
  subject: string;
  body: string;
  category: GameEventTemplate['category'];
  urgency: GameEventTemplate['urgency'];
  date: string;
  turnAdded: number;
  expiresInDays?: number;
  isRead: boolean;
  isArchived: boolean;
  isExpired: boolean;
  isActioned: boolean;
  selectedChoiceIndex?: number;
  choices?: EventAction[];
  triggerReason?: string;
}

// Create an inbox message from a template
export function createInboxMessage(
  state: GameState,
  template: GameEventTemplate,
  reason?: string
): InboxMessage {
  return {
    id: `msg_${Date.now()}_${Math.round(Math.random() * 1000)}`,
    templateId: template.id,
    sender: template.sender,
    subject: template.subject,
    body: template.body,
    category: template.category,
    urgency: template.urgency,
    date: state.date,
    turnAdded: state.turn,
    expiresInDays: template.expiresInDays,
    isRead: false,
    isArchived: false,
    isExpired: false,
    isActioned: false,
    choices: template.choices ? [...template.choices] : undefined,
    triggerReason: reason
  };
}

// Processes the expiration of time-sensitive messages
export function checkMessageExpirations(state: GameState): InboxMessage[] {
  if (!state.inbox) return [];
  
  return state.inbox.map(msg => {
    if (msg.isExpired || msg.isActioned || !msg.expiresInDays) return msg;

    const daysElapsed = state.turn - msg.turnAdded;
    if (daysElapsed >= msg.expiresInDays) {
      return {
        ...msg,
        isExpired: true,
        body: msg.body + `\n\n[NOTICE: This message expired on turn ${msg.turnAdded + msg.expiresInDays} and actions are no longer available.]`
      };
    }
    return msg;
  });
}

// Tick function to schedule/add pending event chains
export function processEventChains(state: GameState): {
  nextState: GameState;
  newMessages: InboxMessage[];
} {
  const newMessages: InboxMessage[] = [];
  const nextChains = { ...state.activeEventChains };

  Object.keys(nextChains).forEach(chainId => {
    const chain = nextChains[chainId];
    // If delay turns have elapsed, trigger the chain event
    if (state.turn >= chain.triggerTurn) {
      const template = GAME_EVENT_TEMPLATES.find(t => t.id === chainId);
      if (template) {
        const msg = createInboxMessage(state, template, `Scheduled chain event: ${template.subject}`);
        newMessages.push(msg);
      }
      // Remove from active pending chains
      delete nextChains[chainId];
    }
  });

  return {
    nextState: {
      ...state,
      activeEventChains: nextChains
    },
    newMessages
  };
}
