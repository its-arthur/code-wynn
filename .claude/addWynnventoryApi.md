# How to prompt: Add Wynnventory APIs

Use this when asking Cursor/AI to add Wynnventory API endpoints to the project.

**Base URL:** `https://www.wynnventory.com/api`
**Auth:** Header `Authorization: Api-Key YOUR_API_KEY`
**Docs / Postman:** [Wynnventory Postman Collection](https://www.postman.com/its-arthur-6181662/workspace/wynnmarket/collection/53188813-35d4a6c0-b400-4031-88a9-585556ee2788)

---

## Project integration pattern

Follow the same format used for the Wynncraft Item API:

| Piece                 | Location                                                | Role                                                                                                                             |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Route handler (proxy) | `src/app/api/wynnventory/<module>/[[...path]]/route.ts` | GET proxy to `wynnventory.com/api`; forwards path + query; sends `Authorization: Api-Key` from `WYNNVENTORY_API_KEY` server-side |
| Client                | `src/api/wynnventory/<module>.ts`                       | Typed functions; in browser `BASE = "/api/wynnventory/<module>"`, on server direct `https://www.wynnventory.com/api/<module>`    |
| Types                 | `src/types/wynnventory/<module>.ts`                     | Interfaces for all response shapes                                                                                               |

---

## Shared types

Many endpoints share the same item shape and pagination wrapper.

### Common item shape

```ts
interface WynnventoryItem {
	amount: number;
	icon: { format: string; value: string } | null;
	itemType: string; // "GearItem" | "TomeItem" | "AspectItem" | "PowderItem" | "EmeraldItem" | "MaterialItem" | "IngredientItem"
	name: string;
	rarity: string; // "Common" | "Unique" | "Rare" | "Legendary" | "Fabled" | "Mythic"
	shiny: boolean;
	shinyStat: string | null;
	subtype: string; // "RING" | "LEGGINGS" | "WEAPON_TOME" | "MageAspect" | etc.
}
```

### Pagination wrapper

```ts
interface PaginatedResponse<T> {
	count: number;
	page: number;
	page_size: number;
	pools?: T[]; // used by raidpool/lootpool history
	items?: T[]; // used by trademarket listings
	total?: number; // used by trademarket listings
}
```

---

## Module 1: Raid Rewards (`raidpool`)

Base path: `/api/raidpool`

### Endpoints

| #   | Name                   | Method | Path               | Query params        | Response                                                                             |
| --- | ---------------------- | ------ | ------------------ | ------------------- | ------------------------------------------------------------------------------------ |
| 1   | Current week           | GET    | `/current`         | —                   | `{ regions: Region[], week: number, year: number }`                                  |
| 2   | Current week (grouped) | GET    | `/items`           | —                   | `GroupedRegion[]`                                                                    |
| 3   | Specific week          | GET    | `/:year/:week`     | —                   | `{ regions: Region[], week: number, year: number }`                                  |
| 4   | Current gambits        | GET    | `/gambits/current` | —                   | `{ day: number, gambits: Gambit[], month: number, timestamp: string, year: number }` |
| 5   | Paginated history      | GET    | `/all`             | `page`, `page_size` | `PaginatedResponse<Pool>` with `pools`                                               |

### Response shapes

```ts
interface RaidRegion {
	items: WynnventoryItem[];
	region: string;
	timestamp: string;
}

interface RaidRewardsResponse {
	regions: RaidRegion[];
	week: number;
	year: number;
}

interface GroupedLootItem {
	amount: number;
	icon: { format: string; value: string } | null;
	itemType: string;
	name: string;
	rarity: string;
	shiny: boolean;
	type?: string;
}

interface RaidGroupedRegion {
	group_items: { group: string; loot_items: GroupedLootItem[] }[];
	region: string;
	timestamp: string;
	week: number;
	year: number;
}

interface Gambit {
	color: string;
	description: string[];
	name: string;
	timestamp: string;
}

interface GambitResponse {
	day: number;
	gambits: Gambit[];
	month: number;
	timestamp: string;
	year: number;
}

interface RaidPool {
	regions: (RaidRegion & { type: string })[];
	week: number;
	year: number;
}

interface RaidHistoryResponse {
	count: number;
	page: number;
	page_size: number;
	pools: RaidPool[];
}
```

---

## Module 2: Lootrun Rewards (`lootpool`)

Base path: `/api/lootpool`

### Endpoints

| #   | Name                   | Method | Path           | Query params        | Response                                            |
| --- | ---------------------- | ------ | -------------- | ------------------- | --------------------------------------------------- |
| 1   | Current week           | GET    | `/current`     | —                   | `{ regions: Region[], week: number, year: number }` |
| 2   | Current week (grouped) | GET    | `/items`       | —                   | `LootrunGroupedRegion[]`                            |
| 3   | Specific week          | GET    | `/:year/:week` | —                   | `{ regions: Region[], week: number, year: number }` |
| 4   | Paginated history      | GET    | `/all`         | `page`, `page_size` | `PaginatedResponse<Pool>` with `pools`              |

### Response shapes

```ts
interface LootrunRegion {
	items: WynnventoryItem[];
	region: string;
	timestamp: string;
}

interface LootrunRewardsResponse {
	regions: LootrunRegion[];
	week: number;
	year: number;
}

interface LootrunGroupedRegion {
	region_items: { group: string; loot_items: GroupedLootItem[] }[];
	region: string;
	timestamp: string;
	week: number;
	year: number;
}

interface LootrunPool {
	regions: (LootrunRegion & { type: string })[];
	week: number;
	year: number;
}

interface LootrunHistoryResponse {
	count: number;
	page: number;
	page_size: number;
	pools: LootrunPool[];
}
```

---

## Module 3: Trademarket (`trademarket`)

Base path: `/api/trademarket`

### Endpoints

| #   | Name                         | Method | Path                        | Query params                                                                      | Response                |
| --- | ---------------------------- | ------ | --------------------------- | --------------------------------------------------------------------------------- | ----------------------- |
| 1   | Live listings                | GET    | `/listings`                 | `tier?`, `shiny?`, `unidentified?`, `rarity?`, `itemType?`, `page?`, `page_size?` | `TradeListingsResponse` |
| 2   | Live listings for item       | GET    | `/listings/:item_name`      | `tier?`, `shiny?`, `unidentified?`, `rarity?`, `itemType?`, `page?`, `page_size?` | `TradeListingsResponse` |
| 3   | Price info for item          | GET    | `/item/:item_name/price`    | `shiny?`, `tier?`                                                                 | `TradePriceInfo`        |
| 4   | Historic average over period | GET    | `/history/:item_name/price` | `shiny?`, `tier?`, `start_date?`, `end_date?`                                     | `TradeHistoricAverage`  |
| 5   | Historic averages per day    | GET    | `/history/:item_name`       | `shiny?`, `tier?`, `start_date?`, `end_date?`                                     | `TradeHistoricDay[]`    |
| 6   | Price ranking                | GET    | `/ranking`                  | `start_date?`, `end_date?`                                                        | `TradeRankingEntry[]`   |

### Query param details

| Param          | Type    | Description                                                 |
| -------------- | ------- | ----------------------------------------------------------- |
| `tier`         | number  | Item tier (1–3), for IngredientItems / MaterialItems        |
| `shiny`        | boolean | Only return shiny listings                                  |
| `unidentified` | boolean | Filter by identification status                             |
| `rarity`       | string  | `"mythic"`, `"fabled"`, `"legendary"`, `"rare"`, `"unique"` |
| `itemType`     | string  | `"GearItem"`, `"IngredientItem"`, `"MaterialItem"`, etc.    |
| `page`         | number  | Pagination page number                                      |
| `page_size`    | number  | Items per page (default 50)                                 |
| `start_date`   | string  | Start of period, format `YYYY-MM-DD`                        |
| `end_date`     | string  | End of period, format `YYYY-MM-DD`                          |

> **Note:** Historic data is always offset by one week.

### Response shapes

```ts
interface TradeListing {
	amount: number;
	hash_code: number;
	icon?: { format: string; value: string } | null;
	item_type: string;
	listing_price: number;
	mod_version: string;
	name: string;
	rarity: string;
	shiny_stat: string | null;
	tier: number | null;
	timestamp: string;
	type: string; // "RING" | "LEGGINGS" | etc.
	unidentified: boolean;
}

interface TradeListingsResponse {
	count: number;
	items: TradeListing[];
	page: number;
	page_size: number;
	total: number;
}

interface TradePriceInfo {
	_id: null;
	average_mid_80_percent_price: number;
	average_price: number;
	highest_price: number;
	lowest_price: number;
	name: string;
	tier: number | null;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_average_price: number;
	unidentified_count: number;
}

interface TradeHistoricAverage {
	average_mid_80_percent_price: number;
	average_price: number;
	document_count: number;
	highest_price: number;
	lowest_price: number;
	name: string;
	tier: number | null;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_average_price: number;
	unidentified_count: number;
}

interface TradeHistoricDay {
	average_mid_80_percent_price: number;
	average_price: number;
	date: string;
	highest_price: number;
	item_type: string;
	lowest_price: number;
	name: string;
	shiny_stat: string | null;
	tier: number | null;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_average_price: number;
	unidentified_count: number;
}

interface TradeRankingEntry {
	average_mid_80_percent_price: number;
	average_price: number;
	average_total_count: number;
	average_unidentified_count: number;
	highest_price: number;
	lowest_price: number;
	name: string;
	rank: number;
	total_count: number;
	unidentified_average_mid_80_percent_price: number;
	unidentified_count: number;
}
```

---

## Example prompt: Add Raidpool API

```
Add the Wynnventory Raidpool API.

- Follow the current format:
  - Route: src/app/api/wynnventory/raidpool/[[...path]]/route.ts → https://www.wynnventory.com/api/raidpool
    - Auth header: `Authorization: Api-Key ${WYNNVENTORY_API_KEY}`
    - GET only
  - Client: src/api/wynnventory/raidpool.ts with typed functions
  - Types: src/types/wynnventory/raidpool.ts

- Endpoints:
  1. GET /current → current week rewards
  2. GET /items → current week grouped items
  3. GET /:year/:week → specific week rewards
  4. GET /gambits/current → current gambits
  5. GET /all?page=&page_size= → paginated history
```

## Example prompt: Add Trademarket API

```
Add the Wynnventory Trademarket API.

- Follow the current format:
  - Route: src/app/api/wynnventory/trademarket/[[...path]]/route.ts → https://www.wynnventory.com/api/trademarket
    - Auth header: `Authorization: Api-Key ${WYNNVENTORY_API_KEY}`
    - GET only
  - Client: src/api/wynnventory/trademarket.ts with typed functions
  - Types: src/types/wynnventory/trademarket.ts

- Endpoints:
  1. GET /listings → live listings (paginated, filterable)
  2. GET /listings/:item_name → live listings for specific item
  3. GET /item/:item_name/price → 7-day price info
  4. GET /history/:item_name/price → historic average over date range
  5. GET /history/:item_name → historic daily averages
  6. GET /ranking → price ranking over date range
```

## Example prompt: Add Lootpool API

```
Add the Wynnventory Lootpool API.

- Follow the current format:
  - Route: src/app/api/wynnventory/lootpool/[[...path]]/route.ts → https://www.wynnventory.com/api/lootpool
    - Auth header: `Authorization: Api-Key ${WYNNVENTORY_API_KEY}`
    - GET only
  - Client: src/api/wynnventory/lootpool.ts with typed functions
  - Types: src/types/wynnventory/lootpool.ts

- Endpoints:
  1. GET /current → current week lootrun rewards
  2. GET /items → current week grouped items
  3. GET /:year/:week → specific week rewards
  4. GET /all?page=&page_size= → paginated history
```

---

## Checklist for the AI

- [ ] Add `src/app/api/wynnventory/<module>/[[...path]]/route.ts` — proxy route, same pattern as wynn/item but with `Authorization: Api-Key` instead of `Bearer`
- [ ] Add `src/api/wynnventory/<module>.ts` — typed client functions for each endpoint
- [ ] Add `src/types/wynnventory/<module>.ts` — interfaces for all response/request shapes
- [ ] Use env var `WYNNVENTORY_API_KEY` in the route handler for upstream auth
- [ ] Shared types (WynnventoryItem, pagination) can go in `src/types/wynnventory/common.ts`

---

## Full endpoint summary (all 15 endpoints)

| #   | Module      | Name                   | Method | Full path                                   |
| --- | ----------- | ---------------------- | ------ | ------------------------------------------- |
| 1   | raidpool    | Current week           | GET    | `/api/raidpool/current`                     |
| 2   | raidpool    | Current week (grouped) | GET    | `/api/raidpool/items`                       |
| 3   | raidpool    | Specific week          | GET    | `/api/raidpool/:year/:week`                 |
| 4   | raidpool    | Current gambits        | GET    | `/api/raidpool/gambits/current`             |
| 5   | raidpool    | Paginated history      | GET    | `/api/raidpool/all?page=&page_size=`        |
| 6   | lootpool    | Current week           | GET    | `/api/lootpool/current`                     |
| 7   | lootpool    | Current week (grouped) | GET    | `/api/lootpool/items`                       |
| 8   | lootpool    | Specific week          | GET    | `/api/lootpool/:year/:week`                 |
| 9   | lootpool    | Paginated history      | GET    | `/api/lootpool/all?page=&page_size=`        |
| 10  | trademarket | Live listings          | GET    | `/api/trademarket/listings`                 |
| 11  | trademarket | Listings for item      | GET    | `/api/trademarket/listings/:item_name`      |
| 12  | trademarket | Price info             | GET    | `/api/trademarket/item/:item_name/price`    |
| 13  | trademarket | Historic average       | GET    | `/api/trademarket/history/:item_name/price` |
| 14  | trademarket | Historic per day       | GET    | `/api/trademarket/history/:item_name`       |
| 15  | trademarket | Price ranking          | GET    | `/api/trademarket/ranking`                  |
