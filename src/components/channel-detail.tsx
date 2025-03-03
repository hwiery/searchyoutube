'use client';

import React, { useState } from 'react';
import { YouTubeChannelDetail } from '@/lib/youtube';
import { formatNumber, formatDate } from '@/lib/utils';

interface ChannelDetailProps {
  channelDetail: YouTubeChannelDetail;
}

export default function ChannelDetail({ channelDetail }: ChannelDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'projections' | 'similar'>('overview');

  // 탭 변경 핸들러
  const handleTabChange = (tab: 'overview' | 'videos' | 'projections' | 'similar') => {
    setActiveTab(tab);
  };

  // 화살표 아이콘 렌더링 함수
  const renderArrow = (isPositive: boolean) => {
    return (
      <span className={`inline-block mr-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100 p-6">
        {/* 채널 헤더 */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-pink-200 flex-shrink-0">
            <img 
              src={channelDetail.thumbnailUrl} 
              alt={channelDetail.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{channelDetail.title}</h1>
              {channelDetail.country && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {channelDetail.country}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">구독자</span>
                <span className="text-lg font-semibold text-gray-800">
                  {formatNumber(channelDetail.subscriberCount)}
                  {channelDetail.subscriberRank && (
                    <span className="ml-2 text-sm text-gray-500">#{channelDetail.subscriberRank}</span>
                  )}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">총 조회수</span>
                <span className="text-lg font-semibold text-gray-800">
                  {formatNumber(channelDetail.viewCount)}
                  {channelDetail.viewCountRank && (
                    <span className="ml-2 text-sm text-gray-500">#{channelDetail.viewCountRank}</span>
                  )}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">동영상</span>
                <span className="text-lg font-semibold text-gray-800">{formatNumber(channelDetail.videoCount)}</span>
              </div>
            </div>
            
            <p className="mt-3 text-gray-600 line-clamp-2">{channelDetail.description}</p>
          </div>
        </div>
        
        {/* 탭 메뉴 */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            <button 
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview' 
                  ? 'text-pink-600 border-b-2 border-pink-500' 
                  : 'text-gray-600 hover:text-pink-500'
              }`}
              onClick={() => handleTabChange('overview')}
            >
              개요
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'videos' 
                  ? 'text-pink-600 border-b-2 border-pink-500' 
                  : 'text-gray-600 hover:text-pink-500'
              }`}
              onClick={() => handleTabChange('videos')}
            >
              동영상
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'projections' 
                  ? 'text-pink-600 border-b-2 border-pink-500' 
                  : 'text-gray-600 hover:text-pink-500'
              }`}
              onClick={() => handleTabChange('projections')}
            >
              예측
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'similar' 
                  ? 'text-pink-600 border-b-2 border-pink-500' 
                  : 'text-gray-600 hover:text-pink-500'
              }`}
              onClick={() => handleTabChange('similar')}
            >
              유사 채널
            </button>
          </div>
        </div>
        
        {/* 개요 탭 내용 */}
        {activeTab === 'overview' && (
          <div>
            {/* 최근 28일 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">조회수</h3>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-800">{channelDetail.recentStats?.views}</span>
                  <div className="flex items-center mt-1 text-sm">
                    {renderArrow(!channelDetail.recentStats?.viewsChange.includes('-'))}
                    <span className={`${
                      !channelDetail.recentStats?.viewsChange.includes('-') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {channelDetail.recentStats?.viewsChange} ({channelDetail.recentStats?.viewsChangePercentage})
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">최근 28일</div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">구독자</h3>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-800">{channelDetail.recentStats?.subscribersGained}</span>
                  <div className="flex items-center mt-1 text-sm">
                    {renderArrow(!channelDetail.recentStats?.subscribersChange.includes('-'))}
                    <span className={`${
                      !channelDetail.recentStats?.subscribersChange.includes('-') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {channelDetail.recentStats?.subscribersChange}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">최근 28일</div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">예상 수익</h3>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-800">{channelDetail.recentStats?.estimatedRevenue}</span>
                  <div className="flex items-center mt-1 text-sm">
                    {renderArrow(channelDetail.recentStats?.revenueChange ? channelDetail.recentStats.revenueChange.includes('+') : false)}
                    <span className={`${
                      channelDetail.recentStats?.revenueChange ? channelDetail.recentStats.revenueChange.includes('+') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                      : 'text-gray-600'
                    }`}>
                      {channelDetail.recentStats?.revenueChange}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">최근 28일</div>
              </div>
            </div>
            
            {/* 최근 동영상 */}
            {channelDetail.recentVideoStats && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 동영상</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-64 h-36 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img 
                        src={channelDetail.thumbnailUrl} 
                        alt="최근 동영상" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-800 mb-2">{channelDetail.recentVideoStats.title}</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        {channelDetail.recentVideoStats.publishedDuration}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">조회수</span>
                          <span className="font-medium">{channelDetail.recentVideoStats.viewCount}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">예상 순위</span>
                          <span className="font-medium">N/A</span>
                        </div>
                      </div>
                      <a 
                        href="#" 
                        className="text-sm text-pink-600 hover:text-pink-700 mt-3 inline-block"
                      >
                        동영상 분석 보기
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 롱폼 vs 쇼츠 조회수 */}
            {channelDetail.contentTypeStats && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">롱폼 vs 쇼츠 조회수</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">롱폼 조회수</div>
                      <div className="text-xl font-semibold">{channelDetail.contentTypeStats.longFormViews}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">쇼츠 조회수</div>
                      <div className="text-xl font-semibold">{channelDetail.contentTypeStats.shortFormViews}</div>
                    </div>
                  </div>
                  <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600" 
                      style={{ 
                        width: `${parseInt(channelDetail.contentTypeStats.longFormViews) / 
                          (parseInt(channelDetail.contentTypeStats.longFormViews) + 
                           parseInt(channelDetail.contentTypeStats.shortFormViews)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">최근 28일 • 추정치</div>
                </div>
              </div>
            )}
            
            {/* 일별 통계 테이블 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">일별 통계</h3>
              <div className="overflow-x-auto">
                <table className="w-full results-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">날짜</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">구독자 변화</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">총 구독자</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">조회수 변화</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">총 조회수</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">수익 범위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 예시 데이터 */}
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">2025/02/17</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">42,000,000</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">19,878,460,992</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">2025/02/18</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+100,000</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">42,100,000</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+12,203,756</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">19,890,664,748</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">$2.7K - $7.5K</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">2025/02/19</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">42,100,000</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+20,610,337</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">19,911,275,085</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">$4.2K - $11.9K</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">일 평균</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+16,666</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+13,575,054</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">$239 - $829</td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">주 평균</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+116,662</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+95,025,378</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">$1.67K - $5.80K</td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">최근 28일</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+400,000</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">+379,185,549</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">$50.60K - $144K</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* 월별 통계 */}
            {channelDetail.monthlyStats && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">월별 통계</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">월별 조회수</div>
                      <div className="text-xl font-semibold">{channelDetail.monthlyStats.views}</div>
                      <div className="flex items-center mt-1 text-sm">
                        {renderArrow(!channelDetail.monthlyStats.viewsChange.includes('-'))}
                        <span className={`${
                          !channelDetail.monthlyStats.viewsChange.includes('-') 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {channelDetail.monthlyStats.viewsChange} ({channelDetail.monthlyStats.viewsChangePercentage})
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">월별 구독자</div>
                      <div className="text-xl font-semibold">{channelDetail.monthlyStats.subscribersGained}</div>
                      <div className="flex items-center mt-1 text-sm">
                        {renderArrow(!channelDetail.monthlyStats.subscribersChange.includes('-'))}
                        <span className={`${
                          !channelDetail.monthlyStats.subscribersChange.includes('-') 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {channelDetail.monthlyStats.subscribersChange} ({channelDetail.monthlyStats.subscribersChangePercentage})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-4">{channelDetail.monthlyStats.month}</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 다른 탭 내용 (필요시 구현) */}
        {activeTab === 'videos' && (
          <div className="text-center py-8 text-gray-500">
            동영상 탭 내용은 준비 중입니다.
          </div>
        )}
        
        {activeTab === 'projections' && (
          <div className="text-center py-8 text-gray-500">
            예측 탭 내용은 준비 중입니다.
          </div>
        )}
        
        {activeTab === 'similar' && (
          <div className="text-center py-8 text-gray-500">
            유사 채널 탭 내용은 준비 중입니다.
          </div>
        )}
      </div>
    </div>
  );
} 