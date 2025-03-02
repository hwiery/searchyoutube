import { Metadata } from 'next';
import HomeClient from '@/components/home-client';

export const metadata: Metadata = {
  title: 'YouTube 컨텐츠 검색',
  description: '유튜브 채널과 동영상을 상세하게 검색하고 분석하세요.',
};

export default function Home() {
  return <HomeClient />;
} 