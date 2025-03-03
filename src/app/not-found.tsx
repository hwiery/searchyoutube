'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';

// 실제 컨텐츠를 렌더링하는 컴포넌트
function NotFoundContent() {
  // 클라이언트 사이드에서만 렌더링되도록 상태 추가
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 서버 사이드 렌더링 중에는 최소한의 내용만 표시
  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-pink-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">페이지를 찾을 수 없습니다</h2>
        <p className="text-lg text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

// Suspense 경계를 포함한 메인 컴포넌트
export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <NotFoundContent />
    </Suspense>
  );
} 