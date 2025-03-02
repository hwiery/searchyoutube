'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const isActive = (path: string) => {
    return pathname === path;
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

          {/* 데스크톱 메뉴 - 중앙 정렬 */}
          <div className="hidden md:flex md:items-center md:justify-center md:flex-1 mx-4">
            <div className="flex space-x-4">
              <Link 
                href="/" 
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive('/') 
                    ? 'text-pink-600 font-semibold' 
                    : 'text-gray-700 hover:text-pink-500'
                }`}
              >
                홈
              </Link>
              <Link 
                href="/search" 
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive('/search') 
                    ? 'text-pink-600 font-semibold' 
                    : 'text-gray-700 hover:text-pink-500'
                }`}
              >
                검색
              </Link>
            </div>
          </div>

          {/* 사용자 메뉴 */}
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/profile" 
                  className={`hidden md:flex px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive('/profile') 
                      ? 'text-pink-600 font-semibold' 
                      : 'text-gray-700 hover:text-pink-500'
                  }`}
                >
                  내 프로필
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="hidden md:flex px-4 py-2 text-sm font-medium text-gray-700 hover:text-pink-500 transition-all duration-300"
                >
                  로그아웃
                </button>
                {session.user?.image && (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-300 shadow-md p-0.5 bg-white">
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || '사용자'} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                )}
                {session.user?.name && (
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">
                    {session.user.name}
                  </span>
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
          <div className="md:hidden py-3 border-t border-pink-200 bg-white rounded-b-2xl shadow-lg">
            <div className="flex flex-col space-y-2 px-2 pb-3">
              <Link 
                href="/" 
                className={`px-4 py-2 text-base font-medium ${
                  isActive('/') 
                    ? 'text-pink-600 font-semibold' 
                    : 'text-gray-700 hover:text-pink-500'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                홈
              </Link>
              <Link 
                href="/search" 
                className={`px-4 py-2 text-base font-medium ${
                  isActive('/search') 
                    ? 'text-pink-600 font-semibold' 
                    : 'text-gray-700 hover:text-pink-500'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                검색
              </Link>
              {session ? (
                <>
                  <Link 
                    href="/profile" 
                    className={`px-4 py-2 text-base font-medium ${
                      isActive('/profile') 
                        ? 'text-pink-600 font-semibold' 
                        : 'text-gray-700 hover:text-pink-500'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    내 프로필
                  </Link>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 text-base font-medium text-gray-700 hover:text-pink-500 text-left"
                  >
                    로그아웃
                  </button>
                  <div className="flex items-center space-x-3 px-4 py-2">
                    {session.user?.image && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-pink-300 shadow-sm">
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || '사용자'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {session.user?.name && (
                      <span className="text-sm font-medium text-gray-700">
                        {session.user.name}
                      </span>
                    )}
                  </div>
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