'use client';

import React, { useState, useEffect, useRef } from 'react';
import { YouTubeSearchResult } from '@/lib/youtube';
import { formatNumber, formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

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
  features: string[];
  sortBy: string;
  videoFormat: string;
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const [sortField, setSortField] = useState<keyof YouTubeSearchResult>('publishedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [displayedResults, setDisplayedResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    uploadDate: '',
    duration: '',
    features: [],
    sortBy: 'publishedAt',
    videoFormat: ''
  });
  const tableRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedTags, setExpandedTags] = useState<{ [key: string]: boolean }>({});
  const [expandedTopics, setExpandedTopics] = useState<{ [key: string]: boolean }>({});
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 필터 옵션 정의 수정
  const filterOptions = {
    uploadDate: [
      { value: 'hour', label: '지난 1시간' },
      { value: 'today', label: '오늘' },
      { value: 'week', label: '이번 주' },
      { value: 'month', label: '이번 달' },
      { value: 'year', label: '올해' }
    ],
    duration: [
      { value: 'short', label: '4분 미만' },
      { value: 'medium', label: '4~20분' },
      { value: 'long', label: '20분 초과' }
    ],
    features: [
      { value: '4k', label: '4K' },
      { value: 'hd', label: 'HD' },
      { value: 'caption', label: '자막' }
    ],
    sortBy: [
      { value: 'publishedAt', label: '업로드 날짜' },
      { value: 'viewCount', label: '조회수' }
    ],
    videoFormat: [
      { value: 'shorts', label: 'Shorts' },
      { value: 'long', label: 'Long' }
    ]
  };

  // 필터 변경 핸들러
  const handleFilterChange = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: type === 'features' 
        ? prev.features.includes(value)
          ? prev.features.filter(f => f !== value)
          : [...prev.features, value]
        : type === 'videoFormat'
          ? value
          : prev[type]
    }));
    setCurrentPage(1);
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

  // 필터링된 결과 계산 수정
  const filteredResults = results.filter(result => {
    const dateMatch = !filters.uploadDate || filterByDate(result.publishedAt, filters.uploadDate);
    const durationMatch = !filters.duration || filterByDuration(result.duration || '', filters.duration);
    const featuresMatch = filters.features.length === 0 || filterByFeatures(result, filters.features);
    const formatMatch = !filters.videoFormat || getVideoFormat(result).format === filters.videoFormat;
    
    return dateMatch && durationMatch && featuresMatch && formatMatch;
  });

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
    if (isLoading || displayedResults.length >= filteredResults.length) return;

    setIsLoading(true);
    
    // 다음 페이지 데이터 계산
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredResults.length);
    const newItems = filteredResults.slice(0, endIndex);
    
    // 데이터 업데이트
    setDisplayedResults(newItems);
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
            <Link 
              href={`https://youtube.com/watch?v=${result.id}`} 
              target="_blank" 
              className="text-blue-600 hover:text-blue-800 line-clamp-2 block"
              title={result.title}
            >
              {result.title}
            </Link>
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
      case 'likeCount':
      case 'commentCount':
      case 'shareCount':
      case 'subscriberCount':
      case 'videoCount':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatNumber(result[col.id] as number || 0)}
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
      case 'subscriberCount':
        return (
          <td key={col.id} className="px-4 py-4">
            {formatNumber(result.subscriberCount as number || 0)}
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
      width: '120px',
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
    // 시청자 참여도 지표
    {
      id: 'engagementRate',
      label: '참여율',
      width: '100px',
      sortable: true,
      field: 'engagementRate'
    },
    {
      id: 'averageViewDuration',
      label: '평균시청시간',
      width: '120px',
      sortable: true,
      field: 'averageViewDuration'
    },
    {
      id: 'viewerDropoffRate',
      label: '이탈률',
      width: '100px',
      sortable: true,
      field: 'viewerDropoffRate'
    },
    {
      id: 'ctr',
      label: '클릭률',
      width: '100px',
      sortable: true,
      field: 'ctr'
    },
    // 지리적 데이터
    {
      id: 'geographicStats',
      label: '국가별분포',
      width: '150px',
      sortable: false
    },
    // 인구통계학적 데이터
    {
      id: 'demographics',
      label: '인구통계',
      width: '150px',
      sortable: false
    },
    // 시청 패턴
    {
      id: 'viewingPatterns',
      label: '시청패턴',
      width: '150px',
      sortable: false
    },
    // 콘텐츠 도달률
    {
      id: 'contentReach',
      label: '도달률',
      width: '150px',
      sortable: false
    },
    // 트래픽 소스
    {
      id: 'trafficSources',
      label: '트래픽',
      width: '150px',
      sortable: false
    },
    // 디바이스 통계
    {
      id: 'deviceStats',
      label: '디바이스',
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

  // 필터 UI 렌더링 수정
  const renderFilters = () => (
    <div className="mb-6 bg-white rounded-lg shadow-md">
      {/* 필터 헤더 */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors duration-200"
        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
      >
        <div className="flex items-center">
          <h2 className="text-lg font-bold text-gray-800">검색 필터</h2>
          <span className="ml-2 text-sm text-gray-500">
            ({filteredResults.length}개 결과)
          </span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <span className={`transform transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* 필터 내용 */}
      {isFilterExpanded && (
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* 업로드 날짜 필터 */}
            <div>
              <h3 className="text-sm font-semibold mb-2">업로드 날짜</h3>
              <div className="space-y-2">
                {filterOptions.uploadDate.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="uploadDate"
                      value={option.value}
                      checked={filters.uploadDate === option.value}
                      onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 길이 필터 */}
            <div>
              <h3 className="text-sm font-semibold mb-2">길이</h3>
              <div className="space-y-2">
                {filterOptions.duration.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="duration"
                      value={option.value}
                      checked={filters.duration === option.value}
                      onChange={(e) => handleFilterChange('duration', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 기능별 필터 */}
            <div>
              <h3 className="text-sm font-semibold mb-2">기능</h3>
              <div className="space-y-2">
                {filterOptions.features.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={filters.features.includes(option.value)}
                      onChange={(e) => handleFilterChange('features', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 형식 필터 */}
            <div>
              <h3 className="text-sm font-semibold mb-2">형식</h3>
              <div className="space-y-2">
                {filterOptions.videoFormat.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="videoFormat"
                      value={option.value}
                      checked={filters.videoFormat === option.value}
                      onChange={(e) => handleFilterChange('videoFormat', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 정렬 기준 */}
            <div>
              <h3 className="text-sm font-semibold mb-2">정렬 기준</h3>
              <div className="space-y-2">
                {filterOptions.sortBy.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="sortBy"
                      value={option.value}
                      checked={filters.sortBy === option.value}
                      onChange={(e) => {
                        handleFilterChange('sortBy', e.target.value);
                        setSortField(e.target.value as keyof YouTubeSearchResult);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="overflow-hidden" ref={tableRef}>
      {renderFilters()}
      <div className="relative">
        {/* 테이블 헤더 (고정) */}
        <div className="sticky top-0 z-30 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md border-b border-pink-100 overflow-hidden">
          <div className="header-table" style={{ width: `${tableWidth}px`, minWidth: '100%' }}>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {visibleColumns.map(col => (
                  <col key={col.id} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-pink-100">
                  {visibleColumns.map(col => (
                    <th 
                      key={col.id}
                      className={`px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap ${
                        col.sortable ? 'cursor-pointer hover:bg-pink-100 transition-colors duration-200' : ''
                      }`}
                      onClick={() => col.sortable && col.field && handleSort(col.field as keyof YouTubeSearchResult)}
                    >
                      <div className="flex items-center">
                        {col.label} {col.sortable && col.field && renderSortIcon(col.field as keyof YouTubeSearchResult)}
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
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar"
          style={{ width: '100%' }}
        >
          <div style={{ width: `${tableWidth}px`, minWidth: '100%' }}>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {visibleColumns.map(col => (
                  <col key={col.id} style={{ width: col.width }} />
                ))}
              </colgroup>
              <tbody className="bg-white divide-y divide-pink-100">
                {displayedResults.map((result, index) => (
                  <tr 
                    key={result.id} 
                    className={`hover:bg-pink-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-pink-50/30'}`}
                  >
                    {visibleColumns.map(col => renderCell(result, col))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 무한 스크롤 로딩 인디케이터 */}
        <div ref={loadMoreRef} className="py-4 text-center">
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          )}
          {!isLoading && displayedResults.length < filteredResults.length && (
            <button 
              onClick={loadMoreItems}
              className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors duration-200"
            >
              더 보기 ({displayedResults.length}/{filteredResults.length})
            </button>
          )}
        </div>
      </div>
      
      {filteredResults.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
} 