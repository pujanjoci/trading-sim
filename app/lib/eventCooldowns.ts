import { GameState } from './simulationEngine';
import { GAME_EVENT_TEMPLATES, GameEventTemplate } from './eventDefinitions';

// Decrements cooldown counters by 1 (called on each tick/day)
export function tickCooldowns(state: GameState): Record<string, number> {
  const nextCooldowns = { ...state.cooldowns };
  
  Object.keys(nextCooldowns).forEach(key => {
    if (nextCooldowns[key] > 0) {
      nextCooldowns[key] -= 1;
    }
  });

  return nextCooldowns;
}

// Checks if a given event category or template is on cooldown
export function isCooldownActive(
  state: GameState,
  template: GameEventTemplate
): boolean {
  // 1. Check global message cooldown (rate limiter)
  if (template.priority !== 'critical') {
    const globalCD = state.cooldowns?.global || 0;
    if (globalCD > 0) return true;
  }

  // 2. Check event-specific cooldown
  const eventCD = state.cooldowns?.[`event_${template.id}`] || 0;
  if (eventCD > 0) return true;

  // 3. Check category cooldown
  const catCD = state.cooldowns?.[`category_${template.category}`] || 0;
  if (catCD > 0) return true;

  return false;
}

// Applies cooldowns after a message has been sent
export function applyCooldownForTriggeredEvent(
  state: GameState,
  template: GameEventTemplate
): Record<string, number> {
  const nextCooldowns = { ...state.cooldowns };

  // Set global message rate-limit (2-5 simulated days)
  if (template.priority !== 'critical') {
    nextCooldowns['global'] = Math.round(2 + Math.random() * 3);
  }

  // Set event-specific cooldown
  const eventCD = template.cooldown ?? 20; // default 20 turns
  nextCooldowns[`event_${template.id}`] = eventCD;

  // Set category-specific cooldowns
  let catCD = 5;
  if (template.category === 'Political Message') {
    catCD = Math.round(7 + Math.random() * 8); // 7-15 days
  } else if (template.category === 'Company Board') {
    catCD = Math.round(10 + Math.random() * 10); // 10-20 days
  } else if (template.category === 'Legal Notice' || template.category === 'Audit Notice') {
    catCD = 25; // audits/legal issues are rare
  } else if (template.category === 'Market Alert') {
    catCD = 3; // market news can be slightly faster
  }

  nextCooldowns[`category_${template.category}`] = catCD;

  return nextCooldowns;
}
