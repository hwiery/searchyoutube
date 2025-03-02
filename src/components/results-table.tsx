'use client';

import React, { useState } from 'react';
import { YouTubeSearchResult } from '@/lib/youtube';
import { formatNumber, formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface ResultsTableProps {
  results: YouTubeSearchResult[];
  contentType: 'all' | 'video' | 'channel';
}

export default function ResultsTable({ results, contentType }: ResultsTableProps) {
  const [sortField, setSortField] = useState<keyof YouTubeSearchResult>('publishedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof YouTubeSearchResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredResults = results.filter(result => {
    if (contentType === 'all') return true;
    return result.type === contentType;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let valueA: any = a[sortField];
    let valueB: any = b[sortField];

    // 특정 필드에 대한 정렬 로직 처리
    if (sortField === 'viewCount' || sortField === 'subscriberCount' || sortField === 'videoCount') {
      valueA = valueA || 0;
      valueB = valueB || 0;
    }

    if (valueA === valueB) return 0;
    
    const comparison = valueA > valueB ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const renderSortIcon = (field: keyof YouTubeSearchResult) => {
    if (sortField !== field) return null;
    return (
      <span className={`icon ${sortDirection === 'asc' ? 'icon-arrow-up' : 'icon-arrow-down'} ml-1 text-pink-500 w-4 h-4`}></span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full results-table">
        <thead>
          <tr className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
            <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">썸네일</th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-pink-100 transition-colors duration-200"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center">
                제목 {renderSortIcon('title')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-pink-100 transition-colors duration-200 whitespace-nowrap"
              onClick={() => handleSort('publishedAt')}
            >
              <div className="flex items-center">
                게시일 {renderSortIcon('publishedAt')}
              </div>
            </th>
            {contentType !== 'channel' && (
              <>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-pink-100 transition-colors duration-200 whitespace-nowrap"
                  onClick={() => handleSort('viewCount')}
                >
                  <div className="flex items-center">
                    조회수 {renderSortIcon('viewCount')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">채널</th>
              </>
            )}
            {contentType !== 'video' && (
              <>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-pink-100 transition-colors duration-200 whitespace-nowrap"
                  onClick={() => handleSort('subscriberCount')}
                >
                  <div className="flex items-center">
                    구독자 {renderSortIcon('subscriberCount')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-pink-100 transition-colors duration-200 whitespace-nowrap"
                  onClick={() => handleSort('videoCount')}
                >
                  <div className="flex items-center">
                    동영상 수 {renderSortIcon('videoCount')}
                  </div>
                </th>
              </>
            )}
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-pink-100 transition-colors duration-200 whitespace-nowrap"
              onClick={() => handleSort('recentViewsGrowth')}
            >
              <div className="flex items-center">
                조회수 성장률 {renderSortIcon('recentViewsGrowth')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-pink-100 transition-colors duration-200 whitespace-nowrap"
              onClick={() => handleSort('estimatedRevenue')}
            >
              <div className="flex items-center">
                예상 수익 {renderSortIcon('estimatedRevenue')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-pink-100">
          {sortedResults.map((result, index) => (
            <tr 
              key={result.id} 
              className={`hover:bg-pink-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-pink-50/30'}`}
            >
              <td className="px-2 py-3 whitespace-nowrap">
                <div className="thumbnail-container">
                  <img 
                    src={result.thumbnailUrl} 
                    alt={result.title} 
                    className={result.type === 'channel' ? 'thumbnail-channel' : 'thumbnail-video'}
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="max-w-md">
                  {result.type === 'video' ? (
                    <a 
                      href={`https://www.youtube.com/watch?v=${result.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-900 font-medium hover:text-pink-600 transition-colors duration-200 line-clamp-2"
                    >
                      {result.title}
                    </a>
                  ) : (
                    <Link 
                      href={`/channel/${result.id}`}
                      className="text-gray-900 font-medium hover:text-pink-600 transition-colors duration-200 line-clamp-2"
                    >
                      {result.title}
                    </Link>
                  )}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{result.description}</p>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {formatDate(result.publishedAt)}
              </td>
              {result.type === 'video' && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {formatNumber(result.viewCount || 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {result.channelTitle && (
                      <Link 
                        href={`/channel/${result.channelId}`}
                        className="text-gray-700 hover:text-pink-600 transition-colors duration-200"
                      >
                        {result.channelTitle}
                      </Link>
                    )}
                  </td>
                </>
              )}
              {result.type === 'channel' && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {formatNumber(result.subscriberCount || 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {formatNumber(result.videoCount || 0)}
                  </td>
                </>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  result.recentViewsGrowth?.includes('+') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.recentViewsGrowth || 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {result.estimatedRevenue || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedResults.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
} 