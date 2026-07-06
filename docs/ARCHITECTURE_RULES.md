# ARCHITECTURE_RULES.md

## 1. MANDATORY RULES

- **Data Access:** No `fetch` or `axios` inside React Components. All API interaction MUST occur within Repository layers using `apiClient`.
- **Infrastructure Coupling:** No `import` of `firebase/firestore` inside Pages or Components. All Firestore operations MUST be abstracted within Repositories.
- **Repository Pattern:** New data access logic MUST extend `BaseRepository` from `/src/core/repository/BaseRepository.ts`.
- **Data Fetching:** No manual `useEffect` fetching. All data fetching MUST use React Query.
- **State Management:** No manual React Context creation for data management (e.g., global state). Use React Query for server state.
- **Layer Directionality:** 
  Component -> Hook -> Repository -> Core (API Client / Firebase Client)
  *NEVER reverse this flow.*

## 2. VIOLATIONS
- Any violation of these rules in new code will be considered a critical technical debt and must be blocked during code review.
