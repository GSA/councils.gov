import { useState, useMemo, type CSSProperties, type Dispatch, type SetStateAction } from 'react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  focusArea: string;
  councilAcronym: string;
  date: string;
  link: string;
}

interface ResourceFilterProps {
  resources: Resource[];
}

// Color mapping for resource types
const typeColors: Record<string, string> = {
  Guidance: '#4D8055',
  Memorandum: '#E5A000',
  Reference: '#8168B3',
  'Quick Reference': '#8168B3',
  Playbook: '#005EA2',
  DEFAULT: '#005EA2',
};

type Filters = {
  councils: string[];
  focusAreas: string[];
  types: string[];
  years: string[];
};

const getResourceYear = (resource: Resource) =>
  resource.date ? resource.date.split('-')[0].trim() : '';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'item';

const matchesFilters = (resource: Resource, filters: Filters) => {
  const resourceYear = getResourceYear(resource);
  const councilMatch =
    filters.councils.length === 0 || filters.councils.includes(resource.councilAcronym);
  const focusAreaMatch =
    filters.focusAreas.length === 0 || filters.focusAreas.includes(resource.focusArea);
  const typeMatch = filters.types.length === 0 || filters.types.includes(resource.type);
  const yearMatch = filters.years.length === 0 || filters.years.includes(resourceYear);

  return councilMatch && focusAreaMatch && typeMatch && yearMatch;
};

export default function ResourceFilter({ resources }: ResourceFilterProps) {
  // Ensure resources is always an array
  const safeResources = Array.isArray(resources) ? resources : [];
  
  const [selectedCouncils, setSelectedCouncils] = useState<string[]>([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const toggleSelection = (
    value: string,
    setSelected: Dispatch<SetStateAction<string[]>>
  ) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const councils = useMemo(() => {
    const filtered = safeResources.filter((resource) =>
      matchesFilters(resource, {
        councils: [],
        focusAreas: selectedFocusAreas,
        types: selectedTypes,
        years: selectedYears,
      })
    );
    const values = Array.from(
      new Set([...filtered.map((r) => r.councilAcronym), ...selectedCouncils])
    );
    return values.filter(Boolean).sort();
  }, [safeResources, selectedFocusAreas, selectedTypes, selectedYears, selectedCouncils]);

  const focusAreas = useMemo(() => {
    const filtered = safeResources.filter((resource) =>
      matchesFilters(resource, {
        councils: selectedCouncils,
        focusAreas: [],
        types: selectedTypes,
        years: selectedYears,
      })
    );
    const values = Array.from(
      new Set([...filtered.map((r) => r.focusArea), ...selectedFocusAreas])
    );
    return values.filter(Boolean).sort();
  }, [safeResources, selectedCouncils, selectedTypes, selectedYears, selectedFocusAreas]);

  const types = useMemo(() => {
    const filtered = safeResources.filter((resource) =>
      matchesFilters(resource, {
        councils: selectedCouncils,
        focusAreas: selectedFocusAreas,
        types: [],
        years: selectedYears,
      })
    );
    const values = Array.from(new Set([...filtered.map((r) => r.type), ...selectedTypes]));
    return values.filter(Boolean).sort();
  }, [safeResources, selectedCouncils, selectedFocusAreas, selectedYears, selectedTypes]);

  const years = useMemo(() => {
    const filtered = safeResources.filter((resource) =>
      matchesFilters(resource, {
        councils: selectedCouncils,
        focusAreas: selectedFocusAreas,
        types: selectedTypes,
        years: [],
      })
    );
    const values = Array.from(
      new Set([
        ...filtered
          .map((resource) => getResourceYear(resource))
          .filter((year) => Boolean(year) && year !== '1900'),
        ...selectedYears,
      ])
    );
    return values.filter(Boolean).sort().reverse();
  }, [safeResources, selectedCouncils, selectedFocusAreas, selectedTypes, selectedYears]);

  const filteredResources = useMemo(
    () =>
      safeResources.filter((resource) =>
        matchesFilters(resource, {
          councils: selectedCouncils,
          focusAreas: selectedFocusAreas,
          types: selectedTypes,
          years: selectedYears,
        })
      ),
    [safeResources, selectedCouncils, selectedFocusAreas, selectedTypes, selectedYears]
  );

  const activeFilters = [
    ...selectedCouncils.map((value) => ({ type: 'Council', value })),
    ...selectedFocusAreas.map((value) => ({ type: 'Focus Area', value })),
    ...selectedTypes.map((value) => ({ type: 'Type', value })),
    ...selectedYears.map((value) => ({ type: 'Year', value })),
  ];

  const formatDate = (dateString: string) => {
    // Extract year from date string (format: YYYY-MM-DD)
    // Since CSV only contains years, just return the year
    if (dateString && dateString.includes('-')) {
      const year = dateString.split('-')[0];
      return year;
    }
    return dateString;
  };

  return (
    <div>
      <div className="resource-filter-top margin-bottom-4">
        <div className="grid-row grid-gap">
          <div className="tablet:grid-col-3">
            <details className="resource-filter-dropdown">
              <summary className="usa-button usa-button--outline resource-filter-dropdown__summary">
                Council
              </summary>
              <div className="resource-filter-dropdown__panel">
                <div className="resource-filter-options">
                  {councils.map((council) => {
                    const id = `filter-council-${slugify(council)}`;
                    return (
                      <div className="usa-checkbox" key={council}>
                        <input
                          className="usa-checkbox__input"
                          id={id}
                          type="checkbox"
                          checked={selectedCouncils.includes(council)}
                          onChange={() => toggleSelection(council, setSelectedCouncils)}
                        />
                        <label className="usa-checkbox__label" htmlFor={id}>
                          {council}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          </div>
          <div className="tablet:grid-col-3">
            <details className="resource-filter-dropdown">
              <summary className="usa-button usa-button--outline resource-filter-dropdown__summary">
                Focus Area
              </summary>
              <div className="resource-filter-dropdown__panel">
                <div className="resource-filter-options">
                  {focusAreas.map((area) => {
                    const id = `filter-focus-area-${slugify(area)}`;
                    return (
                      <div className="usa-checkbox" key={area}>
                        <input
                          className="usa-checkbox__input"
                          id={id}
                          type="checkbox"
                          checked={selectedFocusAreas.includes(area)}
                          onChange={() => toggleSelection(area, setSelectedFocusAreas)}
                        />
                        <label className="usa-checkbox__label" htmlFor={id}>
                          {area}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          </div>
          <div className="tablet:grid-col-3">
            <details className="resource-filter-dropdown">
              <summary className="usa-button usa-button--outline resource-filter-dropdown__summary">
                Type
              </summary>
              <div className="resource-filter-dropdown__panel">
                <div className="resource-filter-options">
                  {types.map((type) => {
                    const id = `filter-type-${slugify(type)}`;
                    return (
                      <div className="usa-checkbox" key={type}>
                        <input
                          className="usa-checkbox__input"
                          id={id}
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleSelection(type, setSelectedTypes)}
                        />
                        <label className="usa-checkbox__label" htmlFor={id}>
                          {type}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          </div>
          <div className="tablet:grid-col-3">
            <details className="resource-filter-dropdown">
              <summary className="usa-button usa-button--outline resource-filter-dropdown__summary">
                Year
              </summary>
              <div className="resource-filter-dropdown__panel">
                <div className="resource-filter-options">
                  {years.map((year) => {
                    const id = `filter-year-${slugify(year)}`;
                    return (
                      <div className="usa-checkbox" key={year}>
                        <input
                          className="usa-checkbox__input"
                          id={id}
                          type="checkbox"
                          checked={selectedYears.includes(year)}
                          onChange={() => toggleSelection(year, setSelectedYears)}
                        />
                        <label className="usa-checkbox__label" htmlFor={id}>
                          {year}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          </div>
        </div>
        <div className="resource-filter-actions margin-top-2">
          <button
            type="button"
            className="usa-button usa-button--outline"
            onClick={() => {
              setSelectedCouncils([]);
              setSelectedFocusAreas([]);
              setSelectedTypes([]);
              setSelectedYears([]);
            }}
          >
            Reset filters
          </button>
          <p className="font-sans-md margin-0 text-bold">
            {filteredResources.length} {filteredResources.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>
      </div>

      <div
        className={`resource-filter-pills margin-bottom-2 ${
          activeFilters.length === 0 ? 'resource-filter-pills--empty' : ''
        }`}
      >
        {activeFilters.map((filter) => (
          <button
            key={`${filter.type}-${filter.value}`}
            type="button"
            className="usa-tag resource-filter-pill"
            aria-label={`Remove ${filter.value}`}
            onClick={() => {
              if (filter.type === 'Council') {
                setSelectedCouncils((prev) => prev.filter((value) => value !== filter.value));
              } else if (filter.type === 'Focus Area') {
                setSelectedFocusAreas((prev) => prev.filter((value) => value !== filter.value));
              } else if (filter.type === 'Type') {
                setSelectedTypes((prev) => prev.filter((value) => value !== filter.value));
              } else if (filter.type === 'Year') {
                setSelectedYears((prev) => prev.filter((value) => value !== filter.value));
              }
            }}
          >
            <span className="resource-filter-pill__label">{filter.value}</span>
            <span aria-hidden="true" className="resource-filter-pill__icon">
              ×
            </span>
          </button>
        ))}
      </div>

      <div className="grid-row grid-gap">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <div key={resource.id} className="tablet:grid-col-6 desktop:grid-col-4">
              <a
                href={resource.link}
                className="usa-card display-block text-no-underline resource-card-link"
                style={{
                  borderTop: `8px solid ${typeColors[resource.type] || typeColors.DEFAULT}`,
                }}
                target="_blank"
                rel="noreferrer noopener"
              >
                <div className="usa-card__container">
                  <header className="usa-card__header">
                    <h3 className="usa-card__heading">
                      {resource.title}
                      <span className="usa-sr-only"> (opens in a new tab)</span>
                    </h3>
                    <div className="resource-date margin-top-1">{formatDate(resource.date)}</div>
                  </header>
                  <div className="usa-card__body">
                    <p>{resource.description}</p>
                    <div className="margin-top-2 resource-tags">
                      <span className="usa-tag">{resource.councilAcronym}</span>
                      {resource.type && (
                        <span
                          className="usa-tag resource-tag--type"
                          style={
                            {
                              ['--resource-tag-color' as string]:
                                typeColors[resource.type] || typeColors.DEFAULT,
                              ['--resource-tag-text' as string]:
                                resource.type === 'Memorandum' ? '#1b1b1b' : '#ffffff',
                            } as CSSProperties
                          }
                        >
                          {resource.type}
                        </span>
                      )}
                      {resource.focusArea && <span className="usa-tag">{resource.focusArea}</span>}
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))
        ) : (
          <div className="tablet:grid-col-12">
            <p className="usa-intro">No resources match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

