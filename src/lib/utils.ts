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
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
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