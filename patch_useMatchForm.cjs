const fs = require('fs');
const file = '/app/applet/src/admin/matches/hooks/useMatchForm.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    homeTeamName: '',
    homeTeamLogo: '',
    awayTeamName: '',
    awayTeamLogo: '',
    leagueName: '',
    leagueLogo: '',`;

const replacement1 = `    homeTeamId: 'custom',
    homeTeamName: '',
    homeTeamLogo: '',
    awayTeamId: 'custom',
    awayTeamName: '',
    awayTeamLogo: '',
    leagueId: 'custom',
    leagueName: '',
    leagueLogo: '',`;

content = content.replace(target1, replacement1);

const target2 = `      homeTeamName: '',
      homeTeamLogo: '',
      awayTeamName: '',
      awayTeamLogo: '',
      leagueName: leagues[0]?.name || 'الدوري الإنجليزي الممتاز',
      leagueLogo: leagues[0]?.logo || 'https://media.api-sports.io/football/leagues/39.png',`;

const replacement2 = `      homeTeamId: 'custom',
      homeTeamName: '',
      homeTeamLogo: '',
      awayTeamId: 'custom',
      awayTeamName: '',
      awayTeamLogo: '',
      leagueId: 'custom',
      leagueName: leagues[0]?.name || 'الدوري الإنجليزي الممتاز',
      leagueLogo: leagues[0]?.logo || 'https://media.api-sports.io/football/leagues/39.png',`;

content = content.replace(target2, replacement2);

const target3 = `    setFormData({
      homeTeamName: typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam || '',
      homeTeamLogo: m.homeLogo || (typeof m.homeTeam === 'object' ? m.homeTeam?.logo : '') || '',
      awayTeamName: typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam || '',
      awayTeamLogo: m.awayLogo || (typeof m.awayTeam === 'object' ? m.awayTeam?.logo : '') || '',
      leagueName: typeof m.league === 'object' ? m.league?.name : m.league || 'الدوري الإنجليزي الممتاز',
      leagueLogo: m.leagueLogo || (typeof m.league === 'object' ? m.league?.logo : '') || 'https://media.api-sports.io/football/leagues/39.png',`;

const replacement3 = `    setFormData({
      homeTeamId: (m.homeTeamDetails?.id) || (typeof m.homeTeam === 'object' ? (m.homeTeam as any)?.id : null) || 'custom',
      homeTeamName: typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam || '',
      homeTeamLogo: m.homeLogo || (typeof m.homeTeam === 'object' ? m.homeTeam?.logo : '') || '',
      awayTeamId: (m.awayTeamDetails?.id) || (typeof m.awayTeam === 'object' ? (m.awayTeam as any)?.id : null) || 'custom',
      awayTeamName: typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam || '',
      awayTeamLogo: m.awayLogo || (typeof m.awayTeam === 'object' ? m.awayTeam?.logo : '') || '',
      leagueId: (typeof m.league === 'object' ? (m.league as any)?.id : null) || 'custom',
      leagueName: typeof m.league === 'object' ? m.league?.name : m.league || 'الدوري الإنجليزي الممتاز',
      leagueLogo: m.leagueLogo || (typeof m.league === 'object' ? m.league?.logo : '') || 'https://media.api-sports.io/football/leagues/39.png',`;

content = content.replace(target3, replacement3);

fs.writeFileSync(file, content);
console.log("Patched useMatchForm");
