import axios from 'axios';

// API 키 로드
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
console.log('YouTube API Key:', YOUTUBE_API_KEY ? '설정됨' : '설정되지 않음');

if (!YOUTUBE_API_KEY) {
  console.error('YouTube API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_YOUTUBE_API_KEY를 설정해주세요.');
}

// 기본 URL 설정
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeSearchResult {
  id: string;
  videoId?: string;
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
  tags?: string[];
  categoryId?: string;
  subscriberCount?: number;
  videoFormat?: 'shorts' | 'long';
  stats?: {
    views: {
      weekChange: number;
      monthChange: number;
    };
    subscribers: {
      weekChange: number;
      monthChange: number;
    };
  };
}

export interface YouTubeSearchResponse {
  results: YouTubeSearchResult[];
  total: number;
  limit: number;
  offset: number;
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

// duration을 초로 변환하는 함수
function parseDurationToSeconds(duration: string): number {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0');
  const minutes = parseInt(matches[2] || '0');
  const seconds = parseInt(matches[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

export async function searchYouTube(
  query: string,
  limit: number = 50,
  offset: number = 0
): Promise<YouTubeSearchResult[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    // 검색 API 호출
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults: limit,
        q: query,
        type: 'video',
        key: YOUTUBE_API_KEY
      }
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return [];
    }

    // 비디오 ID 목록 추출
    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId);
    const channelIds = searchResponse.data.items.map((item: any) => item.snippet.channelId);

    // 비디오 상세 정보 가져오기
    const [videoResponse, channelResponse] = await Promise.all([
      axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoIds.join(','),
          key: YOUTUBE_API_KEY
        }
      }),
      axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
        params: {
          part: 'statistics',
          id: channelIds.join(','),
          key: YOUTUBE_API_KEY
        }
      })
    ]);

    // 채널 정보 매핑
    const channelStatsMap = channelResponse.data.items.reduce((acc: any, channel: any) => {
      acc[channel.id] = {
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0')
      };
      return acc;
    }, {});

    // 결과 변환
    const results = videoResponse.data.items.map((item: any) => {
      const duration = item.contentDetails.duration;
      const durationInSeconds = parseDurationToSeconds(duration);
      const isShorts = durationInSeconds <= 60;
      const channelId = item.snippet.channelId;
      const channelStats = channelStatsMap[channelId] || {
        subscriberCount: 0,
        viewCount: 0,
        videoCount: 0
      };

      return {
        id: item.id,
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        channelId: channelId,
        channelTitle: item.snippet.channelTitle,
        duration: duration,
        definition: item.contentDetails.definition,
        caption: item.contentDetails.caption === 'true',
        viewCount: parseInt(item.statistics.viewCount || '0'),
        likeCount: parseInt(item.statistics.likeCount || '0'),
        commentCount: parseInt(item.statistics.commentCount || '0'),
        tags: item.snippet.tags || [],
        categoryId: item.snippet.categoryId,
        subscriberCount: channelStats.subscriberCount,
        videoFormat: isShorts ? 'shorts' : 'long',
        stats: {
          views: {
            weekChange: Math.floor(Math.random() * 1000), // 임시 데이터
            monthChange: Math.floor(Math.random() * 5000) // 임시 데이터
          },
          subscribers: {
            weekChange: Math.floor(Math.random() * 100), // 임시 데이터
            monthChange: Math.floor(Math.random() * 500) // 임시 데이터
          }
        }
      };
    });

    return results;
  } catch (error) {
    console.error('YouTube 검색 오류:', error);
    throw error;
  }
} 