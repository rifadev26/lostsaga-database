# Lost Saga Database — Project Plan

## Overview

An open-source, community-driven database and visual website for **Lost Saga**.

The project provides:

- Public JSON data for heroes, gears, items, and more.
- Downloadable image assets served through a free CDN.
- A fast, beautiful, and searchable website for browsing the database.

## Goals

- Keep the data pipeline simple and reproducible.
- Maintain a fully static, version-controlled dataset.
- Build a modern React website with excellent performance and UX.
- Make it easy for the community to contribute fixes and new features.

## Tech Stack

### Data Pipeline

- **Runtime:** Node.js 18+ / TypeScript via `tsx`
- **API calls:** Native `fetch()`
- **File I/O:** `fs.promises` and Node.js streams
- **Key libraries:** `fast-xml-parser`, `@marcuth/dds-to-png`
- **Outputs:**
  - `data/hero.json` — raw API hero data
  - `data/hero-local.json` — hero data with local asset paths
  - `data/etc-items.json` — etc item data from `sp2_etcitem_info.ini.iop`
  - `data/etc-items-raw.json` — raw etc item sections
  - `data/etc-manuals.json` — item inventory manuals from `sp2_etc_manual.ini.iop`
  - `data/gears.json` — gear data from `config/mercenary/{code}/{code}_item.ini.iop`
  - `data/medals-raw.json` — raw medal item sections
  - `data/medals.json` — typed medal data
  - `data/pets-raw.json` — raw pet info sections
  - `data/pets.json` — typed pet data
  - `data/pet-feed-info.json` — pet feed rank data
  - `data/pet-manuals.json` — pet inventory manuals
  - `data/quests-raw.json` — raw quest info sections
  - `data/quests.json` — typed quest data
  - `data/quest-help-raw.json` — raw quest help sections
  - `data/quest-present-raw.json` — raw quest present sections
  - `data/quest-guide-raw.json` — raw quest guide sections
  - `data/ui-imageset.json` — UI texture imagesets
  - `data/ui-icons.json` — keyed icon lookup for UI sprites
  - `data/images/ui/` — extracted UI DDS/PNG assets
  - `data/images/heroes/` — hero and gear image assets

### Website

- **Framework:** Next.js `16.2.9`
- **React:** `19.x`
- **Language:** TypeScript
- **Styling:** Tailwind CSS `4.3.1`
- **Components:** shadcn/ui + Lucide React
- **Deployment:** Vercel

### Asset Hosting

Images are served via **jsDelivr** on top of the GitHub repository:

```text
https://cdn.jsdelivr.net/gh/rifadev26/lostsaga-database@main/data/images/heroes/{hero.code}/icon_m.png
https://cdn.jsdelivr.net/gh/rifadev26/lostsaga-database@main/data/images/ui/{uiImage.pngFile}
```

`data/ui-imageset.json` and `data/ui-icons.json` include a ready-to-use `pngUrl` field pointing to the jsDelivr CDN.

## Repository Structure

```text
lostsaga-database/
├── .github/
│   └── ISSUE_TEMPLATE/          # GitHub issue templates
│   └── workflows/               # GitHub Actions
├── data/
│   ├── hero.json                # raw API hero data
│   ├── hero-local.json          # hero data with local asset paths
│   ├── etc-items.json           # etc item data
│   ├── etc-items-raw.json       # raw etc item sections
│   ├── etc-manuals.json         # item inventory manuals
│   ├── gears.json               # gear data
│   ├── medals-raw.json          # raw medal item sections
│   ├── medals.json              # typed medal data
│   ├── pets-raw.json            # raw pet info sections
│   ├── pets.json                # typed pet data
│   ├── pet-feed-info.json       # pet feed rank data
│   ├── pet-manuals.json         # pet inventory manuals
│   ├── quests-raw.json          # raw quest info sections
│   ├── quests.json              # typed quest data
│   ├── quest-help-raw.json      # raw quest help sections
│   ├── quest-present-raw.json   # raw quest present sections
│   ├── quest-guide-raw.json     # raw quest guide sections
│   ├── ui-imageset.json         # UI texture imagesets
│   ├── ui-icons.json            # keyed icon lookup for UI sprites
│   └── images/                  # generated image assets
├── scripts/
│   ├── index.ts                 # data fetching pipeline entrypoint
│   ├── config.ts                # central config & .iop passwords
│   ├── fetchers/
│   │   ├── heroes.ts            # hero + gear image fetcher
│   │   ├── textures.ts          # UI .iop texture fetcher
│   │   ├── items.ts             # etc item data fetcher
│   │   ├── manuals.ts           # item manual fetcher
│   │   ├── gears.ts             # gear data fetcher
│   │   ├── medals.ts            # medal data fetcher
│   │   ├── pets.ts              # pet data fetcher
│   │   └── quests.ts            # quest data fetcher
│   ├── lib/
│   │   ├── iop.ts               # Lost Saga .iop extractor
│   │   ├── dds-to-png.ts        # uncompressed DDS → PNG fallback
│   │   └── ...
│   └── debug/
│       ├── extract-test.ts      # manual .iop extraction test
│       └── extract-patch.ts     # manual server_patch.cfg extractor
├── site/                        # Next.js website
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── PLAN.md
├── README.md
└── SECURITY.md
```

## Data Pipeline

The `scripts/index.ts` pipeline runs through the fetchers in `scripts/fetchers/`:

1. `fetchAllHeroes()` — fetches hero records from the Lost Saga API, downloads hero/gear images, and writes:
   - `data/hero.json`
   - `data/hero-local.json`
   - `data/images/heroes/`
   - `data/failed-images.json` if any downloads fail.
2. `fetchTextures()` — downloads the patch manifest, parses `uiimageset.xml`, extracts `.iop` texture archives, converts DDS sheets to PNG, and writes:
   - `data/ui-imageset.json`
   - `data/ui-icons.json`
   - `data/images/ui/`
   - `data/failed-ui-images.json` and `data/failed-ui-conversions.json` if anything fails.
3. `fetchItems()` — downloads `config/sp2_etcitem_info.ini.iop`, extracts the INI, resolves UI icon references, and writes:
   - `data/etc-items.json`
4. `fetchManuals()` — downloads `config/sp2_etc_manual.ini.iop`, applies the secondary XOR, parses `[ManualN]` sections, and writes:
   - `data/etc-manuals.json`
5. `fetchGears()` — downloads `config/mercenary/{code}/{code}_item.ini.iop` and `{code}_extraitem.ini.iop` for every hero, applies the secondary XOR, parses `[itemN]` sections, merges default gear with `hero-local.json`, and writes:
   - `data/gears.json`
6. `fetchMedals()` — downloads `config/sp2_medalitem_info.ini.iop` and `config/sp2_medal_inven_manual.ini.iop`, applies the secondary XOR, parses medal data and manual text, and writes:
   - `data/medals-raw.json`
   - `data/medals.json`
7. `fetchPets()` — downloads `config/sp2_pet_info.ini.iop`, `config/sp2_pet_eat_info.ini.iop`, and `config/sp2_pet_inven_manual.ini.iop`, applies the secondary XOR, parses pet data, feed ranks, and manuals, and writes:
   - `data/pets-raw.json`
   - `data/pets.json`
   - `data/pet-feed-info.json`
   - `data/pet-manuals.json`
8. `fetchQuests()` — downloads `config/sp2_quest_info.ini.iop`, `config/sp2_quest_help.ini.iop`, `config/sp2_quest_present.ini.iop`, and `config/sp2_quest_guide.ini.iop`, applies the secondary XOR, parses quest data and related sections, and writes:
   - `data/quests-raw.json`
   - `data/quests.json`
   - `data/quest-help-raw.json`
   - `data/quest-present-raw.json`
   - `data/quest-guide-raw.json`

### Running the pipeline

```bash
pnpm install
pnpm run fetch-data
```

## Website Implementation

### Phase 1 — Heroes (complete)

- [x] Scaffold `site/` with Next.js 16, Tailwind CSS 4, and shadcn/ui
- [x] Build `/heroes` listing page with search, type filter, and rarity filter
- [x] Build `/heroes/[code]` detail page
- [x] Apply fresh "Obsidian Cyan" dark theme design
- [x] Deploy to Vercel

### Phase 2 — Items, Gears, Medals, Pets & Discovery

- [x] Etc item listing page (`/items`) with search, group filter, and type-code filter
- [x] Etc item detail page (`/items/[id]`) with metadata and inventory manual
- [x] Gear listing page (`/gears`) with search, type/rarity/source filters, sort, and pagination
- [x] Gear detail page (`/gears/[id]`)
- [x] Medal collection page (`/medals`) with search, sub-type/manual filters, sort, and pagination
- [x] Medal detail page (`/medals/[id]`)
- [x] Pet database page (`/pets`) with search, rank filters, sort, and pagination
- [x] Pet detail page (`/pets/[id]`)
- [x] Global search page (`/search`) across heroes, items, gears, medals, and pets
- [ ] Command reference page (`/commands`) — removed from current scope

### Phase 3 — Tools

- [x] Icon browser (`/tools/icon-browser`)
- [x] Quest generator (`/tools/quest-generator`)
- [ ] Pass generator (`/tools/pass-generator`)
- [ ] SRV ID generator (`/tools/srv-id-generator`)

### Phase 4 — Community Features

- Contribution-friendly data correction workflows
- Optional user accounts / favorites / comments

## Design Direction

The website uses a fresh, modern look called **"Obsidian Cyan"**:

- Deep obsidian background
- Electric cyan accent color
- Clean card-based layout
- Generous whitespace
- Subtle hover glows

It is intentionally different from the original `lostsaga.xyz` site.

## Deployment

### Vercel settings

| Setting | Value |
|---|---|---|
| Framework preset | Next.js |
| Root directory | `site` |
| Build command | `next build` |
| Output directory | `.next` |

No static export is used; Vercel handles the Next.js app natively.

### Image configuration

`site/next.config.ts` allows the Next.js Image component to optimize remote images from jsDelivr:

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'cdn.jsdelivr.net',
    },
  ],
}
```

## Contribution Workflow

1. Fork the repository.
2. Create a feature or fix branch.
3. If you change the data pipeline, run `pnpm run fetch-data` to regenerate data.
4. Verify the website locally with `cd site && pnpm run dev`.
5. Open a pull request.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## License

MIT License — see [LICENSE](./LICENSE).
