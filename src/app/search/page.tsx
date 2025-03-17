'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { searchYouTube, type YouTubeSearchResult } from '@/lib/youtube';
import ResultsTable from '@/components/results-table';

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
  const [searchLimit, setSearchLimit] = useState<SearchLimit | null>(null);

  // 검색 실행
  const fetchResults = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
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
    setResults([]); // 새로운 검색 시작 시 이전 결과 초기화
    
    try {
      // 검색 실행
      const response = await searchYouTube(searchQuery);
      
      // API 응답 데이터 구조 확인 및 처리
      if (response && response.results) {
        setResults(response.results);
        console.log('검색 결과 설정됨:', response.results.length, '개');
      } else {
        console.error('API 응답 데이터 구조 오류:', response);
        setError('검색 결과를 처리하는 중 오류가 발생했습니다.');
      }
      
      // 검색 제한 업데이트
      if (session) {
        const limitResponse = await fetch('/api/search-limit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (limitResponse.ok) {
          const updatedLimit = await limitResponse.json();
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

  // 초기 검색 실행 및 검색어 변경 시 검색 실행
  useEffect(() => {
    if (query) {
      fetchResults(query);
    }
  }, [query, session]); // session 의존성 추가

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 에러 메시지 */}
      {error && (
        <div className="container mx-auto max-w-6xl px-4 mt-4">
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
      {isLoading ? (
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex justify-center py-16">
            <div className="icon icon-loading h-16 w-16 bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-full shadow-lg"></div>
          </div>
        </div>
      ) : results && results.length > 0 ? (
        <div className="container mx-auto w-full px-4 py-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-visible border border-pink-100">
            <div className="w-full overflow-visible">
              <ResultsTable 
                results={results}
              />
            </div>
          </div>
        </div>
      ) : query ? (
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="text-center py-16 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-md inline-block max-w-md border border-pink-100">
              <div className="icon icon-search h-16 w-16 text-pink-300 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600 mb-4">다른 검색어로 시도해보세요.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 