/**
 * Map of federal agency names (lowercase) to their official .gov URLs.
 * Used for "View Agency Webpage" links on member cards.
 * Optional url on a member in frontmatter overrides this lookup.
 */
export const agencyUrls: Record<string, string> = {
  "department of agriculture": "https://www.usda.gov",
  "department of commerce": "https://www.commerce.gov",
  "department of education": "https://www.ed.gov",
  "department of energy": "https://www.energy.gov",
  "department of health and human services": "https://www.hhs.gov",
  "department of homeland security": "https://www.dhs.gov",
  "department of housing and urban development": "https://www.hud.gov",
  "department of justice": "https://www.justice.gov",
  "department of labor": "https://www.dol.gov",
  "department of state": "https://www.state.gov",
  "department of the air force": "https://www.af.mil",
  "department of the army": "https://www.army.mil",
  "department of the interior": "https://www.doi.gov",
  "department of the navy": "https://www.navy.mil",
  "department of the treasury": "https://home.treasury.gov",
  "department of transportation": "https://www.transportation.gov",
  "department of veterans affairs": "https://www.va.gov",
  "department of war": "https://www.defense.gov",
  "environmental protection agency": "https://www.epa.gov",
  "federal deposit insurance corporation": "https://www.fdic.gov",
  "general services administration": "https://www.gsa.gov",
  "national aeronautics and space administration": "https://www.nasa.gov",
  "national archives and records administration": "https://www.archives.gov",
  "national science foundation": "https://www.nsf.gov",
  "nuclear regulatory commission": "https://www.nrc.gov",
  "office of personnel management": "https://www.opm.gov",
  "office of management and budget": "https://www.whitehouse.gov/omb/",
  "office of the director of national intelligence": "https://www.dni.gov",
  "small business administration": "https://www.sba.gov",
  "social security administration": "https://www.ssa.gov",
  "appraisal subcommittee of the federal financial institutions examination council":
    "https://www.asc.gov",
};

/** Get agency URL for a member: use member.url if set, else lookup by agency then name. */
export function getAgencyUrl(member: { url?: string; name?: string; agency?: string }): string | null {
  if (member.url) return member.url;
  const agency = (member.agency ?? "").trim().toLowerCase();
  if (agency && agencyUrls[agency]) return agencyUrls[agency];
  const name = (member.name ?? "").trim().toLowerCase();
  if (!name) return null;
  return agencyUrls[name] ?? null;
}
