import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

// 경쟁도 점수 계산 함수
const calculateCompetitionScore = (
  averageViews: number,
  recentUploads: number
): { score: number; level: 'low' | 'medium' | 'high' } => {
  // 경쟁도 점수 = (상위 20개 영상 평균 조회수 / 10,000) + 최근 30일 내 업로드 수
  let score = (averageViews / 10000) + recentUploads;
  
  // 점수 정규화 (0~100)
  score = Math.min(100, Math.max(0, score));
  
  // 경쟁도 레벨 결정
  let level: 'low' | 'medium' | 'high';
  if (score < 30) level = 'low';
  else if (score < 70) level = 'medium';
  else level = 'high';
  
  return { score: Math.round(score), level };
};

// 간단한 경쟁도 정보 API
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const keyword = url.searchParams.get('keyword');
    
    if (!keyword) {
      return NextResponse.json({ error: '키워드가 필요합니다.' }, { status: 400 });
    }
    
    // YouTube API 호출 (실제 구현 시 API 키 필요)
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    // 상위 20개 영상 검색
    const searchResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
    );
    
    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');
    
    // 영상 상세 정보 가져오기
    const videosResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    // 평균 조회수 계산
    const videos = videosResponse.data.items;
    const totalViews = videos.reduce((sum: number, video: any) => sum + parseInt(video.statistics.viewCount || 0), 0);
    const averageViews = totalViews / videos.length;
    
    // 최근 30일 내 업로드 수 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUploads = videos.filter((video: any) => {
      const uploadDate = new Date(video.snippet.publishedAt);
      return uploadDate >= thirtyDaysAgo;
    }).length;
    
    // 경쟁도 계산
    const competitionData = calculateCompetitionScore(averageViews, recentUploads);
    
    // 무료 사용자에게는 기본 정보만 제공
    if (!session?.user || !session.user.isPremium) {
      return NextResponse.json(competitionData);
    }
    
    // 프리미엄 사용자에게는 추가 정보 제공
    return NextResponse.json({
      ...competitionData,
      averageViews,
      recentUploads,
      isPremium: true
    });
  } catch (error) {
    console.error('키워드 경쟁도 분석 오류:', error);
    return NextResponse.json({ error: '키워드 경쟁도를 분석하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 상세 분석 API (프리미엄 전용)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 프리미엄 사용자 확인
    if (!session?.user || !session.user.isPremium) {
      return NextResponse.json({ error: '프리미엄 사용자만 이용 가능합니다.' }, { status: 403 });
    }
    
    const body = await req.json();
    const { keyword } = body;
    
    if (!keyword) {
      return NextResponse.json({ error: '키워드가 필요합니다.' }, { status: 400 });
    }
    
    // YouTube API 호출 (실제 구현 시 API 키 필요)
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    // 상위 20개 영상 검색
    const searchResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
    );
    
    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');
    
    // 영상 상세 정보 가져오기
    const videosResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    // 평균 조회수 계산
    const videos = videosResponse.data.items;
    const totalViews = videos.reduce((sum: number, video: any) => sum + parseInt(video.statistics.viewCount || 0), 0);
    const averageViews = totalViews / videos.length;
    
    // 최근 30일 내 업로드 수 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUploads = videos.filter((video: any) => {
      const uploadDate = new Date(video.snippet.publishedAt);
      return uploadDate >= thirtyDaysAgo;
    }).length;
    
    // 경쟁도 계산
    const competitionData = calculateCompetitionScore(averageViews, recentUploads);
    
    // 추천 키워드 가져오기 (실제 구현 시 Google Trends API 등 사용)
    // 여기서는 예시 데이터 사용
    const recommendedKeywords = [
      { keyword: `${keyword} 초보`, score: Math.max(10, competitionData.score - 40) },
      { keyword: `${keyword} 기초`, score: Math.max(20, competitionData.score - 30) },
      { keyword: `${keyword} 가이드`, score: Math.max(30, competitionData.score - 20) },
      { keyword: `${keyword} 팁`, score: Math.max(40, competitionData.score - 10) }
    ];
    
    return NextResponse.json({
      ...competitionData,
      averageViews,
      recentUploads,
      recommendedKeywords,
      topVideos: videos.slice(0, 5).map((video: any) => ({
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        viewCount: video.statistics.viewCount,
        publishedAt: video.snippet.publishedAt
      }))
    });
  } catch (error) {
    console.error('키워드 상세 분석 오류:', error);
    return NextResponse.json({ error: '키워드 상세 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 