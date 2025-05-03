import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { YouTubeSearchResult } from '@/lib/youtube';
import { saveDownloadLog } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const results: YouTubeSearchResult[] = data.results;

    // 엑셀 데이터 생성
    const excelData = results.map(result => ({
      '제목': result.title,
      '채널명': result.channelTitle,
      '조회수': result.viewCount,
      '좋아요': result.likeCount,
      '댓글수': result.commentCount,
      '구독자수': result.subscriberCount || 0,
      '업로드일': new Date(result.publishedAt).toLocaleDateString(),
      '영상길이': result.duration,
      '영상형식': result.videoFormat || 'long',
      '설명': result.description
    }));

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    const colWidths = [
      { wch: 50 }, // 제목
      { wch: 30 }, // 채널명
      { wch: 15 }, // 조회수
      { wch: 15 }, // 좋아요
      { wch: 15 }, // 댓글수
      { wch: 15 }, // 구독자수
      { wch: 15 }, // 업로드일
      { wch: 15 }, // 영상길이
      { wch: 15 }, // 영상형식
      { wch: 100 } // 설명
    ];
    ws['!cols'] = colWidths;

    // 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '검색결과');

    // 엑셀 파일 생성
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename=youtube_search_results.xlsx');

    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('엑셀 내보내기 오류:', error);
    return NextResponse.json(
      { error: '엑셀 파일 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 