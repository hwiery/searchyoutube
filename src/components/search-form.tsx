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
    <div className="w-full py-4 border-b border-pink-200">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
        <div className="flex items-center">
          <div className="w-full flex items-center bg-white rounded-full overflow-hidden border border-pink-200 shadow-md hover:shadow-lg transition-all duration-300 focus-within:ring-4 focus-within:ring-pink-100 focus-within:border-pink-400">
            <div className="pl-5 pr-2 text-pink-400 flex items-center">
              <span className="icon icon-search"></span>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="YouTube 채널 또는 비디오 검색..."
              className="flex-grow px-3 py-4 focus:outline-none text-gray-700 text-base bg-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-6 py-4 transition-all duration-300 flex items-center justify-center min-w-[100px] font-medium"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="icon icon-loading mr-2"></span>
                  검색 중...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  검색
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 