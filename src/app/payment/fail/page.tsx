'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message') || '결제 처리 중 오류가 발생했습니다.';

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-red-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">결제 실패</h2>
          <p className="text-red-600 mb-4">{message}</p>
          {code && (
            <p className="text-sm text-gray-500 mb-4">오류 코드: {code}</p>
          )}
        </div>
        <div className="flex justify-center space-x-3">
          <Link
            href="/price"
            className="px-4 py-2 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-lg hover:from-red-500 hover:to-pink-600"
          >
            다시 시도
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
} 