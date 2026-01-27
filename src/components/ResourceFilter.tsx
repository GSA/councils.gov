import { useState, useMemo, type CSSProperties } from 'react';

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

export default function ResourceFilter({ resources }: ResourceFilterProps) {
  // Ensure resources is always an array
  const safeResources = Array.isArray(resources) ? resources : [];
  
  const [selectedCouncil, setSelectedCouncil] = useState<string>('all');
  const [selectedFocusArea, setSelectedFocusArea] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const resetAllFilters = () => {
    setSelectedCouncil('all');
    setSelectedFocusArea('all');
    setSelectedType('all');
    setSelectedYear('all');
  };

  const isAnyFilterSelected =
    selectedCouncil !== 'all' ||
    selectedFocusArea !== 'all' ||
    selectedType !== 'all' ||
    selectedYear !== 'all';

  // Filter resources based on selected filters (for dynamic filter options)
  const filteredForOptions = useMemo(() => {
    return safeResources.filter(resource => {
      const councilMatch = selectedCouncil === 'all' || resource.councilAcronym === selectedCouncil;
      const typeMatch = selectedType === 'all' || resource.type === selectedType;
      // Extract year from date string and compare as strings (strict equality with trimming)
      const resourceYear = resource.date ? resource.date.split('-')[0].trim() : '';
      const selectedYearTrimmed = String(selectedYear).trim();
      const yearMatch = selectedYearTrimmed === 'all' || resourceYear === selectedYearTrimmed;
      const focusAreaMatch = selectedFocusArea === 'all' || resource.focusArea === selectedFocusArea;
      return councilMatch && typeMatch && yearMatch && focusAreaMatch;
    });
  }, [safeResources, selectedCouncil, selectedType, selectedYear, selectedFocusArea]);

  // Get unique values for filters (dynamic based on other filters)
  // First, filter by council, type, and year to get intermediate results
  const intermediateFiltered = useMemo(() => {
    return safeResources.filter(resource => {
      const councilMatch = selectedCouncil === 'all' || resource.councilAcronym === selectedCouncil;
      const typeMatch = selectedType === 'all' || resource.type === selectedType;
      const resourceYear = resource.date ? resource.date.split('-')[0].trim() : '';
      const selectedYearTrimmed = String(selectedYear).trim();
      const yearMatch = selectedYearTrimmed === 'all' || resourceYear === selectedYearTrimmed;
      return councilMatch && typeMatch && yearMatch;
    });
  }, [safeResources, selectedCouncil, selectedType, selectedYear]);

  // Then filter by focus area to get final results
  const councils = useMemo(() => {
    // Show councils that exist in resources matching other filters
    const filtered = safeResources.filter(resource => {
      const typeMatch = selectedType === 'all' || resource.type === selectedType;
      const resourceYear = resource.date ? resource.date.split('-')[0].trim() : '';
      const selectedYearTrimmed = String(selectedYear).trim();
      const yearMatch = selectedYearTrimmed === 'all' || resourceYear === selectedYearTrimmed;
      const focusAreaMatch = selectedFocusArea === 'all' || resource.focusArea === selectedFocusArea;
      return typeMatch && yearMatch && focusAreaMatch;
    });
    const uniqueCouncils = Array.from(new Set(filtered.map(r => r.councilAcronym)));
    return uniqueCouncils.sort();
  }, [safeResources, selectedType, selectedYear, selectedFocusArea]);

  const focusAreas = useMemo(() => {
    const uniqueAreas = Array.from(new Set(intermediateFiltered.map(r => r.focusArea)));
    return uniqueAreas.sort();
  }, [intermediateFiltered]);

  const types = useMemo(() => {
    // Show types that exist in resources matching other filters
    const filtered = safeResources.filter(resource => {
      const councilMatch = selectedCouncil === 'all' || resource.councilAcronym === selectedCouncil;
      const resourceYear = resource.date ? resource.date.split('-')[0].trim() : '';
      const selectedYearTrimmed = String(selectedYear).trim();
      const yearMatch = selectedYearTrimmed === 'all' || resourceYear === selectedYearTrimmed;
      const focusAreaMatch = selectedFocusArea === 'all' || resource.focusArea === selectedFocusArea;
      return councilMatch && yearMatch && focusAreaMatch;
    });
    const uniqueTypes = Array.from(new Set(filtered.map(r => r.type)));
    return uniqueTypes.sort();
  }, [safeResources, selectedCouncil, selectedYear, selectedFocusArea]);

  const years = useMemo(() => {
    // Show years that exist in resources matching other filters
    const filtered = safeResources.filter(resource => {
      const councilMatch = selectedCouncil === 'all' || resource.councilAcronym === selectedCouncil;
      const typeMatch = selectedType === 'all' || resource.type === selectedType;
      const focusAreaMatch = selectedFocusArea === 'all' || resource.focusArea === selectedFocusArea;
      return councilMatch && typeMatch && focusAreaMatch;
    });
    const uniqueYears = Array.from(
      new Set(
        filtered
          .map((resource) => (resource.date ? resource.date.split('-')[0] : null))
          .filter((year): year is string => Boolean(year) && year !== '1900')
      )
    );
    return uniqueYears.sort().reverse();
  }, [safeResources, selectedCouncil, selectedType, selectedFocusArea]);

  // Filter resources based on all selected filters (already includes all filters)
  const filteredResources = filteredForOptions;

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
      <div className="grid-row grid-gap margin-bottom-2">
        <div className="tablet:grid-col-6 desktop:grid-col-3">
          <label htmlFor="council-filter" className="usa-label">
            Filter by Council Acronym
          </label>
          <select
            id="council-filter"
            className="usa-select"
            value={selectedCouncil}
            onChange={(e) => {
              setSelectedCouncil(e.target.value);
            }}
          >
            <option value="all">All Councils</option>
            {councils.map(council => (
              <option key={council} value={council}>{council}</option>
            ))}
          </select>
        </div>
        <div className="tablet:grid-col-6 desktop:grid-col-3">
          <label htmlFor="focus-area-filter" className="usa-label">
            Filter by Focus Area
          </label>
          <select
            id="focus-area-filter"
            className="usa-select"
            value={selectedFocusArea}
            onChange={(e) => setSelectedFocusArea(e.target.value)}
          >
            <option value="all">All Focus Areas</option>
            {focusAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="tablet:grid-col-6 desktop:grid-col-3">
          <label htmlFor="type-filter" className="usa-label">
            Filter by Type
          </label>
          <select
            id="type-filter"
            className="usa-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="tablet:grid-col-6 desktop:grid-col-3">
          <label htmlFor="year-filter" className="usa-label">
            Filter by Year
          </label>
          <select
            id="year-filter"
            className="usa-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid-row margin-bottom-4 display-flex flex-row tablet:flex-column flex-justify flex-align-end">
        <button
          type="button"
          className="usa-button usa-button--secondary margin-bottom-1 tablet:margin-bottom-0"
          onClick={resetAllFilters}
          disabled={!isAnyFilterSelected}
        >
          Clear all filters
        </button>
        <p className="text-bold margin-0">
          {filteredResources.length} {filteredResources.length === 1 ? 'Item' : 'Items'}
        </p>
      </div>

      <div className="grid-row grid-gap">
        {filteredResources.length > 0 ? (
          filteredResources.map(resource => (
            <div key={resource.id} className="tablet:grid-col-6 desktop:grid-col-4">
              <a 
                href={resource.link} 
                className="usa-card display-block text-no-underline resource-card-link"
                style={{ 
                  borderTop: `8px solid ${typeColors[resource.type] || typeColors.DEFAULT}` 
                }}
                target="_blank"
                rel="noreferrer noopener"
              >
                <div 
                  className="usa-card__container"
                >
                  <header className="usa-card__header">
                    <h3 className="usa-card__heading">
                      {resource.title}
                      <span className="usa-sr-only"> (opens in a new tab)</span>
                    </h3>
                    <div className="resource-date margin-top-1">
                      {formatDate(resource.date)}
                    </div>
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
                      {resource.focusArea && (
                        <span className="usa-tag">{resource.focusArea}</span>
                      )}
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

