import { useState } from 'react';
import { WCMatch, WCTeam } from '../../../services/worldCupService';

export function useWorldCupForm() {
  const [editingMatch, setEditingMatch] = useState<WCMatch | null>(null);
  const [matchOverrideForm, setMatchOverrideForm] = useState({
    homeScore: 0,
    awayScore: 0,
    status: 'SCHEDULED',
    elapsed: 0,
    matchName: '',
    homeTeamName: '',
    awayTeamName: '',
    homeTeamCrest: '',
    awayTeamCrest: '',
    utcDate: '',
    matchDescription: '',
    matchImage: '',
    competitionName: '',
    venue: '',
    referee: '',
    broadcastingChannels: ''
  });

  const [matchSearchTerm, setMatchSearchTerm] = useState('');

  const [editingTeam, setEditingTeam] = useState<WCTeam | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', coach: '', ranking: 50, history: '' });

  const [newArticle, setNewArticle] = useState({ title: '', summary: '', content: '', image: '', author: 'ناشر البطولة' });

  const [newStream, setNewStream] = useState({
    matchId: '',
    channelName: '',
    primaryStream: '',
    backupStream: '',
    streamQuality: 'FHD',
    streamNotes: '',
    isActive: true
  });
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [customSyncUrl, setCustomSyncUrl] = useState('');

  const handleEditMatchClick = (m: any) => {
    setEditingMatch(m);
    setMatchOverrideForm({
      homeScore: m.score?.fullTime?.home !== null ? Number(m.score?.fullTime?.home) : 0,
      awayScore: m.score?.fullTime?.away !== null ? Number(m.score?.fullTime?.away) : 0,
      status: m.status || 'SCHEDULED',
      elapsed: m.elapsed || 90,
      matchName: m.matchName || '',
      homeTeamName: m.homeTeam?.name || '',
      awayTeamName: m.awayTeam?.name || '',
      homeTeamCrest: m.homeTeam?.crest || '',
      awayTeamCrest: m.awayTeam?.crest || '',
      utcDate: m.utcDate ? m.utcDate.slice(0, 16) : '',
      matchDescription: m.matchDescription || '',
      matchImage: m.matchImage || '',
      competitionName: m.competition?.name || m.stage || '',
      venue: m.venue || '',
      referee: (m.referees && m.referees.length > 0) ? m.referees[0].name : '',
      broadcastingChannels: m.broadcastingChannels || ''
    });
  };

  const handleEditTeamClick = (t: WCTeam) => {
    setEditingTeam(t);
    setTeamForm({
      name: t.name || '',
      coach: t.coach || '',
      ranking: t.ranking || 50,
      history: t.history || ''
    });
  };

  const handleEditStreamClick = (stream: any) => {
    setEditingStreamId(stream.id);
    setNewStream({
      matchId: stream.matchId || '',
      channelName: stream.channelName || '',
      primaryStream: stream.primaryStream || '',
      backupStream: stream.backupStream || '',
      streamQuality: stream.streamQuality || 'FHD',
      streamNotes: stream.streamNotes || '',
      isActive: stream.isActive !== undefined ? stream.isActive : true
    });
  };

  return {
    editingMatch, setEditingMatch,
    matchOverrideForm, setMatchOverrideForm,
    handleEditMatchClick,
    
    matchSearchTerm, setMatchSearchTerm,
    
    editingTeam, setEditingTeam,
    teamForm, setTeamForm,
    handleEditTeamClick,

    newArticle, setNewArticle,

    newStream, setNewStream,
    editingStreamId, setEditingStreamId,
    handleEditStreamClick,

    customSyncUrl, setCustomSyncUrl
  };
}
