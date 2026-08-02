# Enterprise Home Experience Refactor V2 - SAFARA 90

## Overview & Architecture Audit

The Enterprise Home Experience Refactor V2 restores SAFARA 90's flagship single-page home experience to world-class standards (matching Sofascore, FotMob, and 365Scores) with native Arabic RTL support and dark theme aesthetics (`#080808` / `#080d16`).

---

## 1. Dependency Graph & Section Reorganization

The Homepage is composed of 12 distinct sections rendered in exact chronological order:

```
HomePage (App entry point)
└── PremiumLayout
    ├── PremiumHeader (Navigation, Search Modal, Notifications)
    └── HomePageRenderer (CMS Block Engine)
        ├── 1. Hero Featured Match (PremiumHeroSection)
        ├── 2. Live Matches (PremiumLiveMatchesList)
        ├── 3. Today's Matches (PremiumMatchesScheduleSection - Today)
        ├── 4. Upcoming Matches (PremiumUpcomingMatchesSection + Date Selector Strip)
        ├── 5. Latest Results (PremiumMatchesScheduleSection - Finished)
        ├── 6. Competitions (PremiumCompetitionsSection)
        ├── 7. Trending News (PremiumNewsSection)
        ├── 8. Featured Videos (PremiumVideosSection)
        ├── 9. Top Players (PremiumTopPlayersSection)
        ├── 10. Standings (PremiumStandingsPreview)
        ├── 11. Predictions (PremiumPredictionsSection)
        └── 12. Footer (PremiumFooter)
```

---

## 2. Match Card Enriched Features (Phase 5)

Each match card across Hero, Live, Today, Upcoming, and Results includes:
- **Club Logos**: High-resolution team crests.
- **Team Names**: Full and abbreviated Arabic team names.
- **Real-Time Score & Status**: Live minute counter with pulsing red status indicator.
- **Match Metadata**: Stadium location (الملعب), broadcast channel (القناة الناقلة), commentator (المعلق).
- **Probability Indicator**: Win prediction percentage bar (Home / Draw / Away).
- **Details Button**: Quick link to `/match/:id`.

---

## 3. Performance & Caching Guarantees (Phase 4)

- **Firestore Quota Safety**: Multi-layer client-side caching prevents repetitive `getDocs` calls on re-renders.
- **Lazy Loading**: `loading="lazy"` on team crests and video thumbnails.
- **Responsive Layout**: Validated against 320px, 360px, 390px, 412px, 768px, 1024px, and 1440px viewports without horizontal overflow or layout shift.
