import { useState } from 'react';
import { Match } from '@/types';

export function useMatchForm(leagues: any[]) {
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [modalMatchId, setModalMatchId] = useState('');
  
  const [formData, setFormData] = useState({
    homeTeamName: '',
    homeTeamLogo: '',
    awayTeamName: '',
    awayTeamLogo: '',
    leagueName: '',
    leagueLogo: '',
    startTime: '',
    commentator: '',
    channel: '',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    streamUrl: '',
    streamLabel: 'سيرفر مجاني 1',
    youtubeLink: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    isFeatured: false,
    featuredPriority: 0,
    featuredPinned: false,
    featuredStartDate: '',
    featuredEndDate: '',
    featuredEnabled: true,
  });

  const handleStartAddMatch = () => {
    setModalType('add');
    setModalMatchId('');
    const today = new Date().toISOString().slice(0, 16);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    
    setFormData({
      homeTeamName: '',
      homeTeamLogo: '',
      awayTeamName: '',
      awayTeamLogo: '',
      leagueName: leagues[0]?.name || 'الدوري الإنجليزي الممتاز',
      leagueLogo: leagues[0]?.logo || 'https://media.api-sports.io/football/leagues/39.png',
      startTime: today,
      commentator: '',
      channel: '',
      status: 'UPCOMING',
      homeScore: 0,
      awayScore: 0,
      streamUrl: '',
      streamLabel: 'سيرفر مجاني 1',
      youtubeLink: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      isFeatured: false,
      featuredPriority: 0,
      featuredPinned: false,
      featuredStartDate: today,
      featuredEndDate: nextWeek,
      featuredEnabled: true,
    });
    setShowMatchModal(true);
  };

  const handleStartEditMatch = (m: Match) => {
    setModalType('edit');
    setModalMatchId(m.id);
    const existingUrl = m.streamingLinks?.[0]?.url || '';
    const existingLabel = m.streamingLinks?.[0]?.name || 'سيرفر مجاني 1';
    
    let formattedTime = '';
    if (m.startTime || m.utcDate) {
      try {
        const d = new Date(m.startTime || m.utcDate);
        const offset = d.getTimezoneOffset() * 60000;
        formattedTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
      } catch (e) {
        formattedTime = new Date().toISOString().slice(0, 16);
      }
    } else {
      formattedTime = new Date().toISOString().slice(0, 16);
    }

    const formatToInputTime = (isoString?: string) => {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
      } catch (e) {
        return '';
      }
    };

    setFormData({
      homeTeamName: typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam || '',
      homeTeamLogo: m.homeLogo || (typeof m.homeTeam === 'object' ? m.homeTeam?.logo : '') || '',
      awayTeamName: typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam || '',
      awayTeamLogo: m.awayLogo || (typeof m.awayTeam === 'object' ? m.awayTeam?.logo : '') || '',
      leagueName: typeof m.league === 'object' ? m.league?.name : m.league || 'الدوري الإنجليزي الممتاز',
      leagueLogo: m.leagueLogo || (typeof m.league === 'object' ? m.league?.logo : '') || 'https://media.api-sports.io/football/leagues/39.png',
      startTime: formattedTime,
      commentator: m.commentator || '',
      channel: m.channel || '',
      status: typeof m.status === 'object' ? ((m.status as any)?.short || 'NS') : m.status || 'UPCOMING',
      homeScore: m.homeScore ?? m.score?.home ?? 0,
      awayScore: m.awayScore ?? m.score?.away ?? 0,
      streamUrl: existingUrl,
      streamLabel: existingLabel,
      youtubeLink: m.youtubeLink || '',
      seoTitle: m.seo?.title || '',
      seoDescription: m.seo?.description || '',
      seoKeywords: m.seo?.keywords || '',
      isFeatured: m.isFeatured || false,
      featuredPriority: m.featuredPriority || 0,
      featuredPinned: m.featuredPinned || false,
      featuredStartDate: formatToInputTime(m.featuredStartDate) || new Date().toISOString().slice(0, 16),
      featuredEndDate: formatToInputTime(m.featuredEndDate) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      featuredEnabled: m.featuredEnabled !== false,
    });
    setShowMatchModal(true);
  };

  return {
    showMatchModal,
    setShowMatchModal,
    modalType,
    modalMatchId,
    formData,
    setFormData,
    handleStartAddMatch,
    handleStartEditMatch
  };
}
