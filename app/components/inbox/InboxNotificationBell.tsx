import React from 'react';
import { Bell } from 'lucide-react';

interface InboxNotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export function InboxNotificationBell({
  unreadCount,
  onClick
}: InboxNotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex items-center justify-center"
      title={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
    >
      <Bell 
        size={16} 
        className={`text-zinc-400 group-hover:text-zinc-200 transition-colors ${
          hasUnread ? 'animate-bounce text-cyan-400 group-hover:text-cyan-300' : ''
        }`}
      />
      
      {hasUnread && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white border border-zinc-950 animate-pulse font-mono">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
