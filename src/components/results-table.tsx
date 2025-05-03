'use client';

import React, { useState, useEffect, useRef } from 'react';
import { YouTubeSearchResult } from '@/lib/youtube';
import { formatNumber, formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
  results: YouTubeSearchResult[];
  error?: string;
  quotaExceeded?: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
}

// 컬럼 정의를 위한 인터페이스 추가
interface ColumnDefinition {
  id: string;
  width: string;
  label: string;
  sortable: boolean;
  field?: keyof YouTubeSearchResult;
  path?: string[];
}

// 필터 상태를 위한 인터페이스 수정
interface FilterState {
  uploadDate: string;
  duration: string;
  videoFormat: string;
  contentType: string;
}

interface SortField {
  field: string;
  path: string[];
}

export default function ResultsTable({ results, error, quotaExceeded, currentPage, onPageChange }: ResultsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'publishedAt',
    direction: 'desc'
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [displayedResults, setDisplayedResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    uploadDate: '',
    duration: '',
    videoFormat: '',
    contentType: ''
  });
  const tableRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedTags, setExpandedTags] = useState<{ [key: string]: boolean }>({});
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);

  // 필터 옵션 정의 수정
  const filterOptions = {
    uploadDate: [
      { value: '', label: '전체' },
      { value: 'hour', label: '지난 1시간' },
      { value: 'today', label: '오늘' },
      { value: 'week', label: '이번 주' },
      { value: 'month', label: '이번 달' },
      { value: 'year', label: '올해' }
    ],
    duration: [
      { value: '', label: '전체' },
      { value: '1min', label: '1분 이하' },
      { value: '5min', label: '5분 이하' },
      { value: '10min', label: '10분 이하' },
      { value: '20min', label: '20분 이하' },
      { value: '30min', label: '30분 이하' },
      { value: 'over30min', label: '30분 초과' }
    ],
    videoFormat: [
      { value: '', label: '전체' },
      { value: 'shorts', label: 'Shorts' },
      { value: 'long', label: 'Long' }
    ],
    contentType: [
      { value: '', label: '전체' },
      { value: 'music', label: '음악' },
      { value: 'gaming', label: '게임' },
      { value: 'education', label: '교육' },
      { value: 'entertainment', label: '엔터테인먼트' },
      { value: 'news', label: '뉴스' },
      { value: 'tech', label: '기술' }
    ]
  };

  // 필터 변경 핸들러
  const handleFilterChange = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
    onPageChange(1);
    setDisplayedResults([]);
  };

  // 날짜 필터링 함수
  const filterByDate = (date: string, filterValue: string): boolean => {
    const now = new Date();
    const itemDate = new Date(date);
    
    switch (filterValue) {
      case 'hour':
        return now.getTime() - itemDate.getTime() <= 3600000;
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      case 'year':
        return itemDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  // 길이 필터링 함수
  const filterByDuration = (duration: string, filterValue: string): boolean => {
    const minutes = parseDurationToMinutes(duration);
    
    switch (filterValue) {
      case 'short':
        return minutes < 4;
      case 'medium':
        return minutes >= 4 && minutes <= 20;
      case 'long':
        return minutes > 20;
      default:
        return true;
    }
  };

  // duration을 분으로 변환하는 함수
  const parseDurationToMinutes = (duration: string): number => {
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseInt(matches[3] || '0');
    
    return hours * 60 + minutes + seconds / 60;
  };

  // 동영상 형식 확인 함수 수정
  const getVideoFormat = (result: YouTubeSearchResult): { format: 'shorts' | 'long'; label: string } => {
    if (!result.duration) return { format: 'long', label: 'Long' };
    
    const durationInSeconds = parseDurationToSeconds(result.duration);
    const isShorts = durationInSeconds <= 60;
    
    return {
      format: isShorts ? 'shorts' : 'long',
      label: isShorts ? 'Shorts' : 'Long'
    };
  };

  // duration을 초로 변환하는 함수
  const parseDurationToSeconds = (duration: string): number => {
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseInt(matches[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  };

  // 정렬 및 필터링 적용
  useEffect(() => {
    if (!results.length) return;

    let filteredResults = [...results];

    // 필터 적용
    if (filters.uploadDate) {
      filteredResults = filteredResults.filter(result => 
        filterByDate(result.publishedAt, filters.uploadDate)
      );
    }

    if (filters.duration && filteredResults[0]?.duration) {
      filteredResults = filteredResults.filter(result => 
        filterByDuration(result.duration!, filters.duration)
      );
    }

    if (filters.videoFormat) {
      filteredResults = filteredResults.filter(result => {
        const format = getVideoFormat(result);
        return format.format === filters.videoFormat;
      });
    }

    // 정렬 적용
    filteredResults.sort((a, b) => {
      const aValue = a[sortConfig.field as keyof YouTubeSearchResult];
      const bValue = b[sortConfig.field as keyof YouTubeSearchResult];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });

    // 페이지네이션 적용
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    setDisplayedResults(paginatedResults);
    setTotalPages(Math.ceil(filteredResults.length / itemsPerPage));
  }, [results, filters, sortConfig, currentPage, itemsPerPage]);

  // 컬럼 정의
  const columns: ColumnDefinition[] = [
    { id: 'thumbnail', width: 'w-48', label: '썸네일', sortable: false },
    { id: 'videoFormat', width: 'w-24', label: '형식', sortable: true, field: 'videoFormat' },
    { id: 'title', width: 'w-96', label: '제목', sortable: true, field: 'title' },
    { id: 'channel', width: 'w-48', label: '채널', sortable: true, field: 'channelTitle' },
    { id: 'subscribers', width: 'w-32', label: '구독자', sortable: true, field: 'subscriberCount' },
    { id: 'subChange', width: 'w-48', label: '구독자 변화', sortable: true, path: ['stats', 'subscribers'] },
    { id: 'publishedAt', width: 'w-32', label: '업로드', sortable: true, field: 'publishedAt' },
    { id: 'duration', width: 'w-24', label: '길이', sortable: true, field: 'duration' },
    { id: 'views', width: 'w-32', label: '조회수', sortable: true, field: 'viewCount' },
    { id: 'viewChange', width: 'w-48', label: '조회수 변화', sortable: true, path: ['stats', 'views'] },
    { id: 'likes', width: 'w-32', label: '좋아요', sortable: true, field: 'likeCount' },
    { id: 'comments', width: 'w-32', label: '댓글', sortable: true, field: 'commentCount' }
  ];

  // 정렬 핸들러
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 페이지 변경 핸들러 수정
  const handlePageChange = (page: number) => {
    if (isPageChanging || page === currentPage) return;
    setIsPageChanging(true);
    onPageChange(page);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
      setIsPageChanging(false);
    }, 300);
  };

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    onPageChange(1);
  };

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = () => {
    const data = displayedResults.map(result => ({
      제목: result.title,
      채널: result.channelTitle,
      업로드일: formatDate(result.publishedAt),
      길이: formatDuration(result.duration || ''),
      조회수: formatNumber(result.viewCount),
      좋아요: formatNumber(result.likeCount),
      댓글수: formatNumber(result.commentCount)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '검색결과');
    XLSX.writeFile(wb, 'youtube_search_results.xlsx');
  };

  // 페이지네이션 렌더링 수정
  const renderPagination = () => {
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={isPageChanging}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? 'bg-pink-500 text-white'
              : 'bg-white text-gray-700 hover:bg-pink-100'
          } ${isPageChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isPageChanging}
          className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-pink-100 disabled:opacity-50"
        >
          이전
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              disabled={isPageChanging}
              className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-pink-100"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        {pages}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={isPageChanging}
              className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-pink-100"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isPageChanging}
          className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-pink-100 disabled:opacity-50"
        >
          다음
        </button>
      </div>
    );
  };

  // 페이지당 항목 수 선택기 렌더링
  const renderItemsPerPageSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">페이지당 항목:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    );
  };

  // 필터 렌더링
  const renderFilters = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(filterOptions).map(([key, options]) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {key === 'uploadDate' ? '업로드 날짜' :
                 key === 'duration' ? '영상 길이' :
                 key === 'videoFormat' ? '영상 형식' :
                 '콘텐츠 유형'}
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange(key as keyof FilterState, option.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters[key as keyof FilterState] === option.value
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // 태그 토글 핸들러
  const toggleTags = (resultId: string) => {
    setExpandedTags(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  // 태그 렌더링
  const renderTags = (tags: string[] | undefined, resultId: string) => {
    if (!tags || tags.length === 0) return null;

    const isExpanded = expandedTags[resultId];
    const displayTags = isExpanded ? tags : tags.slice(0, 3);

    return (
      <div className="flex flex-wrap gap-1">
        {displayTags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <button
            onClick={() => toggleTags(resultId)}
            className="text-pink-500 text-xs hover:underline"
          >
            {isExpanded ? '접기' : `+${tags.length - 3}개 더보기`}
          </button>
        )}
      </div>
    );
  };

  // 셀 렌더링
  const renderCell = (col: ColumnDefinition, result: YouTubeSearchResult): React.ReactElement => {
    switch (col.id) {
      case 'thumbnail':
        return (
          <div className="relative w-48 h-27">
            <Image
              src={result.thumbnailUrl}
              alt={result.title}
              width={120}
              height={90}
              className="rounded-md object-cover w-[120px] h-[90px]"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        );
      case 'videoFormat':
        const format = getVideoFormat(result);
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            format.format === 'shorts' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {format.label}
          </span>
        );
      case 'subChange':
        return (
          <div className="space-y-1">
            <div className="text-xs">
              <span className="text-green-600">주간: {formatNumber(result.stats?.subscribers?.weekChange || 0)}</span>
            </div>
            <div className="text-xs">
              <span className="text-blue-600">월간: {formatNumber(result.stats?.subscribers?.monthChange || 0)}</span>
            </div>
          </div>
        );
      case 'viewChange':
        return (
          <div className="space-y-1">
            <div className="text-xs">
              <span className="text-green-600">주간: {formatNumber(result.stats?.views?.weekChange || 0)}</span>
            </div>
            <div className="text-xs">
              <span className="text-blue-600">월간: {formatNumber(result.stats?.views?.monthChange || 0)}</span>
            </div>
          </div>
        );
      case 'title':
        return (
          <div className="flex flex-col">
            <Link
              href={`https://www.youtube.com/watch?v=${result.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              {result.title}
            </Link>
            {renderTags(result.tags, result.id)}
          </div>
        );
      case 'channel':
        return (
          <Link
            href={`https://www.youtube.com/channel/${result.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:underline"
          >
            {result.channelTitle}
          </Link>
        );
      case 'publishedAt':
        return <span>{formatDate(result.publishedAt)}</span>;
      case 'duration':
        return <span>{formatDuration(result.duration || '')}</span>;
      case 'views':
        return <span>{formatNumber(result.viewCount)}</span>;
      case 'likes':
        return <span>{formatNumber(result.likeCount)}</span>;
      case 'comments':
        return <span>{formatNumber(result.commentCount)}</span>;
      default:
        return <span>{String(result[col.field as keyof YouTubeSearchResult] || '')}</span>;
    }
  };

  return (
    <div className="w-full" ref={tableRef}>
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* API 할당량 초과 알림 */}
      {quotaExceeded && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="font-bold">YouTube API 할당량 초과</p>
          <p>현재 YouTube API의 일일 할당량이 소진되었습니다. 내일 다시 시도해주세요.</p>
        </div>
      )}

      {/* 필터 및 도구 모음 */}
      <div className="mb-4 flex flex-wrap justify-between items-center">
        {renderFilters()}
        <div className="flex items-center space-x-4">
          {renderItemsPerPageSelector()}
          <button
            onClick={handleExcelDownload}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 결과 테이블 */}
      {displayedResults.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50">
                {columns.map(col => (
                  <th
                    key={col.id}
                    className={`px-4 py-2 text-left text-sm font-medium text-gray-500 ${col.width}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.field || '')}
                        className="flex items-center space-x-1 hover:text-pink-500"
                      >
                        <span>{col.label}</span>
                        <span>{renderSortIcon(col.field || '')}</span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedResults.map(result => (
                <tr key={result.id} className="border-b hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.id} className="px-4 py-2">
                      {renderCell(col, result)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {quotaExceeded ? (
            <p>API 할당량이 소진되어 검색 결과를 표시할 수 없습니다.</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <p>검색 결과가 없습니다.</p>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {displayedResults.length > 0 && renderPagination()}
    </div>
  );
} 