# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Expo Router screens and layouts (file-based routing). Example: `app/(tabs)/_layout.tsx`, `app/recipe/[id].tsx`.
- `components/`: Reusable UI and screen-level components. Native helpers live in `components/native/`.
- `hooks/`: Shared hooks (theme, native UI options).
- `lib/`: Data and DB utilities (SQLite provider/DB setup).
- `constants/`, `types/`, `data/`: Tokens, TypeScript types, and mock data.
- `assets/`: Images and static assets.
- `ios/`: iOS native project (dev client builds).

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npx expo start`: Start Metro dev server.
- `npx expo run:ios` / `npx expo run:android`: Build and install a dev client (required when adding native modules like `expo-blur` or `@react-native-segmented-control/segmented-control`).
- `npm run web`: Run the web target.
- `npm run lint`: Run Expo ESLint config.
- `npm run reset-project`: Reset starter scaffold.

## Coding Style & Naming Conventions
- Language: TypeScript + React Native (Expo).
- Indentation: 2 spaces (follow existing files).
- File naming: kebab-case for components (`recipe-detail-screen.tsx`), camelCase for hooks (`use-native-header.tsx`).
- Prefer centralized platform logic in `components/native/` and `hooks/` rather than `Platform.OS` checks in screens.

## Testing Guidelines
- No automated tests configured yet.
- Use `npm run lint` for baseline checks.
- When adding tests later, colocate near features and document the runner here.

## Commit & Pull Request Guidelines
- Commit style appears to follow Conventional Commits (e.g., `feat(app): ...`). Use `feat`, `fix`, `chore`, etc. with a concise scope.
- PRs should include: summary, key screenshots (UI changes), and any rebuild requirements (e.g., “run `npx expo run:ios` after adding native modules”).

## Configuration & Native Modules
- Expo Go won’t load optional native modules. Use a dev client build for blur/segmented control.
- After adding native dependencies, rebuild with `npx expo run:ios` or `npx expo run:android`.
