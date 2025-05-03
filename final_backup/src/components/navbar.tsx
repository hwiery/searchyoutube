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
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 브랜드 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-800">유튜브 검색</span>
            </Link>
          </div>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              홈
            </Link>
            <Link 
              href="/search" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/search') 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              검색
            </Link>
            {session ? (
              <>
                <Link 
                  href="/profile" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/profile') 
                      ? 'text-red-600 bg-red-50' 
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  내 프로필
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                >
                  로그아웃
                </button>
                {session.user?.image && (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || '사용자'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </>
            ) : (
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                로그인
              </Link>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-gray-700 hover:text-red-600 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <div className="flex flex-col space-y-2 px-2 pb-3">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/') 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                홈
              </Link>
              <Link 
                href="/search" 
                className={`px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/search') 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                검색
              </Link>
              {session ? (
                <>
                  <Link 
                    href="/profile" 
                    className={`px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/profile') 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
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
                    className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 text-left"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/signin" 
                  className="px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 