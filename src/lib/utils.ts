import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 숫자를 읽기 쉬운 형식으로 변환합니다 (예: 1000 -> 1K, 1000000 -> 1M)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * ISO 날짜 문자열을 한국어 형식으로 변환합니다
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'yyyy-MM-dd', { locale: ko });
  } catch (error) {
    // 날짜 파싱 오류 처리
    console.error('날짜 형식 오류:', dateString);
    return '날짜 없음';
  }
}

/**
 * 텍스트를 지정된 최대 길이로 자릅니다
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 두 날짜 사이의 일수를 계산합니다
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // 밀리초 단위의 하루
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
}

/**
 * 성장률을 계산합니다 (현재값과 이전값 기준)
 */
export function calculateGrowthRate(current: number, previous: number): string {
  if (previous === 0) return '∞%';
  const rate = ((current - previous) / previous) * 100;
  return rate.toFixed(2) + '%';
}

export function formatDuration(duration: string): string {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return '0:00';
  
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 