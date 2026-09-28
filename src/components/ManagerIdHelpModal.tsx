'use client';

import { useState } from 'react';

export function ManagerIdHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2 text-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-[#327a68] hover:text-[#276452] underline underline-offset-4 transition-colors font-medium"
      >
        How do I find my FPL Manager ID?
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-white border border-[#c9e0eb] rounded-lg text-left text-xs text-[#648198] shadow-lg max-w-md mx-auto space-y-2.5">
          <div className="flex justify-between items-center border-b border-[#e0edf2] pb-2">
            <span className="font-bold text-[#244764] text-sm">Finding Your Manager ID</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#7891a3] hover:text-[#244764] text-base leading-none"
            >
              ✕
            </button>
          </div>

          <ol className="list-decimal list-inside space-y-1.5 text-[#648198]">
            <li>
              Log in to the official{' '}
              <a
                href="https://fantasy.premierleague.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#327a68] underline"
              >
                Fantasy Premier League website
              </a>.
            </li>
            <li>Click on the <strong>Points</strong> or <strong>Pick Team</strong> tab.</li>
            <li>
              Look at your browser URL bar. The format will look like:
              <div className="mt-1 p-2 bg-[#f4fbff] rounded border border-[#c9e0eb] font-mono text-[11px] text-[#327a68] break-all">
                fantasy.premierleague.com/entry/<span className="bg-[#d7f0e4] px-1 rounded font-bold text-[#327a68]">1234567</span>/event/1
              </div>
            </li>
            <li>
              The digits after <code className="text-[#327a68] font-mono">/entry/</code> represent your <strong>Manager ID</strong>.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}