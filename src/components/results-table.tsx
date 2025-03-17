'use client';

import React, { useState, useEffect, useRef } from 'react';
import { YouTubeSearchResult } from '@/lib/youtube';
import { formatNumber, formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
  results: YouTubeSearchResult[];
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
  highlight: string;
}

interface SortField {
  field: string;
  path: string[];
}

interface ContentHighlight {
  type: string;
  label: string;
  color: string;
  description: string;
}

// 하이라이트 기준 정의
const HIGHLIGHT_CRITERIA = {
  VIRAL_VIEW_RATE: 3,
  WEEKLY_SUB_GROWTH_RATE: 0.3,
  MONTHLY_SUB_GROWTH_RATE: 0.5,
  WEEKLY_VIEW_GROWTH_RATE: 1,
  MONTHLY_VIEW_GROWTH_RATE: 2,
};

export default function ResultsTable({ results }: ResultsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'publishedAt',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 기본값 10개로 설정
  const [displayedResults, setDisplayedResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    uploadDate: '',
    duration: '',
    videoFormat: '',
    highlight: ''
  });
  const tableRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedTags, setExpandedTags] = useState<{ [key: string]: boolean }>({});
  const [expandedTopics, setExpandedTopics] = useState<{ [key: string]: boolean }>({});
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

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
      { value: 'short', label: '4분 미만' },
      { value: 'medium', label: '4~20분' },
      { value: 'long', label: '20분 초과' }
    ],
    videoFormat: [
      { value: '', label: '전체' },
      { value: 'shorts', label: 'Shorts' },
      { value: 'long', label: 'Long' }
    ],
    highlight: [
      { value: '', label: '전체' },
      { value: 'any', label: '주목할 만한 콘텐츠' },
      { value: 'viral', label: '바이럴 콘텐츠' },
      { value: 'growing', label: '급성장 채널' },
      { value: 'trending', label: '트렌딩 콘텐츠' },
      { value: 'viral+growing', label: '바이럴 + 급성장' },
      { value: 'viral+trending', label: '바이럴 + 트렌딩' },
      { value: 'growing+trending', label: '급성장 + 트렌딩' },
      { value: 'viral+growing+trending', label: '바이럴 + 급성장 + 트렌딩' }
    ]
  };

  // 필터 변경 핸들러
  const handleFilterChange = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
    setCurrentPage(1);
    setDisplayedResults([]); // 표시된 결과 초기화
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

  // 기능별 필터링 함수
  const filterByFeatures = (result: YouTubeSearchResult, features: string[]): boolean => {
    return features.every(feature => {
      switch (feature) {
        case '4k':
          return result.definition === '4k';
        case 'hd':
          return result.definition === 'hd';
        case 'caption':
          return result.caption;
        default:
          return true;
      }
    });
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

  // 하이라이트 타입을 체크하는 함수
  const getHighlightTypes = (result: YouTubeSearchResult): string[] => {
    const highlights: string[] = [];
    
    // 바이럴 콘텐츠 체크
    if (result.viewCount && result.subscriberCount && 
        result.viewCount > result.subscriberCount * HIGHLIGHT_CRITERIA.VIRAL_VIEW_RATE) {
      highlights.push('viral');
    }
    
    // 급성장 채널 체크
    if (result.stats?.subscribers?.weekChange && result.subscriberCount) {
      const weeklyGrowthRate = result.stats.subscribers.weekChange / result.subscriberCount;
      if (weeklyGrowthRate > HIGHLIGHT_CRITERIA.WEEKLY_SUB_GROWTH_RATE) {
        highlights.push('growing');
      }
    }
    
    // 트렌딩 콘텐츠 체크
    if (result.stats?.views?.weekChange && result.viewCount) {
      const weeklyViewGrowthRate = result.stats.views.weekChange / result.viewCount;
      if (weeklyViewGrowthRate > HIGHLIGHT_CRITERIA.WEEKLY_VIEW_GROWTH_RATE) {
        highlights.push('trending');
      }
    }
    
    return highlights;
  };

  // 하이라이트 정보를 가져오는 함수
  const getHighlights = (result: YouTubeSearchResult): ContentHighlight[] => {
    const highlightTypes = getHighlightTypes(result);
    const highlights: ContentHighlight[] = [];
    
    if (highlightTypes.includes('viral')) {
      const viewToSubRatio = result.viewCount && result.subscriberCount ? 
        (result.viewCount / result.subscriberCount).toFixed(1) : '0';
      highlights.push({
        type: 'viral',
        label: '바이럴',
        color: 'from-yellow-400 to-orange-500',
        description: `조회수가 구독자 수의 ${viewToSubRatio}배`
      });
    }
    
    if (highlightTypes.includes('growing')) {
      const weeklySubGrowthRate = result.stats?.subscribers?.weekChange && result.subscriberCount ?
        ((result.stats.subscribers.weekChange / result.subscriberCount) * 100).toFixed(1) : '0';
      highlights.push({
        type: 'growing',
        label: '급성장',
        color: 'from-green-400 to-emerald-500',
        description: `주간 구독자 ${weeklySubGrowthRate}% 증가`
      });
    }
    
    if (highlightTypes.includes('trending')) {
      const weeklyViewGrowthRate = result.stats?.views?.weekChange && result.viewCount ?
        ((result.stats.views.weekChange / result.viewCount) * 100).toFixed(1) : '0';
      highlights.push({
        type: 'trending',
        label: '트렌딩',
        color: 'from-blue-400 to-indigo-500',
        description: `주간 조회수 ${weeklyViewGrowthRate}% 증가`
      });
    }
    
    return highlights;
  };

  // 필터링된 결과 계산 수정
  const filteredResults = results.filter(result => {
    if (!result) return false;
    
    const dateMatch = !filters.uploadDate || filterByDate(result.publishedAt, filters.uploadDate);
    const durationMatch = !filters.duration || filterByDuration(result.duration || '', filters.duration);
    const formatMatch = !filters.videoFormat || getVideoFormat(result).format === filters.videoFormat;
    
    // 하이라이트 필터 적용
    let highlightMatch = true;
    if (filters.highlight) {
      const highlightTypes = getHighlightTypes(result);
      
      switch (filters.highlight) {
        case 'any':
          highlightMatch = highlightTypes.length > 0;
          break;
        case 'viral':
          highlightMatch = highlightTypes.includes('viral');
          break;
        case 'growing':
          highlightMatch = highlightTypes.includes('growing');
          break;
        case 'trending':
          highlightMatch = highlightTypes.includes('trending');
          break;
        case 'viral+growing':
          highlightMatch = highlightTypes.includes('viral') && highlightTypes.includes('growing');
          break;
        case 'viral+trending':
          highlightMatch = highlightTypes.includes('viral') && highlightTypes.includes('trending');
          break;
        case 'growing+trending':
          highlightMatch = highlightTypes.includes('growing') && highlightTypes.includes('trending');
          break;
        case 'viral+growing+trending':
          highlightMatch = highlightTypes.includes('viral') && highlightTypes.includes('growing') && highlightTypes.includes('trending');
          break;
        default:
          highlightMatch = true;
      }
    }
    
    return dateMatch && durationMatch && formatMatch && highlightMatch;
  });

  // 페이지네이션 계산
  useEffect(() => {
    setTotalPages(Math.ceil(filteredResults.length / itemsPerPage));
    // 필터나 아이템 개수가 변경되면 첫 페이지로 이동
    if (currentPage > Math.ceil(filteredResults.length / itemsPerPage)) {
    setCurrentPage(1);
    }
  }, [filteredResults.length, itemsPerPage]);

  // 중첩된 객체에서 값을 가져오는 함수
  const getNestedValue = (obj: any, path: string[]): any => {
    return path.reduce((acc, curr) => (acc && acc[curr] !== undefined ? acc[curr] : undefined), obj);
  };

  // 정렬 처리 함수 수정
  const handleSort = (field: string, path: string[]) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // 현재 페이지의 결과 계산
  useEffect(() => {
    // 정렬된 결과 계산
    const sortedResults = [...filteredResults].sort((a, b) => {
      const fieldConfig = columns.find(col => col.id === sortConfig.field);
      if (!fieldConfig?.path) return 0;

      const valueA = getNestedValue(a, fieldConfig.path);
      const valueB = getNestedValue(b, fieldConfig.path);

      // 숫자 필드 처리
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // 날짜 필드 처리
      if (fieldConfig.id === 'publishedAt') {
        const dateA = new Date(valueA || 0).getTime();
        const dateB = new Date(valueB || 0).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // 문자열 필드 처리
      const strA = String(valueA || '');
      const strB = String(valueB || '');
      return sortConfig.direction === 'asc' ? 
        strA.localeCompare(strB) : 
        strB.localeCompare(strA);
    });

    // 현재 페이지의 결과 계산
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedResults.length);
    setDisplayedResults(sortedResults.slice(startIndex, endIndex));
  }, [filteredResults, sortConfig, currentPage, itemsPerPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 아이템 개수 변경 핸들러
  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // 개수 변경 시 첫 페이지로 이동
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = () => {
    // 엑셀에 포함할 데이터 준비
    const excelData = displayedResults.map(result => ({
      '제목': result.title,
      '채널': result.channelTitle,
      '업로드 날짜': formatDate(result.publishedAt),
      '조회수': result.viewCount,
      '좋아요': result.likeCount,
      '댓글': result.commentCount,
      '길이': formatDuration(result.duration || ''),
      '구독자수': result.subscriberCount || 0,
      '조회수 변화(1주일)': result.stats?.views.weekChange || 0,
      '조회수 변화(1달)': result.stats?.views.monthChange || 0,
      '구독자 변화(1주일)': result.stats?.subscribers.weekChange || 0,
      '구독자 변화(1달)': result.stats?.subscribers.monthChange || 0
    }));

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // 워크북 생성 및 워크시트 추가
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '검색 결과');
    
    // 파일 이름 생성 (현재 날짜 포함)
    const fileName = `YouTube_검색결과_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, fileName);
  };

  // 페이지네이션 UI 렌더링
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPageButtons = 5; // 한 번에 표시할 최대 페이지 버튼 수
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center mt-6 mb-4 space-x-2">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-full transition-all duration-200 ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 hover:from-pink-200 hover:to-purple-200'
          }`}
          aria-label="이전 페이지"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* 첫 페이지 버튼 (시작 페이지가 1이 아닌 경우) */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 hover:from-pink-200 hover:to-purple-200 transition-all duration-200"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {/* 페이지 번호 버튼 */}
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`px-4 py-2 rounded-full transition-all duration-200 ${
              currentPage === number
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-gray-800 font-bold shadow-md transform scale-105'
                : 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 hover:from-pink-200 hover:to-purple-200'
            }`}
          >
            {number}
          </button>
        ))}
        
        {/* 마지막 페이지 버튼 (끝 페이지가 totalPages가 아닌 경우) */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 hover:from-pink-200 hover:to-purple-200 transition-all duration-200"
            >
              {totalPages}
            </button>
          </>
        )}
        
        {/* 다음 페이지 버튼 */}
            <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-full transition-all duration-200 ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 hover:from-pink-200 hover:to-purple-200'
          }`}
          aria-label="다음 페이지"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
            </button>
      </div>
    );
  };

  // 아이템 개수 선택 UI 렌더링
  const renderItemsPerPageSelector = () => {
    const options = [10, 30, 50, 100];

  return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {options.map(option => (
              <button
              key={option}
              onClick={() => handleItemsPerPageChange(option)}
              className={`px-4 py-2 text-sm rounded-full transition-all duration-200 ${
                itemsPerPage === option
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-gray-800 font-bold shadow-md transform scale-105'
                  : 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 hover:from-pink-200 hover:to-purple-200'
              }`}
            >
              {option}개 표시
              </button>
          ))}
        </div>
        
        <div className="ml-auto">
          {/* 엑셀 다운로드 버튼 */}
          <button
            onClick={handleExcelDownload}
            className="px-4 py-2 bg-gradient-to-r from-pink-300 to-purple-300 text-gray-800 font-bold rounded-full hover:from-pink-400 hover:to-purple-400 transition-all duration-200 flex items-center shadow-md transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            엑셀 다운로드
          </button>
        </div>
      </div>
    );
  };

  // 필터 UI 렌더링 수정
  const renderFilters = () => {
    return (
      <div className="w-full">
        {/* 필터 섹션 */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* 업로드 날짜 필터 */}
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0 pt-2 text-sm font-medium text-gray-700">업로드 날짜</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {filterOptions.uploadDate.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('uploadDate', option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filters.uploadDate === option.value
                        ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 길이 필터 */}
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0 pt-2 text-sm font-medium text-gray-700">길이</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {filterOptions.duration.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('duration', option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filters.duration === option.value
                        ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 형식 필터 */}
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0 pt-2 text-sm font-medium text-gray-700">형식</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {filterOptions.videoFormat.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('videoFormat', option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filters.videoFormat === option.value
                        ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 하이라이트 필터 */}
            <div className="flex items-start">
              <div className="w-32 flex-shrink-0 pt-2 text-sm font-medium text-gray-700">하이라이트</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {filterOptions.highlight.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('highlight', option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filters.highlight === option.value
                        ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 선택된 필터 표시 */}
          {Object.values(filters).some(value => value !== '') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;
                  const option = filterOptions[key as keyof typeof filterOptions].find(opt => opt.value === value);
                  if (!option) return null;
                  return (
                    <div key={key} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                      <span className="text-gray-700">{option.label}</span>
                      <button
                        onClick={() => handleFilterChange(key as keyof typeof filters, '')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: string) => {
    if (!field) return null;
    
    return (
      <span className="ml-1 inline-block">
        {sortConfig.field === field ? (
          sortConfig.direction === 'asc' ? (
            <span className="icon icon-arrow-up text-pink-500" />
          ) : (
            <span className="icon icon-arrow-down text-pink-500" />
          )
        ) : (
          <span className="icon icon-arrow-down text-gray-300" />
        )}
      </span>
    );
  };

  // 태그 토글 함수
  const toggleTags = (resultId: string) => {
    setExpandedTags(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  // 주제 토글 함수
  const toggleTopics = (resultId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  // 태그 렌더링 함수
  const renderTags = (tags: string[] | undefined, resultId: string) => {
    if (!tags || tags.length === 0) return '태그 없음';
    
    const isExpanded = expandedTags[resultId];
    const visibleTags = isExpanded ? tags : tags.slice(0, 6);
    const remainingCount = tags.length - 6;

    return (
      <div className="relative">
        <div className={`flex flex-wrap gap-1 ${!isExpanded ? 'max-h-[3.5rem]' : ''}`}>
          {visibleTags.map((tag, index) => (
            <span key={index} className="inline-block px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
        {tags.length > 6 && (
          <div className="absolute bottom-0 right-0 bg-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTags(resultId);
              }}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs whitespace-nowrap hover:bg-gray-200 transition-colors duration-200"
            >
              {isExpanded ? '접기' : `+${remainingCount}개 더보기`}
            </button>
          </div>
        )}
      </div>
    );
  };

  // 주제 렌더링 함수
  const renderTopics = (topics: Array<{ name: string; wikiPath: string | null }> | undefined, resultId: string) => {
    if (!topics || topics.length === 0) return '주제 없음';
    
    const isExpanded = expandedTopics[resultId];
    const visibleTopics = isExpanded ? topics : topics.slice(0, 2);
    const remainingCount = topics.length - 2;

    return (
      <div className="relative">
        <div className={`flex flex-wrap gap-1 ${!isExpanded ? 'max-h-[3.5rem]' : ''}`}>
          {visibleTopics.map((topic, index) => (
            <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs whitespace-nowrap">
              {topic.name}
            </span>
          ))}
        </div>
        {topics.length > 2 && (
          <div className="absolute bottom-0 right-0 bg-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTopics(resultId);
              }}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs whitespace-nowrap hover:bg-gray-200 transition-colors duration-200"
            >
              {isExpanded ? '접기' : `+${remainingCount}개 더보기`}
            </button>
          </div>
        )}
      </div>
    );
  };

  // 하이라이트 뱃지 렌더링 함수 추가
  const renderHighlightBadges = (highlights: ContentHighlight[]) => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {highlights.map((highlight, index) => (
          <span
            key={index}
            className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${highlight.color} text-white shadow-sm`}
            title={highlight.description}
          >
            {highlight.label}
          </span>
        ))}
      </div>
    );
  };

  // 테이블 셀 렌더링 함수
  const renderCell = (col: ColumnDefinition, result: YouTubeSearchResult): React.ReactElement => {
    const highlights = getHighlights(result);
    
    switch (col.id) {
      case 'thumbnail':
        return (
          <td key={col.id} className="px-4 py-4">
            <Image
              src={result.thumbnailUrl}
              alt={result.title}
              width={120}
              height={68}
              className="rounded-lg"
            />
          </td>
        );
      case 'title':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="flex flex-col">
              <Link href={`https://www.youtube.com/watch?v=${result.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {result.title}
              </Link>
              {highlights.length > 0 && renderHighlightBadges(highlights)}
            </div>
          </td>
        );
      case 'description':
        return (
          <td key={col.id} className="px-4 py-4">
            <div 
              className="line-clamp-2"
              title={result.description}
            >
              {result.description}
            </div>
          </td>
        );
      case 'publishedAt':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatDate(result.publishedAt)}
          </td>
        );
      case 'duration':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatDuration(result.duration || '')}
          </td>
        );
      case 'viewCount':
        const isViral = result.viewCount && result.subscriberCount && 
          result.viewCount > result.subscriberCount * HIGHLIGHT_CRITERIA.VIRAL_VIEW_RATE;
        return (
          <td key={col.id} className={`px-4 py-4 ${isViral ? 'highlight-viral highlight-cell' : ''}`}>
            {formatNumber(result.viewCount as number || 0)}
          </td>
        );
      case 'weekViewChange':
        const weeklyViewGrowthRate = result.stats?.views?.weekChange 
          ? result.stats.views.weekChange / result.viewCount 
          : 0;
        return (
          <td className={`${col.width} px-4 py-2 text-right ${
            weeklyViewGrowthRate > HIGHLIGHT_CRITERIA.WEEKLY_VIEW_GROWTH_RATE
              ? 'highlight-trending highlight-cell'
              : ''
          }`}>
            {result.stats?.views?.weekChange !== undefined && (
              <>
                {result.stats.views.weekChange > 0 ? '+' : ''}
                {formatNumber(result.stats.views.weekChange)}
                {weeklyViewGrowthRate > HIGHLIGHT_CRITERIA.WEEKLY_VIEW_GROWTH_RATE && (
                  <span className="ml-1 text-xs text-blue-600">
                    ({(weeklyViewGrowthRate * 100).toFixed(0)}%↑)
                  </span>
                )}
              </>
            )}
          </td>
        );
      case 'monthViewChange':
        return (
          <td className={`${col.width} px-4 py-2 text-right`}>
            {result.stats?.views?.monthChange !== undefined && (
              <>
                {result.stats.views.monthChange > 0 ? '+' : ''}
                {formatNumber(result.stats.views.monthChange)}
              </>
            )}
          </td>
        );
      case 'likeCount':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatNumber(result.likeCount as number || 0)}
          </td>
        );
      case 'commentCount':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatNumber(result.commentCount as number || 0)}
          </td>
        );
      case 'channelTitle':
        return (
          <td key={col.id} className="px-4 py-4">
            <Link href={`https://youtube.com/channel/${result.channelId}`} target="_blank" className="text-blue-600 hover:text-blue-800">
              {result.channelTitle}
            </Link>
          </td>
        );
      case 'subscriberCount':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatNumber(result.subscriberCount as number || 0)}
          </td>
        );
      case 'weekSubChange':
        const weeklySubGrowthRate = result.stats?.subscribers?.weekChange 
          ? result.stats.subscribers.weekChange / result.subscriberCount 
          : 0;
        return (
          <td className={`${col.width} px-4 py-2 text-right ${
            weeklySubGrowthRate > HIGHLIGHT_CRITERIA.WEEKLY_SUB_GROWTH_RATE
              ? 'highlight-growing highlight-cell'
              : ''
          }`}>
            {result.stats?.subscribers?.weekChange !== undefined && (
              <>
                {result.stats.subscribers.weekChange > 0 ? '+' : ''}
                {formatNumber(result.stats.subscribers.weekChange)}
                {weeklySubGrowthRate > HIGHLIGHT_CRITERIA.WEEKLY_SUB_GROWTH_RATE && (
                  <span className="ml-1 text-xs text-green-600">
                    ({(weeklySubGrowthRate * 100).toFixed(0)}%↑)
                  </span>
                )}
              </>
            )}
          </td>
        );
      case 'monthSubChange':
        return (
          <td className={`${col.width} px-4 py-2 text-right`}>
            {result.stats?.subscribers?.monthChange !== undefined && (
              <>
                {result.stats.subscribers.monthChange > 0 ? '+' : ''}
                {formatNumber(result.stats.subscribers.monthChange)}
              </>
            )}
          </td>
        );
      case 'topicDetails':
        return (
          <td key={col.id} className="px-4 py-4">
            {renderTopics(result.topicDetails, result.id)}
          </td>
        );
      case 'tags':
        return (
          <td key={col.id} className="px-4 py-4">
            {renderTags(result.tags, result.id)}
          </td>
        );
      case 'videoFormat':
        return (
          <td className={`${col.width} px-4 py-2 text-center`}>
            {result.duration ? (
              parseDurationToSeconds(result.duration) <= 60 ? (
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">Shorts</span>
              ) : (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Long</span>
              )
            ) : '-'}
          </td>
        );
      default:
        return (
          <td key={col.id} className="px-4 py-4">
            {String(result[col.id as keyof YouTubeSearchResult] || '-')}
          </td>
        );
    }
  };

  // 통합된 동영상 컬럼 정의
  const videoColumns: ColumnDefinition[] = [
    {
      id: 'thumbnail',
      label: '썸네일',
      width: '100px',
      sortable: false
    },
    {
      id: 'videoFormat',
      label: '형식',
      width: '100px',
      sortable: false
    },
    {
      id: 'title',
      label: '제목',
      width: '300px',
      sortable: true,
      path: ['title']
    },
    {
      id: 'description',
      label: '설명',
      width: '300px',
      sortable: false
    },
    {
      id: 'publishedAt',
      label: '게시일',
      width: '150px',
      sortable: true,
      path: ['publishedAt']
    },
    {
      id: 'duration',
      label: '길이',
      width: '80px',
      sortable: true,
      path: ['duration']
    },
    {
      id: 'viewCount',
      label: '조회수',
      width: '100px',
      sortable: true,
      path: ['viewCount']
    },
    {
      id: 'weekViewChange',
      label: '1주일 조회수 변화',
      width: '150px',
      sortable: true,
      path: ['stats', 'views', 'weekChange']
    },
    {
      id: 'monthViewChange',
      label: '1달 조회수 변화',
      width: '150px',
      sortable: true,
      path: ['stats', 'views', 'monthChange']
    },
    {
      id: 'likeCount',
      label: '좋아요',
      width: '100px',
      sortable: true,
      path: ['likeCount']
    },
    {
      id: 'commentCount',
      label: '댓글',
      width: '100px',
      sortable: true,
      path: ['commentCount']
    },
    {
      id: 'channelTitle',
      label: '채널명',
      width: '200px',
      sortable: true,
      path: ['channelTitle']
    },
    {
      id: 'subscriberCount',
      label: '구독자수',
      width: '120px',
      sortable: true,
      path: ['subscriberCount']
    },
    {
      id: 'weekSubChange',
      label: '1주일 구독자 변화',
      width: '150px',
      sortable: true,
      path: ['stats', 'subscribers', 'weekChange']
    },
    {
      id: 'monthSubChange',
      label: '1달 구독자 변화',
      width: '150px',
      sortable: true,
      path: ['stats', 'subscribers', 'monthChange']
    }
  ];

  // 콘텐츠 타입에 따른 컬럼 선택
  const columns = videoColumns;

  // 테이블 너비 계산
  const tableWidth = columns.reduce((acc, col) => {
    const width = parseInt(col.width);
    return acc + (isNaN(width) ? 100 : width);
  }, 0);

  // 스크롤 동기화 함수 추가
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const headerTable = document.querySelector('.header-table');
        if (headerTable) {
          (headerTable as HTMLElement).style.transform = `translateX(-${scrollLeft}px)`;
        }
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div className="overflow-hidden" ref={tableRef}>
      {renderFilters()}
      
      {/* 페이지당 항목 수 선택 */}
      <div className="flex justify-center items-center mb-4">
        {renderItemsPerPageSelector()}
      </div>
      
      <div className="relative">
        {/* 테이블 헤더 (고정) */}
        <div className="sticky top-0 z-30 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md border-b border-pink-100">
          <div className="header-table" style={{ width: `${tableWidth}px`, minWidth: '100%' }}>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {columns.map(col => (
                  <col key={col.id} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-pink-100">
                  {columns.map(col => (
                    <th 
                      key={col.id}
                      className={`px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap ${
                        col.sortable ? 'cursor-pointer hover:bg-pink-50/50' : ''
                      }`}
                      onClick={() => col.sortable && col.path && handleSort(col.id, col.path)}
                    >
                      <div className="flex items-center">
                        {col.label}
                        {col.sortable && col.path && renderSortIcon(col.id)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>
        </div>
        
        {/* 테이블 본문 (스크롤 가능) */}
        <div 
          className="overflow-x-auto"
          ref={scrollContainerRef}
          style={{ maxHeight: 'calc(100vh - 300px)' }}
        >
          <div style={{ width: `${tableWidth}px`, minWidth: '100%' }}>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {columns.map(col => (
                  <col key={col.id} style={{ width: col.width }} />
                ))}
              </colgroup>
              <tbody>
                {displayedResults.length > 0 ? (
                  displayedResults.map((result, index) => (
                  <tr 
                      key={`${result.id}-${index}`}
                    className={`hover:bg-pink-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-pink-50/30'}`}
                  >
                      {columns.map(col => renderCell(col, result))}
            </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
        
      {/* 페이지네이션 */}
      {renderPagination()}
      
      {/* 로딩 인디케이터 */}
          {isLoading && (
        <div className="py-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-400 border-r-transparent"></div>
        </div>
      )}
    </div>
  );
} 