'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getChannelDetail, YouTubeChannelDetail } from '@/lib/youtube';
import ChannelDetail from '@/components/channel-detail';

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;
  
  const [channelDetail, setChannelDetail] = useState<YouTubeChannelDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchChannelDetail() {
      try {
        setLoading(true);
        const data = await getChannelDetail(channelId);
        setChannelDetail(data);
      } catch (err) {
        setError('채널 정보를 불러오는 중 오류가 발생했습니다.');
        console.error('채널 정보 불러오기 오류:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (channelId) {
      fetchChannelDetail();
    }
  }, [channelId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="icon icon-loading h-16 w-16 bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-full shadow-lg"></div>
      </div>
    );
  }
  
  if (error || !channelDetail) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100 p-6 text-center">
          <div className="icon icon-search h-16 w-16 text-pink-300 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">채널 정보를 찾을 수 없습니다</h3>
          <p className="text-gray-600 mb-4">{error || '요청하신 채널 정보를 불러올 수 없습니다.'}</p>
        </div>
      </div>
    );
  }
  
  return <ChannelDetail channelDetail={channelDetail} />;
} 