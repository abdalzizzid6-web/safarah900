# Safara 90: Match Rejection & Graceful Degradation Report

## 1. Overview
As per the updated directive, the validation logic has been shifted from a "Strict Zero-Placeholder" policy to a **Graceful Degradation Strategy**. This ensures maximum match visibility while maintaining professional UI standards through intelligent fallbacks.

## 2. Graceful Degradation Rules (Implemented)

| Feature | Primary Source | Fallback 1 | Fallback 2 | Fallback 3 |
| :--- | :--- | :--- | :--- | :--- |
| **Team Name** | API Primary Name | API Short Name / TLA | Translation DB | Generic "فريق" (Team) |
| **Team Logo** | API Official URL | Flag CDN (via TLA) | Translation Assets | Generated Initials Avatar |
| **Competition** | API Name | Translation DB | "بطولة غير متوفرة" | N/A |
| **Venue** | API Venue Name | "ملعب المباراة" | Empty String | N/A |

## 3. Rejection Criteria (When matches are HIDDEN)
Matches are now only hidden (`isHidden: true`) if they meet one of the following criteria of **Actual Data Corruption**:

1. **Missing Identifier**: The match object has no `id` (impossible to track or link).
2. **Missing Temporal Data**: No `utcDate`, `startTime`, or `date` provided (cannot be placed in a schedule).
3. **Corrupted Object**: The API response for the match is `null`, `undefined`, or an empty object that cannot be parsed.
4. **Explicit Administrative Hide**: The match has been manually marked as hidden in the Admin CMS.

## 4. Statistics (Projected)
- **Previous Rejection Rate**: ~15% (due to missing logos/translations).
- **New Rejection Rate**: <1% (only genuine technical errors).
- **Match Visibility**: Maximized to 100% of validly timed fixtures.

## 5. Conclusion
Data integrity is now preserved through **resilience** rather than **exclusion**. The UI handles missing assets gracefully using dynamic generators (UI-Avatars) and localized fallback labels, ensuring a rich content experience even when upstream data is incomplete.
