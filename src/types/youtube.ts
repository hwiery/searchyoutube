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
  subscriberCount?: number;  // 채널 구독자 수
  videoCount?: number;
  tags?: string[];
  topicDetails?: Array<{ name: string; wikiPath: string | null }>;
  // 시청자 참여도 지표
  engagementRate?: number;
  averageViewDuration?: number;
  viewerDropoffRate?: number;
  ctr?: number;
  // 지리적 데이터
  geographicStats?: {
    countries: { [key: string]: number };
  };
  // 인구통계학적 데이터
  demographics?: {
    population: number;
    populationDensity: number;
    ageGroups: { [key: string]: number };
    gender: { [key: string]: number };
  };
  // 시청 패턴
  viewingPatterns?: {
    peakViewingTime: string;
    livePercentage: number;
    dailyTrends: { [key: string]: number };
    hourlyTrends: { [key: string]: number };
  };
  // 콘텐츠 도달률
  contentReach?: number;
  // 트래픽 소스
  trafficSources?: { [key: string]: number };
  // 디바이스 통계
  deviceStats?: { [key: string]: number };
} 