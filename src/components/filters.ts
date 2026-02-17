export type Filters = {
  councils: string[];
  focusAreas: string[];
  types: string[];
  years: string[];
};

export type FilterableItem = {
  councilAcronym?: string;
  focusArea?: string;
  type?: string;
  date?: string;
};

export const createEmptyFilters = (): Filters => ({
  councils: [],
  focusAreas: [],
  types: [],
  years: [],
});

/** Initial filters from URL ?council= (for when navigating from a council page). Client-only. */
export const getInitialFiltersFromUrl = (): Filters => {
  if (typeof window === 'undefined') return createEmptyFilters();
  const council = new URLSearchParams(window.location.search).get('council');
  if (!council?.trim()) return createEmptyFilters();
  return { ...createEmptyFilters(), councils: [council.trim()] };
};

export const getItemYear = (item: FilterableItem) =>
  item.date ? item.date.split('-')[0].trim() : '';

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'item';

export const matchesFilters = (item: FilterableItem, filters: Filters) => {
  const councilValue = item.councilAcronym ?? '';
  const focusAreaValue = item.focusArea ?? '';
  const typeValue = item.type ?? '';
  const yearValue = getItemYear(item);

  const councilMatch = filters.councils.length === 0 || filters.councils.includes(councilValue);
  const focusAreaMatch =
    filters.focusAreas.length === 0 || filters.focusAreas.includes(focusAreaValue);
  const typeMatch = filters.types.length === 0 || filters.types.includes(typeValue);
  const yearMatch = filters.years.length === 0 || filters.years.includes(yearValue);

  return councilMatch && focusAreaMatch && typeMatch && yearMatch;
};

export const buildFilterOptions = <T extends FilterableItem>(items: T[], selected: Filters) => {
  const councils = Array.from(
    new Set([
      ...items
        .filter((item) =>
          matchesFilters(item, {
            councils: [],
            focusAreas: selected.focusAreas,
            types: selected.types,
            years: selected.years,
          })
        )
        .map((item) => item.councilAcronym ?? ''),
      ...selected.councils,
    ])
  )
    .filter(Boolean)
    .sort();

  const focusAreas = Array.from(
    new Set([
      ...items
        .filter((item) =>
          matchesFilters(item, {
            councils: selected.councils,
            focusAreas: [],
            types: selected.types,
            years: selected.years,
          })
        )
        .map((item) => item.focusArea ?? ''),
      ...selected.focusAreas,
    ])
  )
    .filter(Boolean)
    .sort();

  const types = Array.from(
    new Set([
      ...items
        .filter((item) =>
          matchesFilters(item, {
            councils: selected.councils,
            focusAreas: selected.focusAreas,
            types: [],
            years: selected.years,
          })
        )
        .map((item) => item.type ?? ''),
      ...selected.types,
    ])
  )
    .filter(Boolean)
    .sort();

  const years = Array.from(
    new Set([
      ...items
        .filter((item) =>
          matchesFilters(item, {
            councils: selected.councils,
            focusAreas: selected.focusAreas,
            types: selected.types,
            years: [],
          })
        )
        .map((item) => getItemYear(item))
        .filter((year) => Boolean(year) && year !== '1900'),
      ...selected.years,
    ])
  )
    .filter(Boolean)
    .sort()
    .reverse();

  return { councils, focusAreas, types, years };
};

export const filterItems = <T extends FilterableItem>(items: T[], selected: Filters): T[] =>
  items.filter((item) => matchesFilters(item, selected));

export const buildActiveFilters = (selected: Filters) => [
  ...selected.councils.map((value) => ({ type: 'Council', value })),
  ...selected.focusAreas.map((value) => ({ type: 'Focus Area', value })),
  ...selected.types.map((value) => ({ type: 'Type', value })),
  ...selected.years.map((value) => ({ type: 'Year', value })),
];
