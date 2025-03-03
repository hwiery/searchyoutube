import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserSubscription } from '@/types/user';

/**
 * 비즈니스 모델 구현 요약
 * 
 * 1. 무료 플랜:
 *    - 검색 횟수 제한 없음
 *    - 검색 결과 최대 10개 출력
 *    - Excel 내보내기 불가
 *    - 결과 출력 개수 선택 불가
 * 
 * 2. 프리미엄 플랜 ($10/월):
 *    - 검색 횟수 제한 없음
 *    - 검색 결과 최대 50개 출력 (30/50 선택 가능)
 *    - Excel 내보내기 가능
 *    - 우선 기술 지원
 * 
 * 구현 내용:
 * - 구독 상태 관리 API (현재 파일)
 * - 결과 테이블에서 프리미엄 기능 제한 (Excel 내보내기, 결과 개수 선택)
 * - 프로필 페이지에서 구독 정보 표시
 * - 가격 페이지에서 구독 관리 (활성화/취소)
 * 
 * 실제 구현 시 고려사항:
 * - 실제 결제 처리를 위한 Stripe 등의 결제 서비스 연동
 * - 구독 정보를 데이터베이스에 저장
 * - 구독 만료 처리 및 자동 갱신 로직
 */

// 실제 프로덕션에서는 데이터베이스에 저장해야 합니다.
// 이 예제에서는 메모리에 임시 저장합니다.
const userSubscriptions: Record<string, UserSubscription> = {};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 임시 사용자 ID 생성 (실제로는 데이터베이스의 사용자 ID를 사용해야 함)
    const userId = session.user.email || 'anonymous-user';
    
    // 사용자의 구독 정보가 없으면 기본값 설정
    if (!userSubscriptions[userId]) {
      userSubscriptions[userId] = {
        isPremium: false,
        subscriptionStart: '',
        subscriptionEnd: ''
      };
    }
    
    return NextResponse.json(userSubscriptions[userId]);
  } catch (error) {
    console.error('구독 정보 조회 오류:', error);
    return NextResponse.json({ error: '구독 정보를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    const body = await req.json();
    const { action } = body;
    
    // 임시 사용자 ID 생성 (실제로는 데이터베이스의 사용자 ID를 사용해야 함)
    const userId = session.user.email || 'anonymous-user';
    
    // 사용자의 구독 정보가 없으면 기본값 설정
    if (!userSubscriptions[userId]) {
      userSubscriptions[userId] = {
        isPremium: false,
        subscriptionStart: '',
        subscriptionEnd: ''
      };
    }
    
    // 구독 활성화
    if (action === 'activate') {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1개월 구독
      
      userSubscriptions[userId] = {
        isPremium: true,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: endDate.toISOString(),
        subscriptionId: `sub_${Math.random().toString(36).substring(2, 15)}`,
        paymentMethod: 'credit_card'
      };
    }
    
    // 구독 취소
    else if (action === 'cancel') {
      userSubscriptions[userId].isPremium = false;
    }
    
    return NextResponse.json(userSubscriptions[userId]);
  } catch (error) {
    console.error('구독 정보 업데이트 오류:', error);
    return NextResponse.json({ error: '구독 정보를 업데이트하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 