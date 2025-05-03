'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);

  // 검색 파라미터가 변경될 때 쿼리 상태 업데이트
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    
    // 검색 페이지로 이동 후 로딩 상태 해제
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <header className="w-full bg-gradient-to-r from-pink-100 to-purple-100 shadow-lg sticky top-0 z-50 border-b border-pink-200">
      <div className="container mx-auto">
        <nav className="flex flex-row justify-between items-center h-16 px-4 w-full">
          {/* 로고 및 브랜드 */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600 mr-2">
                SearchYoutube
              </span>
              <span className="icon icon-heart text-red-500"></span>
            </Link>
          </div>

          {/* 검색창 */}
          <div className="flex-1 mx-4 hidden md:flex">
            <div className="flex items-center w-full max-w-3xl mx-auto">
              <div className="flex items-center w-full bg-white rounded-full overflow-hidden border border-pink-200 shadow-md hover:shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-pink-100 focus-within:border-pink-400">
                <div className="pl-4 pr-2 text-pink-400 flex items-center">
                  <span className="icon icon-search"></span>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="YouTube 채널 또는 비디오 검색..."
                  className="flex-grow px-3 py-2 focus:outline-none text-gray-700 text-sm bg-transparent"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === 'Enter' && query.trim() && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-4 py-2 transition-all duration-300 flex items-center justify-center min-w-[70px] font-medium"
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="icon icon-loading mr-1"></span>
                      검색 중...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      검색
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center ml-3">
            <button 
              onClick={toggleMenu}
              className="text-gray-700 hover:text-pink-500 focus:outline-none transition-colors duration-300 p-2 bg-white rounded-full shadow-md border border-pink-100"
              aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            >
              <span className={`icon ${isMenuOpen ? 'icon-close' : 'icon-menu'}`}></span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
} 