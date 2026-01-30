import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type CSSProperties,
} from 'react';
import { FilterPanel, FilterPills } from './FilterPanel';
import {
  buildActiveFilters,
  buildFilterOptions,
  createEmptyFilters,
  filterItems,
  type Filters,
  type FilterableItem,
} from './filters';

interface Resource extends FilterableItem {
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
  const safeResources: Resource[] = Array.isArray(resources) ? resources : [];
  
  const [selectedFilters, setSelectedFilters] = useState<Filters>(createEmptyFilters());
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

  const toggleSelection = (group: keyof Filters, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[group];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  };

  const removeSelection = (group: keyof Filters, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [group]: prev[group].filter((item) => item !== value),
    }));
  };

  const resetFilters = () => {
    setSelectedFilters(createEmptyFilters());
  };

  const filterOptions = useMemo(
    () => buildFilterOptions(safeResources, selectedFilters),
    [safeResources, selectedFilters]
  );

  const filteredResources = useMemo(
    () => filterItems(safeResources, selectedFilters),
    [safeResources, selectedFilters]
  );

  const activeFilters = useMemo(() => buildActiveFilters(selectedFilters), [selectedFilters]);

  const formatDate = (dateString: string) => {
    // Extract year from date string (format: YYYY-MM-DD)
    // Since CSV only contains years, just return the year
    if (dateString && dateString.includes('-')) {
      const year = dateString.split('-')[0];
      return year;
    }
    return dateString;
  };

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (resultsTopRef.current) {
      const targetTop = resultsTopRef.current.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > targetTop) {
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }
  }, [selectedFilters]);

  return (
    <div className="grid-row grid-gap">
      <aside className="tablet:grid-col-3 margin-bottom-4 tablet:margin-bottom-0">
        <FilterPanel
          options={filterOptions}
          selected={selectedFilters}
          onToggle={toggleSelection}
          onReset={resetFilters}
        />
      </aside>

      <div className="tablet:grid-col-9" ref={resultsTopRef}>
        <div className="margin-bottom-1">
          <p className="font-sans-lg margin-0 text-bold">
            {filteredResources.length} {filteredResources.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>

        <FilterPills activeFilters={activeFilters} onRemove={removeSelection} />

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
                      <div className="resource-date margin-top-1">
                        {formatDate(resource.date)}
                      </div>
                    </header>
                    <div className="usa-card__body">
                      <p>{resource.description}</p>
                      <div className="margin-top-2 content-tags">
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
    </div>
  );
}

