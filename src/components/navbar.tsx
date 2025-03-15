'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // 검색 파라미터가 변경될 때 쿼리 상태 업데이트
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // 프로필 메뉴 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
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
              {/* 로고 이미지 (현재는 텍스트로 대체) */}
              {/* 나중에 로고 이미지가 준비되면 아래 주석을 해제하고 텍스트 부분을 주석 처리하세요 */}
              {/* <img src="/assets/logo.png" alt="SearchYoutube" className="h-8 w-auto mr-2" /> */}
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

          {/* 사용자 메뉴 */}
          <div className="flex items-center">
            {session ? (
              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 focus:outline-none group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-300 shadow-md p-0.5 bg-white group-hover:border-pink-400 transition-all duration-300">
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || '사용자'} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-pink-200 rounded-full">
                        <span className="text-pink-600 font-bold text-lg">
                          {session.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden lg:block group-hover:text-pink-600 transition-colors duration-300">
                    {session.user?.name || '사용자'}
                  </span>
                  <span className={`text-gray-600 transition-transform duration-300 ${isProfileMenuOpen ? 'transform rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {/* 프로필 드롭다운 메뉴 */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50 border border-pink-100 animate-fadeIn">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsProfileMenuOpen(false);
                        router.push('/profile');
                      }}
                    >
                      <div className="flex items-center">
                        <span className="icon icon-user mr-2 text-pink-400"></span>
                        내 프로필
                      </div>
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <span className="icon icon-logout mr-2 text-pink-400"></span>
                        로그아웃
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-red-400 to-pink-500 text-white hover:from-red-500 hover:to-pink-600 shadow-md transition-all duration-300"
              >
                로그인
              </Link>
            )}

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
          </div>
        </nav>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-pink-200 bg-white rounded-b-2xl shadow-lg animate-fadeIn">
            {/* 모바일 검색창 */}
            <div className="px-4 py-2">
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
            
            <div className="flex flex-col space-y-2 px-2 pb-3 mt-2">
              {session ? (
                <>
                  <Link 
                    href="/profile" 
                    className={`px-4 py-2 text-base font-medium ${
                      isActive('/profile') 
                        ? 'text-pink-600 font-semibold' 
                        : 'text-gray-700 hover:text-pink-500'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMenuOpen(false);
                      router.push('/profile');
                    }}
                  >
                    <div className="flex items-center">
                      <span className="icon icon-user mr-2 text-pink-400"></span>
                      내 프로필
                    </div>
                  </Link>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 text-base font-medium text-gray-700 hover:text-pink-500 text-left"
                  >
                    <div className="flex items-center">
                      <span className="icon icon-logout mr-2 text-pink-400"></span>
                      로그아웃
                    </div>
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/signin" 
                  className="px-4 py-2 rounded-full text-base font-medium bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 