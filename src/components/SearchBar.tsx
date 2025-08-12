
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { searchRecipes } from '@/api/search';

const SuggestionChip = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium rounded-full border border-search-border bg-chip-bg hover:bg-chip-hover active:bg-chip-hover transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-h-[40px] touch-manipulation"
    type="button"
  >
    {children}
  </button>
);

export const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const isUrl = (text: string) => {
    if (!text || text.trim().length < 4) return false;
    
    const trimmedText = text.trim();
    // Check for URLs starting with http/https or www or domain patterns
    const urlPattern = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;
    const isUrlMatch = urlPattern.test(trimmedText);
    
    console.log('URL Check:', { text: trimmedText, isUrl: isUrlMatch });
    return isUrlMatch;
  };

  // Use useMemo to compute placeholder based on current query
  const placeholder = useMemo(() => {
    return isUrl(query) ? "Add this recipe to your collection..." : "Quick vegetarian lunch with coconut…";
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await searchRecipes(query);
      if (response.ok) {
        console.log('Search completed:', response);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const suggestions = [
    'High-protein dinner', 
    'Kids\' snack',
    'Vegetarian meal'
  ];

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center border border-search-border rounded-full bg-search-bg hover:border-search-focus focus-within:border-search-focus focus-within:ring-2 focus-within:ring-ring transition-all shadow-sm">
          <label htmlFor="search" className="sr-only">
            Search for recipes
          </label>
          <input
            id="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 sm:px-5 sm:py-3 bg-transparent border-0 rounded-full text-base placeholder:text-muted-foreground focus:outline-none min-h-[48px] sm:min-h-[52px]"
            aria-label="Search for recipes"
            autoComplete="off"
          />
        </div>
      </form>

      {/* Suggestion chips */}
      <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-2 scrollbar-hide">
        {suggestions.map((suggestion) => (
          <SuggestionChip
            key={suggestion}
            onClick={() => handleChipClick(suggestion)}
          >
            {suggestion}
          </SuggestionChip>
        ))}
      </div>

      {/* Live region for accessibility */}
      <div aria-live="polite" className="sr-only">
        {isSearching && 'Searching...'}
      </div>
    </div>
  );
};
