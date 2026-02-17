/**
 * Builds the list of councils for the header (and anywhere else) from the content directory.
 * Any council with an about.md in src/content/councils/{slug}/ is included, sorted by councilName.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const contentDir = join(process.cwd(), "src/content/councils");

export interface NavCouncil {
  slug: string;
  acronym: string;
  councilName: string;
}

function getNavCouncils(): NavCouncil[] {
  if (!existsSync(contentDir)) return [];
  const slugs = readdirSync(contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const councils: NavCouncil[] = [];
  for (const slug of slugs) {
    const aboutPath = join(contentDir, slug, "about.md");
    if (!existsSync(aboutPath)) continue;
    const { data } = matter(readFileSync(aboutPath, "utf-8"));
    const councilName = (data.councilName as string) ?? slug;
    const acronym = (data.logoAlt as string)?.replace(/\s*Logo\s*$/i, "").trim() || slug.toUpperCase();
    councils.push({ slug, acronym, councilName });
  }
  councils.sort((a, b) => a.councilName.localeCompare(b.councilName, "en-US"));
  return councils;
}

export const navCouncils = getNavCouncils();
