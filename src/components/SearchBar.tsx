'use client';

import { useState } from 'react';
import { SearchApiResponse, SearchResultItem } from '@/types/search';
import { ManagerIdHelpModal } from './ManagerIdHelpModal';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (/^\d+$/.test(query.trim())) {
      onSearch(query.trim());
      setSearchResults([]);
      return;
    }

    setIsSearchingName(true);
    try {
      const res = await fetch(`/api/fpl/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data: SearchApiResponse = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingName(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter FPL Manager ID or Team Name..."
          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={loading || isSearchingName}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {loading || isSearchingName ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
          {searchResults.map((item) => (
            <button
              key={item.entryId}
              type="button"
              onClick={() => {
                onSearch(item.entryId.toString());
                setSearchResults([]);
              }}
              className="w-full px-4 py-3 text-left hover:bg-slate-800 flex justify-between items-center transition-colors border-b border-slate-800/50 last:border-0"
            >
              <div>
                <div className="font-semibold text-slate-200 text-xs">{item.entryName}</div>
                <div className="text-[11px] text-slate-400">
                  {item.playerFirstName} {item.playerLastName}
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded">
                ID: {item.entryId}
              </span>
            </button>
          ))}
        </div>
      )}

      <ManagerIdHelpModal />
    </div>
  );
}