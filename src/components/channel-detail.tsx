'use client';

import { useState, useEffect } from 'react';
import { YouTubeChannelDetail, getChannelDetail } from '@/lib/youtube';
import Image from 'next/image';

interface ChannelDetailProps {
  channelId: string;
}

export default function ChannelDetail({ channelId }: ChannelDetailProps) {
  const [channel, setChannel] = useState<YouTubeChannelDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannelDetail() {
      try {
        setLoading(true);
        const data = await getChannelDetail(channelId);
        setChannel(data);
      } catch (err) {
        setError('채널 정보를 불러오는 중 오류가 발생했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (channelId) {
      fetchChannelDetail();
    }
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-red-600 font-medium">{error || '채널 정보를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* 채널 헤더 */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0">
            <Image 
              src={channel.thumbnailUrl} 
              alt={channel.title} 
              fill 
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-1">{channel.title}</h1>
            <p className="text-gray-600 mb-2">{channel.customUrl}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-3">
              <div className="text-center">
                <p className="text-xl font-bold">{formatNumberWithCommas(channel.subscriberCount)}</p>
                <p className="text-sm text-gray-500">구독자</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{formatNumberWithCommas(channel.videoCount)}</p>
                <p className="text-sm text-gray-500">동영상</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{formatNumberWithCommas(channel.viewCount)}</p>
                <p className="text-sm text-gray-500">총 조회수</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">{channel.description}</p>
          </div>
        </div>
      </div>

      {/* 채널 통계 */}
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">채널 통계</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">채널명:</td>
                  <td className="py-1 font-medium">{channel.title}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">채널링크 아이디:</td>
                  <td className="py-1 font-medium">{channel.customUrl}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">채널 소유 비디오개수:</td>
                  <td className="py-1 font-medium">{formatNumberWithCommas(channel.videoCount)}개</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">구독자수:</td>
                  <td className="py-1 font-medium">{formatNumberWithCommas(channel.subscriberCount)}</td>
                </tr>
                {channel.subscriberRank && (
                  <tr>
                    <td className="py-1 text-gray-600">구독자수 순위:</td>
                    <td className="py-1 font-medium">#{channel.subscriberRank}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 text-gray-600">전체 뷰 수:</td>
                  <td className="py-1 font-medium">{formatNumberWithCommas(channel.viewCount)}</td>
                </tr>
                {channel.viewCountRank && (
                  <tr>
                    <td className="py-1 text-gray-600">전체뷰수 순위:</td>
                    <td className="py-1 font-medium">#{channel.viewCountRank}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {channel.recentStats && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">최근 28일 통계</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600">뷰 수:</td>
                    <td className="py-1 font-medium">{channel.recentStats.views}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">구독자 증가:</td>
                    <td className="py-1 font-medium">{channel.recentStats.subscribersGained}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">예상 수익:</td>
                    <td className="py-1 font-medium">{channel.recentStats.estimatedRevenue}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-lg font-semibold mt-4 mb-3">최근 28일 대비 이전 기간</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600">뷰 수 변화:</td>
                    <td className="py-1 font-medium">
                      {channel.recentStats.viewsChange} ({channel.recentStats.viewsChangePercentage})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">구독자 변화:</td>
                    <td className="py-1 font-medium">{channel.recentStats.subscribersChange}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">예상 수익 변화:</td>
                    <td className="py-1 font-medium">{channel.recentStats.revenueChange}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {channel.recentVideoStats && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">최근 동영상</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600">제목:</td>
                    <td className="py-1 font-medium">{channel.recentVideoStats.title}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">업로드 후:</td>
                    <td className="py-1 font-medium">{channel.recentVideoStats.publishedDuration}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">총 조회수:</td>
                    <td className="py-1 font-medium">{channel.recentVideoStats.viewCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {channel.contentTypeStats && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">최근 28일 동영상 유형별 조회수</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600">롱폼 동영상:</td>
                    <td className="py-1 font-medium">{channel.contentTypeStats.longFormViews}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">숏폼 동영상:</td>
                    <td className="py-1 font-medium">{channel.contentTypeStats.shortFormViews}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {channel.monthlyStats && (
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="text-lg font-semibold mb-3">{channel.monthlyStats.month} 통계</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">월간 조회수:</td>
                  <td className="py-1 font-medium">
                    {channel.monthlyStats.views} (전월 대비 {channel.monthlyStats.viewsChange}, {channel.monthlyStats.viewsChangePercentage})
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">월간 구독자 증가:</td>
                  <td className="py-1 font-medium">
                    {channel.monthlyStats.subscribersGained} (전월 대비 {channel.monthlyStats.subscribersChange}, {channel.monthlyStats.subscribersChangePercentage})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {channel.averageStats && (
          <div>
            <h3 className="text-lg font-semibold mb-3">평균 통계</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">최근 2주간 일일 평균</h4>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-600">구독자 증가:</td>
                      <td className="py-1 font-medium">{channel.averageStats.daily.subscribersGained}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">조회수 증가:</td>
                      <td className="py-1 font-medium">{channel.averageStats.daily.views}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">예상 수익:</td>
                      <td className="py-1 font-medium">{channel.averageStats.daily.estimatedRevenue}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">최근 주간 평균</h4>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-600">구독자 증가:</td>
                      <td className="py-1 font-medium">{channel.averageStats.weekly.subscribersGained}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">조회수 증가:</td>
                      <td className="py-1 font-medium">{channel.averageStats.weekly.views}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">예상 수익:</td>
                      <td className="py-1 font-medium">{channel.averageStats.weekly.estimatedRevenue}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">최근 28일 총계</h4>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-600">구독자 증가:</td>
                      <td className="py-1 font-medium">{channel.averageStats.monthly.subscribersGained}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">조회수 증가:</td>
                      <td className="py-1 font-medium">{channel.averageStats.monthly.views}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">예상 수익:</td>
                      <td className="py-1 font-medium">{channel.averageStats.monthly.estimatedRevenue}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 숫자에 콤마 추가하는 함수
function formatNumberWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
} 