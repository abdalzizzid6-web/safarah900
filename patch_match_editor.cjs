const fs = require('fs');
const file = '/app/applet/src/admin/matches/components/MatchEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to inject fetching of teams and leagues
const importsToAdd = `import { ITeam } from '../../../core/api-management/models/team.model';
import { ILeague } from '../../../core/api-management/models/league.model';
import { apiManagementRepository } from '../../../core/api-management';
import { useEffect, useState } from 'react';
`;

content = content.replace("import React from 'react';", "import React from 'react';\n" + importsToAdd);

const hookToAdd = `  const [teams, setTeams] = useState<ITeam[]>([]);
  const [leagues, setLeagues] = useState<ILeague[]>([]);

  useEffect(() => {
    if (showMatchModal) {
      apiManagementRepository.teamRepository.getTeams().then(data => setTeams(data));
      apiManagementRepository.leagueRepository.getLeagues().then(data => setLeagues(data));
    }
  }, [showMatchModal]);

  const handleHomeTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setFormData({ ...formData, homeTeamId: team.id, homeTeamName: team.nameAR, homeTeamLogo: team.logo });
    } else {
      setFormData({ ...formData, homeTeamId: 'custom', homeTeamName: '', homeTeamLogo: '' });
    }
  };

  const handleAwayTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setFormData({ ...formData, awayTeamId: team.id, awayTeamName: team.nameAR, awayTeamLogo: team.logo });
    } else {
      setFormData({ ...formData, awayTeamId: 'custom', awayTeamName: '', awayTeamLogo: '' });
    }
  };

  const handleLeagueChange = (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    if (league) {
      setFormData({ ...formData, leagueId: league.id, leagueName: league.nameAR, leagueLogo: league.logo });
    } else {
      setFormData({ ...formData, leagueId: 'custom', leagueName: '', leagueLogo: '' });
    }
  };
`;

content = content.replace("const handleRecover = () => {", hookToAdd + "\n  const handleRecover = () => {");

const targetHomeTeam = `                    {/* Home Team */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded-full">الفريق المستضيف (Home)</span>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم النادي</label>
                        <input 
                          type="text"
                          required
                          placeholder="مثال: الهلال، ريال مدريد"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                          value={formData.homeTeamName || ''}
                          onChange={e => setFormData({ ...formData, homeTeamName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">رابط شعار النادي (URL)</label>
                        <input 
                          type="text"
                          placeholder="مثال: https://media.api-sports.io/football/teams/..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono"
                          value={formData.homeTeamLogo || ''}
                          onChange={e => setFormData({ ...formData, homeTeamLogo: e.target.value })}
                        />
                      </div>
                    </div>`;

const replacementHomeTeam = `                    {/* Home Team */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded-full">الفريق المستضيف (Home)</span>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اختيار الفريق</label>
                        <select 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold"
                          value={formData.homeTeamId || (teams.find(t => t.nameAR === formData.homeTeamName)?.id) || 'custom'}
                          onChange={e => handleHomeTeamChange(e.target.value)}
                        >
                          <option value="custom">-- فريق مخصص (Custom) --</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.nameAR}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم النادي</label>
                        <input 
                          type="text"
                          required
                          placeholder="مثال: الهلال، ريال مدريد"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                          value={formData.homeTeamName || ''}
                          onChange={e => setFormData({ ...formData, homeTeamName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">رابط شعار النادي (URL)</label>
                        <input 
                          type="text"
                          placeholder="مثال: https://media.api-sports.io/football/teams/..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono dir-ltr text-left"
                          value={formData.homeTeamLogo || ''}
                          onChange={e => setFormData({ ...formData, homeTeamLogo: e.target.value })}
                        />
                      </div>
                    </div>`;

content = content.replace(targetHomeTeam, replacementHomeTeam);


const targetAwayTeam = `                    {/* Away Team */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full">الفريق الضيف (Away)</span>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم النادي</label>
                        <input 
                          type="text"
                          required
                          placeholder="مثال: النصر، برشلونة"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                          value={formData.awayTeamName || ''}
                          onChange={e => setFormData({ ...formData, awayTeamName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">رابط شعار النادي (URL)</label>
                        <input 
                          type="text"
                          placeholder="مثال: https://media.api-sports.io/football/teams/..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono"
                          value={formData.awayTeamLogo || ''}
                          onChange={e => setFormData({ ...formData, awayTeamLogo: e.target.value })}
                        />
                      </div>
                    </div>`;

const replacementAwayTeam = `                    {/* Away Team */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full">الفريق الضيف (Away)</span>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اختيار الفريق</label>
                        <select 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold"
                          value={formData.awayTeamId || (teams.find(t => t.nameAR === formData.awayTeamName)?.id) || 'custom'}
                          onChange={e => handleAwayTeamChange(e.target.value)}
                        >
                          <option value="custom">-- فريق مخصص (Custom) --</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.nameAR}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم النادي</label>
                        <input 
                          type="text"
                          required
                          placeholder="مثال: النصر، برشلونة"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                          value={formData.awayTeamName || ''}
                          onChange={e => setFormData({ ...formData, awayTeamName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5">رابط شعار النادي (URL)</label>
                        <input 
                          type="text"
                          placeholder="مثال: https://media.api-sports.io/football/teams/..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono dir-ltr text-left"
                          value={formData.awayTeamLogo || ''}
                          onChange={e => setFormData({ ...formData, awayTeamLogo: e.target.value })}
                        />
                      </div>
                    </div>`;

content = content.replace(targetAwayTeam, replacementAwayTeam);


const targetLeague = `                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم البطولة / الدوري</label>
                      <input 
                        type="text"
                        required
                        placeholder="مثال: دوري أبطال أوروبا"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.leagueName || ''}
                        onChange={e => setFormData({ ...formData, leagueName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">شعار البطولة (Logo URL)</label>
                      <input 
                        type="text"
                        placeholder="رابط اللوجو"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono"
                        value={formData.leagueLogo || ''}
                        onChange={e => setFormData({ ...formData, leagueLogo: e.target.value })}
                      />
                    </div>`;

const replacementLeague = `                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">البطولة / الدوري</label>
                      <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold mb-2"
                        value={formData.leagueId || (leagues.find(l => l.nameAR === formData.leagueName)?.id) || 'custom'}
                        onChange={e => handleLeagueChange(e.target.value)}
                      >
                        <option value="custom">-- بطولة مخصصة (Custom) --</option>
                        {leagues.map(l => <option key={l.id} value={l.id}>{l.nameAR}</option>)}
                      </select>
                      <input 
                        type="text"
                        required
                        placeholder="اسم البطولة (يتم تعبئته تلقائياً)"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.leagueName || ''}
                        onChange={e => setFormData({ ...formData, leagueName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">شعار البطولة (Logo URL)</label>
                      <input 
                        type="text"
                        placeholder="رابط اللوجو"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono dir-ltr text-left"
                        value={formData.leagueLogo || ''}
                        onChange={e => setFormData({ ...formData, leagueLogo: e.target.value })}
                      />
                    </div>`;

content = content.replace(targetLeague, replacementLeague);

fs.writeFileSync(file, content);
console.log('Patched MatchEditor.tsx');
