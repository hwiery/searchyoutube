'use client';

import React, { useState } from 'react';

interface SearchFormProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchForm({ initialQuery = '', onSearch, isLoading = false }: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="YouTube 채널 또는 비디오 검색..."
          className="flex-grow px-4 py-3 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 transition-colors duration-200"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              검색 중...
            </span>
          ) : (
            '검색'
          )}
        </button>
      </div>
    </form>
  );
} 