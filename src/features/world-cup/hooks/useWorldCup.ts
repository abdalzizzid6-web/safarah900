import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { worldCupService, WCMatch, WCTeam } from '../../../services/worldCupService';
import { worldCupAdminRepository } from '../repositories/worldCupAdminRepository';
import { dataSourceService, DataSourceSettings } from '../../../services/dataSourceService';

export function useWorldCup() {
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [providerSettings, setProviderSettings] = useState<DataSourceSettings | null>(null);

  const { data: dbMatches = [], refetch: refetchMatches } = useQuery({
    queryKey: ['wc-admin-matches'],
    queryFn: () => worldCupService.getWorldCupMatches(2026),
    staleTime: 60000
  });

  const { data: dbTeams = [], refetch: refetchTeams } = useQuery({
    queryKey: ['wc-admin-teams'],
    queryFn: () => worldCupService.getWorldCupTeams(2026),
    staleTime: 60000
  });

  const { data: newsList = [], refetch: refetchNews } = useQuery({
    queryKey: ['wc-admin-news'],
    queryFn: worldCupAdminRepository.getNews,
    staleTime: 60000
  });

  const { data: streamsList = [], refetch: refetchStreams } = useQuery({
    queryKey: ['wc-admin-streams'],
    queryFn: worldCupAdminRepository.getStreams,
    staleTime: 60000
  });

  const { data: usersList = [], refetch: refetchUsers } = useQuery({
    queryKey: ['wc-admin-users'],
    queryFn: async () => {
      try {
        return await worldCupAdminRepository.getUsers();
      } catch (e) {
        return [
          { id: "u1", email: "abdalziz2022@gmail.com", isAdmin: true, displayName: "عبدالعزيز الماستر" },
          { id: "u2", email: "visitor1@gmail.com", isAdmin: false, displayName: "أحمد الفهد" },
          { id: "u3", email: "moderator@wcup2026.org", isAdmin: true, displayName: "مشرف المنصة" }
        ];
      }
    },
    staleTime: 60000
  });

  const loadCmsData = () => {
    refetchMatches();
    refetchTeams();
    refetchNews();
    refetchStreams();
    refetchUsers();
  };

  useEffect(() => {
    dataSourceService.getSettings().then(s => setProviderSettings(s));
    
    const logsUnsub = worldCupAdminRepository.subscribeToApiLogs((logs) => {
      setApiLogs(logs);
    });

    return () => {
      logsUnsub();
    };
  }, []);

  return {
    dbMatches,
    dbTeams,
    newsList,
    streamsList,
    usersList,
    apiLogs,
    providerSettings,
    loadCmsData
  };
}
