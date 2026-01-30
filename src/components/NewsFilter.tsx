import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterPanel, FilterPills } from './FilterPanel';
import {
  buildActiveFilters,
  buildFilterOptions,
  createEmptyFilters,
  filterItems,
  type Filters,
  type FilterableItem,
} from './filters';

interface NewsItem extends FilterableItem {
  id: string;
  title: string;
  description: string;
  date: string;
  link: string;
  tags: string[];
}

interface NewsFilterProps {
  items: NewsItem[];
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

export default function NewsFilter({ items }: NewsFilterProps) {
  const safeItems = Array.isArray(items) ? items : [];
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
            {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'}
          </p>
        </div>

        <FilterPills activeFilters={activeFilters} onRemove={removeSelection} />

        {filteredItems.length > 0 ? (
          <ul className="usa-collection">
            {filteredItems.map((item) => (
              <li key={item.id} className="usa-collection__item">
                <div className="usa-collection__body">
                  <h3 className="usa-collection__heading">
                    <a className="usa-link" href={item.link} target="_blank" rel="noreferrer noopener">
                      {item.title}
                    </a>
                  </h3>
                  <p className="usa-collection__description">{item.description}</p>
                  <ul className="usa-collection__meta" aria-label="More information">
                    <li className="usa-collection__meta-item">
                      <time dateTime={item.date}>{formatDate(item.date)}</time>
                    </li>
                    {item.councilAcronym && (
                      <li className="usa-collection__meta-item">{item.councilAcronym}</li>
                    )}
                  </ul>
                  {item.tags.length > 0 && (
                    <ul className="usa-collection__meta" aria-label="Topics">
                      {item.tags.map((tag) => (
                        <li key={tag} className="usa-collection__meta-item usa-tag">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="usa-intro">No news or events match the selected filters.</p>
        )}
      </div>
    </div>
  );
}
