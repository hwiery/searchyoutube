import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// 환경 변수 로깅
console.log('NextAuth Secret:', process.env.NEXTAUTH_SECRET ? '설정됨' : '설정되지 않음');
console.log('NextAuth URL:', process.env.NEXTAUTH_URL);

// 실제 프로덕션에서는 데이터베이스에 저장해야 합니다.
// 이 예제에서는 메모리에 임시 저장합니다.
const userSearchCounts: Record<string, { count: number; resetAt: Date }> = {};

// 무료 사용자의 일일 검색 제한
const FREE_SEARCH_LIMIT = 5;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 임시 사용자 ID 생성 (실제로는 데이터베이스의 사용자 ID를 사용해야 함)
    const userId = session.user.email || 'anonymous-user';
    
    // 사용자의 검색 카운트 정보가 없거나 리셋 시간이 지났으면 초기화
    if (!userSearchCounts[userId] || isResetNeeded(userSearchCounts[userId].resetAt)) {
      userSearchCounts[userId] = {
        count: 0,
        resetAt: getNextResetDate(),
      };
    }
    
    return NextResponse.json({
      remainingSearches: FREE_SEARCH_LIMIT - userSearchCounts[userId].count,
      totalLimit: FREE_SEARCH_LIMIT,
      resetAt: userSearchCounts[userId].resetAt,
    });
  } catch (error) {
    console.error('검색 제한 조회 오류:', error);
    return NextResponse.json({ error: '검색 제한 정보를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 임시 사용자 ID 생성 (실제로는 데이터베이스의 사용자 ID를 사용해야 함)
    const userId = session.user.email || 'anonymous-user';
    
    // 사용자의 검색 카운트 정보가 없거나 리셋 시간이 지났으면 초기화
    if (!userSearchCounts[userId] || isResetNeeded(userSearchCounts[userId].resetAt)) {
      userSearchCounts[userId] = {
        count: 0,
        resetAt: getNextResetDate(),
      };
    }
    
    // 검색 제한 확인
    if (userSearchCounts[userId].count >= FREE_SEARCH_LIMIT) {
      return NextResponse.json(
        { error: '일일 검색 제한에 도달했습니다. 내일 다시 시도하거나 프리미엄으로 업그레이드하세요.' },
        { status: 429 }
      );
    }
    
    // 검색 카운트 증가
    userSearchCounts[userId].count += 1;
    
    return NextResponse.json({
      remainingSearches: FREE_SEARCH_LIMIT - userSearchCounts[userId].count,
      totalLimit: FREE_SEARCH_LIMIT,
      resetAt: userSearchCounts[userId].resetAt,
    });
  } catch (error) {
    console.error('검색 제한 업데이트 오류:', error);
    return NextResponse.json({ error: '검색 제한 정보를 업데이트하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 다음 리셋 날짜 계산 (다음 날 자정)
function getNextResetDate(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// 리셋이 필요한지 확인
function isResetNeeded(resetAt: Date): boolean {
  const now = new Date();
  return now >= resetAt;
} 