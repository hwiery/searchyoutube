export interface UserSubscription {
  isPremium: boolean;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionId?: string;
  paymentMethod?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  subscription: UserSubscription;
}

export type SubscriptionPlan = 'free' | 'premium';

export interface PlanFeature {
  name: string;
  free: boolean;
  premium: boolean;
  description?: string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    name: '검색 횟수',
    free: true,
    premium: true,
    description: '제한 없음'
  },
  {
    name: '검색 결과 출력',
    free: true,
    premium: true,
    description: '무료: 최대 10개, 프리미엄: 최대 50개'
  },
  {
    name: 'Excel 내보내기',
    free: false,
    premium: true,
    description: '검색 결과를 Excel 파일로 다운로드'
  },
  {
    name: '결과 출력 개수 선택',
    free: false,
    premium: true,
    description: '30개 또는 50개 선택 가능'
  }
]; 