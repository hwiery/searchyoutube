'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserSubscription } from '@/types/user';

export default function PricePage() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  
  // 구독 정보 가져오기
  useEffect(() => {
    if (session) {
      fetch('/api/subscription')
        .then(res => {
          if (!res.ok) {
            throw new Error('구독 정보를 가져오는데 실패했습니다.');
          }
          return res.json();
        })
        .then(data => {
          setSubscription(data);
          setSelectedPlan(data.isPremium ? 'premium' : 'free');
        })
        .catch(err => console.error('구독 정보를 가져오는 중 오류 발생:', err));
    }
  }, [session]);
  
  // 결제 처리 함수 (실제 구현은 Stripe 등의 결제 서비스와 연동 필요)
  const handlePayment = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 결제 정보 요청
      const response = await fetch('/api/payment');
      
      if (!response.ok) {
        throw new Error('결제 정보를 가져오는데 실패했습니다.');
      }
      
      const paymentInfo = await response.json();
      
      // Toss Payments SDK 로드
      const loadTossPayments = async () => {
        // @ts-ignore
        if (window.TossPayments) {
          // @ts-ignore
          return window.TossPayments;
        }
        
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://js.tosspayments.com/v1/payment-widget';
          script.onload = () => {
            // @ts-ignore
            resolve(window.TossPayments);
          };
          document.body.appendChild(script);
        });
      };
      
      // Toss Payments SDK 초기화
      // @ts-ignore
      const TossPayments = await loadTossPayments();
      // @ts-ignore
      const tossPayments = new TossPayments(paymentInfo.clientKey);
      
      // 결제 요청
      tossPayments.requestPayment('카드', {
        amount: paymentInfo.amount,
        orderId: paymentInfo.orderId,
        orderName: paymentInfo.orderName,
        customerName: paymentInfo.customerName,
        successUrl: paymentInfo.successUrl,
        failUrl: paymentInfo.failUrl,
      });
    } catch (error) {
      console.error('결제 오류:', error);
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 구독 취소 함수
  const handleCancelSubscription = async () => {
    if (!session || !subscription?.isPremium) return;
    
    if (!confirm('정말로 구독을 취소하시겠습니까?')) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });
      
      if (!response.ok) {
        throw new Error('구독 취소에 실패했습니다.');
      }
      
      const data = await response.json();
      setSubscription(data);
      setSelectedPlan('free');
      alert('구독이 취소되었습니다.');
    } catch (error) {
      console.error('구독 취소 오류:', error);
      alert('구독 취소 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600">
            SearchYoutube
          </span> 요금제
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          YouTube 채널과 동영상을 더 효과적으로 검색하고 분석하세요. 
          필요에 맞는 요금제를 선택하여 더 많은 기능을 활용하세요.
        </p>
      </div>
      
      {/* 현재 구독 상태 */}
      {subscription && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-pink-100 max-w-3xl mx-auto mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">현재 구독 상태</h3>
          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-2 ${subscription.isPremium ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">{subscription.isPremium ? '프리미엄' : '무료'}</span>
          </div>
          
          {subscription.isPremium && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">구독 시작일:</span> {new Date(subscription.subscriptionStart || '').toLocaleDateString('ko-KR')}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">구독 만료일:</span> {new Date(subscription.subscriptionEnd || '').toLocaleDateString('ko-KR')}
              </p>
            </div>
          )}
          
          {subscription.isPremium && (
            <button 
              onClick={handleCancelSubscription}
              disabled={isLoading}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              구독 취소
            </button>
          )}
        </div>
      )}
      
      {/* 요금제 선택 */}
      <div className="flex flex-col md:flex-row gap-8 justify-center mb-12">
        {/* 무료 요금제 */}
        <div 
          className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 w-full md:w-96 flex flex-col ${
            selectedPlan === 'free' ? 'border-pink-400 transform scale-105' : 'border-gray-200 hover:border-pink-200'
          }`}
          onClick={() => setSelectedPlan('free')}
        >
          <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">무료 플랜</h2>
            <p className="text-gray-600">기본 검색 기능</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-800">₩0</span>
              <span className="text-gray-500 ml-1">/월</span>
            </div>
          </div>
          <div className="p-6 flex-grow">
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>검색 횟수 제한 없음</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>검색 결과 최대 10개 출력</span>
              </li>
              <li className="flex items-start text-gray-400">
                <span className="text-red-400 mr-2">✗</span>
                <span>Excel 데이터 내보내기</span>
              </li>
              <li className="flex items-start text-gray-400">
                <span className="text-red-400 mr-2">✗</span>
                <span>검색 결과 30/50개 출력</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-gray-50">
            <button 
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors duration-300"
              onClick={() => setSelectedPlan('free')}
              disabled={subscription?.isPremium === false}
            >
              {subscription?.isPremium === false ? '현재 플랜' : '무료 플랜 선택'}
            </button>
          </div>
        </div>
        
        {/* 프리미엄 요금제 */}
        <div 
          className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 w-full md:w-96 flex flex-col ${
            selectedPlan === 'premium' ? 'border-pink-400 transform scale-105' : 'border-gray-200 hover:border-pink-200'
          }`}
          onClick={() => setSelectedPlan('premium')}
        >
          <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-pink-500 text-white px-4 py-1 transform rotate-45 translate-x-2 translate-y-3 text-xs font-bold">
              인기
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">프리미엄 플랜</h2>
            <p className="text-gray-600">고급 검색 및 분석 기능</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-800">$10</span>
              <span className="text-gray-500 ml-1">/월</span>
            </div>
          </div>
          <div className="p-6 flex-grow">
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>검색 횟수 제한 없음</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>검색 결과 최대 50개 출력 (30/50 선택 가능)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Excel 데이터 내보내기</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>우선 기술 지원</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-gray-50">
            <button 
              className={`w-full py-2 px-4 rounded-full font-medium transition-colors duration-300 ${
                subscription?.isPremium 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white'
              }`}
              onClick={subscription?.isPremium ? undefined : handlePayment}
              disabled={isLoading || subscription?.isPremium}
            >
              {isLoading ? '처리 중...' : subscription?.isPremium ? '현재 플랜' : '프리미엄 시작하기'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 결제 정보 */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-pink-100 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">결제 정보</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">결제 방법</h4>
            <p className="text-gray-600">
              현재 Stripe를 통한 신용카드 결제를 지원하고 있습니다. 모든 결제는 안전하게 처리됩니다.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">환불 정책</h4>
            <p className="text-gray-600">
              구독 시작 후 7일 이내에 요청하시면 전액 환불해 드립니다. 환불 요청은 이메일(support@searchyoutube.com)로 문의해 주세요.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">자주 묻는 질문</h4>
            <div className="space-y-2">
              <div>
                <p className="text-gray-700 font-medium">Q: 구독은 언제 갱신되나요?</p>
                <p className="text-gray-600">A: 구독은 매월 자동으로 갱신됩니다. 언제든지 취소할 수 있습니다.</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Q: 프리미엄으로 업그레이드하면 어떤 이점이 있나요?</p>
                <p className="text-gray-600">A: 더 많은 검색 결과(최대 50개)를 볼 수 있고, Excel로 데이터를 내보낼 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 결제 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">프리미엄 구독 완료!</h3>
              <p className="text-gray-600 mb-4">
                프리미엄 구독이 성공적으로 활성화되었습니다. 이제 모든 프리미엄 기능을 이용하실 수 있습니다.
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/profile');
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-lg hover:from-red-500 hover:to-pink-600"
              >
                내 프로필로 이동
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 