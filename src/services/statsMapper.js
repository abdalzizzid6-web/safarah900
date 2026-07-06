export function mapMatchStats(rawMatch) {
  if (!rawMatch || !rawMatch.statistics) return null;

  const rawStats = rawMatch.statistics || [];
  
  // Real stats only. No defaults.
  const possessionItem = rawStats.find(s => s.type === 'BALL_POSSESSION' || s.type === 'POSSESSION');
  const shotsItem = rawStats.find(s => s.type === 'TOTAL_ATTEMPTS' || s.type === 'SHOTS' || s.type === 'TOTAL_SHOTS');
  const onTargetItem = rawStats.find(s => s.type === 'SHOTS_ON_GOAL' || s.type === 'SHOTS_ON_TARGET');
  const cornersItem = rawStats.find(s => s.type === 'CORNER_KICKS' || s.type === 'CORNERS');
  const foulsItem = rawStats.find(s => s.type === 'FOULS' || s.type === 'FOULS_COMMITTED');
  const yellowItem = rawStats.find(s => s.type === 'YELLOW_CARDS');
  const redItem = rawStats.find(s => s.type === 'RED_CARDS');

  if (!possessionItem && !shotsItem && !onTargetItem && !cornersItem && !foulsItem && !yellowItem && !redItem) {
    return null;
  }

  return {
    possession: possessionItem ? { home: parseInt(possessionItem.home, 10), away: parseInt(possessionItem.away, 10), label: 'الاستحواذ على الكرة', suffix: '%' } : null,
    shots: shotsItem ? { home: parseInt(shotsItem.home, 10), away: parseInt(shotsItem.away, 10), label: 'إجمالي المحاولات (تسديدات)' } : null,
    shotsOnTarget: onTargetItem ? { home: parseInt(onTargetItem.home, 10), away: parseInt(onTargetItem.away, 10), label: 'تسديدات على المرمى' } : null,
    corners: cornersItem ? { home: parseInt(cornersItem.home, 10), away: parseInt(cornersItem.away, 10), label: 'الضربات الركنية' } : null,
    fouls: foulsItem ? { home: parseInt(foulsItem.home, 10), away: parseInt(foulsItem.away, 10), label: 'الأخطاء المرتكبة (فاول)' } : null,
    yellowCards: yellowItem ? { home: parseInt(yellowItem.home, 10), away: parseInt(yellowItem.away, 10), label: 'البطاقات الصفراء' } : null,
    redCards: redItem ? { home: parseInt(redItem.home, 10), away: parseInt(redItem.away, 10), label: 'البطاقات الحمراء' } : null
  };
}
