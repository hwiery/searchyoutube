'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserSubscription } from '@/types/user';

interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

interface UserProfile {
  name: string;
  email: string;
  image?: string;
  searchCount: number;
  memberSince: string;
  subscription: UserSubscription;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    // 사용자 프로필 및 검색 기록 가져오기 (임시 데이터)
    if (status === 'authenticated' && session?.user) {
      // 구독 정보 가져오기
      fetch('/api/subscription')
        .then(res => {
          if (!res.ok) {
            throw new Error('구독 정보를 가져오는데 실패했습니다.');
          }
          return res.json();
        })
        .then(subscriptionData => {
          // 실제 구현에서는 API 호출로 대체
          setProfile({
            name: session.user.name || '사용자',
            email: session.user.email || '',
            image: session.user.image || '',
            searchCount: 42,
            memberSince: new Date().toISOString().split('T')[0],
            subscription: subscriptionData
          });
        })
        .catch(err => {
          console.error('구독 정보를 가져오는 중 오류 발생:', err);
          // 오류 발생 시 기본 구독 정보 사용
          setProfile({
            name: session.user.name || '사용자',
            email: session.user.email || '',
            image: session.user.image || '',
            searchCount: 42,
            memberSince: new Date().toISOString().split('T')[0],
            subscription: {
              isPremium: false,
              subscriptionStart: '',
              subscriptionEnd: ''
            }
          });
        });

      // 임시 검색 기록 데이터
      setSearchHistory([
        {
          id: '1',
          query: '프로그래밍 튜토리얼',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          resultCount: 15
        },
        {
          id: '2',
          query: 'React 강의',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          resultCount: 8
        },
        {
          id: '3',
          query: 'Next.js 프로젝트',
          timestamp: new Date().toISOString(),
          resultCount: 12
        }
      ]);

      setIsLoading(false);
    }
  }, [status, session, router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">내 프로필</h1>

      {profile && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-pink-100">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {profile.image && (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-pink-200">
                <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{profile.name}</h2>
              <p className="text-gray-600 mb-4">{profile.email}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500">가입일</p>
                  <p className="font-medium">{formatDate(profile.memberSince)}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500">총 검색 횟수</p>
                  <p className="font-medium">{profile.searchCount}회</p>
                </div>
              </div>
              
              {/* 구독 정보 섹션 */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-100 mb-6">
                <h3 className="text-lg font-semibold mb-3">구독 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">멤버십 상태</p>
                    <p className="font-medium">
                      {profile.subscription.isPremium ? (
                        <span className="text-pink-600 font-bold">프리미엄</span>
                      ) : (
                        <span>무료</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">검색 결과 출력</p>
                    <p className="font-medium">
                      {profile.subscription.isPremium ? '최대 50개' : '최대 10개'}
                    </p>
                  </div>
                  
                  {profile.subscription.isPremium && (
                    <>
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">구독 시작일</p>
                        <p className="font-medium">{formatDate(profile.subscription.subscriptionStart || '')}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">구독 만료일</p>
                        <p className="font-medium">{formatDate(profile.subscription.subscriptionEnd || '')}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {!profile.subscription.isPremium ? (
                  <div className="mt-4">
                    <Link 
                      href="/price" 
                      className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 inline-block"
                    >
                      프리미엄으로 업그레이드
                    </Link>
                    <p className="text-sm text-gray-600 mt-2">
                      프리미엄 멤버십으로 업그레이드하여 더 많은 검색 결과와 Excel 내보내기 기능을 이용하세요.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">프리미엄 혜택</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>검색 결과 최대 50개 출력</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Excel 데이터 내보내기</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>결과 출력 개수 선택 (30/50개)</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6 border border-pink-100">
        <h2 className="text-xl font-semibold mb-4">최근 검색 기록</h2>
        
        {searchHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">검색어</th>
                  <th className="px-4 py-2 text-left">검색 날짜</th>
                  <th className="px-4 py-2 text-left">결과 수</th>
                  <th className="px-4 py-2 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {searchHistory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{item.query}</td>
                    <td className="px-4 py-3">{formatDate(item.timestamp)}</td>
                    <td className="px-4 py-3">{item.resultCount}개</td>
                    <td className="px-4 py-3">
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}`)}
                      >
                        다시 검색
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 py-4 text-center">검색 기록이 없습니다.</p>
        )}
      </div>
    </div>
  );
} 