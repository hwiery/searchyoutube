'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { searchYouTube, type YouTubeSearchResult, type YouTubeSearchResponse } from '@/lib/youtube';
import ResultsTable from '@/components/results-table';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data: session } = useSession();
  
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreResults, setHasMoreResults] = useState(false);

  // 검색 실행
  const fetchResults = async (offset: number = 0, limit: number = 100) => {
    if (!query.trim()) return;
    
    // 로그인 확인
    if (!session) {
      setError('검색하려면 로그인이 필요합니다.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 검색 실행
      const response = await searchYouTube(query, limit, offset);
      console.log('검색 결과:', response);
      
      // 응답이 객체인 경우 (API 응답 형식)
      if (response && response.results) {
        if (response.results.length > 0) {
          if (offset === 0) {
            // 첫 페이지 로드
            setResults(response.results);
          } else {
            // 추가 결과 로드
            setResults(prevResults => [...prevResults, ...response.results]);
          }
          
          setTotalResults(response.total);
          setHasMoreResults(response.total > offset + response.results.length);
        } else if (offset === 0) {
          setError('검색 결과가 없습니다. 다른 검색어로 시도해보세요.');
        }
      } else {
        setError('검색 결과가 없습니다. 다른 검색어로 시도해보세요.');
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
      fetchResults(0, 100);
    }
  }, [query]);

  return (
    <section className="w-full flex flex-col">
      {/* 검색 결과 및 필터 */}
      <div className="w-full flex-grow">
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
        {results.length > 0 ? (
          <div className="w-full">
            {/* 결과 테이블 */}
            <div className="container mx-auto max-w-6xl px-4 py-4">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100">
                <ResultsTable 
                  results={results}
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
                <p className="text-gray-600">상단 검색창에 검색어를 입력하여 시작하세요.</p>
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