# Meal Card Planner

A personal, single-user React + TypeScript + Vite web app for browsing a curated
deck of meal cards (breakfast/lunch/dinner/snack) and building a grocery list
from a selection of them. Client-side only — no backend, no accounts, all meal
data is bundled at build time.

## Features

- Browse meal cards with filters for meal type and dietary tags (including a
  dedicated bedtime-snack filter).
- Select multiple cards and generate an aggregated, section-grouped grocery
  list with running nutrition totals against soft target references.
- Full detail view per card: ingredients, numbered steps, nutrition panel with
  verified/estimated confidence flags, and cook's notes.
- A dietary rule validator that hard-fails the dataset on red meat, most
  legumes (chickpea pasta excepted), or seafood without a safe doneness cue.

## Local development

```bash
npm install
npm run dev          # start the dev server
npm run build         # type-check and build for production into dist/
npm run validate:cards # run the dietary-rule validator against the card dataset
npm test               # run the vitest suite (non-watch)
```

## Deployment

This app deploys to GitHub Pages via `.github/workflows/deploy.yml`, which
builds and publishes on every push to `main`.

**GitHub Pages must be enabled in the repository settings, with Source set to
"GitHub Actions"**, before the workflow will publish successfully.

The Vite `base` is set to `/MealPlanSite/` in `vite.config.ts` to match the
GitHub Pages project-site URL.

## Adding or editing meal cards

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full schema, the dietary
hard-fail rules, and a worked example of adding a new card.
