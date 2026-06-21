"use client";

import React from 'react';

interface NewsTickerProps {
  logs: { date: string; headline: string; description: string }[];
}

export function NewsTicker({ logs }: NewsTickerProps) {
  // Take the latest 5 log headlines
  const headlines = logs.slice(0, 8).map(log => ({
    text: `[${log.date}] ${log.headline.toUpperCase()}`,
    isUrgent: log.headline.includes('BREAKING') || log.headline.includes('WAR') || log.headline.includes('SINGULARITY') || log.headline.includes('CRISIS')
  }));

  if (headlines.length === 0) {
    return (
      <div className="h-10 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-500">
        INITIALIZING NEWS NETWORKS...
      </div>
    );
  }

  // Join the headlines with spacing/separators
  const joinedText = headlines.map(h => h.text).join('   •   ');

  return (
    <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center overflow-hidden z-20 relative select-none">
      {/* Red Alert Flash indicator */}
      <div className="bg-rose-950 border-r border-zinc-800 px-4 h-full flex items-center gap-2 z-30 shadow-[5px_0_10px_rgba(0,0,0,0.5)]">
        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span className="text-[10px] font-black tracking-widest text-rose-400 font-mono whitespace-nowrap">MARKET FEED</span>
      </div>

      <div className="w-full relative overflow-hidden flex items-center h-full">
        <div className="animate-marquee hover:[animation-play-state:paused] flex gap-24 items-center whitespace-nowrap text-xs font-mono font-medium text-zinc-400">
          {headlines.map((headline, idx) => (
            <span key={idx} className={`flex items-center gap-2 ${headline.isUrgent ? 'text-rose-400 font-bold' : 'text-zinc-300'}`}>
              {headline.isUrgent && <span className="text-[9px] px-1 py-0.2 rounded bg-rose-900/60 border border-rose-800 text-rose-300 font-bold animate-pulse-glow">CRITICAL</span>}
              {headline.text}
            </span>
          ))}
          {/* Double map to allow smooth seamless looping if text is short */}
          {headlines.map((headline, idx) => (
            <span key={`dup-${idx}`} className={`flex items-center gap-2 ${headline.isUrgent ? 'text-rose-400 font-bold' : 'text-zinc-300'}`}>
              {headline.isUrgent && <span className="text-[9px] px-1 py-0.2 rounded bg-rose-900/60 border border-rose-800 text-rose-300 font-bold animate-pulse-glow">CRITICAL</span>}
              {headline.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
