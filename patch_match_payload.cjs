const fs = require('fs');
const file = '/app/applet/src/admin/matches/dashboard/MatchesDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    const matchPayload: any = {
      isFeatured: formData.isFeatured,
      featuredPriority: Number(formData.featuredPriority) || 0,
      featuredPinned: formData.featuredPinned,
      featuredStartDate: parsedStartDate,
      featuredEndDate: parsedEndDate,
      featuredEnabled: formData.featuredEnabled,
      homeTeam: { name: formData.homeTeamName, logo: formData.homeTeamLogo || '' },
      awayTeam: { name: formData.awayTeamName, logo: formData.awayTeamLogo || '' },
      homeLogo: formData.homeTeamLogo || '',
      awayLogo: formData.awayTeamLogo || '',
      league: formData.leagueName,
      leagueLogo: formData.leagueLogo || '',
      leagueDetails: { id: 'manual', name: formData.leagueName, country: '', logo: formData.leagueLogo || '' },`;

const replacement = `    const matchPayload: any = {
      isFeatured: formData.isFeatured,
      featuredPriority: Number(formData.featuredPriority) || 0,
      featuredPinned: formData.featuredPinned,
      featuredStartDate: parsedStartDate,
      featuredEndDate: parsedEndDate,
      featuredEnabled: formData.featuredEnabled,
      homeTeam: { id: formData.homeTeamId, name: formData.homeTeamName, logo: formData.homeTeamLogo || '' },
      awayTeam: { id: formData.awayTeamId, name: formData.awayTeamName, logo: formData.awayTeamLogo || '' },
      homeLogo: formData.homeTeamLogo || '',
      awayLogo: formData.awayTeamLogo || '',
      homeTeamDetails: { id: formData.homeTeamId },
      awayTeamDetails: { id: formData.awayTeamId },
      league: formData.leagueName,
      leagueLogo: formData.leagueLogo || '',
      leagueDetails: { id: formData.leagueId || 'manual', name: formData.leagueName, country: '', logo: formData.leagueLogo || '' },`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log("Patched match payload");
