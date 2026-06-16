# Agent Instructions

## Project Notes

This repository is the 1PM Marketing Admin web app, not the generic Harness
source repo.

Current stack:

- React + Vite + TypeScript frontend in `src/`.
- Node.js stdlib backend in `server/`.
- JSON persistence in `data/app-state.json`.
- Railway single-service deploy.

Before product work, read:

- `docs/product/overview.md`
- `docs/product/operations.md`
- `docs/product/api-contract.md`
- `docs/ARCHITECTURE.md`
- `docs/TEST_MATRIX.md`

Important boundary: personal v1 may use JSON store and dev token auth. Public
customer use needs real auth, database, tenancy, media storage, and provider
OAuth/app review.

<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `docs/TOOL_REGISTRY.md`
- `scripts/bin/harness-cli query matrix` on macOS/Linux, or `.\scripts\bin\harness-cli.exe query matrix` on Windows

Use the Rust Harness CLI at `scripts/bin/harness-cli` on macOS/Linux or
`scripts/bin/harness-cli.exe` on Windows as the main operational tool. Before a
step that could use an external tool, run `scripts/bin/harness-cli query tools
--capability <name> --status present` to see what is equipped; an absent
capability is a clean skip.
<!-- HARNESS:END -->
