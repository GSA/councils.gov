# Content Management Guide

This site uses markdown files for easy content updates. All council pages are templated and pull content from markdown files.

## Directory Structure

Content files are located in `src/content/councils/[council-slug]/`:

```
src/content/councils/
├── cioc/
│   ├── about.md
│   └── members-leaders.md
└── coffa/
    ├── about.md
    └── members-leaders.md
```

## Adding a New Council

To add a new council:

1. Create a new directory in `src/content/councils/` with the council slug (e.g., `newcouncil/`)
2. Create `about.md` and `members-leaders.md` files in that directory
3. The pages will automatically be generated at `/newcouncil/` and `/newcouncil/members-leaders/`

## About Pages

The `about.md` file uses frontmatter for metadata and markdown for content.

**Frontmatter (required):**
- `title`: Page title
- `councilName`: Full council name (e.g., "CIOC")
- `councilSlug`: URL slug (e.g., "cioc")
- `logoPath`: Path to council logo image
- `logoAlt`: Alt text for logo
- `logoClass`: CSS class for logo styling (optional)

**Content:**
Write your content in standard markdown. Lists will automatically get the `usa-list` class applied.

Example:
```markdown
---
title: About CIOC
councilName: CIOC
councilSlug: cioc
logoPath: /assets/img/councils/CIOC.png
logoAlt: CIOC Logo
logoClass: cioc-logo-about
---

# About CIOC

Your content here...

## Mission

Mission statement...

## Goals

- Goal 1
- Goal 2
- Goal 3
```

## Leadership & Members Pages

The `members-leaders.md` file uses frontmatter for all structured data.

**Frontmatter (required):**
- `title`: Page title
- `councilName`: Full council name
- `councilSlug`: URL slug
- `intro`: Introduction paragraph text
- `leaders`: Array of leader objects (max 4)
  - `role`: Role title (e.g., "Chair", "Vice Chair")
  - `name`: Leader's name
  - `title`: Job title
  - `bio`: Short bio text
  - `image`: Path to leader image
  - `imageAlt`: Alt text for image
- `members`: Array of member objects
  - `agency`: Agency name
  - `name`: Representative's name
  - `title`: Job title
  - `logo`: Path to agency logo
  - `logoAlt`: Alt text for logo
- `membersIntro`: Introduction text for members section

Example:
```markdown
---
title: CIOC Leadership & Members
councilName: CIOC
councilSlug: cioc
intro: The CIOC is composed of...
leaders:
  - role: Chair
    name: Dr. Michael Chen
    title: Chief Information Officer, Department of Technology
    bio: Leading the CIOC's strategic initiatives...
    image: /assets/img/leaders/leader-1.svg
    imageAlt: Dr. Michael Chen
members:
  - agency: Department of Commerce
    name: Robert Martinez
    title: Chief Information Officer
    logo: /assets/img/agencies/commerce.svg
    logoAlt: Department of Commerce
membersIntro: The CIOC includes representatives...
---
```

## Editing Content

Simply edit the markdown files in `src/content/councils/[council-slug]/` and the changes will be reflected on the site. No need to edit `.astro` files for content changes.

## Images

- Council logos: Place in `public/assets/img/councils/`
- Leader images: Place in `public/assets/img/leaders/`
- Agency logos: Place in `public/assets/img/agencies/`
