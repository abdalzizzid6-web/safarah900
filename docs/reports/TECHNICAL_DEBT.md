# TECHNICAL_DEBT - Safara 90

## Overview
Significant technical debt identified in the server-side architecture and frontend monolith.

## Key Findings

### 1. Monolithic `server.ts` (Critical)
The `/server/index.ts` file is a massive monolith containing:
- Route definitions
- Middlewares
- SEO enhancements
- Firestore cache orchestration
- Job definitions
- AI Service orchestration
- Static asset handling

This file is a major bottleneck for maintainability, testing, and scaling.

### 2. Frontend Structure
While modularized to some extent (admin, components, pages), the `App.tsx` file is overly responsible for routing configuration and startup logic.

### 3. API Management
The proxy logic for external APIs (football-data, etc.) in `server.ts` is complex and brittle. It should be extracted into dedicated service classes under `/server/services/`.

## Recommendations
- Refactor `server.ts` into a structured Express router-controller architecture.
- Extract AI and API service logic into `/core-engine/`.
