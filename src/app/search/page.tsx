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
        .then(res => {
          if (!res.ok) {
            throw new Error('검색 제한 정보를 가져오는데 실패했습니다.');
          }
          return res.json();
        })
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
      const resetDate = searchLimit.resetAt ? new Date(searchLimit.resetAt) : null;
      const resetDateStr = resetDate && !isNaN(resetDate.getTime()) 
        ? resetDate.toLocaleString('ko-KR') 
        : '다음 날';
      
      setError(`일일 검색 한도에 도달했습니다. ${resetDateStr} 이후에 다시 시도해주세요.`);
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
        } else {
          console.error('검색 제한 업데이트 실패:', await response.text());
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

  // 검색 핸들러
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim() === query.trim()) {
      // 같은 검색어로 다시 검색
      fetchResults();
    } else {
      // URL 업데이트
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchQuery);
      window.history.pushState({}, '', url.toString());
      
      // 검색 실행
      fetchResults();
    }
  };

  return (
    <section className="w-full flex flex-col">
      {/* 검색 폼 바 */}
      <div className="w-full bg-gradient-to-r from-pink-100 to-purple-100 sticky top-16 z-40">
        <SearchForm 
          initialQuery={query} 
          onSearch={handleSearch} 
          isLoading={isLoading} 
        />
      </div>
      
      {/* 검색 결과 및 필터 */}
      <div className="w-full flex-grow">
        {/* 검색 제한 정보 */}
        {searchLimit && (
          <div className="flex justify-center my-4">
            <div className="bg-white px-4 py-2 rounded-full text-sm text-gray-600 shadow-sm border border-pink-100 flex items-center">
              <span className="font-medium mr-1">남은 검색 횟수:</span> 
              <span className="text-pink-600 font-bold">{searchLimit.remainingSearches}/{searchLimit.totalLimit}</span>
            </div>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && (
          <div className="container mx-auto max-w-6xl px-4">
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl shadow-md mb-6 text-center">
              <p>{error}</p>
              {error.includes('로그인') && (
                <a href="/auth/signin" className="mt-2 inline-block px-4 py-2 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-full text-sm font-medium">
                  로그인하기
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* 검색 결과 */}
        {results.length > 0 ? (
          <div className="w-full">
            {/* 필터 바 */}
            <div className="sticky top-[104px] z-30">
              <FilterBar 
                contentType={contentType}
                setContentType={setContentType}
                sortField={sortField}
                setSortField={setSortField}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
                totalResults={results.length}
              />
            </div>
            
            {/* 결과 테이블 */}
            <div className="container mx-auto max-w-6xl px-4 py-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100">
                <ResultsTable 
                  results={results} 
                  contentType={contentType} 
                />
              </div>
            </div>
          </div>
        ) : !isLoading && query ? (
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <div className="text-center py-16 px-4">
              <div className="bg-white p-8 rounded-2xl shadow-md inline-block max-w-md border border-pink-100">
                <div className="icon icon-search h-16 w-16 text-pink-300 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-600 mb-4">다른 검색어로 시도해보세요.</p>
              </div>
            </div>
          </div>
        ) : !query && !isLoading ? (
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <div className="text-center py-16 px-4">
              <div className="bg-white p-8 rounded-2xl shadow-md inline-block max-w-md border border-pink-100">
                <div className="icon icon-search h-16 w-16 text-pink-300 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">YouTube 검색</h3>
                <p className="text-gray-600">위의 검색창에 검색어를 입력하여 시작하세요.</p>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <div className="flex justify-center py-16">
              <div className="icon icon-loading h-16 w-16 bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-full shadow-lg"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 