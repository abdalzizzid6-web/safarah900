# FIRESTORE_AUDIT - Safara 90

## Overview
Audit of Firestore usage, structure, and security.

## Key Findings

### 1. Data Structure
The schema is complex, but the reliance on `allow read: if true` on many collections makes the structure implicitly exposed.

### 2. Usage Patterns
- Extensive use of `getDoc()` is good.
- Potential high-read count for matches/news if not properly cached at the client level.
- Need to monitor Firestore read/write quotas, especially with the `ai_match_predictions` collection which is frequently updated and queried.

### 3. Recommendations
- Implement stricter security rules immediately to follow the Principle of Least Privilege.
- Audit Firestore indexes (`firestore.indexes.json`).
