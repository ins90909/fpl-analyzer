'use client';

import { FPLElement } from '@/types/fpl';
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
      <div className="bg-white border border-[#c9e0eb] rounded-lg p-6 mb-8 text-center text-[#7891a3] text-sm">
        No immediate high-priority transfers recommended for this Gameweek.
      </div>
    );
  }

  return (
    <div className="bg-[#eaf6fb] border border-[#c9e0eb] rounded-lg p-6 mb-8">
      <h2 className="text-lg font-bold text-[#244764] flex items-center gap-2 mb-4">
        <span>Recommended Transfer Upgrades</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parsedSuggestions.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-white border border-[#c9e0eb] rounded-lg flex items-center justify-between gap-3 text-xs"
          >
            {/* Sell Player */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-[#b45851] uppercase tracking-wider mb-1">
                <span>Sell</span>
              </div>
              <div className="font-bold text-[#244764] truncate">
                {item!.playerOut.web_name || 'Unknown'}
              </div>
              <div className="text-[#7891a3] text-[11px]">
                {item!.playerOut.team_short || 'UNK'} • £{((item!.playerOut.now_cost || 0) / 10).toFixed(1)}m
              </div>
              <div className="text-[#b45851] font-semibold mt-1">
                {item!.outScore.toFixed(1)} xP
              </div>
            </div>

            {/* Transfer Arrow */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="px-2 py-1 rounded bg-[#e8f7f0] text-[#327a68] border border-[#bde3d0] font-bold">
                →
              </div>
              <span className="text-[10px] font-bold text-[#327a68] mt-1">
                +{item!.gain.toFixed(1)} xP
              </span>
            </div>

            {/* Buy Player */}
            <div className="flex-1 min-w-0 text-right">
              <div className="text-[10px] font-bold text-[#327a68] uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                <span>Buy</span>
              </div>
              <div className="font-bold text-[#244764] truncate">
                {item!.playerIn.web_name || 'Unknown'}
              </div>
              <div className="text-[#7891a3] text-[11px]">
                {item!.playerIn.team_short || 'UNK'} • £{((item!.playerIn.now_cost || 0) / 10).toFixed(1)}m
              </div>
              <div className="text-[#327a68] font-semibold mt-1">
                {item!.inScore.toFixed(1)} xP
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}