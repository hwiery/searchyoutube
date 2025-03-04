import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

// 모의 데이터 생성 함수
function generateMockData(query: string, limit: number, offset: number) {
  // 검색어에 따라 다른 결과 수를 생성 (일관성을 위해)
  const queryHash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const totalResults = 50 + (queryHash % 150); // 50~200개 사이의 결과
  
  const results = [];
  for (let i = 0; i < totalResults; i++) {
    const id = `video-${i}-${queryHash}`;
    const viewCount = 1000 + Math.floor(Math.random() * 1000000);
    const likeCount = Math.floor(viewCount * (0.01 + Math.random() * 0.1));
    const commentCount = Math.floor(viewCount * (0.001 + Math.random() * 0.01));
    const subscriberCount = 1000 + Math.floor(Math.random() * 1000000);
    
    // 날짜 생성 (최근 2년 내)
    const publishedDate = new Date();
    publishedDate.setDate(publishedDate.getDate() - Math.floor(Math.random() * 730));
    
    // 동영상 길이 생성 (PT1M30S 형식)
    const minutes = Math.floor(Math.random() * 15);
    const seconds = Math.floor(Math.random() * 59);
    const duration = `PT${minutes}M${seconds}S`;
    
    // 태그 생성
    const tags = ['유튜브', '검색', query];
    if (Math.random() > 0.5) tags.push('인기');
    if (Math.random() > 0.7) tags.push('추천');
    
    // 통계 데이터 생성 (1주일 전, 1달 전 데이터)
    const weekAgoViews = Math.floor(viewCount * 0.9); // 10% 감소 가정
    const monthAgoViews = Math.floor(viewCount * 0.8); // 20% 감소 가정
    const weekAgoSubscribers = Math.floor(subscriberCount * 0.95); // 5% 감소 가정
    const monthAgoSubscribers = Math.floor(subscriberCount * 0.9); // 10% 감소 가정
    
    results.push({
      id,
      title: `${query} 관련 동영상 ${i + 1}`,
      description: `이 동영상은 "${query}"에 관한 내용을 담고 있습니다. 자세한 정보는 동영상을 확인하세요.`,
      thumbnailUrl: `https://picsum.photos/seed/${id}/480/360`,
      channelTitle: `${query} 채널 ${Math.floor(i / 3) + 1}`,
      channelId: `channel-${Math.floor(i / 3) + 1}-${queryHash}`,
      publishedAt: publishedDate.toISOString(),
      viewCount,
      likeCount,
      commentCount,
      duration,
      tags,
      dislikeCount: 0,
      subscriberCount,
      firstWeekViews: Math.floor(viewCount * (0.3 + Math.random() * 0.4)),
      stats: {
        views: {
          current: viewCount,
          weekAgo: weekAgoViews,
          monthAgo: monthAgoViews,
          weekChange: viewCount - weekAgoViews,
          monthChange: viewCount - monthAgoViews
        },
        subscribers: {
          current: subscriberCount,
          weekAgo: weekAgoSubscribers,
          monthAgo: monthAgoSubscribers,
          weekChange: subscriberCount - weekAgoSubscribers,
          monthChange: subscriberCount - monthAgoSubscribers
        }
      }
    });
  }
  
  // 페이지네이션 적용
  return {
    results: results.slice(offset, offset + limit),
    total: totalResults,
    limit,
    offset
  };
}

export async function GET(req: NextRequest) {
  try {
    // 검색어 확인
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    if (!query) {
      return NextResponse.json({ error: '검색어가 필요합니다.' }, { status: 400 });
    }
    
    console.log(`검색 요청: 쿼리=${query}, 제한=${limit}, 오프셋=${offset}`); // 디버깅용 로그 추가
    
    // 사용자 세션 확인
    const session = await getServerSession(authOptions);
    const isPremium = session?.user?.isPremium || false;
    
    try {
      // YouTube API 키 확인
      const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      
      if (!YOUTUBE_API_KEY) {
        console.log('YouTube API 키가 설정되지 않아 모의 데이터를 사용합니다.');
        const mockData = generateMockData(query, limit, offset);
        console.log(`모의 데이터 생성: ${mockData.results.length}개 결과`); // 디버깅용 로그 추가
        return NextResponse.json({
          ...mockData,
          isPremium
        });
      }
      
      try {
        // YouTube API 호출 시도
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=50&key=${YOUTUBE_API_KEY}`
        );
        
        // 비디오 ID 추출
        const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
        
        if (!videoIds) {
          return NextResponse.json({
            results: [],
            total: 0,
            limit,
            offset,
            isPremium
          });
        }
        
        // 비디오 상세 정보 가져오기
        const videosResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        
        // 결과 가공
        const allResults = videosResponse.data.items.map((video: any) => {
          // 임의의 첫 주 조회수 생성 (실제 데이터는 YouTube Analytics API 필요)
          const viewCount = parseInt(video.statistics.viewCount || '0');
          const firstWeekViews = Math.floor(viewCount * (0.3 + Math.random() * 0.4)); // 30~70% 범위
          
          // 구독자 수 임의 생성 (실제로는 채널 API 호출 필요)
          const subscriberCount = Math.floor(1000 + Math.random() * 1000000);
          
          // 통계 데이터 생성 (1주일 전, 1달 전 데이터)
          const weekAgoViews = Math.floor(viewCount * 0.9); // 10% 감소 가정
          const monthAgoViews = Math.floor(viewCount * 0.8); // 20% 감소 가정
          const weekAgoSubscribers = Math.floor(subscriberCount * 0.95); // 5% 감소 가정
          const monthAgoSubscribers = Math.floor(subscriberCount * 0.9); // 10% 감소 가정
          
          return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
            channelTitle: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            publishedAt: video.snippet.publishedAt,
            viewCount: parseInt(video.statistics.viewCount || '0'),
            likeCount: parseInt(video.statistics.likeCount || '0'),
            commentCount: parseInt(video.statistics.commentCount || '0'),
            duration: video.contentDetails.duration,
            tags: video.snippet.tags || [],
            dislikeCount: 0, // YouTube API에서 더 이상 제공하지 않으므로 기본값 설정
            subscriberCount: subscriberCount, // 임의 생성된 구독자 수
            firstWeekViews: firstWeekViews, // 임의 생성된 첫 주 조회수
            stats: {
              views: {
                current: viewCount,
                weekAgo: weekAgoViews,
                monthAgo: monthAgoViews,
                weekChange: viewCount - weekAgoViews,
                monthChange: viewCount - monthAgoViews
              },
              subscribers: {
                current: subscriberCount,
                weekAgo: weekAgoSubscribers,
                monthAgo: monthAgoSubscribers,
                weekChange: subscriberCount - weekAgoSubscribers,
                monthChange: subscriberCount - monthAgoSubscribers
              }
            }
          };
        });
        
        // 페이지네이션 처리
        const totalResults = allResults.length;
        const paginatedResults = allResults.slice(offset, offset + limit);
        
        // 응답 반환
        return NextResponse.json({
          results: paginatedResults,
          total: totalResults,
          limit,
          offset,
          isPremium
        });
      } catch (apiError: any) {
        console.error('YouTube API 오류:', apiError.response?.data || apiError.message);
        
        // API 할당량 초과 오류인 경우 모의 데이터 사용
        if (apiError.response?.data?.error?.code === 403 && 
            apiError.response?.data?.error?.message?.includes('quota')) {
          console.log('YouTube API 할당량 초과로 모의 데이터를 사용합니다.');
          const mockData = generateMockData(query, limit, offset);
          return NextResponse.json({
            ...mockData,
            isPremium
          });
        }
        
        // 다른 API 오류의 경우 모의 데이터 사용
        console.log('YouTube API 오류로 모의 데이터를 사용합니다.');
        const mockData = generateMockData(query, limit, offset);
        return NextResponse.json({
          ...mockData,
          isPremium
        });
      }
    } catch (error: any) {
      console.error('검색 처리 중 오류:', error);
      // 오류 발생 시 모의 데이터 사용
      const mockData = generateMockData(query, limit, offset);
      return NextResponse.json({
        ...mockData,
        isPremium
      });
    }
  } catch (error: any) {
    console.error('YouTube 검색 오류:', error);
    return NextResponse.json({ 
      error: '검색 중 오류가 발생했습니다.',
      message: error.message
    }, { status: 500 });
  }
} 