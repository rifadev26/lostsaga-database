# Lost Saga Database — Website

The Next.js frontend for the [Lost Saga Database](https://github.com/rifadev26/lostsaga-database).

Live site: [https://lostsaga-database.vercel.app](https://lostsaga-database.vercel.app)

## Tech stack

- **Framework:** Next.js `16.2.9`
- **React:** `19.x`
- **Language:** TypeScript
- **Styling:** Tailwind CSS `4.3.1`
- **Components:** shadcn/ui + Lucide React

## Getting started

From the **repository root**, generate the data first:

```bash
pnpm install
pnpm run fetch-data
```

Then install and run the website:

```bash
cd site
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
pnpm run build
```

## Notes

- Make sure `data/etc-items.json`, `data/etc-manuals.json`, `data/hero-local.json`, `data/ui-imageset.json`, and `data/ui-icons.json` exist in the root `data/` folder before running the site.
- The site is configured as a Next.js app with `site` as the Vercel root directory.
