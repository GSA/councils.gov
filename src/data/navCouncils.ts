/**
 * Re-exports council data from councilsData (single source: about.md).
 */
import { getNavCouncils } from "./councilsData";
export { getNavCouncils, type NavCouncil } from "./councilsData";
export const navCouncils = getNavCouncils();
