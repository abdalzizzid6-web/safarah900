export interface PlayerStats {
  rating: number;
  passesCompleted: number;
  passesAttempted: number;
  duelsWon: number;
  duelsTotal: number;
  extraLabel1: string;
  extraValue1: string;
  extraLabel2: string;
  extraValue2: string;
}

export interface Player {
  number: number;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  subbedOut?: boolean;
  subbedIn?: boolean;
  subTime?: string;
  subPlayer?: string; // name of player swapped with
}

export interface TeamRoster {
  formation: string;
  players: Player[];
  substitutes: Player[];
}

export function generatePlayerStats(player: Player): PlayerStats {
  // Use a simple hash of player.name to make sure statistics are deterministic
  let hash = 0;
  for (let i = 0; i < player.name.length; i++) {
    hash = player.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const rating = Number((6.8 + (hash % 23) / 10).toFixed(1)); // 6.8 - 9.0

  const passesAttempted = 25 + (hash % 45); // 25 - 69
  const passPercent = 75 + (hash % 21); // 75% - 95%
  const passesCompleted = Math.round((passesAttempted * passPercent) / 100);

  const duelsTotal = 4 + (hash % 8); // 4 - 11
  const duelsWon = Math.round((duelsTotal * (55 + (hash % 36))) / 100);

  let extraLabel1 = "قطع كرات";
  let extraValue1 = `${2 + (hash % 5)}`;
  let extraLabel2 = "ركض (كم)";
  let extraValue2 = `${(9.5 + (hash % 30) / 10).toFixed(1)}`;

  if (player.position === 'GK') {
    extraLabel1 = "تصديات رائعة";
    extraValue1 = `${3 + (hash % 4)}`;
    extraLabel2 = "تشتيت بنجاح";
    extraValue2 = `${1 + (hash % 3)}`;
  } else if (player.position === 'DEF') {
    extraLabel1 = "تشتيت كرات";
    extraValue1 = `${4 + (hash % 6)}`;
    extraLabel2 = "اعتراض هجمات";
    extraValue2 = `${2 + (hash % 4)}`;
  } else if (player.position === 'MID') {
    extraLabel1 = "تمريرات مفتاحية";
    extraValue1 = `${2 + (hash % 4)}`;
    extraLabel2 = "نجاح الالتحامات";
    extraValue2 = `${60 + (hash % 30)}%`;
  } else if (player.position === 'FWD') {
    extraLabel1 = "على المرمى";
    const totalShots = 2 + (hash % 4);
    const onTarget = Math.max(1, totalShots - (hash % 3));
    extraValue1 = `${onTarget}/${totalShots}`;
    extraLabel2 = "مراوغات ناجحة";
    const totalDribbles = 3 + (hash % 5);
    const succDribbles = Math.max(1, totalDribbles - (hash % 3));
    extraValue2 = `${succDribbles}/${totalDribbles}`;
  }

  return {
    rating,
    passesCompleted,
    passesAttempted,
    duelsWon,
    duelsTotal,
    extraLabel1,
    extraValue1,
    extraLabel2,
    extraValue2
  };
}

export function mapTeamRoster(lineup: any): TeamRoster {
  if (!lineup) return { formation: '-', players: [], substitutes: [] };
  
  const mapPos = (pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    const p = String(pos || '').toUpperCase();
    if (p === 'G' || p === 'GK') return 'GK';
    if (p === 'D' || p === 'DEF') return 'DEF';
    if (p === 'M' || p === 'MID') return 'MID';
    if (p === 'F' || p === 'FWD' || p === 'ATT') return 'FWD';
    return 'MID';
  };

  return {
    formation: lineup.formation || '-',
    players: (lineup.startXI || []).map((p: any) => ({
      number: p.player?.number || 0,
      name: p.player?.name || '',
      position: mapPos(p.player?.pos)
    })),
    substitutes: (lineup.substitutes || []).map((p: any) => ({
      number: p.player?.number || 0,
      name: p.player?.name || '',
      position: mapPos(p.player?.pos)
    }))
  };
}
