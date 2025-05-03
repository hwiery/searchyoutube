import axios from 'axios';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

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
}

export interface YouTubeSearchResponse {
  items: YouTubeSearchResult[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  // 실제 API 호출 대신 임시 데이터 반환
  const mockResults: YouTubeSearchResult[] = [
    {
      id: 'video1',
      title: '인기 프로그래밍 언어 TOP 10',
      description: '2023년 가장 인기있는 프로그래밍 언어를 소개합니다.',
      thumbnailUrl: 'https://i.ytimg.com/vi/sample1/hqdefault.jpg',
      publishedAt: '2023-05-15T09:30:00Z',
      channelId: 'channel1',
      channelTitle: '코딩 마스터',
      viewCount: 250000,
      type: 'video'
    },
    {
      id: 'channel1',
      title: '코딩 마스터',
      description: '프로그래밍 튜토리얼과 팁을 제공하는 채널입니다.',
      thumbnailUrl: 'https://i.ytimg.com/vi/sample2/hqdefault.jpg',
      publishedAt: '2020-01-10T12:00:00Z',
      subscriberCount: 500000,
      videoCount: 320,
      type: 'channel'
    },
    {
      id: 'video2',
      title: 'React와 Next.js로 웹사이트 만들기',
      description: '처음부터 끝까지 React와 Next.js로 웹사이트를 만드는 방법을 알아봅니다.',
      thumbnailUrl: 'https://i.ytimg.com/vi/sample3/hqdefault.jpg',
      publishedAt: '2023-06-20T15:45:00Z',
      channelId: 'channel2',
      channelTitle: '웹 개발 학습',
      viewCount: 180000,
      type: 'video'
    },
    {
      id: 'channel2',
      title: '웹 개발 학습',
      description: '웹 개발에 관한 모든 것을 배울 수 있는 채널입니다.',
      thumbnailUrl: 'https://i.ytimg.com/vi/sample4/hqdefault.jpg',
      publishedAt: '2019-03-22T08:15:00Z',
      subscriberCount: 750000,
      videoCount: 450,
      type: 'channel'
    }
  ];

  // 검색어에 따라 필터링 (실제 구현에서는 API 호출로 대체)
  return mockResults.filter(result => 
    result.title.toLowerCase().includes(query.toLowerCase()) || 
    result.description.toLowerCase().includes(query.toLowerCase())
  );
}

const getChannelStats = async (channelIds: string[]) => {
  const { data } = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
    params: {
      part: 'statistics',
      id: channelIds.join(','),
      key: YOUTUBE_API_KEY,
    },
  });
  return data.items;
};

const getVideoStats = async (videoIds: string[]) => {
  const { data } = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
    params: {
      part: 'statistics',
      id: videoIds.join(','),
      key: YOUTUBE_API_KEY,
    },
  });
  return data.items;
}; 