import axios from 'axios';

// API 키 로드
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
console.log('YouTube API Key:', YOUTUBE_API_KEY ? '설정됨' : '설정되지 않음');

if (!YOUTUBE_API_KEY) {
  console.error('YouTube API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_YOUTUBE_API_KEY를 설정해주세요.');
}

// 기본 URL 설정
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_ANALYTICS_API_BASE_URL = 'https://youtubeanalytics.googleapis.com/v2';

export interface YouTubeSearchResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  duration?: string;
  definition?: string;
  caption?: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  subscriberCount?: number;
  videoCount?: number;
  tags?: string[];
  topicDetails?: Array<{ name: string; wikiPath: string | null }>;
  trafficSources?: Record<string, number>;
  deviceStats?: Record<string, number>;
  engagementRate?: number;
  averageViewDuration?: number;
  viewerDropoffRate?: number;
  ctr?: number;
  contentReach?: number;
  demographics?: {
    population: number;
    populationDensity: number;
    medianAge: number;
    urbanPopulation: number;
  };
  viewingPatterns?: {
    peakViewingTime: string;
    livePercentage: number;
    subscribedPercentage: number;
    repeatViewPercentage: number;
  };
  growthStats?: {
    viewsGrowth?: number;
    engagementRate?: number;
    subscriberGrowth?: number;
  };
  retentionStats?: {
    viewerDropoffRate: number;
    ctr: number;
    avgViewDuration: string;
  };
  geographicStats?: {
    countries: Record<string, number>;
  };
  viewingStats?: {
    peakViewingTime: string;
    livePercentage: number;
    subscribedPercentage: number;
  };
  stats?: {
    views: {
      current: number;
      weekAgo: number;
      monthAgo: number;
      weekChange: number;
      monthChange: number;
    };
    subscribers: {
      current: number;
      weekAgo: number;
      monthAgo: number;
      weekChange: number;
      monthChange: number;
    };
  };
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

// 주제 카테고리 매핑
const topicCategories: { [key: string]: { name: string; wikiPath: string } } = {
  '/m/04rlf': { name: '음악', wikiPath: 'Music' },
  '/m/05fw6t': { name: '영화', wikiPath: 'Film' },
  '/m/02jjt': { name: '엔터테인먼트', wikiPath: 'Entertainment' },
  '/m/019_rr': { name: '방송', wikiPath: 'Broadcasting' },
  '/m/032tl': { name: '스포츠', wikiPath: 'Sport' },
  '/m/027x7n': { name: '교육', wikiPath: 'Education' },
  '/m/02wbm': { name: '라이프스타일', wikiPath: 'Lifestyle_(sociology)' },
  '/m/098wr': { name: '게임', wikiPath: 'Game' },
  '/m/01k8wb': { name: '기술', wikiPath: 'Technology' },
  '/m/09s1f': { name: '비즈니스', wikiPath: 'Business' },
  '/m/07c1v': { name: '기술과 과학', wikiPath: 'Science_and_technology' },
  '/m/01h6rj': { name: '뉴스', wikiPath: 'News' },
  '/m/02jx1': { name: '푸드', wikiPath: 'Food' },
  '/m/07bxq': { name: '여행', wikiPath: 'Travel' },
  '/m/041xxh': { name: '애완동물', wikiPath: 'Pet' },
  '/m/07yv9': { name: '차량', wikiPath: 'Vehicle' },
  '/m/03glg': { name: '취미', wikiPath: 'Hobby' },
  '/m/06ntj': { name: '스포츠', wikiPath: 'Sport' },
  '/m/02vxn': { name: '코미디', wikiPath: 'Comedy' }
};

// 주제 ID를 한글 카테고리로 변환하는 함수
function convertTopicToCategory(topicId: string): { name: string; wikiPath: string | null } {
  const category = topicCategories[topicId];
  return category || { name: topicId, wikiPath: null };
}

// 예시 데이터 생성 함수들
function generateAudienceStats() {
  return {
    ageGroups: {
      '13-17': Math.random() * 10,
      '18-24': Math.random() * 30,
      '25-34': Math.random() * 30,
      '35-44': Math.random() * 20,
      '45-54': Math.random() * 10,
      '55+': Math.random() * 10
    },
    genderGroups: {
      '남성': 45 + Math.random() * 20,
      '여성': 35 + Math.random() * 20
    }
  };
}

function generateGeographicStats() {
  return {
    countries: {
      'KR': 60 + Math.random() * 20,
      'US': 10 + Math.random() * 10,
      'JP': 5 + Math.random() * 10,
      'CN': 5 + Math.random() * 10,
      'Other': 5 + Math.random() * 10
    }
  };
}

function generateViewingStats() {
  return {
    timeOfDay: {
      '0-4': Math.random() * 10,
      '4-8': Math.random() * 15,
      '8-12': Math.random() * 25,
      '12-16': Math.random() * 25,
      '16-20': Math.random() * 30,
      '20-24': Math.random() * 20
    },
    livePercentage: Math.random() * 5
  };
}

function generateRetentionStats() {
  return {
    segments: {
      '0-25%': 100,
      '25-50%': 70 + Math.random() * 20,
      '50-75%': 50 + Math.random() * 20,
      '75-100%': 30 + Math.random() * 20
    },
    ctr: 3 + Math.random() * 7
  };
}

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_YOUTUBE_API_KEY를 설정해주세요.');
  }

  try {
    // 기본 검색 결과 가져오기
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(
        query
      )}&key=${YOUTUBE_API_KEY}&maxResults=50&type=video`
    );
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      throw new Error(`YouTube API 오류: ${errorData.error?.message || '알 수 없는 오류가 발생했습니다.'}`);
    }

    const searchData = await searchResponse.json();
    const items = searchData.items || [];

    // 결과 매핑 및 추가 데이터 가져오기
    const results = await Promise.all(
      items.map(async (item: any) => {
        const videoId = item.id.videoId;
        
        // 기본 정보 구성
        const result: YouTubeSearchResult = {
          id: videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0
        };

        try {
          // 비디오 상세 정보 가져오기
          const videoResponse = await fetch(
            `${YOUTUBE_API_BASE_URL}/videos?part=statistics,contentDetails,topicDetails,status&id=${videoId}&key=${YOUTUBE_API_KEY}`
          );
          
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            const videoItem = videoData.items?.[0];
            
            if (videoItem) {
              // 통계 정보
              result.viewCount = parseInt(videoItem.statistics?.viewCount || '0');
              result.likeCount = parseInt(videoItem.statistics?.likeCount || '0');
              result.commentCount = parseInt(videoItem.statistics?.commentCount || '0');
              
              // 콘텐츠 상세
              result.duration = videoItem.contentDetails?.duration;
              result.definition = videoItem.contentDetails?.definition;
              result.caption = videoItem.contentDetails?.caption === 'true';
              
              // 주제 상세
              if (videoItem.topicDetails?.topicCategories) {
                result.topicDetails = videoItem.topicDetails.topicCategories.map((topic: string) => {
                  const name = topic.split('/').pop() || '';
                  return {
                    name,
                    wikiPath: name
                  };
                });
              }
            }
          }

          // 채널 구독자 수 가져오기
          const channelResponse = await fetch(
            `${YOUTUBE_API_BASE_URL}/channels?part=statistics&id=${result.channelId}&key=${YOUTUBE_API_KEY}`
          );
          
          if (channelResponse.ok) {
            const channelData = await channelResponse.json();
            const channelItem = channelData.items?.[0];
            
            if (channelItem) {
              result.subscriberCount = parseInt(channelItem.statistics?.subscriberCount || '0');
              result.videoCount = parseInt(channelItem.statistics?.videoCount || '0');
            }
          }

          // 통계 데이터 가져오기
          const stats = await getVideoAndChannelStats(videoId, result.channelId);
          result.stats = stats;

        } catch (error) {
          console.error(`Error fetching additional data for ${videoId}:`, error);
        }

        return result;
      })
    );

    return results;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    throw error;
  }
}

// 비디오와 채널 통계를 가져오는 함수
async function getVideoAndChannelStats(videoId: string, channelId: string) {
  try {
    // 현재 날짜와 1주일 전, 1달 전 날짜 계산
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 비디오 통계 가져오기
    const videoResponse = await fetch(
      `${YOUTUBE_API_BASE_URL}/videos?part=statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const videoData = await videoResponse.json();
    const currentViews = parseInt(videoData.items?.[0]?.statistics?.viewCount || '0');

    // 채널 통계 가져오기
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE_URL}/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelResponse.json();
    const currentSubscribers = parseInt(channelData.items?.[0]?.statistics?.subscriberCount || '0');

    // 예시 데이터 (실제로는 YouTube Analytics API를 사용해야 함)
    // 현재는 예시 데이터를 생성합니다
    const weekAgoViews = Math.floor(currentViews * 0.9); // 10% 감소 가정
    const monthAgoViews = Math.floor(currentViews * 0.8); // 20% 감소 가정
    const weekAgoSubscribers = Math.floor(currentSubscribers * 0.95); // 5% 감소 가정
    const monthAgoSubscribers = Math.floor(currentSubscribers * 0.9); // 10% 감소 가정

    return {
      views: {
        current: currentViews,
        weekAgo: weekAgoViews,
        monthAgo: monthAgoViews,
        weekChange: currentViews - weekAgoViews,
        monthChange: currentViews - monthAgoViews
      },
      subscribers: {
        current: currentSubscribers,
        weekAgo: weekAgoSubscribers,
        monthAgo: monthAgoSubscribers,
        weekChange: currentSubscribers - weekAgoSubscribers,
        monthChange: currentSubscribers - monthAgoSubscribers
      }
    };
  } catch (error) {
    console.error('통계 데이터 가져오기 실패:', error);
    return undefined;
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
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// ISO 8601 기간 문자열을 초 단위로 변환하는 함수
function parseDuration(duration: string): number {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
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

// 국가 랜덤 생성 함수
function getRandomCountry(): string {
  const countries = ['미국', '한국', '일본', '영국', '캐나다', '호주', '독일', '프랑스', '스페인', '이탈리아'];
  return countries[Math.floor(Math.random() * countries.length)];
}

// 일별 통계 생성 함수
function generateDailyStats(days: number): Array<{
  date: string;
  subsChange: number;
  subsTotal: number;
  viewsChange: number;
  viewsTotal: number;
  revenueRange: string;
}> {
  const stats = [];
  const now = new Date();
  let subsTotal = Math.floor(Math.random() * 50) * 1000000;
  let viewsTotal = Math.floor(Math.random() * 20) * 1000000000;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const subsChange = Math.random() > 0.7 ? Math.floor(Math.random() * 200000) : 0;
    const viewsChange = Math.random() > 0.3 ? Math.floor(Math.random() * 30000000) : 0;
    
    subsTotal += subsChange;
    viewsTotal += viewsChange;
    
    const minRevenue = (viewsChange * 0.0002).toFixed(1);
    const maxRevenue = (viewsChange * 0.0006).toFixed(1);
    
    stats.push({
      date: `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`,
      subsChange,
      subsTotal,
      viewsChange,
      viewsTotal,
      revenueRange: viewsChange > 0 ? `$${minRevenue}K - $${maxRevenue}K` : '-'
    });
  }
  
  return stats;
}

export async function getChannelInfo(channelId: string): Promise<{ subscriberCount: number }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return {
        subscriberCount: parseInt(data.items[0].statistics.subscriberCount)
      };
    }
    
    return { subscriberCount: 0 };
  } catch (error) {
    console.error('채널 정보 가져오기 실패:', error);
    return { subscriberCount: 0 };
  }
} 