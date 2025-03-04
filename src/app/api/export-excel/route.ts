import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { YouTubeSearchResult } from '@/lib/youtube';
import { saveDownloadLog } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    
    // 인증 확인
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    // 프리미엄 사용자 확인
    if (!session.user.isPremium) {
      return NextResponse.json(
        { error: '프리미엄 사용자만 이용 가능한 기능입니다.' },
        { status: 403 }
      );
    }
    
    // 요청 데이터 파싱
    const { results, keyword } = await req.json();
    
    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다.' },
        { status: 400 }
      );
    }
    
    // 로그 저장
    if (session.user.id) {
      await saveDownloadLog(session.user.id, keyword || '알 수 없음', results.length);
    }
    
    // 엑셀 데이터 생성
    const excelData = results.map((result: YouTubeSearchResult) => ({
      '제목': result.title,
      '채널명': result.channelTitle,
      '조회수': result.viewCount,
      '좋아요': result.likeCount,
      '댓글수': result.commentCount,
      '업로드 날짜': new Date(result.publishedAt).toLocaleDateString('ko-KR'),
      '영상 길이': result.duration,
      '설명': result.description?.substring(0, 100) + (result.description && result.description.length > 100 ? '...' : ''),
      '태그': result.tags?.join(', ') || '',
      '카테고리': result.categoryId,
      '영상 URL': `https://www.youtube.com/watch?v=${result.videoId}`,
      '채널 URL': `https://www.youtube.com/channel/${result.channelId}`
    }));
    
    // 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '검색 결과');
    
    // 열 너비 설정
    const columnWidths = [
      { wch: 40 }, // 제목
      { wch: 20 }, // 채널명
      { wch: 10 }, // 조회수
      { wch: 10 }, // 좋아요
      { wch: 10 }, // 댓글수
      { wch: 15 }, // 업로드 날짜
      { wch: 10 }, // 영상 길이
      { wch: 50 }, // 설명
      { wch: 30 }, // 태그
      { wch: 15 }, // 카테고리
      { wch: 30 }, // 영상 URL
      { wch: 30 }  // 채널 URL
    ];
    worksheet['!cols'] = columnWidths;
    
    // 엑셀 파일 생성
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // 응답 반환
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="search_results_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    return NextResponse.json(
      { error: '엑셀 파일 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 