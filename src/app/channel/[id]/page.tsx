import ChannelDetail from '@/components/channel-detail';

interface ChannelPageProps {
  params: {
    id: string;
  };
}

export default function ChannelPage({ params }: ChannelPageProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <ChannelDetail channelId={params.id} />
    </main>
  );
} 