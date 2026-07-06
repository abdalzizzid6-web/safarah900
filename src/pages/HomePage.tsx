import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SEO from '../components/SEO';
import InstallFloatingWidget from '../components/InstallFloatingWidget';
import PullToRefresh from '../components/ui/PullToRefresh';
import PremiumHomePage from '../premium/screens/PremiumHomePage';

export default function HomePage() {
  const queryClient = useQueryClient();

  const handlePullToRefresh = async () => {
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['wcMatches'] }),
        queryClient.refetchQueries({ queryKey: ['latestNews'] }),
        queryClient.refetchQueries({ queryKey: ['liveMatchesV2'] }),
        queryClient.refetchQueries({ queryKey: ['fixturesV2'] }),
        queryClient.refetchQueries({ queryKey: ['fixtures'] })
      ]);
    } catch (err) {
      console.error("[HomePage] Error refetching layout streams:", err);
    }
  };

  return (
    <div className="bg-[#080808] font-sans" dir="rtl">
      <SEO 
        title="Safara 90 | مباريات اليوم، نتائج فورية، وأخبار كرة القدم" 
        description="Safara 90 - بوابتك الرياضية الأولى لمتابعة مباريات اليوم، نتائج المباريات الحية، أخبار المنتخبات، وتقارير كأس العالم."
      />
      <InstallFloatingWidget />
      <PullToRefresh onRefresh={handlePullToRefresh}>
        <PremiumHomePage />
      </PullToRefresh>
    </div>
  );
}

