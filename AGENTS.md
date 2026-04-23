# AGENTS.md

## Repo shape
- Single-package Expo + React Native app for Android only.
- Real boot flow is `index.ts` → `app/index.tsx` → `stack/rootStack.tsx`.
- `app/` holds screens, `stack/` owns route registration/types, `state/` holds app-wide providers, `lib/` is shared infra, and `store/` is persisted Zustand state.
- Route registration and typing are centralized in `stack/screen.ts`, `stack/screenName.ts`, and `stack/screenParams.ts`.
- `app/singin` is the real route folder, while `stack/screenName.ts` contains both `ScreenName.Singin` and `ScreenName.Signin`; do not “fix” the spelling unless you update every reference.
- Use the `@/*` alias from `tsconfig.json` instead of long relative imports.
- App startup is provider-heavy in `app/index.tsx`; `state/web/index.tsx` mounts `AutoCheckIn` and `WebRunner` as side effects, so web-service changes can affect boot behavior.

## Commands
- Package manager is `pnpm`; there is no workspace file.
- App scripts:
  - `pnpm start`
  - `pnpm prebuild`
  - `pnpm build`
  - `pnpm build:apk`
  - `pnpm build:apk:debug`
- There are no repo scripts for lint, test, or typecheck. Use:
  - `pnpm exec biome check .`
  - `pnpm exec tsc --noEmit`
- Android build flow is `pnpm prebuild` first, then `pnpm build` or `pnpm build:apk`.
- Current baseline: `pnpm exec biome check .` passes, while `pnpm exec tsc --noEmit` fails in `stack/rootStack.tsx` because of the navigator screen map typing; do not assume that pre-existing error came from your change.

## Env and build gotchas
- All app scripts load env through `dotenvx run -f .env.local .env --ignore=MISSING_ENV_FILE -- ...`; Expo default env loading is intentionally disabled.
- `.env.example` uses `APP_PUBLIC_*` names plus `EXPO_NO_DOTENV=1` and `EXPO_NO_CLIENT_ENV_VARS=1`.
- If you add or rename an env, update all three: `app.config.ts`, `types/expoExtra.ts`, and `lib/config/index.ts`.
- Release signing is injected by `plugins/withSignedPlugin.ts` only when all `APP_RELEASE_*` vars are set.
- The Sentry Expo plugin is enabled only when `SENTRY_AUTH_TOKEN`, `SENTRY_PROJECT`, and `SENTRY_ORGANIZATION` are present.
- CI release builds (`.github/workflows/android-release.yml`) use pnpm 10 + Node 24, then run `pnpm install --frozen-lockfile` → `pnpm run prebuild` → `pnpm run build` → `pnpm run build:apk`.

## Native and tooling
- `pnpm prebuild` mutates native projects. `android/` and `ios/` are gitignored here, so treat native output as generated unless the user explicitly wants native files inspected or regenerated.
- Styling is Tailwind v4 + Uniwind. `app/index.tsx` imports `global.css` once at the root; `metro.config.cjs` generates `types/uniwind-types.d.ts`, and `biome.json` excludes that file.
- Babel only adds `react-native-worklets/plugin`; keep that in mind before changing animation/worklets setup.
