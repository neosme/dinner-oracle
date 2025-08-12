import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { searchRecipes } from '@/api/search';

const SuggestionChip = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border border-search-border bg-chip-bg hover:bg-chip-hover transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    type="button"
  >
    {children}
  </button>
);

export const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
    'Quick lunch',
    'High-protein dinner', 
    'Kids\' snack',
    'Vegetarian meal',
    'Dessert'
  ];

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center border border-search-border rounded-full bg-search-bg hover:border-search-focus focus-within:border-search-focus focus-within:ring-2 focus-within:ring-ring transition-all">
          <label htmlFor="search" className="sr-only">
            Search for recipes
          </label>
          <input
            id="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick vegetarian lunch with coconut…"
            className="flex-1 px-5 py-3 bg-transparent border-0 rounded-full text-base placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search for recipes"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="mr-2 px-6 py-2 text-sm font-medium rounded-full border border-search-border bg-background hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
            variant="outline"
          >
            {isSearching ? 'Searching...' : 'Ask'}
          </Button>
        </div>
      </form>

      {/* Suggestion chips */}
      <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
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