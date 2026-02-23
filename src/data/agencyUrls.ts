/**
 * Map of federal agency names (lowercase) to their official .gov URLs.
 * Used for "View Agency Webpage" links on member cards.
 * Optional url on a member in frontmatter overrides this lookup.
 * Department of Transportation and Office of Personnel Management are intentionally
 * omitted; no link is shown when the member's agency has no entry here.
 */
export const agencyUrls: Record<string, string> = {
  "department of agriculture":
    "https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-financial-officer/federal-financial-assistance-policy",
  "department of commerce": "https://www.commerce.gov/oam/policy/financial-assistance-policy",
  "department of education":
    "https://www.ed.gov/grants-and-programs/apply-grant/grants-overview-us-department-of-education?src=pn",
  "department of energy": "https://www.energy.gov/management/financial-assistance",
  "department of health and human services": "https://www.hhs.gov/grants-contracts/grants/index.html",
  "department of homeland security": "https://www.dhs.gov/dhs-financial-assistance",
  "department of housing and urban development": "https://www.hud.gov",
  "department of justice": "https://www.justice.gov/grants",
  "department of labor": "https://www.dol.gov/grants",
  "department of state":
    "https://www.state.gov/bureaus-offices/under-secretary-for-management/bureau-of-the-comptroller-and-global-financial-services/",
  "department of the air force": "https://www.af.mil",
  "department of the army": "https://www.army.mil",
  "department of the interior": "https://www.doi.gov/pfm/cfo",
  "department of the navy": "https://www.navy.mil",
  "department of the treasury": "https://home.treasury.gov/services/treasury-financial-assistance",
  "department of veterans affairs":
    "https://department.va.gov/administrations-and-offices/management/finance/?redirect=1",
  "department of war": "https://rt.cto.mil/ddre-rt/science-and-technology-foundations/grants/",
  "environmental protection agency":
    "https://www.epa.gov/aboutepa/about-office-financial-operations-management",
  "federal deposit insurance corporation": "https://www.fdic.gov",
  "general services administration":
    "https://www.gsa.gov/about-us/organization/office-of-the-chief-financial-officer",
  "national aeronautics and space administration":
    "https://www.nasa.gov/grants-policy-and-compliance-team/",
  "national archives and records administration": "https://www.archives.gov",
  "national science foundation": "https://www.nsf.gov/bfa/dias",
  "nuclear regulatory commission": "https://www.nrc.gov/about-nrc/grants",
  "office of management and budget": "https://www.whitehouse.gov/omb/",
  "office of the director of national intelligence": "https://www.dni.gov",
  "small business administration":
    "https://www.sba.gov/about-sba/sba-locations/headquarters-offices/office-performance-planning-chief-financial-officer",
  "social security administration": "https://www.ssa.gov/oag/grants/",
  "appraisal subcommittee of the federal financial institutions examination council":
    "https://www.asc.gov",
};

/** Get agency URL for a member: use member.url if set, else lookup by agency then name. hideLink: true suppresses the link. */
export function getAgencyUrl(member: { url?: string; name?: string; agency?: string; hideLink?: boolean }): string | null {
  if (member.hideLink === true) return null;
  if (member.url) return member.url;
  const agency = (member.agency ?? "").trim().toLowerCase();
  if (agency && agencyUrls[agency]) return agencyUrls[agency];
  const name = (member.name ?? "").trim().toLowerCase();
  if (!name) return null;
  return agencyUrls[name] ?? null;
}
