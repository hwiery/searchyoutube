'use client';

import React from 'react';
import SearchForm from '@/components/search-form';
import { useRouter } from 'next/navigation';

export default function HomeClient() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          YouTube 컨텐츠 검색
        </h1>
        <p className="text-center mb-12 text-lg">
          채널과 동영상의 상세 정보를 한눈에 확인하세요
        </p>
        <SearchForm onSearch={handleSearch} />
      </div>
    </main>
  );
} 