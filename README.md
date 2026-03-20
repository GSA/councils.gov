# Councils.gov

Static site for **Federal Executive Councils** ([councils.gov](https://www.councils.gov)), built with **Astro**, **USWDS**, and **React** for interactive pieces. Content is mostly Markdown under `src/content/` plus JSON/CSV data for listings.

## Requirements

- **Node.js** (LTS recommended)
- **npm**

## Scripts

| Command | Description |
|--------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` / `npm start` | Local dev server |
| `npm run build` | Production build → `_site/` |
| `npm run preview` | Preview the production build |
| `npm run federalist` | Same as `build` (Cloud.gov Pages / Federalist) |

## Technologies

| Layer | Stack |
|-------|--------|
| Framework | [Astro](https://astro.build/) 5.x (static output, `outDir: _site`) |
| UI system | [USWDS](https://designsystem.digital.gov/) 3.x (`@uswds/uswds`) |
| Interactivity | [React](https://react.dev/) 18 (`@astrojs/react`) — filter UIs, search, pagination |
| Styles | [Sass](https://sass-lang.com/) (`global.scss`), CSS variables (`variables.css`, `fonts.css`) |
| Content | Astro Content Collections (`content.config.ts`), Markdown frontmatter |
| Data | JSON (`src/data/`), CSV (e.g. resources), [PapaParse](https://www.papaparse.com/), [gray-matter](https://github.com/jonschlinkert/gray-matter), [marked](https://marked.js.org/) |
| SEO | [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) |
| CMS (optional) | [Decap CMS](https://decapcms.org/) config at `public/admin/config.yml` |

## Configuration highlights

- **`astro.config.mjs`**
  - `site`: `https://www.councils.gov`
  - `trailingSlash: "always"`
  - **`base`**: defaults to `/`; set **`BASEURL`** env var for subdirectory deploys (e.g. preview URLs)
  - **Redirects**: legacy `/councils/{slug}/…` routes → `/{slug}/…` (generated from folders in `src/content/councils/`)
- **`import.meta.env.BASE_URL`**: used in layouts and components for asset and link paths

## Project structure

```
/
├── public/                    # Static assets (copied as-is to _site/)
│   ├── admin/config.yml       # Decap CMS (if used)
│   ├── assets/img/            # Logos, backgrounds, leaders, members, icons, etc.
│   ├── img/usa-icons/         # USWDS icon set (and related)
│   └── favicon.svg
├── src/
│   ├── assets/img/            # Images processed by Astro (e.g. hero WebP)
│   ├── components/            # Astro + React
│   │   ├── USWDS*.astro       # Banner, header, footer, identifier
│   │   ├── FilterPanel.tsx    # Shared filters + filter pills
│   │   ├── ResourceFilter.tsx
│   │   ├── NewsFilter.tsx
│   │   ├── SearchResults.tsx
│   │   ├── Pagination.tsx
│   │   ├── filters.ts         # Filter logic shared by Resource/News
│   │   └── …
│   ├── content/               # Astro collections (see content.config.ts)
│   │   ├── councils/{slug}/   # Per council: about.md, members-leaders.md
│   │   └── pages/home.md      # Home hero + intro frontmatter
│   ├── data/                  # JSON listings, nav, councilsData.ts, csv/
│   ├── layouts/
│   │   ├── BaseLayout.astro   # Site chrome, USWDS CSS, global styles
│   │   └── CouncilLayout.astro
│   ├── pages/                 # File-based routing
│   │   ├── index.astro        # Home
│   │   ├── resources.astro
│   │   ├── news-events.astro
│   │   ├── news-events/news/[slug].astro
│   │   ├── news-events/events/[slug].astro
│   │   ├── search/index.astro
│   │   ├── admin/index.astro
│   │   └── [council]/
│   │       ├── index.astro           # About
│   │       └── members-leaders.astro
│   ├── styles/
│   │   ├── global.scss
│   │   ├── variables.css
│   │   └── fonts.css
│   └── content.config.ts
├── astro.config.mjs
├── package.json
├── CONTENT.md                 # Detailed guide for council Markdown content
├── STYLES_RESTORE_GUIDE.md    # Optional SCSS restoration notes
└── STYLES_CLEANUP_GUIDE.md    # Duplicate-removal reference (mostly applied)
```

## Routing (summary)

| URL pattern | Source |
|-------------|--------|
| `/` | `src/pages/index.astro` |
| `/{council}/` | `src/pages/[council]/index.astro` + `src/content/councils/{council}/about.md` |
| `/{council}/members-leaders/` | `src/pages/[council]/members-leaders.astro` + `members-leaders.md` |
| `/resources/` | `src/pages/resources.astro` + `src/data/resources.json` (and related CSV) |
| `/news-events/` | `src/pages/news-events.astro` + `src/data/news.json` |
| `/news-events/news/{slug}/`, `/news-events/events/{slug}/` | Dynamic routes under `news-events/` |
| `/search/` | `src/pages/search/index.astro` |

Legacy `/councils/{slug}/…` URLs redirect via `astro.config.mjs`.

## Content & data

- **Council copy & leadership lists**: Markdown in `src/content/councils/<slug>/` — see **`CONTENT.md`** for frontmatter and conventions.
- **Home**: `src/content/pages/home.md` (frontmatter for hero/intro).
- **Resources / news**: Primarily `src/data/*.json`; resources may be synced from `src/data/csv/`.
- **Navigation / council registry**: `src/data/councils.json`, `councilsData.ts`, `navCouncils.ts`.

## React usage

Interactive islands use `client:load` (or similar) where needed:

- Resource and news/event filtering (`ResourceFilter`, `NewsFilter`, `FilterPanel`)
- Site search results (`SearchResults`)
- Pagination (`Pagination`)
- USWDS client init where required (`USWDSInit.tsx`)

## Deploy

- **Build output**: `_site/` (not `dist/`)
- **Cloud.gov Pages**: `npm run pages` runs the standard build
- Set **`BASEURL`** when the site is not served from domain root

## Docs in repo

- **`CONTENT.md`** — Adding councils, about/members-leaders Markdown, frontmatter
- **`STYLES_RESTORE_GUIDE.md`** / **`STYLES_CLEANUP_GUIDE.md`** — Historical SCSS cleanup (optional reference)
