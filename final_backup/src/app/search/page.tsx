'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { searchYouTube, type YouTubeSearchResult } from '@/lib/youtube';
import SearchForm from '@/components/search-form';
import ResultsTable from '@/components/results-table';
import FilterBar from '@/components/filter-bar';

interface SearchLimit {
  remainingSearches: number;
  totalLimit: number;
  resetAt: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data: session } = useSession();
  
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'all' | 'video' | 'channel'>('all');
  const [sortField, setSortField] = useState<string>('publishedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchLimit, setSearchLimit] = useState<SearchLimit | null>(null);

  // 검색 제한 정보 가져오기
  useEffect(() => {
    if (session) {
      fetch('/api/search-limit')
        .then(res => res.json())
        .then(data => setSearchLimit(data))
        .catch(err => console.error('검색 제한 정보를 가져오는 중 오류 발생:', err));
    }
  }, [session]);

  // 검색 실행
  const fetchResults = async () => {
    if (!query.trim()) return;
    
    // 로그인 확인
    if (!session) {
      setError('검색하려면 로그인이 필요합니다.');
      return;
    }
    
    // 검색 제한 확인
    if (searchLimit && searchLimit.remainingSearches <= 0) {
      setError(`일일 검색 한도에 도달했습니다. ${new Date(searchLimit.resetAt).toLocaleString()} 이후에 다시 시도해주세요.`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 검색 실행
      const data = await searchYouTube(query);
      setResults(data);
      
      // 검색 제한 업데이트
      if (session) {
        const response = await fetch('/api/search-limit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const updatedLimit = await response.json();
          setSearchLimit(updatedLimit);
        }
      }
    } catch (err) {
      setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      console.error('검색 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 검색 실행
  useEffect(() => {
    if (query) {
      fetchResults();
    }
  }, [query]);

  // 검색 제한 정보 표시
  const renderSearchLimitInfo = () => {
    if (!session || !searchLimit) return null;
    
    return (
      <div className="text-sm text-gray-600 mt-2">
        남은 검색 횟수: <span className="font-semibold">{searchLimit.remainingSearches}/{searchLimit.totalLimit}</span>
        <span className="ml-2">
          (다음 리셋: {new Date(searchLimit.resetAt).toLocaleString()})
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">YouTube 콘텐츠 검색</h1>
      
      <SearchForm 
        initialQuery={query} 
        onSearch={(newQuery) => {
          window.history.pushState(
            {}, 
            '', 
            `/search?q=${encodeURIComponent(newQuery)}`
          );
          fetchResults();
        }} 
        isLoading={isLoading} 
      />
      
      {renderSearchLimitInfo()}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : results.length > 0 ? (
        <>
          <FilterBar 
            contentType={contentType}
            setContentType={setContentType}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            totalResults={results.length}
          />
          
          <ResultsTable 
            results={results} 
            contentType={contentType} 
          />
        </>
      ) : query && !isLoading && !error ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">검색 결과가 없습니다.</p>
        </div>
      ) : null}
    </div>
  );
} 