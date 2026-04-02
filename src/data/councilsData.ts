/**
 * Single source of truth for council data.
 * Reads from src/content/councils/{slug}/about.md.
 * Drives: home page cards, nav, footer.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const contentDir = join(process.cwd(), "src/content/councils");

export interface NavCouncil {
  slug: string;
  acronym: string;
  councilName: string;
  /** When set, primary nav links here instead of `/{slug}/`. */
  externalSiteUrl?: string;
}

export interface CouncilForHome {
  title: string;
  acronym: string;
  slug: string;
  href: string;
  /** True when `href` is off-site (from `externalSiteUrl` in about.md). */
  isExternal: boolean;
  logo: string;
  logoAlt: string;
  logoClass: string;
  description: string;
}

interface AboutFrontmatter {
  councilName?: string;
  councilSlug?: string;
  /** If set, this council has no on-site About/Members pages; nav and home link here. */
  externalSiteUrl?: string;
  logoPath?: string;
  logoAlt?: string;
  logoClass?: string;
  shortDescription?: string;
}

function getCouncilsFromAbout(): Array<{
  slug: string;
  councilName: string;
  acronym: string;
  externalSiteUrl?: string;
  logoPath: string;
  logoAlt: string;
  logoClass: string;
  shortDescription: string;
}> {
  if (!existsSync(contentDir)) return [];
  const slugs = readdirSync(contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const councils: Array<{
    slug: string;
    councilName: string;
    acronym: string;
    externalSiteUrl?: string;
    logoPath: string;
    logoAlt: string;
    logoClass: string;
    shortDescription: string;
  }> = [];

  for (const slug of slugs) {
    const aboutPath = join(contentDir, slug, "about.md");
    if (!existsSync(aboutPath)) continue;

    const { data } = matter(readFileSync(aboutPath, "utf-8")) as { data: AboutFrontmatter };
    const councilName = data.councilName ?? slug;
    const acronym =
      (data.logoAlt as string)?.replace(/\s*Logo\s*$/i, "").trim() || slug.toUpperCase();
    const defaultLogoPath = `/assets/img/councils/${slug}_logo.png`;
    const logoPath =
      data.logoPath && String(data.logoPath).trim()
        ? String(data.logoPath).trim()
        : defaultLogoPath;
    const logoAlt = data.logoAlt ?? `${acronym} Logo`;
    const logoClass = data.logoClass ?? "council-logo";
    const shortDescription = data.shortDescription ?? "";
    const externalRaw = data.externalSiteUrl != null ? String(data.externalSiteUrl).trim() : "";
    const externalSiteUrl = externalRaw || undefined;

    councils.push({
      slug,
      councilName,
      acronym,
      externalSiteUrl,
      logoPath,
      logoAlt,
      logoClass,
      shortDescription,
    });
  }

  councils.sort((a, b) => a.councilName.localeCompare(b.councilName, "en-US"));
  return councils;
}

const councilsCache = getCouncilsFromAbout();

/** For nav and footer: slug, acronym, councilName */
export function getNavCouncils(): NavCouncil[] {
  return councilsCache.map(({ slug, acronym, councilName, externalSiteUrl }) => ({
    slug,
    acronym,
    councilName,
    ...(externalSiteUrl ? { externalSiteUrl } : {}),
  }));
}

/** For home page cards: full data including description, logo, href */
export function getCouncilsForHome(): CouncilForHome[] {
  return councilsCache.map((c) => {
    const ext = c.externalSiteUrl?.trim();
    const isExternal = Boolean(ext);
    return {
      title: c.councilName,
      acronym: c.acronym,
      slug: c.slug,
      href: ext || `/${c.slug}/`,
      isExternal,
      logo: c.logoPath,
      logoAlt: c.logoAlt,
      logoClass: c.logoClass,
      description: c.shortDescription,
    };
  });
}
