# Feature Template Structure

New features should follow this structure:

/src/features/[FeatureName]/
  ├── components/      # Feature-specific UI components
  ├── hooks/           # React Query hooks
  ├── repository.ts    # Extends BaseRepository
  ├── types.ts         # Feature types/interfaces
  └── index.ts         # Public API for the feature
