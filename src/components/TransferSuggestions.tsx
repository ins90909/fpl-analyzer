'use client';

import { FPLElement } from '@/types/fpl';
import { ArrowRightLeft, TrendingUp, AlertCircle } from 'lucide-react';

interface TransferSuggestionsProps {
  suggestions: any[];
}

export function TransferSuggestions({ suggestions }: TransferSuggestionsProps) {
  // Normalize and resolve player objects across any key naming convention
  const parsedSuggestions = (suggestions || [])
    .map((item) => {
      if (!item) return null;

      const playerOut: FPLElement & { expected_score?: number; position_short?: string; team_short?: string } =
        item.out ||
        item.playerOut ||
        item.player_out ||
        item.sell ||
        item.outPlayer ||
        item.from ||
        item.current ||
        item.transferOut;

      const playerIn: FPLElement & { expected_score?: number; position_short?: string; team_short?: string } =
        item.in ||
        item.playerIn ||
        item.player_in ||
        item.buy ||
        item.inPlayer ||
        item.to ||
        item.target ||
        item.replacement ||
        item.transferIn;

      if (!playerOut || !playerIn) return null;

      const outScore = Number(playerOut.expected_score ?? playerOut.ep_next ?? 0);
      const inScore = Number(playerIn.expected_score ?? playerIn.ep_next ?? 0);

      const gain =
        item.scoreGain ??
        item.gain ??
        item.projectedGain ??
        item.expectedGain ??
        item.pointsGain ??
        item.xPGain ??
        (inScore - outScore);

      return {
        playerOut,
        playerIn,
        outScore,
        inScore,
        gain: Math.max(0, gain),
      };
    })
    .filter(Boolean);

  if (parsedSuggestions.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 backdrop-blur-sm mb-8 text-center text-slate-400 text-sm">
        No immediate high-priority transfers recommended for this Gameweek.
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 backdrop-blur-sm mb-8">
      <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
        <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
        <span>Recommended Transfer Upgrades</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parsedSuggestions.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl flex items-center justify-between gap-3 text-xs"
          >
            {/* Sell Player */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Sell</span>
              </div>
              <div className="font-bold text-slate-200 truncate">
                {item!.playerOut.web_name || 'Unknown'}
              </div>
              <div className="text-slate-400 text-[11px]">
                {item!.playerOut.team_short || 'UNK'} • £{((item!.playerOut.now_cost || 0) / 10).toFixed(1)}m
              </div>
              <div className="text-rose-400 font-semibold mt-1">
                {item!.outScore.toFixed(1)} xP
              </div>
            </div>

            {/* Transfer Arrow */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="p-2 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-1">
                +{item!.gain.toFixed(1)} xP
              </span>
            </div>

            {/* Buy Player */}
            <div className="flex-1 min-w-0 text-right">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Buy</span>
              </div>
              <div className="font-bold text-slate-200 truncate">
                {item!.playerIn.web_name || 'Unknown'}
              </div>
              <div className="text-slate-400 text-[11px]">
                {item!.playerIn.team_short || 'UNK'} • £{((item!.playerIn.now_cost || 0) / 10).toFixed(1)}m
              </div>
              <div className="text-emerald-400 font-semibold mt-1">
                {item!.inScore.toFixed(1)} xP
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}