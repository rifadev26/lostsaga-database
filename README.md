# Lost Saga Database

An open-source database of **Lost Saga** heroes, gears, items, and assets.

## Website

Live site:

```text
https://lostsaga-database.vercel.app
```

## What's inside

| File / Folder | Description |
|---|---|---|
| `data/hero.json` | Raw hero data from the Lost Saga API |
| `data/hero-local.json` | Hero data with local image asset paths |
| `data/etc-items.json` | Etc item data parsed from `sp2_etcitem_info.ini.iop` |
| `data/etc-manuals.json` | Item inventory manuals parsed from `sp2_etc_manual.ini.iop` |
| `data/ui-imageset.json` | UI texture imagesets |
| `data/ui-icons.json` | Keyed icon lookup for UI sprites |
| `data/images/heroes/` | Hero and gear image assets |
| `data/images/ui/` | Extracted UI DDS/PNG assets |
| `scripts/index.ts` | Data fetching and asset download pipeline |
| `site/` | Next.js 16 website source code |

## Current website features

- `/heroes` — hero database with search, type filter, and rarity filter.
- `/heroes/[code]` — hero detail page with gear and image gallery.
- `/items` — etc item database with search, group filter, and type-code filter.
- `/items/[id]` — item detail page with metadata and inventory manual.
- `/tools/icon-browser` — UI sprite-sheet inspector.

## Quick start

### 1. Generate data

```bash
pnpm install
pnpm run fetch-data
```

This will:

- Fetch heroes from the Lost Saga API.
- Download hero/gear and UI image assets.
- Generate `data/hero.json`, `data/hero-local.json`, `data/etc-items.json`, `data/etc-manuals.json`, `data/ui-imageset.json`, and `data/ui-icons.json`.

### 2. Run the website locally

```bash
cd site
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech stack

- **Data pipeline:** Node.js + TypeScript via `tsx` + native `fetch`
- **Website:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Deployment:** Vercel
- **Asset CDN:** jsDelivr

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## Project plan

See [PLAN.md](./PLAN.md) for the full roadmap and architecture.

## License

[MIT](./LICENSE)
