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
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-gray-600 mb-2">검색 결과: <span className="font-semibold">{totalResults}개</span></p>
          <div className="flex space-x-2">
            <button
              onClick={() => setContentType('all')}
              className={`px-4 py-2 rounded-md text-sm ${
                contentType === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setContentType('video')}
              className={`px-4 py-2 rounded-md text-sm ${
                contentType === 'video'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              동영상
            </button>
            <button
              onClick={() => setContentType('channel')}
              className={`px-4 py-2 rounded-md text-sm ${
                contentType === 'channel'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              채널
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-select" className="text-sm text-gray-600">정렬:</label>
          <select
            id="sort-select"
            value={sortField}
            onChange={handleSortChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="publishedAt">게시일</option>
            <option value="title">제목</option>
            {contentType !== 'channel' && (
              <option value="viewCount">조회수</option>
            )}
            {contentType !== 'video' && (
              <option value="subscriberCount">구독자 수</option>
            )}
          </select>
          
          <button
            onClick={toggleSortDirection}
            className="border border-gray-300 rounded-md p-2 hover:bg-gray-100"
            title={sortDirection === 'asc' ? '오름차순' : '내림차순'}
          >
            {sortDirection === 'asc' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 