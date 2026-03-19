import { useState, useMemo, useEffect, useRef } from 'react';
import { FilterPanel, FilterPills } from './FilterPanel';
import Pagination from './Pagination';
import {
  buildActiveFilters,
  buildFilterOptions,
  createEmptyFilters,
  filterItems,
  getInitialFiltersFromUrl,
  sanitizeHref,
  toArray,
  type Filters,
  type FilterableItem,
} from './filters';

interface Resource extends FilterableItem {
  id: string;
  title: string;
  description: string;
  type: string | string[];
  focusArea: string | string[];
  councilAcronym: string | string[];
  date: string;
  link: string;
}

interface ResourceFilterProps {
  resources: Resource[];
  /** Base URL for assets (e.g. import.meta.env.BASE_URL) so assets work in all environments */
  baseUrl?: string;
}

export default function ResourceFilter({ resources, baseUrl = '' }: ResourceFilterProps) {
  // Ensure resources is always an array
  const safeResources: Resource[] = Array.isArray(resources) ? resources : [];

  // Only allow ?council= to pre-select when it matches a council that exists in the data
  const allowedCouncilAcronyms = useMemo(
    () =>
      Array.from(
        new Set(safeResources.flatMap((r) => toArray(r.councilAcronym)))
      ),
    [safeResources]
  );

  const [selectedFilters, setSelectedFilters] = useState<Filters>(() =>
    getInitialFiltersFromUrl(allowedCouncilAcronyms)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const filterHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const hasMountedRef = useRef(false);
  const paginationInitializedRef = useRef(false);

  const PAGE_SIZE = 12;

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

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));
  const resultsRangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const resultsRangeEnd = Math.min(currentPage * PAGE_SIZE, filteredResources.length);
  const resultsCountText =
    filteredResources.length > 0
      ? `Showing ${resultsRangeStart} to ${resultsRangeEnd} of ${filteredResources.length} resources`
      : null;
  const paginatedResources = useMemo(
    () =>
      filteredResources.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredResources, currentPage]
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
    setCurrentPage(1);
  }, [selectedFilters]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (resultsTopRef.current) {
      const targetTop = resultsTopRef.current.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > targetTop) {
        window.scrollTo({ top: targetTop });
      }
    }

    requestAnimationFrame(() => {
      resultsTopRef.current?.focus({ preventScroll: true });
    });
  }, [selectedFilters, filteredResources.length]);

  useEffect(() => {
    if (!paginationInitializedRef.current) {
      paginationInitializedRef.current = true;
      return;
    }
    requestAnimationFrame(() => {
      resultsTopRef.current?.focus({ preventScroll: true });
    });
  }, [currentPage]);

  return (
    <div className="grid-row grid-gap sidebar-layout">
      <aside
        className="sidebar-layout__sidebar"
        role="region"
        aria-label="Filter resources by council, focus area, type, and year"
      >
        <FilterPanel
          options={filterOptions}
          selected={selectedFilters}
          onToggle={toggleSelection}
          onReset={resetFilters}
          filterHeadingRef={filterHeadingRef}
        />
      </aside>

      <div
        className="sidebar-layout__main"
        ref={resultsTopRef}
        role="region"
        aria-label="Filter results"
        tabIndex={-1}
      >
        <p
          className="font-sans-sm text-bold margin-top-0 margin-bottom-2"
          aria-live="polite"
          aria-atomic="true"
          role="status"
        >
          {resultsCountText ? (
            <>
              <span>
                {activeFilters.length > 0 && (
                  <span className="usa-sr-only">Filters applied: </span>
                )}
                {resultsCountText}
              </span>
            </>
          ) : (
            'No resources match the selected filters'
          )}
        </p>
        <FilterPills activeFilters={activeFilters} onRemove={removeSelection} baseUrl={baseUrl} />

        <div className="grid-row grid-gap resource-cards-grid">
          {filteredResources.length > 0 ? (
            <>
              {paginatedResources.map((resource) => {
              const rawHref = resource.link.startsWith('/')
                ? `${baseUrl.replace(/\/$/, '')}${resource.link}`
                : resource.link;
              const href = sanitizeHref(rawHref) ?? '#';
              return (
              <div key={resource.id} className="tablet:grid-col-6 desktop:grid-col-4">
                <a
                  href={href}
                  className="usa-card display-block text-no-underline resource-card-link resource-card-link--bordered"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${resource.title} (opens in new tab)`}
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
                      <div className="content-tags">
                        {toArray(resource.councilAcronym).map((acronym) => (
                          <span key={acronym} className="usa-tag">
                            {acronym}
                          </span>
                        ))}
                        {toArray(resource.type).map((t) => (
                          <span key={t} className="usa-tag resource-tag--type">
                            {t}
                          </span>
                        ))}
                        {toArray(resource.focusArea).map((area) => (
                          <span key={area} className="usa-tag">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="usa-card__footer">
                      <span className="usa-link usa-link--external font-sans-sm">View resource</span>
                    </div>
                  </div>
                </a>
              </div>
              );
            })}
              {totalPages > 1 && (
                <div className="tablet:grid-col-12 margin-top-0 display-flex flex-justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    ariaLabel="Resources results"
                  />
                </div>
              )}
            </>
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

