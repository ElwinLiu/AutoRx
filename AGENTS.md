# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Expo Router screens and layouts (file-based routes such as `app/(tabs)/_layout.tsx` and `app/recipe/[id].tsx`).
- `components/`: Reusable UI and screen-level components. Native helpers belong in `components/native/`.
- `hooks/`: Shared hooks (theme, native UI options).
- `lib/`: Data and database utilities (SQLite provider/setup).
- `constants/`, `types/`, `data/`: Tokens, TypeScript types, and mock data.
- `assets/`: Images and static assets.
- `ios/`: iOS native project for dev client builds.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npx expo start`: Start the Metro dev server for iOS/Android.
- `npm run web`: Run the web target.
- `npx expo run:ios` / `npx expo run:android`: Build and install a dev client (required after adding native modules).
- `npm run lint`: Run the Expo ESLint config.
- `npm run reset-project`: Reset the starter scaffold.

## Coding Style & Naming Conventions
- Language: TypeScript + React Native (Expo).
- Indentation: 2 spaces.
- Components use kebab-case filenames (e.g., `recipe-detail-screen.tsx`).
- Hooks use camelCase filenames (e.g., `use-native-header.tsx`).
- Prefer centralized platform logic in `components/native/` and `hooks/` rather than `Platform.OS` checks in screens.

## Testing Guidelines
- No automated tests configured yet.
- Use `npm run lint` as the baseline quality check.
- When tests are added, colocate them near features and document the runner here.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (e.g., `feat(app): add recipe detail screen`).
- Pull requests should include a clear summary, any relevant screenshots (UI changes), and rebuild notes when native modules are added (e.g., “run `npx expo run:ios`”).

## Native Modules & Configuration Notes
- Expo Go will not load optional native modules (e.g., blur or segmented control).
- Use a dev client build (`npx expo run:ios` / `npx expo run:android`) after adding native dependencies.
