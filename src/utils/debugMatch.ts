/**
 * Utility for debugging Match objects and Firestore payloads
 */

import { Match } from '../types';

export const EXPECTED_FIRESTORE_FIELDS = [
  'id',
  'homeTeam',
  'awayTeam',
  'league',
  'startTime',
  'status',
  'isLive',
  'utcDate',
  'homeScore',
  'awayScore',
  'homeLogo',
  'awayLogo',
  'leagueLogo',
  'score',
  'homeTeamDetails',
  'awayTeamDetails',
  'leagueDetails',
  'commentator',
  'channel',
  'approved',
  'archived',
  'showOnHome',
  'showInLive',
  'showInSlider',
  'isFeatured',
  'isManual',
  'createdAt',
  'updatedAt'
];

/**
 * Validates a match object against expected fields and logs findings to console
 */
export function validateMatchPayload(payload: any, context: string = 'Save Match') {
  console.group(`🔍 Firestore Payload Diagnostic: ${context}`);
  
  const results = {
    valid: true,
    missingFields: [] as string[],
    extraFields: [] as string[],
    types: {} as Record<string, string>,
    criticalIssues: [] as string[]
  };

  // Check for critical identification fields
  if (!payload.homeTeam) results.criticalIssues.push('Missng homeTeam (Name or Object)');
  if (!payload.awayTeam) results.criticalIssues.push('Missing awayTeam (Name or Object)');
  if (!payload.startTime) results.criticalIssues.push('Missing startTime - this will fail home page filtering');

  // Check expected fields
  EXPECTED_FIRESTORE_FIELDS.forEach(field => {
    if (payload[field] === undefined) {
      results.missingFields.push(field);
    } else {
      results.types[field] = typeof payload[field];
    }
  });

  // Check for unhandled fields
  Object.keys(payload).forEach(key => {
    if (!EXPECTED_FIRESTORE_FIELDS.includes(key)) {
      results.extraFields.push(key);
    }
  });

  if (results.criticalIssues.length > 0) {
    results.valid = false;
    console.error('❌ Critical Schema Issues Found:', results.criticalIssues);
  }

  console.log('✅ Payload Content:', payload);
  console.log('📝 Missing Suggested Fields:', results.missingFields);
  console.log('⚠️ Unexpected Fields (May be ignored by Firestore):', results.extraFields);
  console.table(results.types);
  
  console.groupEnd();

  return results;
}
