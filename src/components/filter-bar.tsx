'use client';

import React from 'react';

interface FilterBarProps {
  contentType: 'video' | 'channel';
  setContentType: (type: 'video' | 'channel') => void;
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
  // 정렬 필드 옵션
  const sortOptions = [
    { value: 'publishedAt', label: '게시일' },
    { value: 'viewCount', label: '조회수' },
    { value: 'subscriberCount', label: '구독자 수' },
    { value: 'videoCount', label: '동영상 수' },
    { value: 'viewsGrowth', label: '조회수 성장률' },
    { value: 'subscriberGrowth', label: '구독자 성장률' }
  ];

  // 콘텐츠 타입에 따라 필터링된 정렬 옵션
  const filteredSortOptions = sortOptions.filter(option => {
    if (contentType === 'video') {
      return !['subscriberCount', 'videoCount', 'subscriberGrowth'].includes(option.value);
    }
    return true;
  });

  return (
    <div className="w-full bg-white border-b border-pink-200 shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 콘텐츠 타입 필터 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-pink-50 rounded-full p-1">
              <button
                onClick={() => setContentType('video')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  contentType === 'video'
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-pink-500'
                }`}
              >
                동영상
              </button>
              <button
                onClick={() => setContentType('channel')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  contentType === 'channel'
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-pink-500'
                }`}
              >
                채널
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 정렬 옵션 */}
            <div className="flex items-center">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-white border border-pink-200 text-gray-700 text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 appearance-none cursor-pointer"
                style={{ backgroundPosition: 'right 0.75rem center' }}
              >
                {filteredSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="ml-2 p-1.5 bg-white border border-pink-200 rounded-full hover:bg-pink-50 transition-colors duration-200"
              >
                <span className={`text-gray-600 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
            </div>

            {/* 총 결과 수 */}
            <div className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border border-pink-100 shadow-sm">
              총 <span className="font-bold text-pink-600">{totalResults}</span>개 결과
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 