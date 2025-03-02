import axios from 'axios';

// API 키 로드 및 로깅
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
console.log('YouTube API Key:', YOUTUBE_API_KEY ? '설정됨' : '설정되지 않음');

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_ANALYTICS_API_BASE_URL = 'https://youtubeanalytics.googleapis.com/v2';

export interface YouTubeSearchResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelId?: string;
  channelTitle?: string;
  viewCount?: number;
  subscriberCount?: number;
  videoCount?: number;
  type: 'video' | 'channel';
  recentViewsGrowth?: string;
  estimatedRevenue?: string;
  engagementRate?: string;
  averageViewDuration?: string;
}

export interface YouTubeSearchResponse {
  items: YouTubeSearchResult[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeChannelDetail {
  id: string;
  title: string;
  customUrl: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  country?: string;
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  subscriberRank?: number;
  viewCountRank?: number;
  recentStats?: {
    views: string;
    subscribersGained: string;
    estimatedRevenue: string;
    viewsChange: string;
    viewsChangePercentage: string;
    subscribersChange: string;
    revenueChange: string;
  };
  recentVideoStats?: {
    title: string;
    publishedDuration: string;
    viewCount: string;
  };
  contentTypeStats?: {
    longFormViews: string;
    shortFormViews: string;
  };
  monthlyStats?: {
    month: string;
    views: string;
    viewsChange: string;
    viewsChangePercentage: string;
    subscribersGained: string;
    subscribersChange: string;
    subscribersChangePercentage: string;
  };
  averageStats?: {
    daily: {
      subscribersGained: string;
      views: string;
      estimatedRevenue: string;
    };
    weekly: {
      subscribersGained: string;
      views: string;
      estimatedRevenue: string;
    };
    monthly: {
      subscribersGained: string;
      views: string;
      estimatedRevenue: string;
    };
  };
}

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  try {
    // API 키 확인
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API 키가 설정되지 않았습니다.');
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    // YouTube API 검색 요청
    const { data } = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        maxResults: 10,
        type: 'video,channel',
        key: YOUTUBE_API_KEY,
      },
    });

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // 검색 결과 변환
    const results: YouTubeSearchResult[] = data.items.map((item: any) => {
      const isChannel = item.id.kind === 'youtube#channel';
      
      return {
        id: isChannel ? item.id.channelId : item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        channelId: isChannel ? item.id.channelId : item.snippet.channelId,
        channelTitle: isChannel ? item.snippet.title : item.snippet.channelTitle,
        type: isChannel ? 'channel' : 'video',
      };
    });

    // 채널 ID와 비디오 ID 추출
    const channelIds = results
      .filter(item => item.type === 'channel')
      .map(item => item.id);
    
    // 검색 결과에 포함된 모든 채널 ID 수집 (비디오의 채널 ID 포함)
    const videoChannelIds = results
      .filter(item => item.type === 'video' && item.channelId)
      .map(item => item.channelId as string);
    
    // 중복 제거하여 모든 채널 ID 목록 생성
    const allChannelIds = [...new Set([...channelIds, ...videoChannelIds])];
    
    const videoIds = results
      .filter(item => item.type === 'video')
      .map(item => item.id);

    // 채널 및 비디오 통계 정보 가져오기
    let channelStats: any[] = [];
    let videoStats: any[] = [];
    let analyticsData: any = {};

    if (allChannelIds.length > 0) {
      channelStats = await getChannelStats(allChannelIds);
      // Analytics API를 통해 채널 분석 데이터 가져오기
      analyticsData = await getChannelAnalytics(allChannelIds);
    }

    if (videoIds.length > 0) {
      videoStats = await getVideoStats(videoIds);
    }

    // 결과에 통계 정보 추가
    return results.map(result => {
      if (result.type === 'channel') {
        const channelStat = channelStats.find((stat: any) => stat.id === result.id);
        if (channelStat && channelStat.statistics) {
          result.subscriberCount = parseInt(channelStat.statistics.subscriberCount || '0', 10);
          result.videoCount = parseInt(channelStat.statistics.videoCount || '0', 10);
        }
        
        // Analytics 데이터 추가
        if (analyticsData[result.id]) {
          const analytics = analyticsData[result.id];
          result.recentViewsGrowth = analytics.recentViewsGrowth;
          result.estimatedRevenue = analytics.estimatedRevenue;
          result.engagementRate = analytics.engagementRate;
          result.averageViewDuration = analytics.averageViewDuration;
        }
      } else if (result.type === 'video') {
        const videoStat = videoStats.find((stat: any) => stat.id === result.id);
        if (videoStat && videoStat.statistics) {
          result.viewCount = parseInt(videoStat.statistics.viewCount || '0', 10);
        }
        
        // 비디오의 채널 정보도 추가
        if (result.channelId) {
          const channelStat = channelStats.find((stat: any) => stat.id === result.channelId);
          if (channelStat && channelStat.statistics) {
            result.subscriberCount = parseInt(channelStat.statistics.subscriberCount || '0', 10);
            result.videoCount = parseInt(channelStat.statistics.videoCount || '0', 10);
          }
          
          // 채널의 Analytics 데이터 추가
          if (analyticsData[result.channelId]) {
            const analytics = analyticsData[result.channelId];
            result.recentViewsGrowth = analytics.recentViewsGrowth;
            result.estimatedRevenue = analytics.estimatedRevenue;
            result.engagementRate = analytics.engagementRate;
            result.averageViewDuration = analytics.averageViewDuration;
          }
        }
      }
      return result;
    });
  } catch (error) {
    console.error('YouTube API 검색 오류:', error);
    return [];
  }
}

const getChannelStats = async (channelIds: string[]) => {
  try {
    // 한 번에 요청할 수 있는 최대 채널 수 제한 (YouTube API 제한)
    const maxChannelsPerRequest = 50;
    let allChannelStats: any[] = [];
    
    // 채널 ID를 최대 요청 수에 맞게 분할
    for (let i = 0; i < channelIds.length; i += maxChannelsPerRequest) {
      const channelIdsChunk = channelIds.slice(i, i + maxChannelsPerRequest);
      
      const { data } = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
        params: {
          part: 'statistics',
          id: channelIdsChunk.join(','),
          key: YOUTUBE_API_KEY,
        },
      });
      
      if (data.items && data.items.length > 0) {
        allChannelStats = [...allChannelStats, ...data.items];
      }
    }
    
    return allChannelStats;
  } catch (error) {
    console.error('채널 통계 가져오기 오류:', error);
    return [];
  }
};

const getVideoStats = async (videoIds: string[]) => {
  try {
    const { data } = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'statistics',
        id: videoIds.join(','),
        key: YOUTUBE_API_KEY,
      },
    });
    return data.items || [];
  } catch (error) {
    console.error('비디오 통계 가져오기 오류:', error);
    return [];
  }
};

export async function getChannelDetail(channelId: string): Promise<YouTubeChannelDetail | null> {
  try {
    // 채널 기본 정보 가져오기
    const { data } = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channelData = data.items[0];
    const snippet = channelData.snippet;
    const statistics = channelData.statistics;

    // 채널의 최근 동영상 가져오기
    const recentVideos = await getChannelVideos(channelId, 1);
    const recentVideo = recentVideos.length > 0 ? recentVideos[0] : null;

    // 채널 상세 정보 구성
    const channelDetail: YouTubeChannelDetail = {
      id: channelData.id,
      title: snippet.title,
      customUrl: snippet.customUrl || `@${snippet.title.replace(/\s+/g, '').toLowerCase()}`,
      description: snippet.description,
      thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
      publishedAt: snippet.publishedAt,
      country: snippet.country,
      viewCount: parseInt(statistics.viewCount, 10),
      subscriberCount: parseInt(statistics.subscriberCount, 10),
      videoCount: parseInt(statistics.videoCount, 10),
      
      // 실제 API에서는 이 정보를 가져올 수 없으므로 예시 데이터로 채웁니다
      // 실제 구현에서는 YouTube Analytics API를 사용해야 하지만 권한이 필요합니다
      subscriberRank: 111, // 예시 데이터
      viewCountRank: 224, // 예시 데이터
      
      recentStats: {
        views: '453M',
        subscribersGained: '400K',
        estimatedRevenue: '$51K-$148K',
        viewsChange: '-223M',
        viewsChangePercentage: '35.1% 감소',
        subscribersChange: '-300K',
        revenueChange: '+$26.2K 증가'
      },
      
      recentVideoStats: recentVideo ? {
        title: recentVideo.title,
        publishedDuration: calculateDuration(recentVideo.publishedAt),
        viewCount: formatNumber(recentVideo.viewCount || 0)
      } : undefined,
      
      contentTypeStats: {
        longFormViews: '18M',
        shortFormViews: '435.2M'
      },
      
      monthlyStats: {
        month: '2025년 1월',
        views: '767M',
        viewsChange: '218M',
        viewsChangePercentage: '39.8% 증가',
        subscribersGained: '700K',
        subscribersChange: '100K',
        subscribersChangePercentage: '16.7% 증가'
      },
      
      averageStats: {
        daily: {
          subscribersGained: '+13,333',
          views: '+15,106,548',
          estimatedRevenue: '$259 - $904'
        },
        weekly: {
          subscribersGained: '+93,331',
          views: '+105,745,836',
          estimatedRevenue: '$1,810 - $6,320'
        },
        monthly: {
          subscribersGained: '+400,000',
          views: '+409,887,777',
          estimatedRevenue: '$49,660 - $142,000'
        }
      }
    };

    return channelDetail;
  } catch (error) {
    console.error('채널 상세 정보 가져오기 오류:', error);
    return null;
  }
}

async function getChannelVideos(channelId: string, maxResults: number = 10): Promise<any[]> {
  try {
    // 채널의 업로드 재생목록 ID 가져오기
    const { data: channelData } = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!channelData.items || channelData.items.length === 0) {
      return [];
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // 재생목록에서 비디오 가져오기
    const { data: playlistData } = await axios.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!playlistData.items || playlistData.items.length === 0) {
      return [];
    }

    // 비디오 ID 추출
    const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId);

    // 비디오 통계 가져오기
    const videoStats = await getVideoStats(videoIds);

    // 비디오 정보와 통계 결합
    return playlistData.items.map((item: any) => {
      const videoId = item.snippet.resourceId.videoId;
      const videoStat = videoStats.find((stat: any) => stat.id === videoId);
      
      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        viewCount: videoStat ? parseInt(videoStat.statistics.viewCount, 10) : 0,
      };
    });
  } catch (error) {
    console.error('채널 비디오 가져오기 오류:', error);
    return [];
  }
}

// 날짜 차이 계산 함수
function calculateDuration(publishedAt: string): string {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - publishedDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${diffDays}일 ${diffHours}시간 경과`;
}

// 숫자 포맷팅 함수
function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// YouTube Analytics API를 통해 채널 분석 데이터 가져오기
async function getChannelAnalytics(channelIds: string[]): Promise<Record<string, any>> {
  try {
    // 실제 구현에서는 OAuth 2.0 인증을 통해 YouTube Analytics API에 접근해야 합니다.
    // 여기서는 예시 데이터를 반환합니다.
    const analyticsData: Record<string, any> = {};
    
    // 각 채널에 대한 예시 데이터 생성
    channelIds.forEach(channelId => {
      // 실제 구현에서는 아래 API 호출을 사용합니다:
      // GET https://youtubeanalytics.googleapis.com/v2/reports
      // ?dimensions=day
      // &metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained
      // &sort=-day
      // &maxResults=30
      // &ids=channel==${channelId}
      // &startDate=30daysAgo
      // &endDate=today
      
      // 예시 데이터
      analyticsData[channelId] = {
        recentViewsGrowth: getRandomGrowth(),
        estimatedRevenue: getRandomRevenue(),
        engagementRate: getRandomEngagementRate(),
        averageViewDuration: getRandomViewDuration()
      };
    });
    
    return analyticsData;
  } catch (error) {
    console.error('채널 분석 데이터 가져오기 오류:', error);
    return {};
  }
}

// 예시 데이터 생성 함수들
function getRandomGrowth(): string {
  const growth = Math.random() * 100 - 30; // -30% ~ +70%
  const sign = growth >= 0 ? '+' : '';
  return `${sign}${growth.toFixed(1)}%`;
}

function getRandomRevenue(): string {
  const min = Math.floor(Math.random() * 10000);
  const max = min + Math.floor(Math.random() * 20000);
  return `$${(min/1000).toFixed(1)}K-$${(max/1000).toFixed(1)}K`;
}

function getRandomEngagementRate(): string {
  const rate = Math.random() * 15 + 5; // 5% ~ 20%
  return `${rate.toFixed(1)}%`;
}

function getRandomViewDuration(): string {
  const minutes = Math.floor(Math.random() * 10) + 1;
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 