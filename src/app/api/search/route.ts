import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';
import { searchYouTube } from '@/lib/youtube';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    const results = await searchYouTube(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('검색 오류:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 