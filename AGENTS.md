# AGENTS.md

## Repo shape
- Single-package Expo + React Native app for Android only.
- Actual boot flow is `index.ts` → `app/index.tsx` → `stack/rootStack.tsx`.
- `app/` holds screens, `stack/` owns route registration/types, `state/` holds app-wide providers, `components/` is shared UI, `lib/` is shared infra, `store/` is persisted Zustand state.
- Route names/types are centralized in `stack/screen.ts`, `stack/screenName.ts`, and `stack/screenParams.ts`.
- `app/singin` and `ScreenName.Singin` are intentionally misspelled in the current codebase; do not "fix" them unless you update every reference.
- Use the `@/*` alias from `tsconfig.json` instead of long relative imports.

## Commands
- Package manager is `pnpm`; there is no workspace file.
- App scripts are only:
  - `pnpm start`
  - `pnpm prebuild`
  - `pnpm build`
  - `pnpm build:apk`
- There are no repo scripts for lint, test, or typecheck. Use:
  - `pnpm exec biome check .`
  - `pnpm exec tsc --noEmit`

## Verification baseline
- `pnpm exec biome check .` succeeds but still reports one existing warning in `lib/renderer/types.ts` (`noExplicitAny`).
- `pnpm exec tsc --noEmit` is not clean on `main`; verified current errors are in `app/index.tsx`, `app/search/index.tsx`, and `stack/rootStack.tsx`.
- No test runner, CI workflow, or pre-commit config was found. Verification is mostly static checks plus manual runtime validation via `pnpm start` and Android builds when native behavior matters.

## Env and config gotchas
- App scripts load env through `dotenvx run -f .env.local .env --ignore=MISSING_ENV_FILE -- ...`; do not assume Expo default env loading.
- `.env.example` sets `EXPO_NO_DOTENV=1` and `EXPO_NO_CLIENT_ENV_VARS=1`.
- Public env names use `APP_PUBLIC_*`, not `EXPO_PUBLIC_*`.
- If you add or rename an env, update all three: `app.config.ts`, `types/expoExtra.ts`, and `lib/config/index.ts`.

## Native and tooling gotchas
- `pnpm prebuild` mutates/generates native projects. `android/` and `ios/` are gitignored here; treat native output as generated unless the user explicitly wants native files inspected or regenerated.
- Release signing is injected by `plugins/withSignedPlugin.ts` only when the `APP_RELEASE_*` vars are set.
- Sentry Expo integration is enabled only when `SENTRY_AUTH_TOKEN`, `SENTRY_PROJECT`, and `SENTRY_ORGANIZATION` are present.
- Styling uses Tailwind v4 + Uniwind. `app/index.tsx` imports `../global.css` once at the app root, and `metro.config.cjs` generates `types/uniwind-types.d.ts`.
- `types/uniwind-types.d.ts` is generated and excluded from Biome.
- Babel only adds `react-native-worklets/plugin`; keep that in mind before changing animation/worklets setup.
- `state/web/index.tsx` mounts `AutoCheckIn` as a provider side effect; web-service changes can affect app startup behavior.
