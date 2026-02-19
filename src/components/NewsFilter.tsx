import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterPanel, FilterPills } from './FilterPanel';
import {
  buildActiveFilters,
  buildFilterOptions,
  createEmptyFilters,
  filterItems,
  getInitialFiltersFromUrl,
  type Filters,
  type FilterableItem,
} from './filters';

interface NewsItem extends FilterableItem {
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
    () => buildFilterOptions(safeItems, selectedFilters),
    [safeItems, selectedFilters]
  );

  const filteredItems = useMemo(
    () => filterItems(safeItems, selectedFilters),
    [safeItems, selectedFilters]
  );

  const activeFilters = useMemo(() => buildActiveFilters(selectedFilters), [selectedFilters]);

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
    <div className="grid-row grid-gap sidebar-layout">
      <aside className="sidebar-layout__sidebar margin-bottom-4 tablet:margin-bottom-0">
        <FilterPanel
          options={filterOptions}
          selected={selectedFilters}
          onToggle={toggleSelection}
          onReset={resetFilters}
        />
      </aside>

      <div className="sidebar-layout__main" ref={resultsTopRef}>
        <FilterPills activeFilters={activeFilters} onRemove={removeSelection} baseUrl={baseUrl} />

        {filteredItems.length > 0 ? (
          <ul className="usa-collection">
            {filteredItems.map((item) => {
              const href = getItemHref(item, baseUrl);
              return (
              <li key={item.id} className="usa-collection__item">
                <div className="usa-collection__body">
                  <h3 className="usa-collection__heading">
                    {href ? (
                      <a className="usa-link font-serif" href={href}>
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  <div className="resource-date margin-top-05">
                    <time dateTime={item.date}>
                      {item.dateDisplay ?? formatDate(item.date)}
                    </time>
                  </div>
                  <p className="usa-collection__description margin-bottom-2">{truncateDescription(item.description)}</p>
                  {(item.councilAcronym || (item.tags?.length ?? 0) > 0) && (
                    <ul className="usa-collection__meta content-tags news-tags" aria-label="Topics">
                      {item.councilAcronym && (
                        <li className="usa-tag">{item.councilAcronym}</li>
                      )}
                      {(item.tags ?? []).map((tag) => (
                        <li key={tag} className="usa-tag">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <p className="usa-intro">No news or events match the selected filters.</p>
        )}
      </div>
    </div>
  );
}
