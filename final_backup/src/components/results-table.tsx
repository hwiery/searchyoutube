'use client';

import React, { useState } from 'react';
import { YouTubeSearchResult } from '@/lib/youtube';
import { formatNumber, formatDate } from '@/lib/utils';

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
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border-b">썸네일</th>
            <th 
              className="px-4 py-2 border-b cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('title')}
            >
              제목 {renderSortIcon('title')}
            </th>
            <th 
              className="px-4 py-2 border-b cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('publishedAt')}
            >
              게시일 {renderSortIcon('publishedAt')}
            </th>
            {contentType !== 'channel' && (
              <>
                <th 
                  className="px-4 py-2 border-b cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('viewCount')}
                >
                  조회수 {renderSortIcon('viewCount')}
                </th>
                <th className="px-4 py-2 border-b">채널</th>
              </>
            )}
            {contentType !== 'video' && (
              <>
                <th 
                  className="px-4 py-2 border-b cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('subscriberCount')}
                >
                  구독자 {renderSortIcon('subscriberCount')}
                </th>
                <th 
                  className="px-4 py-2 border-b cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('videoCount')}
                >
                  동영상 수 {renderSortIcon('videoCount')}
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedResults.map((result) => (
            <tr key={result.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">
                <img 
                  src={result.thumbnailUrl} 
                  alt={result.title} 
                  className="w-24 h-auto object-cover"
                />
              </td>
              <td className="px-4 py-2 border-b">
                <div className="font-medium">{result.title}</div>
                <div className="text-sm text-gray-500 truncate max-w-md">
                  {result.description}
                </div>
              </td>
              <td className="px-4 py-2 border-b whitespace-nowrap">
                {formatDate(result.publishedAt)}
              </td>
              {result.type === 'video' && (
                <>
                  <td className="px-4 py-2 border-b whitespace-nowrap">
                    {result.viewCount ? formatNumber(result.viewCount) : 'N/A'}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {result.channelTitle || 'N/A'}
                  </td>
                </>
              )}
              {result.type === 'channel' && (
                <>
                  <td className="px-4 py-2 border-b whitespace-nowrap">
                    {result.subscriberCount ? formatNumber(result.subscriberCount) : 'N/A'}
                  </td>
                  <td className="px-4 py-2 border-b whitespace-nowrap">
                    {result.videoCount ? formatNumber(result.videoCount) : 'N/A'}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 