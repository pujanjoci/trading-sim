import React from 'react';
import { InboxMessage } from '../../lib/inboxEngine';
import { Mail, MailOpen, Tag, Archive, AlertTriangle } from 'lucide-react';

interface InboxMessageListProps {
  messages: InboxMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
  onArchiveMessage: (id: string, e: React.MouseEvent) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  showArchived: boolean;
  setShowArchived: (val: boolean) => void;
}

export function InboxMessageList({
  messages,
  selectedMessageId,
  onSelectMessage,
  onArchiveMessage,
  categoryFilter,
  setCategoryFilter,
  showArchived,
  setShowArchived
}: InboxMessageListProps) {
  const categories = [
    'All',
    'Market Alert',
    'Political Message',
    'Company Board',
    'Legal Notice',
    'Audit Notice',
    'Loan / Bank Message',
    'Intelligence Tip',
    'News Briefing'
  ];

  // Filter messages based on active filter and archived state
  const filteredMessages = messages.filter(msg => {
    const matchesArchive = msg.isArchived === showArchived;
    const matchesCategory = categoryFilter === 'All' || msg.category === categoryFilter;
    return matchesArchive && matchesCategory;
  });

  // Sort messages: newest first
  const sortedMessages = [...filteredMessages].sort((a, b) => b.turnAdded - a.turnAdded);

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-rose-400 bg-rose-950/40 border border-rose-800 animate-pulse-glow';
      case 'high':
        return 'text-amber-400 bg-amber-950/20 border border-amber-900';
      case 'medium':
        return 'text-cyan-400 bg-cyan-950/20 border border-cyan-900';
      default:
        return 'text-zinc-400 bg-zinc-900 border border-zinc-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden font-mono select-none">
      {/* Top Filter and Actions Bar */}
      <div className="p-4 border-b border-zinc-900 flex flex-col gap-3 bg-zinc-900/10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inbox Folders</span>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-[9px] px-2.5 py-1 rounded border transition-all font-bold ${
              showArchived
                ? 'bg-amber-950/20 border-amber-800 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {showArchived ? 'VIEW INBOX' : 'VIEW ARCHIVED'}
          </button>
        </div>

        {/* Category select dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-850 rounded p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/80 font-mono"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'All' ? 'ALL CATEGORIES' : cat.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Message List Pane */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
        {sortedMessages.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 text-xs italic">
            No messages found in folder.
          </div>
        ) : (
          sortedMessages.map((msg) => {
            const isSelected = selectedMessageId === msg.id;
            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage(msg.id)}
                className={`p-3.5 transition-all cursor-pointer flex gap-3 text-left relative ${
                  isSelected
                    ? 'bg-zinc-900/60 border-l-2 border-cyan-500 shadow-inner'
                    : 'hover:bg-zinc-900/20'
                } ${!msg.isRead ? 'font-black text-white' : 'text-zinc-400'}`}
              >
                {/* Unread indicator glow */}
                {!msg.isRead && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 glow-blue animate-pulse" />
                )}

                <div className="flex-1 min-w-0 flex flex-col gap-1.5 pl-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] text-zinc-500 truncate max-w-[130px]">
                      From: {msg.sender}
                    </span>
                    <span className="text-[9px] text-zinc-600 shrink-0">
                      Day {msg.turnAdded}
                    </span>
                  </div>

                  <span className="text-xs font-bold truncate leading-tight uppercase tracking-tight block">
                    {msg.subject}
                  </span>

                  <div className="flex justify-between items-center gap-2 mt-1">
                    <span className="text-[8px] text-cyan-500/80 font-bold uppercase truncate max-w-[120px]">
                      {msg.category}
                    </span>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase ${getUrgencyStyles(msg.urgency)}`}>
                        {msg.urgency}
                      </span>
                      
                      {!showArchived && (
                        <button
                          onClick={(e) => onArchiveMessage(msg.id, e)}
                          title="Archive message"
                          className="text-zinc-650 hover:text-zinc-400 transition-colors p-0.5"
                        >
                          <Archive size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
