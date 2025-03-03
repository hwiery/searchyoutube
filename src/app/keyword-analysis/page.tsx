'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface KeywordAnalysis {
  score: number;
  level: 'low' | 'medium' | 'high';
  averageViews?: number;
  recentUploads?: number;
  recommendedKeywords?: Array<{ keyword: string; score: number }>;
  topVideos?: Array<{
    title: string;
    channelTitle: string;
    viewCount: string;
    publishedAt: string;
  }>;
  isPremium?: boolean;
}

export default function KeywordAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [keyword, setKeyword] = useState<string>('');
  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  
  // URL에서 키워드 가져오기
  useEffect(() => {
    const keywordParam = searchParams.get('keyword');
    if (keywordParam) {
      setKeyword(keywordParam);
      analyzeKeyword(keywordParam);
    }
  }, [searchParams]);
  
  // 키워드 분석 함수
  const analyzeKeyword = async (keywordToAnalyze: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 프리미엄 사용자인 경우 상세 분석 API 호출
      if (session?.user?.isPremium) {
        const response = await fetch('/api/keyword-competition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword: keywordToAnalyze }),
        });
        
        if (!response.ok) {
          throw new Error('키워드 분석에 실패했습니다.');
        }
        
        const data = await response.json();
        setAnalysis(data);
      } else {
        // 무료 사용자인 경우 기본 분석 API 호출
        const response = await fetch(`/api/keyword-competition?keyword=${encodeURIComponent(keywordToAnalyze)}`);
        
        if (!response.ok) {
          throw new Error('키워드 분석에 실패했습니다.');
        }
        
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (err: any) {
      setError(err.message || '키워드 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 키워드 분석 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/keyword-analysis?keyword=${encodeURIComponent(keyword)}`);
      analyzeKeyword(keyword);
    }
  };
  
  // 경쟁도 레벨에 따른 색상 클래스
  const getLevelColorClass = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return '';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">키워드 경쟁 분석</h1>
      
      {/* 키워드 입력 폼 */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="분석할 키워드 입력"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={isLoading}
          >
            {isLoading ? '분석 중...' : '분석 시작'}
          </button>
        </div>
      </form>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* 분석 결과 */}
      {analysis && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">키워드: "{keyword}"</h2>
          
          {/* 경쟁도 점수 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">경쟁도</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                <div
                  className={`h-4 rounded-full ${
                    analysis.level === 'low' ? 'bg-green-600' :
                    analysis.level === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${analysis.score}%` }}
                ></div>
              </div>
              <span className={`font-bold ${getLevelColorClass(analysis.level)}`}>
                {analysis.score}/100
              </span>
            </div>
            <p className={`mt-1 ${getLevelColorClass(analysis.level)}`}>
              {analysis.level === 'low' ? '낮음 (경쟁이 적음)' :
               analysis.level === 'medium' ? '중간 (적당한 경쟁)' : '높음 (경쟁이 치열함)'}
            </p>
          </div>
          
          {/* 프리미엄 사용자에게만 보이는 상세 정보 */}
          {analysis.isPremium ? (
            <>
              {/* 통계 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">상위 20개 영상 평균 조회수</h3>
                  <p className="text-2xl font-bold">{analysis.averageViews?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">최근 30일 내 업로드 수</h3>
                  <p className="text-2xl font-bold">{analysis.recentUploads}</p>
                </div>
              </div>
              
              {/* 추천 키워드 */}
              {analysis.recommendedKeywords && analysis.recommendedKeywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">추천 키워드</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.recommendedKeywords.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <Link
                            href={`/keyword-analysis?keyword=${encodeURIComponent(rec.keyword)}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {rec.keyword}
                          </Link>
                          <span className={`text-sm font-medium ${getLevelColorClass(
                            rec.score < 30 ? 'low' : rec.score < 70 ? 'medium' : 'high'
                          )}`}>
                            {rec.score}/100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 상위 영상 */}
              {analysis.topVideos && analysis.topVideos.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">상위 영상</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업로드 날짜</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analysis.topVideos.map((video, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{video.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{video.channelTitle}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseInt(video.viewCount).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(video.publishedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            // 무료 사용자에게 보이는 프리미엄 안내
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-2">프리미엄 기능 잠금</h3>
              <p className="text-gray-600 mb-4">
                상세 분석 정보, 추천 키워드, 상위 영상 정보를 보려면 프리미엄으로 업그레이드하세요.
              </p>
              <Link
                href="/price"
                className="inline-block px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                프리미엄으로 업그레이드
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* 프리미엄 모달 */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2">프리미엄 기능</h3>
            <p className="text-gray-600 mb-4">
              이 기능은 프리미엄 사용자만 이용할 수 있습니다. 지금 업그레이드하고 모든 기능을 이용해보세요.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
              <Link
                href="/price"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                업그레이드
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 