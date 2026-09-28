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
          className="flex-1 px-4 py-3 bg-white border border-[#c9e0eb] rounded-lg text-[#16324f] placeholder-[#8aa4b5] focus:outline-none focus:border-[#55b89a] transition-colors text-sm shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || isSearchingName}
          className="px-6 py-3 bg-[#55b89a] hover:bg-[#449f83] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          {loading || isSearchingName ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="bg-white border border-[#c9e0eb] rounded-lg overflow-hidden shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((item) => (
            <button
              key={item.entryId}
              type="button"
              onClick={() => {
                onSearch(item.entryId.toString());
                setSearchResults([]);
              }}
              className="w-full px-4 py-3 text-left hover:bg-[#eff9f5] flex justify-between items-center transition-colors border-b border-[#e0edf2] last:border-0"
            >
              <div>
                <div className="font-semibold text-[#244764] text-xs">{item.entryName}</div>
                <div className="text-[11px] text-[#7891a3]">
                  {item.playerFirstName} {item.playerLastName}
                </div>
              </div>
              <span className="text-xs font-mono text-[#327a68] bg-[#e8f7f0] border border-[#bde3d0] px-2 py-1 rounded">
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