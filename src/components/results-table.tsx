'use client';

import React, { useState, useEffect, useRef } from 'react';
import { YouTubeSearchResult } from '@/lib/youtube';
import { formatNumber, formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface ResultsTableProps {
  results: YouTubeSearchResult[];
  contentType: 'video' | 'channel';
}

// 컬럼 정의를 위한 인터페이스 추가
interface ColumnDefinition {
  id: string;
  width: string;
  label: string;
  sortable: boolean;
  field?: keyof YouTubeSearchResult;
}

export default function ResultsTable({ results, contentType }: ResultsTableProps) {
  const [sortField, setSortField] = useState<keyof YouTubeSearchResult>('publishedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [displayedResults, setDisplayedResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedTags, setExpandedTags] = useState<{ [key: string]: boolean }>({});

  const handleSort = (field: keyof YouTubeSearchResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredResults = results.filter(result => {
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

  // 무한 스크롤 구현
  useEffect(() => {
    // 초기 데이터 로드
    loadMoreItems();

    // 인터섹션 옵저버 설정
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && displayedResults.length < sortedResults.length) {
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
  }, [sortedResults, currentPage, isLoading]);

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
    if (isLoading || displayedResults.length >= sortedResults.length) return;

    setIsLoading(true);
    
    // 다음 페이지 데이터 계산
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedResults.length);
    const newItems = sortedResults.slice(0, endIndex);
    
    // 데이터 업데이트
    setDisplayedResults(newItems);
    setCurrentPage(prev => prev + 1);
    setIsLoading(false);
  };

  const renderSortIcon = (field: keyof YouTubeSearchResult) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-pink-500">
        {sortDirection === 'asc' ? '▲' : '▼'}
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

  // 통합된 동영상 컬럼 정의
  const videoColumns: ColumnDefinition[] = [
    {
      id: 'thumbnail',
      label: '썸네일',
      width: '100px',
      sortable: false
    },
    {
      id: 'title',
      label: '제목',
      width: '300px',
      sortable: true,
      field: 'title' as keyof YouTubeSearchResult
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
      field: 'publishedAt' as keyof YouTubeSearchResult
    },
    {
      id: 'duration',
      label: '길이',
      width: '80px',
      sortable: false
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
      id: 'topicDetails',
      label: '주제',
      width: '120px',
      sortable: false
    },
    {
      id: 'tags',
      label: '태그',
      width: '400px',
      sortable: false
    },
    {
      id: 'viewCount',
      label: '조회수',
      width: '100px',
      sortable: true,
      field: 'viewCount' as keyof YouTubeSearchResult
    },
    {
      id: 'likeCount',
      label: '좋아요',
      width: '100px',
      sortable: true,
      field: 'likeCount' as keyof YouTubeSearchResult
    },
    {
      id: 'commentCount',
      label: '댓글',
      width: '100px',
      sortable: true,
      field: 'commentCount' as keyof YouTubeSearchResult
    },
    {
      id: 'channelTitle',
      label: '채널명',
      width: '200px',
      sortable: true,
      field: 'channelTitle' as keyof YouTubeSearchResult
    },
    {
      id: 'subscriberCount',
      label: '구독자',
      width: '100px',
      sortable: true,
      field: 'subscriberCount' as keyof YouTubeSearchResult
    },
    {
      id: 'videoCount',
      label: '동영상 수',
      width: '100px',
      sortable: true,
      field: 'videoCount' as keyof YouTubeSearchResult
    }
  ];

  // 채널 카테고리에 필요한 컬럼 정의
  const channelColumns: ColumnDefinition[] = [
    {
      id: 'thumbnail',
      label: '채널 이미지',
      width: '100px',
      sortable: false
    },
    {
      id: 'title',
      label: '채널명',
      width: '300px',
      sortable: true,
      field: 'title' as keyof YouTubeSearchResult
    },
    {
      id: 'description',
      label: '설명',
      width: '300px',
      sortable: false
    },
    {
      id: 'publishedAt',
      label: '생성일',
      width: '120px',
      sortable: true,
      field: 'publishedAt' as keyof YouTubeSearchResult
    },
    {
      id: 'viewCount',
      label: '총 조회수',
      width: '100px',
      sortable: true,
      field: 'viewCount' as keyof YouTubeSearchResult
    },
    {
      id: 'subscriberCount',
      label: '구독자',
      width: '100px',
      sortable: true,
      field: 'subscriberCount' as keyof YouTubeSearchResult
    },
    {
      id: 'videoCount',
      label: '동영상 수',
      width: '100px',
      sortable: true,
      field: 'videoCount' as keyof YouTubeSearchResult
    }
  ];

  // 콘텐츠 타입에 따른 컬럼 선택
  const visibleColumns = contentType === 'video' ? videoColumns : channelColumns;

  // 테이블 너비 계산
  const tableWidth = visibleColumns.reduce((acc, col) => {
    const width = parseInt(col.width);
    return acc + (isNaN(width) ? 100 : width);
  }, 0);

  const toggleTags = (resultId: string) => {
    setExpandedTags(prev => ({
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

  // 테이블 셀 렌더링 함수
  const renderCell = (result: YouTubeSearchResult, col: ColumnDefinition) => {
    switch (col.id) {
      case 'thumbnail':
        return (
          <td key={col.id} className="px-3 py-4 whitespace-nowrap">
            <div className="thumbnail-container" style={{ width: '80px', height: '80px' }}>
              <img 
                src={result.thumbnailUrl} 
                alt={result.title} 
                className={result.type === 'channel' ? 'rounded-full w-full h-full object-cover' : 'w-full h-full object-cover'}
              />
            </div>
          </td>
        );
      case 'title':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              {result.type === 'video' ? (
                <a 
                  href={`https://www.youtube.com/watch?v=${result.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-900 font-medium hover:text-pink-600 transition-colors duration-200 line-clamp-2 break-words"
                >
                  {result.title}
                </a>
              ) : (
                <Link 
                  href={`/channel/${result.id}`}
                  className="text-gray-900 font-medium hover:text-pink-600 transition-colors duration-200 line-clamp-2 break-words"
                >
                  {result.title}
                </Link>
              )}
            </div>
          </td>
        );
      case 'description':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-600 line-clamp-2 break-words">{result.description}</p>
            </div>
          </td>
        );
      case 'publishedAt':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{formatDate(result.publishedAt)}</p>
            </div>
          </td>
        );
      case 'duration':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{result.duration ? formatDuration(result.duration) : 'N/A'}</p>
            </div>
          </td>
        );
      case 'definition':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{result.definition ? result.definition.toUpperCase() : 'N/A'}</p>
            </div>
          </td>
        );
      case 'caption':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{result.caption ? '있음' : '없음'}</p>
            </div>
          </td>
        );
      case 'topicDetails':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <div className="flex flex-wrap gap-1">
                {result.topicDetails?.map((topic: { name: string; wikiPath: string | null }, index: number) => {
                  const displayName = topic.name.replace('/m/', '');
                  return (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs whitespace-nowrap">
                      {topic.wikiPath ? (
                        <a
                          href={`https://en.wikipedia.org/wiki/${topic.wikiPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-900"
                        >
                          {displayName}
                        </a>
                      ) : (
                        displayName
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </td>
        );
      case 'tags':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              {renderTags(result.tags, result.id)}
            </div>
          </td>
        );
      case 'viewCount':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{formatNumber(result.viewCount)}</p>
            </div>
          </td>
        );
      case 'likeCount':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{result.likeCount ? formatNumber(result.likeCount) : 'N/A'}</p>
            </div>
          </td>
        );
      case 'commentCount':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{result.commentCount ? formatNumber(result.commentCount) : 'N/A'}</p>
            </div>
          </td>
        );
      case 'channelTitle':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2 break-words">{result.channelTitle}</p>
            </div>
          </td>
        );
      case 'subscriberCount':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{result.subscriberCount ? formatNumber(result.subscriberCount) : 'N/A'}</p>
            </div>
          </td>
        );
      case 'videoCount':
        return (
          <td key={col.id} className="px-4 py-4">
            <div className="max-w-full overflow-hidden">
              <p className="text-sm text-gray-700 line-clamp-2">{result.videoCount ? formatNumber(result.videoCount) : 'N/A'}</p>
            </div>
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-4">-</td>;
    }
  };

  return (
    <div className="overflow-hidden" ref={tableRef}>
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
          {!isLoading && displayedResults.length < sortedResults.length && (
            <button 
              onClick={loadMoreItems}
              className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors duration-200"
            >
              더 보기 ({displayedResults.length}/{sortedResults.length})
            </button>
          )}
        </div>
      </div>
      
      {sortedResults.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
} 