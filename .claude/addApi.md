# How to prompt: Add an API for Market

Use this when asking Cursor/AI to add a new Wynncraft API used by the Market section.

**Reference:** [Wynncraft API docs](https://docs.wynncraft.com/docs/modules/item.html) (Item module and others).

---

## Template prompt

Copy and adapt:

```
Add the [API name] API for the market section.

- Follow the current format used in this repo:
  - Route proxy: @src/app/api/wynn/* ([[...path]] route that forwards to api.wynncraft.com)
  - Client: @src/api/* (typed functions, BASE = /api/wynn/... in browser, direct URL on server)
  - Types: @src/types/* if new response shapes are needed

- API details:
  - Name: [e.g. item]
  - Upstream base: [e.g. https://api.wynncraft.com/v3/item]
  - Endpoints: [list method, path, and purpose]
```

---

## Item module (official spec)

From [Item module | WAPI v3.3](https://docs.wynncraft.com/docs/modules/item.html). Base: **https://api.wynncraft.com/v3/item**. Items use the API Markup parser for Major IDs.

| Endpoint | Method | Path / behavior | TTL | Response |
|----------|--------|------------------|-----|----------|
| **Item database (paginated)** | GET | `.../database` | 1h | `{ controller: { count, pages, previous, current, next, links }, results: { "Item Name": {...} } }` |
| **Item database (full)** | GET | `.../database?fullResult` | 1h | `{ "Item Name": {...}, ... }` (no controller; bypasses pagination) |
| **Item search** | POST | `.../search` | — | Body: `query`, `type`, `tier`, `attackSpeed`, `levelRange`, `professions`, `identifications`, `majorIds`. Add `?fullResult` to return only results. |
| **Item quick search** | GET | `.../quick-search` (or equivalent) | 1m | Same item shape: `{ "Item Name": {...}, ... }` |
| **Item metadata** | GET | `.../metadata` | 1h | `{ identifications: [], majorIds: [], filters: { type, advanced, tier, levelRange } }` — all available filters for advanced search |

**Item object shape (summary):** `internalName`, `type`, `subType`, `icon`, `identifier`, `allow_craftsman`, type-specific fields (`armourMaterial`, `attackSpeed`, `averageDPS`, `gatheringSpeed`, `tier`, `rarity`, etc.), `majorIds`, `craftable`, `powderSlots`, `lore`, `dropRestriction`, `restriction`, `raidReward`, `dropMeta`, `base`, `requirements`, `identifications`.

---

## Example prompt: Item API

Use this to add the full Item module:

```
Add the Wynncraft Item API for the market section using the official spec:
https://docs.wynncraft.com/docs/modules/item.html

- Follow the current format:
  - Route: @src/app/api/wynn/* and @src/api (same pattern as player, publisher).
  - Proxy: src/app/api/wynn/item/[[...path]]/route.ts → https://api.wynncraft.com/v3/item
    - Support both GET and POST (Item search is POST .../search with JSON body).
  - Client: src/api/item.ts with typed functions for each endpoint.

- Endpoints (from Item module docs):
  1. GET database (paginated): GET /v3/item/database → controller + results.
  2. GET database (full): GET /v3/item/database?fullResult → plain { "Item Name": {...} }.
  3. POST search: POST /v3/item/search with body { query?, type?, tier?, attackSpeed?, levelRange?, professions?, identifications?, majorIds? }; optional ?fullResult.
  4. GET quick search: GET /v3/item/quick-search (or path from docs) → same item map, 1 min TTL.
  5. GET metadata: GET /v3/item/metadata → identifications, majorIds, filters (for UI dropdowns).

- Types: Add src/types/item.ts for paginated response (controller + results), item entry shape, search request body, and metadata response. Item entries have variable keys by type (weapon, armour, ingredient, etc.); use a flexible type or union where needed.
```

---

## What gets created (reference)

| Piece | Location | Role |
|-------|----------|------|
| Route handler | `src/app/api/wynn/<module>/[[...path]]/route.ts` | GET (and POST if needed) proxy to Wynncraft; forwards path + query; optional `Authorization: Bearer` from `WYNN_API_KEY` |
| Client | `src/api/<module>.ts` | Typed functions; in browser `BASE = "/api/wynn/<module>"`, on server direct `https://api.wynncraft.com/v3/<module>` |
| Types | `src/types/<module>.ts` (optional) | Interfaces for controller, results, item entry, search body, metadata |

---

## Checklist for the AI

- [ ] Add `src/app/api/wynn/<module>/[[...path]]/route.ts` (match existing proxy pattern; support POST for Item search if applicable).
- [ ] Add `src/api/<module>.ts` with functions for each endpoint (database full, database paginated, search, quick search, metadata).
- [ ] Add or extend `src/types/*` for controller, results, item shape, search body, metadata.
- [ ] Use `WYNN_API_KEY` / `NEXT_PUBLIC_WYNN_API_KEY` in the route when calling upstream (same as existing routes).
