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

## Walmart cart and search links

The grocery list view includes an "Add all to Walmart cart" link and a
per-item "Search" link:

- **Add all to Walmart cart** builds a deep link to
  `affil.walmart.com/cart/addToCart` with the curated, catalog-matched items
  in the current grocery list (with their resolved quantities). It only
  renders when at least one item in the list has a curated Walmart catalog
  ID; a coverage note ("N of M items") next to it shows how many of the
  list's items are included, since unmatched items are silently skipped.
- **Search** links (one per grocery item) open a Walmart search for that
  item's name, and work for every item regardless of catalog coverage.

The `affil.walmart.com` cart endpoint is Impact Radius affiliate
infrastructure and **requires Impact Radius affiliate program enrollment**
for Walmart before it can be used in production — this project does not
currently assert or include any affiliate tracking ID. See the PRD's open
questions for the status of that enrollment.

## Adding or editing meal cards

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full schema, the dietary
hard-fail rules, and a worked example of adding a new card.
