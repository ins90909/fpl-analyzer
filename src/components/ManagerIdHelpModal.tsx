'use client';

import { useState } from 'react';

export function ManagerIdHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2 text-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors font-medium"
      >
        How do I find my FPL Manager ID?
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-slate-900/95 border border-slate-700/80 rounded-xl text-left text-xs text-slate-300 shadow-xl max-w-md mx-auto space-y-2.5 backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-100 text-sm">Finding Your Manager ID</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-base leading-none"
            >
              ✕
            </button>
          </div>

          <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
            <li>
              Log in to the official{' '}
              <a
                href="https://fantasy.premierleague.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline"
              >
                Fantasy Premier League website
              </a>.
            </li>
            <li>Click on the <strong>Points</strong> or <strong>Pick Team</strong> tab.</li>
            <li>
              Look at your browser URL bar. The format will look like:
              <div className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-300 break-all">
                fantasy.premierleague.com/entry/<span className="bg-emerald-500/20 px-1 rounded font-bold text-emerald-400">1234567</span>/event/1
              </div>
            </li>
            <li>
              The digits after <code className="text-emerald-400 font-mono">/entry/</code> represent your <strong>Manager ID</strong>.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}