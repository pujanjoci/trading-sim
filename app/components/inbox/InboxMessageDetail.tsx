import React from 'react';
import { InboxMessage } from '../../lib/inboxEngine';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

interface InboxMessageDetailProps {
  message: InboxMessage | null;
  onAction: (messageId: string, choiceIdx: number) => void;
  playerCash: number;
}

export function InboxMessageDetail({
  message,
  onAction,
  playerCash
}: InboxMessageDetailProps) {
  if (!message) {
    return (
      <div className="h-full bg-zinc-950 border border-zinc-900 rounded-xl p-8 flex flex-col justify-center items-center text-center font-mono text-zinc-500 text-xs italic select-none">
        <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>
        <HelpCircle size={28} className="text-zinc-600 mb-3" />
        No message selected. Select an email from the left sidebar to read transmission details.
      </div>
    );
  }

  const hasChoices = message.choices && message.choices.length > 0;
  const isActioned = message.isActioned;
  const isExpired = message.isExpired;
  
  // Check if player has enough cash for choices
  const noneAffordable = hasChoices && !isActioned && !isExpired && 
    message.choices!.every(choice => playerCash < choice.cost);

  return (
    <div className="h-full bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col gap-4 font-mono overflow-y-auto select-none relative">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Header Metadata */}
      <div className="border-b border-zinc-900 pb-3.5 z-10 flex flex-col gap-1 text-left">
        <div className="flex justify-between items-start gap-2 flex-wrap">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
            Sender: <span className="text-cyan-400 font-extrabold">{message.sender}</span>
          </span>
          <span className="text-[9px] text-zinc-500 font-bold">
            Sim Date: {message.date} (Day {message.turnAdded})
          </span>
        </div>
        
        <h2 className="text-sm font-black text-white uppercase tracking-tight mt-1">
          {message.subject}
        </h2>

        <div className="flex gap-2 items-center mt-2.5 flex-wrap">
          <span className="text-[8px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase">
            {message.category}
          </span>
          
          <span className={`text-[8px] px-2 py-0.5 rounded font-extrabold uppercase ${
            message.urgency === 'critical' ? 'bg-rose-950/40 border border-rose-800 text-rose-300' :
            message.urgency === 'high' ? 'bg-amber-950/20 border border-amber-900 text-amber-400' :
            'bg-zinc-900 border border-zinc-800 text-zinc-400'
          }`}>
            Urgency: {message.urgency.toUpperCase()}
          </span>

          {message.expiresInDays && !isActioned && !isExpired && (
            <span className="text-[8px] px-2 py-0.5 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300 font-bold flex items-center gap-1">
              <Clock size={8} className="animate-pulse" />
              Expires in {message.expiresInDays} Days
            </span>
          )}
        </div>
      </div>

      {/* Trigger Reason Warning Block */}
      {message.triggerReason && (
        <div className="bg-zinc-900/60 border border-zinc-850 p-3 rounded-lg text-left text-[10px] text-zinc-400 leading-normal flex items-start gap-2">
          <ShieldAlert size={14} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-cyan-400 font-black block uppercase mb-0.5 text-[9px] tracking-wider">Audit Investigation Trigger</span>
            {message.triggerReason}
          </div>
        </div>
      )}

      {/* Message Body Content */}
      <div className="flex-1 text-left text-xs text-zinc-300 leading-relaxed bg-zinc-900/25 p-4 rounded-xl border border-zinc-850 whitespace-pre-wrap font-mono min-h-[140px] z-10 overflow-y-auto">
        {message.body}
      </div>

      {/* Liquidity Warn Banner */}
      {noneAffordable && (
        <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-3 text-rose-300 text-[10px] leading-relaxed text-left flex items-start gap-2.5 animate-pulse">
          <AlertTriangle size={13} className="text-rose-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-extrabold text-rose-400 block uppercase mb-0.5">Capital Deficit Detected</span>
            Your account cash is insufficient to cover the transaction costs. Any selected option will secure automatic funding via high-interest leverage margin.
          </div>
        </div>
      )}

      {/* Choice Response Grid */}
      {hasChoices && (
        <div className="flex flex-col gap-2 mt-2 border-t border-zinc-900 pt-4 z-10">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-left mb-1 block">Decision Action Panel</span>

          {/* Actioned State */}
          {isActioned && (
            <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl text-emerald-400 text-xs font-bold leading-normal flex items-center gap-2.5 text-left">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Instruction Processed</span>
                Response option executed: "{message.choices![message.selectedChoiceIndex ?? 0].text}"
              </div>
            </div>
          )}

          {/* Expired State */}
          {isExpired && (
            <div className="bg-rose-950/10 border border-rose-900/30 p-4 rounded-xl text-rose-400 text-xs font-bold leading-normal flex items-center gap-2.5 text-left">
              <Clock size={16} className="text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Time Window Closed</span>
                This notice has expired and response choices are no longer active.
              </div>
            </div>
          )}

          {/* Action Choice Buttons */}
          {!isActioned && !isExpired && (
            <div className="flex flex-col gap-2">
              {message.choices!.map((choice, idx) => {
                const canAfford = playerCash >= choice.cost;
                const forcesDebt = !canAfford && noneAffordable;
                const allowed = canAfford || noneAffordable;

                return (
                  <button
                    key={idx}
                    onClick={() => onAction(message.id, idx)}
                    disabled={!allowed}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${
                      allowed
                        ? forcesDebt
                          ? 'bg-rose-950/10 border-rose-900/60 hover:bg-rose-900/25 hover:border-rose-500 hover:shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 hover:border-cyan-500/60 hover:shadow-md'
                        : 'bg-zinc-950/20 border-zinc-900 text-zinc-650 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-bold text-zinc-200 flex-1">{choice.text}</span>
                    
                    <div className="flex gap-3 text-[10px] font-bold shrink-0">
                      {choice.cost > 0 && (
                        <span className={forcesDebt ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
                          {forcesDebt ? `FORCED DEBT: +$${(choice.cost - playerCash).toLocaleString()}` : `COST: $${choice.cost.toLocaleString()}`}
                        </span>
                      )}
                      {choice.effects.reputationPublicChange && (
                        <span className={choice.effects.reputationPublicChange > 0 ? 'text-emerald-400' : 'text-rose-500'}>
                          PUB REP: {choice.effects.reputationPublicChange > 0 ? '+' : ''}{choice.effects.reputationPublicChange}
                        </span>
                      )}
                      {choice.effects.reputationCorporateChange && (
                        <span className={choice.effects.reputationCorporateChange > 0 ? 'text-emerald-400' : 'text-rose-500'}>
                          CORP REP: {choice.effects.reputationCorporateChange > 0 ? '+' : ''}{choice.effects.reputationCorporateChange}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
