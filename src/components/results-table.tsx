'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { YouTubeSearchResult } from '@/lib/youtube';
import { formatNumber, formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { UserSubscription } from '@/types/user';

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
}

// 필터 상태를 위한 인터페이스 수정
interface FilterState {
  uploadDate: string;
  duration: string;
  videoFormat: string;
  advancedSort: string; // 심화 필터링 옵션 추가
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const [sortField, setSortField] = useState<keyof YouTubeSearchResult>('publishedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [displayedResults, setDisplayedResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    uploadDate: '',
    duration: '',
    videoFormat: '',
    advancedSort: '' // 심화 필터링 초기값
  });
  const tableRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedTags, setExpandedTags] = useState<{ [key: string]: boolean }>({});
  const [expandedTopics, setExpandedTopics] = useState<{ [key: string]: boolean }>({});
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // 구독 정보 가져오기
  useEffect(() => {
    if (session) {
      fetch('/api/subscription')
        .then(res => {
          if (!res.ok) {
            throw new Error('구독 정보를 가져오는데 실패했습니다.');
          }
          return res.json();
        })
        .then(data => setSubscription(data))
        .catch(err => console.error('구독 정보를 가져오는 중 오류 발생:', err));
    }
  }, [session]);

  // 아이템 개수 옵션
  const itemsPerPageOptions = [
    { value: 10, label: '10개', premium: false },
    { value: 30, label: '30개', premium: true },
    { value: 50, label: '50개', premium: true }
  ];

  // 아이템 개수 변경 핸들러
  const handleItemsPerPageChange = (value: number) => {
    // 프리미엄 사용자가 아니면서 프리미엄 옵션을 선택한 경우
    if (!subscription?.isPremium && value > 10) {
      setShowPremiumModal(true);
      return;
    }
    
    setItemsPerPage(value);
    setCurrentPage(1);
    setDisplayedResults([]);
  };

  // Excel 내보내기 함수
  const exportToExcel = async () => {
    // 프리미엄 사용자가 아닌 경우
    if (!subscription?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    try {
      // xlsx 모듈을 동적으로 가져오기
      const XLSX = await import('xlsx');
      
      // 데이터 준비
      const exportData = filteredResults.map(result => ({
        '제목': result.title,
        '채널': result.channelTitle,
        '조회수': result.viewCount,
        '좋아요': result.likeCount,
        '댓글': result.commentCount,
        '업로드 날짜': formatDate(result.publishedAt),
        '길이': result.duration ? formatDuration(result.duration) : '-'
      }));
      
      // 워크시트 생성
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // 워크북 생성
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'YouTube 검색 결과');
      
      // 파일 저장
      XLSX.writeFile(wb, `youtube-search-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel 내보내기 오류:', error);
      alert('Excel 내보내기 중 오류가 발생했습니다.');
    }
  };

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
    // 심화 필터링 옵션 추가
    advancedSort: [
      { value: '', label: '기본 정렬', premium: false },
      { value: 'views_desc', label: '조회수 높은 순', premium: false },
      { value: 'views_asc', label: '조회수 낮은 순', premium: false },
      { value: 'date_desc', label: '최신순', premium: false },
      { value: 'date_asc', label: '오래된 순', premium: false },
      { value: 'view_subscriber_ratio', label: '구독자 대비 조회수 높은 순', premium: true },
      { value: 'first_week_views', label: '업로드 후 7일 내 조회수 높은 순', premium: true },
      { value: 'comment_engagement', label: '댓글 참여도 높은 순', premium: true },
      { value: 'like_ratio', label: '좋아요 비율 높은 순', premium: true }
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

  // 심화 필터링 로직 구현
  const applyAdvancedFilters = (results: YouTubeSearchResult[], filterValue: string): YouTubeSearchResult[] => {
    if (!filterValue) return results;
    
    // 프리미엄 사용자가 아닌 경우 프리미엄 필터 적용 불가
    const isPremiumFilter = filterOptions.advancedSort.find(option => option.value === filterValue)?.premium;
    if (isPremiumFilter && !subscription?.isPremium) {
      setShowPremiumModal(true);
      return results;
    }
    
    switch (filterValue) {
      case 'views_desc':
        return [...results].sort((a, b) => Number(b.viewCount) - Number(a.viewCount));
      case 'views_asc':
        return [...results].sort((a, b) => Number(a.viewCount) - Number(b.viewCount));
      case 'date_desc':
        return [...results].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      case 'date_asc':
        return [...results].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
      case 'view_subscriber_ratio':
        return [...results].sort((a, b) => {
          const ratioA = Number(a.viewCount) / Number(a.channelSubscriberCount || 1);
          const ratioB = Number(b.viewCount) / Number(b.channelSubscriberCount || 1);
          return ratioB - ratioA;
        });
      case 'first_week_views':
        return [...results].sort((a, b) => {
          // 업로드 후 7일 내 조회수 (이 데이터가 API에서 제공되는 경우)
          // 실제 구현에서는 이 데이터를 가져와야 함
          const firstWeekViewsA = a.firstWeekViews || 0;
          const firstWeekViewsB = b.firstWeekViews || 0;
          return firstWeekViewsB - firstWeekViewsA;
        });
      case 'comment_engagement':
        return [...results].sort((a, b) => {
          const engagementA = Number(a.commentCount) / Number(a.viewCount || 1);
          const engagementB = Number(b.commentCount) / Number(b.viewCount || 1);
          return engagementB - engagementA;
        });
      case 'like_ratio':
        return [...results].sort((a, b) => {
          const ratioA = Number(a.likeCount) / (Number(a.likeCount) + Number(a.dislikeCount || 0));
          const ratioB = Number(b.likeCount) / (Number(b.likeCount) + Number(b.dislikeCount || 0));
          return ratioB - ratioA;
        });
      default:
        return results;
    }
  };

  // 필터링된 결과 계산 수정
  const filteredResults = useMemo(() => {
    let results = results.filter(result => {
      const dateMatch = !filters.uploadDate || filterByDate(result.publishedAt, filters.uploadDate);
      const durationMatch = !filters.duration || filterByDuration(result.duration || '', filters.duration);
      const formatMatch = !filters.videoFormat || getVideoFormat(result).format === filters.videoFormat;
      
      return dateMatch && durationMatch && formatMatch;
    });
    
    // 심화 필터링 적용
    results = applyAdvancedFilters(results, filters.advancedSort);
    
    return results;
  }, [results, filters, subscription?.isPremium]);

  // 필터 변경 시 displayedResults 업데이트
  useEffect(() => {
    setDisplayedResults([]);
    setCurrentPage(1);
    loadMoreItems();
  }, [filters, itemsPerPage]);

  const handleSort = (field: keyof YouTubeSearchResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    
    // 정렬된 결과를 즉시 적용
    const newSortDirection = sortField === field ? 
      (sortDirection === 'asc' ? 'desc' : 'asc') : 
      'desc';
      
    const sorted = [...displayedResults].sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];

      // 숫자 필드 처리
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return newSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // 날짜 필드 처리
      if (field === 'publishedAt') {
        valueA = new Date(valueA as string).getTime();
        valueB = new Date(valueB as string).getTime();
        return newSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // 문자열 필드 처리
      valueA = String(valueA || '');
      valueB = String(valueB || '');
      return newSortDirection === 'asc' ? 
        valueA.localeCompare(valueB) : 
        valueB.localeCompare(valueA);
    });

    setDisplayedResults(sorted);
  };

  // 무한 스크롤 구현
  useEffect(() => {
    // 초기 데이터 로드
    loadMoreItems();

    // 인터섹션 옵저버 설정
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && displayedResults.length < filteredResults.length) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filteredResults, currentPage, isLoading]);

  // 스크롤 동기화
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

  const loadMoreItems = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // 현재 페이지에 해당하는 아이템 가져오기
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredResults.length);
    
    // 프리미엄 사용자가 아닌 경우 최대 10개로 제한
    const maxItems = subscription?.isPremium ? itemsPerPage : Math.min(10, itemsPerPage);
    const limitedEndIndex = Math.min(startIndex + maxItems, filteredResults.length);
    
    const newItems = filteredResults.slice(startIndex, limitedEndIndex);
    
    // 정렬 적용
    const sortedItems = [...newItems].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      // 숫자 필드 처리
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // 날짜 필드 처리
      if (sortField === 'publishedAt') {
        valueA = new Date(valueA as string).getTime();
        valueB = new Date(valueB as string).getTime();
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // 문자열 필드 처리
      valueA = String(valueA || '');
      valueB = String(valueB || '');
      return sortDirection === 'asc' ? 
        valueA.localeCompare(valueB) : 
        valueB.localeCompare(valueA);
    });
    
    // 기존 결과에 새 결과 추가
    setDisplayedResults(prev => [...prev, ...sortedItems]);
    setCurrentPage(prev => prev + 1);
    setIsLoading(false);
  };

  const renderSortIcon = (field: keyof YouTubeSearchResult) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-gray-400">
          <span className="block text-[0.6rem]">▲</span>
          <span className="block text-[0.6rem] -mt-1">▼</span>
        </span>
      );
    }
    return (
      <span className="ml-1 text-pink-500">
        {sortDirection === 'asc' ? (
          <span className="block text-[0.6rem]">▲</span>
        ) : (
          <span className="block text-[0.6rem]">▼</span>
        )}
      </span>
    );
  };

  // 성장률 표시 함수
  const renderGrowthBadge = (growth: string | undefined) => {
    if (!growth) return 'N/A';
    
    const isPositive = growth.includes('+');
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
        isPositive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {growth}
      </span>
    );
  };

  // 구독자 변화 표시 함수
  const renderSubscriberChange = (result: YouTubeSearchResult) => {
    return 'N/A';
  };

  // 구독자 변화율 표시 함수
  const renderSubscriberChangePercentage = (result: YouTubeSearchResult) => {
    return 'N/A';
  };

  // 참여율 표시 함수
  const renderEngagementRate = (rate: number | undefined) => {
    return 'N/A';
  };

  // 콘텐츠 타입별 조회수 비율 표시 함수
  const renderContentTypeRatio = (result: YouTubeSearchResult) => {
    return 'N/A';
  };

  // 일일 평균 통계 표시 함수
  const renderDailyAverage = (result: YouTubeSearchResult, type: 'subscribers' | 'views' | 'revenue') => {
    return 'N/A';
  };

  // 조회수 성장률 표시 함수
  const renderViewsGrowth = (result: YouTubeSearchResult) => {
    return 'N/A';
  };

  // 스타일 추가
  useEffect(() => {
    // 커스텀 스크롤바 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #fff5f7;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #f687b3, #d53f8c);
        border-radius: 10px;
        border: 3px solid #fff5f7;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #ed64a6, #b83280);
      }
      .custom-scrollbar::-webkit-scrollbar-corner {
        background: #fff5f7;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const toggleTags = (resultId: string) => {
    setExpandedTags(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

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

  // 선택된 필터 표시 컴포넌트
  const renderSelectedFilters = () => {
    const selectedFilters = Object.entries(filters)
      .filter(([_, value]) => value !== '')
      .map(([type, value]) => {
        const option = filterOptions[type as keyof typeof filterOptions]
          .find(opt => opt.value === value);
        return {
          type,
          label: option?.label || '',
          value
        };
      });

    if (selectedFilters.length === 0) return null;

  return (
      <div className="px-4 py-3 bg-pink-50/50 border-t border-pink-100">
        <div className="flex flex-wrap gap-2">
          {selectedFilters.map((filter) => (
            <div
              key={`${filter.type}-${filter.value}`}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-pink-200"
            >
              <span className="text-sm text-pink-700">{filter.label}</span>
              <button
                onClick={() => handleFilterChange(filter.type as keyof FilterState, '')}
                className="text-pink-400 hover:text-pink-600 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 필터 UI 렌더링 수정
  const renderFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* 기존 필터... */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">업로드 날짜</label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={filters.uploadDate}
            onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
          >
            {filterOptions.uploadDate.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">동영상 길이</label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={filters.duration}
            onChange={(e) => handleFilterChange('duration', e.target.value)}
          >
            {filterOptions.duration.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">동영상 형식</label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={filters.videoFormat}
            onChange={(e) => handleFilterChange('videoFormat', e.target.value)}
          >
            {filterOptions.videoFormat.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        {/* 심화 필터링 드롭다운 추가 */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={filters.advancedSort}
            onChange={(e) => handleFilterChange('advancedSort', e.target.value)}
          >
            {filterOptions.advancedSort.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.premium && '(Premium)'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // 테이블 셀 렌더링 함수
  const renderCell = (result: YouTubeSearchResult, col: ColumnDefinition): React.ReactElement => {
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
            <div className="line-clamp-2">
              <Link href={`https://www.youtube.com/watch?v=${result.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {result.title}
              </Link>
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
      case 'definition':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.definition?.toUpperCase() || '-'}
          </td>
        );
      case 'caption':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.caption ? '있음' : '없음'}
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
      case 'viewCount':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatNumber(result.viewCount as number || 0)}
          </td>
        );
      case 'viewChange':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.stats ? (
              <div className="space-y-1">
                <div className={`text-sm ${result.stats.views.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  1주일: {formatNumber(Math.abs(result.stats.views.weekChange))}
                  {result.stats.views.weekChange >= 0 ? '↑' : '↓'}
                </div>
                <div className={`text-sm ${result.stats.views.monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  1달: {formatNumber(Math.abs(result.stats.views.monthChange))}
                  {result.stats.views.monthChange >= 0 ? '↑' : '↓'}
                </div>
              </div>
            ) : '-'}
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
      case 'subscriberChange':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.stats ? (
              <div className="space-y-1">
                <div className={`text-sm ${result.stats.subscribers.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  1주일: {formatNumber(Math.abs(result.stats.subscribers.weekChange))}
                  {result.stats.subscribers.weekChange >= 0 ? '↑' : '↓'}
                </div>
                <div className={`text-sm ${result.stats.subscribers.monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  1달: {formatNumber(Math.abs(result.stats.subscribers.monthChange))}
                  {result.stats.subscribers.monthChange >= 0 ? '↑' : '↓'}
                </div>
              </div>
            ) : '-'}
          </td>
        );
      case 'trafficSources':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.trafficSources && (
              <div className="space-y-1">
                {Object.entries(result.trafficSources).map(([source, percentage]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-xs">{source}: {percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        );
      case 'deviceStats':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.deviceStats && (
              <div className="space-y-1">
                {Object.entries(result.deviceStats).map(([device, percentage]) => (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-xs">{device}: {percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        );
      case 'growthStats':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.growthStats && (
              <div className="space-y-1">
                <div>성장률: {result.growthStats.viewsGrowth?.toFixed(1)}%</div>
                <div>참여율: {result.growthStats.engagementRate?.toFixed(1)}%</div>
              </div>
            )}
          </td>
        );
      case 'retentionStats':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.retentionStats && (
              <div className="space-y-1">
                <div>시청 지속률: {result.retentionStats.viewerDropoffRate}%</div>
                <div>클릭률(CTR): {result.retentionStats.ctr}%</div>
              </div>
            )}
          </td>
        );
      case 'geographicStats':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.geographicStats?.countries && (
              <div className="space-y-1">
                {Object.entries(result.geographicStats.countries)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([country, percentage]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-xs">{country}: {percentage.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            )}
          </td>
        );
      case 'viewingStats':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.viewingStats && (
              <div className="space-y-1">
                <div>주요 시청 시간: {result.viewingStats.peakViewingTime}</div>
                <div>실시간 시청: {result.viewingStats.livePercentage.toFixed(1)}%</div>
              </div>
            )}
          </td>
        );
      case 'videoFormat':
        const format = getVideoFormat(result);
        return (
          <td key={col.id} className="px-4 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              format.format === 'shorts' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {format.label}
            </span>
          </td>
        );
      case 'engagementRate':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.engagementRate?.toFixed(1)}%
          </td>
        );
      case 'averageViewDuration':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.averageViewDuration?.toFixed(1)} minutes
          </td>
        );
      case 'viewerDropoffRate':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.viewerDropoffRate?.toFixed(1)}%
          </td>
        );
      case 'ctr':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.ctr?.toFixed(1)}%
          </td>
        );
      case 'geographicStats':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.geographicStats?.countries && (
              <div className="space-y-1">
                {Object.entries(result.geographicStats.countries)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([country, percentage]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-xs">{country}: {percentage.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            )}
          </td>
        );
      case 'demographics':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.demographics && (
              <div className="space-y-1">
                <div>인구통계: {result.demographics.population.toLocaleString()}</div>
                <div>인구밀도: {result.demographics.populationDensity.toLocaleString()} people/km²</div>
              </div>
            )}
          </td>
        );
      case 'viewingPatterns':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.viewingPatterns && (
              <div className="space-y-1">
                <div>주요 시청 시간: {result.viewingPatterns.peakViewingTime}</div>
                <div>실시간 시청: {result.viewingPatterns.livePercentage.toFixed(1)}%</div>
              </div>
            )}
          </td>
        );
      case 'contentReach':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.contentReach?.toFixed(1)}%
          </td>
        );
      case 'trafficSources':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.trafficSources && (
              <div className="space-y-1">
                {Object.entries(result.trafficSources).map(([source, percentage]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-xs">{source}: {percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        );
      case 'deviceStats':
        return (
          <td key={col.id} className="px-4 py-4">
            {result.deviceStats && (
              <div className="space-y-1">
                {Object.entries(result.deviceStats).map(([device, percentage]) => (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-xs">{device}: {percentage}%</span>
                  </div>
                ))}
              </div>
            )}
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
      field: 'title'
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
      field: 'publishedAt'
    },
    {
      id: 'duration',
      label: '길이',
      width: '80px',
      sortable: true,
      field: 'duration'
    },
    {
      id: 'definition',
      label: '화질',
      width: '80px',
      sortable: false
    },
    {
      id: 'caption',
      label: '자막',
      width: '80px',
      sortable: false
    },
    {
      id: 'viewCount',
      label: '조회수',
      width: '100px',
      sortable: true,
      field: 'viewCount'
    },
    {
      id: 'viewChange',
      label: '조회수 변화',
      width: '150px',
      sortable: false
    },
    {
      id: 'likeCount',
      label: '좋아요',
      width: '100px',
      sortable: true,
      field: 'likeCount'
    },
    {
      id: 'commentCount',
      label: '댓글',
      width: '100px',
      sortable: true,
      field: 'commentCount'
    },
    {
      id: 'channelTitle',
      label: '채널명',
      width: '200px',
      sortable: true,
      field: 'channelTitle'
    },
    {
      id: 'subscriberCount',
      label: '구독자수',
      width: '120px',
      sortable: true,
      field: 'subscriberCount'
    },
    {
      id: 'subscriberChange',
      label: '구독자 변화',
      width: '150px',
      sortable: false
    }
  ];

  // 콘텐츠 타입에 따른 컬럼 선택 제거
  const visibleColumns = videoColumns;

  // 테이블 너비 계산
  const tableWidth = visibleColumns.reduce((acc, col) => {
    const width = parseInt(col.width);
    return acc + (isNaN(width) ? 100 : width);
  }, 0);

  return (
    <div className="w-full">
      {/* 테이블 헤더 및 필터 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
            검색 결과 <span className="text-pink-600">{filteredResults.length}</span>개
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* 결과 개수 선택 */}
            <div className="flex items-center">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600 mr-2">
                표시:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 p-2"
              >
                {itemsPerPageOptions.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.premium && !subscription?.isPremium}
                  >
                    {option.label} {option.premium && !subscription?.isPremium ? '(프리미엄)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Excel 내보내기 버튼 */}
            <button
              onClick={exportToExcel}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                subscription?.isPremium
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
              title={subscription?.isPremium ? 'Excel로 내보내기' : '프리미엄 기능입니다'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Excel 내보내기
              {!subscription?.isPremium && (
                <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-1 rounded">
                  프리미엄
                </span>
              )}
            </button>
            
            {/* 필터 토글 버튼 */}
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              필터
              {Object.values(filters).some(v => v) && (
                <span className="ml-1 bg-pink-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-xs">
                  {Object.values(filters).filter(v => v).length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* 필터 UI */}
        {isFilterExpanded && renderFilters()}
        
        {/* 선택된 필터 표시 */}
        {Object.values(filters).some(v => v) && renderSelectedFilters()}
      </div>

      {/* ... existing code ... */}
      
      {/* 프리미엄 안내 모달 */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">프리미엄 기능</h3>
            <p className="text-gray-600 mb-4">
              선택하신 기능은 프리미엄 사용자만 이용할 수 있습니다. 
              프리미엄으로 업그레이드하여 더 많은 검색 결과와 Excel 내보내기 기능을 이용하세요.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                닫기
              </button>
              <Link 
                href="/price"
                className="px-4 py-2 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-lg hover:from-red-500 hover:to-pink-600"
              >
                프리미엄 알아보기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 