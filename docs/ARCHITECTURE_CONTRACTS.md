# ARCHITECTURE_CONTRACTS.md

## 1. Repository Contract (`BaseRepository<T>`)
Every new repository MUST implement:
- `getAll(): Promise<T[]>`
- `getById(id: string): Promise<T | null>`
- MUST extend `BaseRepository`.
- Errors MUST be handled via `errorHandler`.
- Logging MUST be handled via `logger`.
- Cache policy MUST be implemented using `cacheManager`.

## 2. Hook Contract
- All hooks MUST use `@tanstack/react-query`.
- `staleTime` MUST be defined based on data type (e.g., Live Matches: 30s, News: 5m, Standings: 1h).
- `useEffect` for fetching is PROHIBITED.

## 3. Context Contract
- Only the following contexts are permitted:
    - `AuthContext`
    - `ThemeContext`
    - `LocalizationContext`
- Adding a new Context requires an architectural justification.
