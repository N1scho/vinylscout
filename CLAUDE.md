# CLAUDE.md

## Secrets

`ANTHROPIC_API_KEY` and `DISCOGS_TOKEN` belong to the Vercel functions in `api/` and are read via `process.env`. Never move either into a `VITE_*` variable — Vite inlines those into the client bundle, which ships the key to every visitor. `.env` and `.env.local` are off limits to read, print, or write; the deny rules in `.claude/settings.local.json` cover the file tools only, so a shell command can still reach them. Treat this as the rule rather than relying on the guardrail.

## Committed build outputs

`src/data/discoverAlbums.json` (1.3 MB) and `public/vinyl-covers/**` are generated *and* checked in on purpose. `npm run build` regenerates them from `C:/Users/nikol/Desktop/Claude/Genre Lists`, which lives outside the repo and exists only on the dev machine. On CI and Vercel that directory is absent, so `scripts/parseGenreCovers.js` falls back to the committed JSON and the build proceeds; it fails only when both the source directory and the cached JSON are missing.

Consequences: a local build can produce a large diff in those two paths, and that is expected rather than corruption. Never delete them as "generated artifacts" — CI has no way to recreate them.

## Git

Default branch is `master`, not `main`. Two long-lived branches are deliberate: `backup-v3.2.0-stable` (has commits from 2026-07-28, so the name understates it) and `overhaul/phase-1` (last touched 2026-07-20). Don't prune either. `--no-verify` skips the husky hook that runs eslint and prettier, so it stays off unless asked for by name.

## Dead code

`*.backup` files, including `src/App.jsx.backup`, are dead snapshots — don't edit them or read them as live code. `src/BUILD_TIMESTAMP.txt` is generated.

## Status docs

`HANDOVER_v3.3.0.md` is the current one — read it for project state. `HANDOVER.md`, `PROJECT_STATUS.md`, `PHASE_2_SUMMARY.md`, and `REVISION_PHASE_1.md` are historical snapshots; useful for how things got here, not for what is true now. `README.md` and `CHANGELOG.md` keep their usual roles.
