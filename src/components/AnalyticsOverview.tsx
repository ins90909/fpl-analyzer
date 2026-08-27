'use client';

import { ProcessedPlayer } from '@/types/fpl';

interface AnalyticsOverviewProps {
  captainRecommendation?: ProcessedPlayer | null;
  viceCaptainRecommendation?: ProcessedPlayer | null;
  totalXP?: number;
  bank?: number;
  teamValue?: number;
}

export function AnalyticsOverview({
  captainRecommendation,
  viceCaptainRecommendation,
  totalXP = 0,
  bank = 0,
  teamValue = 0,
}: AnalyticsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl shadow-md">
        <div className="text-xs font-semibold text-slate-400 mb-1">Recommended Captain</div>
        <div className="text-xl font-bold text-slate-100 truncate">
          {captainRecommendation?.web_name || 'N/A'}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          xPts:{' '}
          <span className="text-emerald-400 font-semibold">
            {captainRecommendation?.expected_score ?? 0}
          </span>
        </div>
      </div>

      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl shadow-md">
        <div className="text-xs font-semibold text-slate-400 mb-1">Recommended Vice Captain</div>
        <div className="text-xl font-bold text-slate-100 truncate">
          {viceCaptainRecommendation?.web_name || 'N/A'}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          xPts:{' '}
          <span className="text-emerald-400 font-semibold">
            {viceCaptainRecommendation?.expected_score ?? 0}
          </span>
        </div>
      </div>

      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl shadow-md">
        <div className="text-xs font-semibold text-slate-400 mb-1">Starting XI xP</div>
        <div className="text-xl font-bold text-emerald-400">{totalXP} pts</div>
        <div className="text-xs text-slate-400 mt-1">Projected GW score</div>
      </div>

      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl shadow-md">
        <div className="text-xs font-semibold text-slate-400 mb-1">Squad Value & Bank</div>
        <div className="text-xl font-bold text-slate-100">£{teamValue.toFixed(1)}m</div>
        <div className="text-xs text-slate-400 mt-1">
          In Bank: <span className="text-emerald-400 font-semibold">£{bank.toFixed(1)}m</span>
        </div>
      </div>
    </div>
  );
}