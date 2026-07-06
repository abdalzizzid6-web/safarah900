
// Mapping three-letter FIFA codes to two-letter ISO country codes for SVG flags via FlagCDN
export const FIFA_TO_ISO2: Record<string, string> = {
  "ARG": "ar", "FRA": "fr", "BRA": "br", "CRO": "hr", "MAR": "ma", "KSA": "sa", "JPN": "jp", "ESP": "es",
  "ENG": "gb-eng", "GER": "de", "NED": "nl", "POR": "pt", "BEL": "be", "SUI": "ch", "DEN": "dk", "SEN": "sn",
  "KOR": "kr", "USA": "us", "URU": "uy", "MEX": "mx", "CMR": "cm", "ECU": "ec", "CAN": "ca", "AUS": "au",
  "IRN": "ir", "TUN": "tn", "POL": "pl", "CRC": "cr", "QAT": "qa", "WAL": "gb-wls", "GHA": "gh", "SRB": "rs",
  "SWE": "se", "ALG": "dz", "EGY": "eg", "IRQ": "iq", "UZB": "uz", "ITA": "it", "AUT": "at", "NGA": "ng",
  "CHI": "cl", "COL": "co", "UKR": "ua", "PER": "pe", "PAR": "py", "ROU": "ro", "IRL": "ie", "ANG": "ao",
  "NZL": "nz", "GUI": "gn", "MLI": "ml", "SCO": "gb-sct", "NIR": "gb-nir", "CIV": "ci", "CZE": "cz", "TOG": "tg",
  "TRI": "tt", "PARAGUAY": "py", "PRK": "kp", "SVK": "sk", "SVN": "si", "HON": "hn", "GRE": "gr", "BIH": "ba",
  "RUS": "ru", "ISL": "is", "PAN": "pa"
};

import { ARABIC_TEAM_NAMES as GLOBAL_ARABIC_NAMES } from '../utils/arabicTeamNames';

// Arabic translations for teams to ensure perfect design craftsmanship and consistency
export const ARABIC_TEAM_NAMES = GLOBAL_ARABIC_NAMES;

export const STAGE_TRANSLATIONS: Record<string, string> = {
  "GROUP_STAGE": "دور المجموعات",
  "LAST_16": "دور الـ16",
  "ROUND_OF_16": "دور الـ16",
  "QUARTER_FINALS": "ربع النهائي",
  "SEMI_FINALS": "نصف النهائي",
  "FINAL": "النهائي",
  "THIRD_PLACE": "المركز الثالث"
};

export const STATUS_TRANSLATIONS: Record<string, string> = {
  "SCHEDULED": "لم تبدأ",
  "TIMED": "مجدولة",
  "LIVE": "مباشر الآن",
  "IN_PLAY": "مباشرة الآن",
  "PAUSED": "استراحة بين الأشواط",
  "FINISHED": "انتهت",
  "FT": "انتهت",
  "POSTPONED": "مؤجلة",
  "SUSPENDED": "معلقة",
  "CANCELLED": "ملغاة"
};

export const GITHUB_RAW_BASE_WC = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master';
