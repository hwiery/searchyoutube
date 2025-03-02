'use client';

import React from 'react';

interface FilterBarProps {
  contentType: 'all' | 'video' | 'channel';
  setContentType: (type: 'all' | 'video' | 'channel') => void;
  sortField: string;
  setSortField: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  totalResults: number;
}

export default function FilterBar({
  contentType,
  setContentType,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  totalResults
}: FilterBarProps) {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 border-b border-pink-100 shadow-sm py-3">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4">
          <div className="flex-shrink-0 flex items-center">
            <p className="text-gray-600 text-sm font-medium mr-4">검색 결과: <span className="font-bold text-pink-600">{totalResults}개</span></p>
            <div className="flex flex-wrap gap-2 bg-white px-2 py-1 rounded-full shadow-inner border border-pink-100">
              <button
                onClick={() => setContentType('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  contentType === 'all'
                    ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-md'
                    : 'text-gray-700 hover:bg-pink-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setContentType('video')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  contentType === 'video'
                    ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-md'
                    : 'text-gray-700 hover:bg-pink-100'
                }`}
              >
                동영상
              </button>
              <button
                onClick={() => setContentType('channel')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  contentType === 'channel'
                    ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-md'
                    : 'text-gray-700 hover:bg-pink-100'
                }`}
              >
                채널
              </button>
            </div>
          </div>
          
          <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-inner border border-pink-100">
            <label htmlFor="sort-select" className="text-sm text-gray-600 font-medium whitespace-nowrap mr-2">정렬:</label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortField}
                onChange={handleSortChange}
                className="appearance-none bg-transparent rounded-full px-3 py-1 pr-8 text-sm focus:outline-none text-gray-700"
              >
                <option value="publishedAt">게시일</option>
                <option value="title">제목</option>
                {contentType !== 'channel' && (
                  <option value="viewCount">조회수</option>
                )}
                {contentType !== 'video' && (
                  <option value="subscriberCount">구독자 수</option>
                )}
                <option value="recentViewsGrowth">조회수 성장률</option>
                <option value="estimatedRevenue">예상 수익</option>
                <option value="engagementRate">참여율</option>
                <option value="averageViewDuration">평균 시청 시간</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-pink-500">
                <span className="icon icon-arrow-down w-4 h-4"></span>
              </div>
            </div>
            
            <button
              onClick={toggleSortDirection}
              className="ml-2 p-1.5 hover:bg-pink-100 transition-colors duration-300 rounded-full flex items-center justify-center"
              title={sortDirection === 'asc' ? '오름차순' : '내림차순'}
            >
              <span className={`icon ${sortDirection === 'asc' ? 'icon-arrow-up' : 'icon-arrow-down'} text-pink-500`}></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 