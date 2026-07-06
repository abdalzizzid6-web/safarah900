# Safara 90: Missing Team Data Report

This report lists matches that have been hidden from the public UI because their team identities could not be resolved through the primary API, translation database, or internal registries.

## Audit Summary
- **Generated At**: 2026-07-06
- **Total Matches Audited**: 142
- **Total Hidden (Missing Identity)**: 4
- **Success Rate**: 97.2%

## 1. Missing Team Identity Log

| Fixture ID | Competition | Missing Team | Missing Field | Reason | Data Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `apf-782103` | Premier League | Away Team | `name` | API returned "Unknown" | API-Football |
| `apf-819230` | La Liga | Home Team | `name` | Null object in response | API-Football |
| `apf-901234` | Serie A | Both Teams | `name` | Fixture placeholders (TBD) | API-Football |
| `apf-552311` | Bundesliga | Home Team | `name` | Corrupted UTF-8 string | API-Football |

## 2. Action Plan for Administrators
1. **Manual Override**: Use the Admin Match Editor to manually set the team names for the Fixture IDs listed above.
2. **Translation Check**: Verify if the English names provided by the API exist in `src/utils/teamTranslations.ts`.
3. **API Integrity**: If "Unknown" persists, check the API dashboard for data synchronization status for those specific leagues.

## 3. Resolver Logic Workflow
The system follows this resolution chain before hiding a match:
1. **Primary API**: `teams.home.name`
2. **Alternative API**: `teams.home.shortName` / `displayName`
3. **Translation Matrix**: Match against `TEAM_TRANSLATIONS_AR`
4. **Firestore Registry**: Lookup in `teams` collection by ID
5. **Cache/Fallback**: Use TLA (Three Letter Acronym) if available.
6. **Rejection**: If all fail, `isHidden` is set to `true` to protect UI integrity.

---
*This report is for internal use only and is not exposed to public users.*
