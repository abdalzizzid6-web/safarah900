import { translationService } from '../services/translationService';

export const useTranslate = (name: string, type: 'team' | 'country' | 'league' | 'stadium'): string => {
  if (!name) return '';
  switch (type) {
    case 'team':
      return translationService.translateTeam(name);
    case 'country':
      return translationService.translateCountry(name);
    case 'league':
      return translationService.translateCompetition(name);
    case 'stadium':
      return translationService.translateStadium(name);
    default:
      return name;
  }
};
