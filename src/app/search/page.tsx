'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchYouTube, type YouTubeSearchResult } from '@/lib/youtube';
import ResultsTable from '@/components/results-table';

export default function SearchPage() {
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const fetchResults = async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null);
    setQuotaExceeded(false);
    setCurrentPage(1); // 검색 시 페이지 초기화

    try {
      const data = await searchYouTube(query);
      setResults(data);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.error?.message?.includes('quota')) {
        setQuotaExceeded(true);
        setError('YouTube API 할당량이 소진되었습니다. 내일 다시 시도해주세요.');
      } else {
        setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      console.error('검색 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchResults();
    }
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8">
      {!query && !isLoading && (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">YouTube 콘텐츠 검색</h2>
          <p className="text-gray-600 mb-8">검색어를 입력하여 YouTube 콘텐츠를 검색해보세요.</p>
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="container mx-auto max-w-6xl px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl shadow-md mb-6 text-center">
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* 검색 결과 */}
      {results.length > 0 ? (
        <div className="container mx-auto w-full px-4 py-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-visible border border-pink-100">
            <div className="w-full overflow-visible">
              <ResultsTable 
                results={results}
                error={error || undefined}
                quotaExceeded={quotaExceeded}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
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
      ) : null}
      
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        </div>
      )}
    </div>
  );
} 