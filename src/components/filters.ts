export type Filters = {
  councils: string[];
  focusAreas: string[];
  types: string[];
  years: string[];
};

export type FilterableItem = {
  councilAcronym?: string | string[];
  focusArea?: string | string[];
  type?: string | string[];
  date?: string;
};

/** Normalize a value that may be string or string[] to string[] */
export const toArray = (value: string | string[] | undefined): string[] => {
  if (value == null) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
};

export const createEmptyFilters = (): Filters => ({
  councils: [],
  focusAreas: [],
  types: [],
  years: [],
});

/**
 * Initial filters from URL ?council= (e.g. when navigating from a council About page).
 * Only applies the param if it is in allowedCouncils, so arbitrary values (e.g. ?council=BUTTS) are ignored.
 * Client-only.
 */
export const getInitialFiltersFromUrl = (allowedCouncils: string[]): Filters => {
  if (typeof window === 'undefined') return createEmptyFilters();
  const council = new URLSearchParams(window.location.search).get('council')?.trim();
  if (!council || allowedCouncils.length === 0) return createEmptyFilters();
  const allowedSet = new Set(allowedCouncils.map((c) => c.trim()).filter(Boolean));
  if (!allowedSet.has(council)) return createEmptyFilters();
  return { ...createEmptyFilters(), councils: [council] };
};

/** Display value for the filter option when a resource has no year. */
export const NO_YEAR_LABEL = 'No year';

export const getItemYear = (item: FilterableItem) =>
  item.date ? item.date.split('-')[0].trim() : '';

export const slugify = (value: string | string[] | unknown): string => {
  const str = Array.isArray(value) ? value[0] : value;
  return (typeof str === 'string' ? str : String(str ?? ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'item';
};

export const matchesFilters = (item: FilterableItem, filters: Filters) => {
  const councilValues = toArray(item.councilAcronym);
  const focusAreaValues = toArray(item.focusArea);
  const typeValues = toArray(item.type);
  const yearValue = getItemYear(item);

  const councilMatch =
    filters.councils.length === 0 || councilValues.some((c) => filters.councils.includes(c));
  const focusAreaMatch =
    filters.focusAreas.length === 0 ||
    focusAreaValues.some((f) => filters.focusAreas.includes(f));
  const typeMatch =
    filters.types.length === 0 || typeValues.some((t) => filters.types.includes(t));
  const yearMatch =
    filters.years.length === 0 ||
    (yearValue === '' && filters.years.includes(NO_YEAR_LABEL)) ||
    (yearValue !== '' && filters.years.includes(yearValue));

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
        .flatMap((item) => toArray(item.councilAcronym)),
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
        .flatMap((item) => toArray(item.focusArea)),
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
        .flatMap((item) => toArray(item.type)),
      ...selected.types,
    ])
  )
    .filter(Boolean)
    .sort();

  const itemsMatchingOtherFilters = items.filter((item) =>
    matchesFilters(item, {
      councils: selected.councils,
      focusAreas: selected.focusAreas,
      types: selected.types,
      years: [],
    })
  );
  const yearValues = itemsMatchingOtherFilters
    .map((item) => getItemYear(item))
    .filter((year) => year === '' || (Boolean(year) && year !== '1900'));
  const hasNoYear = yearValues.some((y) => y === '');
  const yearsSet = new Set([
    ...yearValues.filter(Boolean),
    ...selected.years,
    ...(hasNoYear ? [NO_YEAR_LABEL] : []),
  ]);
  const years = Array.from(yearsSet)
    .filter(Boolean)
    .sort((a, b) => {
      if (a === NO_YEAR_LABEL) return 1;
      if (b === NO_YEAR_LABEL) return -1;
      return b.localeCompare(a, undefined, { numeric: true });
    });

  return { councils, focusAreas, types, years };
};

export const filterItems = <T extends FilterableItem>(items: T[], selected: Filters): T[] =>
  items.filter((item) => matchesFilters(item, selected));

/** News/Events: only council and year filters. */
export const matchesFiltersForNews = (item: FilterableItem, filters: Filters) => {
  const councilValues = toArray(item.councilAcronym);
  const yearValue = getItemYear(item);
  const councilMatch =
    filters.councils.length === 0 || councilValues.some((c) => filters.councils.includes(c));
  const yearMatch =
    filters.years.length === 0 ||
    (yearValue === '' && filters.years.includes(NO_YEAR_LABEL)) ||
    (yearValue !== '' && filters.years.includes(yearValue));
  return councilMatch && yearMatch;
};

/** News/Events: build filter options for council and year only. */
export const buildFilterOptionsForNews = <T extends FilterableItem>(
  items: T[],
  selected: Filters
) => {
  const councils = Array.from(
    new Set([
      ...items
        .filter((item) =>
          matchesFiltersForNews(item, {
            councils: [],
            focusAreas: [],
            types: [],
            years: selected.years,
          })
        )
        .flatMap((item) => toArray(item.councilAcronym)),
      ...selected.councils,
    ])
  )
    .filter(Boolean)
    .sort();

  const itemsMatchingCouncil = items.filter((item) =>
    matchesFiltersForNews(item, {
      councils: selected.councils,
      focusAreas: [],
      types: [],
      years: [],
    })
  );
  const yearValues = itemsMatchingCouncil
    .map((item) => getItemYear(item))
    .filter((year) => year === '' || (Boolean(year) && year !== '1900'));
  const hasNoYear = yearValues.some((y) => y === '');
  const yearsSet = new Set([
    ...yearValues.filter(Boolean),
    ...selected.years,
    ...(hasNoYear ? [NO_YEAR_LABEL] : []),
  ]);
  const years = Array.from(yearsSet)
    .filter(Boolean)
    .sort((a, b) => {
      if (a === NO_YEAR_LABEL) return 1;
      if (b === NO_YEAR_LABEL) return -1;
      return b.localeCompare(a, undefined, { numeric: true });
    });

  return { councils, focusAreas: [], types: [], years };
};

export const filterItemsForNews = <T extends FilterableItem>(
  items: T[],
  selected: Filters
): T[] => items.filter((item) => matchesFiltersForNews(item, selected));

export const buildActiveFilters = (selected: Filters) => [
  ...selected.councils.map((value) => ({ type: 'Council', value })),
  ...selected.focusAreas.map((value) => ({ type: 'Focus Area', value })),
  ...selected.types.map((value) => ({ type: 'Type', value })),
  ...selected.years.map((value) => ({ type: 'Year', value })),
];
