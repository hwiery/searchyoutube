import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

// 환경 변수 (실제 구현 시 .env 파일에 설정)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y';
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || 'test_ck_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y';
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

/**
 * 결제 요청 정보 생성 API
 * 프론트엔드에서 결제 요청 시 필요한 정보를 반환합니다.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 주문 ID 생성 (실제 구현 시 DB에 저장)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // 결제 정보
    const paymentInfo = {
      clientKey: TOSS_CLIENT_KEY,
      amount: 10000, // $10 (원화로 10,000원)
      orderId,
      orderName: 'SearchYoutube 프리미엄 구독',
      customerName: session.user.name || session.user.email,
      successUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
      failUrl: `${process.env.NEXTAUTH_URL}/payment/fail`,
    };
    
    return NextResponse.json(paymentInfo);
  } catch (error) {
    console.error('결제 정보 생성 오류:', error);
    return NextResponse.json({ error: '결제 정보를 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 결제 승인 API
 * Toss Payments에서 결제 성공 후 호출되는 API입니다.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    const body = await req.json();
    const { paymentKey, orderId, amount } = body;
    
    // Toss Payments API 호출하여 결제 승인
    const response = await axios.post(
      `${TOSS_API_URL}/payments/${paymentKey}`,
      {
        orderId,
        amount,
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // 결제 승인 성공 시 구독 정보 업데이트
    if (response.status === 200) {
      // 구독 API 호출하여 프리미엄 상태로 업데이트
      const subscriptionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ action: 'activate' }),
      });
      
      if (!subscriptionResponse.ok) {
        throw new Error('구독 정보 업데이트에 실패했습니다.');
      }
      
      const subscriptionData = await subscriptionResponse.json();
      
      // 결제 정보 저장 (실제 구현 시 DB에 저장)
      const paymentData = {
        userId: session.user.id,
        paymentKey: paymentKey,
        orderId: orderId,
        amount: amount,
        status: 'success',
        paidAt: new Date().toISOString(),
        subscriptionId: subscriptionData.subscriptionId,
      };
      
      return NextResponse.json({
        success: true,
        payment: paymentData,
        subscription: subscriptionData,
      });
    }
    
    return NextResponse.json({ error: '결제 승인에 실패했습니다.' }, { status: 400 });
  } catch (error) {
    console.error('결제 승인 오류:', error);
    return NextResponse.json({ error: '결제를 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 