import React, { useState } from 'react';
import { GameState } from '../../lib/simulationEngine';
import { InboxMessage } from '../../lib/inboxEngine';
import { InboxMessageList } from './InboxMessageList';
import { InboxMessageDetail } from './InboxMessageDetail';
import { Mail } from 'lucide-react';

interface InboxPanelProps {
  state: GameState;
  onActionMessage: (messageId: string, choiceIdx: number) => void;
  onArchiveMessage: (messageId: string) => void;
  onReadMessage: (messageId: string) => void;
}

export function InboxPanel({
  state,
  onActionMessage,
  onArchiveMessage,
  onReadMessage
}: InboxPanelProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const messages = state.inbox || [];
  
  // Find current selected message details
  const selectedMessage = messages.find(m => m.id === selectedMessageId) || null;

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id);
    onReadMessage(id); // mark it as read immediately
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selecting the message when archiving it
    onArchiveMessage(id);
    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
  };

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md glow-blue flex flex-col h-[520px] select-none relative">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-4 z-10">
        <h3 className="text-xs font-black font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
          <Mail size={13} className="text-cyan-400" />
          <span>Communications Terminal (Mail & Notices)</span>
        </h3>
        <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase">Secure Encryption Grid</span>
      </div>

      {/* Side-by-side Layout Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 z-10">
        {/* Left Side: Message List */}
        <div className="md:col-span-1 min-h-0 h-full">
          <InboxMessageList
            messages={messages}
            selectedMessageId={selectedMessageId}
            onSelectMessage={handleSelectMessage}
            onArchiveMessage={handleArchive}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
          />
        </div>

        {/* Right Side: Message Detail */}
        <div className="md:col-span-2 min-h-0 h-full">
          <InboxMessageDetail
            message={selectedMessage}
            onAction={onActionMessage}
            playerCash={state.cash}
          />
        </div>
      </div>
    </div>
  );
}
