import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterPanel, FilterPills } from './FilterPanel';
import Pagination from './Pagination';
import {
  buildActiveFilters,
  buildFilterOptionsForNews,
  createEmptyFilters,
  filterItemsForNews,
  getInitialFiltersFromUrl,
  type Filters,
  type FilterableItem,
} from './filters';

export interface NewsItem extends FilterableItem {
  id: string;
  title: string;
  description: string;
  date: string;
  /** Optional display date (e.g. "September 24-25, 2025" for events) */
  dateDisplay?: string;
  link?: string;
  slug?: string;
  kind?: 'news' | 'event';
  tags?: string[];
  /** Optional thumbnail image path (e.g. /assets/img/symposium-thumbnail.jpg) */
  thumbnail?: string;
}

interface NewsFilterProps {
  items: NewsItem[];
  /** Base URL for the site (e.g. from import.meta.env.BASE_URL) for internal links */
  baseUrl?: string;
}

const formatDate = (dateString: string) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const DESCRIPTION_MAX_LENGTH = 160;

function truncateDescription(text: string, maxLength: number = DESCRIPTION_MAX_LENGTH): string {
  if (!text || text.length <= maxLength) return text;
  const trimmed = text.slice(0, maxLength).trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return trimmed.slice(0, lastSpace) + '…';
  }
  return trimmed + '…';
}

function getItemHref(item: NewsItem, baseUrl: string): string | null {
  const base = baseUrl ?? '';
  if (item.slug && item.kind) {
    const segment = item.kind === 'event' ? 'events' : 'news';
    return `${base}news-events/${segment}/${item.slug}/`;
  }
  return item.link ?? null;
}

export default function NewsFilter({ items, baseUrl = '' }: NewsFilterProps) {
  const safeItems = Array.isArray(items) ? items : [];
  const allowedCouncilAcronyms = useMemo(
    () => Array.from(new Set(safeItems.map((i) => i.councilAcronym).filter(Boolean))),
    [safeItems]
  );
  const [selectedFilters, setSelectedFilters] = useState<Filters>(() => 
    getInitialFiltersFromUrl(allowedCouncilAcronyms as string[])
  );
  const [currentPage, setCurrentPage] = useState(1);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);
  const hasMountedRef = useRef(false);
  const paginationInitializedRef = useRef(false);

  const PAGE_SIZE = 10;

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
    () => buildFilterOptionsForNews(safeItems, selectedFilters),
    [safeItems, selectedFilters]
  );

  const filteredItems = useMemo(
    () => filterItemsForNews(safeItems, selectedFilters),
    [safeItems, selectedFilters]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(
    () =>
      filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredItems, currentPage]
  );

  const activeFilters = useMemo(
    () =>
      buildActiveFilters(selectedFilters).filter(
        (f) => f.type === 'Council' || f.type === 'Year'
      ),
    [selectedFilters]
  );

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
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }
  }, [selectedFilters]);

  useEffect(() => {
    if (!paginationInitializedRef.current) {
      paginationInitializedRef.current = true;
      return;
    }
    requestAnimationFrame(() => {
      if (firstItemRef.current) {
        firstItemRef.current.focus({ preventScroll: true });
      } else if (resultsTopRef.current) {
        resultsTopRef.current.focus({ preventScroll: true });
      }
    });
  }, [currentPage]);

  return (
    <div className="grid-row grid-gap sidebar-layout">
      <aside className="sidebar-layout__sidebar margin-bottom-4 tablet:margin-bottom-0">
        <FilterPanel
          options={filterOptions}
          selected={selectedFilters}
          onToggle={toggleSelection}
          onReset={resetFilters}
          filterGroups={['councils', 'years']}
        />
      </aside>

      <div
        className="sidebar-layout__main"
        ref={resultsTopRef}
        tabIndex={-1}
      >
        <FilterPills activeFilters={activeFilters} onRemove={removeSelection} baseUrl={baseUrl} />

        {filteredItems.length > 0 ? (
          <>
            <ul className="usa-collection">
              {paginatedItems.map((item) => {
              const href = getItemHref(item, baseUrl);
              const isFirst = paginatedItems[0]?.id === item.id;
              return (
              <li key={item.id} className="usa-collection__item">
                <div className="usa-collection__body">
                  <h3 className="usa-collection__heading">
                    {href ? (
                      <a
                        ref={isFirst ? firstItemRef : undefined}
                        className="usa-link font-serif"
                        href={href}
                      >
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  <div className="resource-date margin-bottom-2">
                    <time dateTime={item.date}>
                      {item.dateDisplay ?? formatDate(item.date)}
                    </time>
                  </div>
                  {item.councilAcronym && (
                    <ul className="usa-collection__meta content-tags news-tags" aria-label="Topics">
                      <li className="usa-tag">{item.councilAcronym}</li>
                    </ul>
                  )}
                  <p className="usa-collection__description margin-y-2">{truncateDescription(item.description)}</p>
                </div>
              </li>
              );
            })}
            </ul>
            {totalPages > 1 && (
              <div className="margin-top-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  ariaLabel="News and events results"
                />
              </div>
            )}
          </>
        ) : (
          <p className="usa-intro">No news or events match the selected filters.</p>
        )}
      </div>
    </div>
  );
}
