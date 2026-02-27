import { slugify, type Filters } from './filters';

export type FilterGroup = 'councils' | 'focusAreas' | 'types' | 'years';

type FilterPanelProps = {
  options: {
    councils: string[];
    focusAreas: string[];
    types: string[];
    years: string[];
  };
  selected: Filters;
  onToggle: (group: keyof Filters, value: string) => void;
  onReset: () => void;
  /** Which filter groups to show. Default: all. Use e.g. ['councils', 'years'] for News. */
  filterGroups?: FilterGroup[];
  filterHeadingRef?: React.RefObject<HTMLHeadingElement>;
};

type FilterPillsProps = {
  activeFilters: { type: string; value: string }[];
  onRemove: (group: keyof Filters, value: string) => void;
  /** Base URL for assets (e.g. import.meta.env.BASE_URL) so close icon works in all environments */
  baseUrl?: string;
};

export function FilterPanel({
  options,
  selected,
  onToggle,
  onReset,
  filterGroups = ['councils', 'focusAreas', 'types', 'years'],
  filterHeadingRef,
}: FilterPanelProps) {
  const { councils, focusAreas, types, years } = options;
  const show = (g: FilterGroup) => filterGroups.includes(g);

  const handleReset = () => {
    onReset();
    requestAnimationFrame(() => {
      filterHeadingRef?.current?.focus();
    });
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-sidebar__header">
        <h2 ref={filterHeadingRef} className="font-sans-lg" tabIndex={-1}>
          Filters
        </h2>
        {(selected.councils.length > 0 ||
          (show('focusAreas') && selected.focusAreas.length > 0) ||
          (show('types') && selected.types.length > 0) ||
          selected.years.length > 0) && (
          <button
            type="button"
            className="usa-button--unstyled usa-link margin-bottom-2"
            onClick={handleReset}
          >
            Reset filters
          </button>
        )}
      </div>
      <div className="usa-accordion" aria-multiselectable="true" data-allow-multiple="true">
        <h3 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="filter-councils"
          >
            {selected.councils.length > 0 ? `Councils (${selected.councils.length})` : 'Councils'}
          </button>
        </h3>
        <div id="filter-councils" className="usa-accordion__content usa-prose">
          <div className="filter-options">
            {councils.map((council) => {
              const id = `filter-council-${slugify(council)}`;
              return (
                <div className="usa-checkbox" key={council}>
                  <input
                    className="usa-checkbox__input"
                    id={id}
                    type="checkbox"
                    checked={selected.councils.includes(council)}
                    onChange={() => onToggle('councils', council)}
                  />
                  <label className="usa-checkbox__label" htmlFor={id}>
                    {council}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {show('focusAreas') && (
          <>
            <h3 className="usa-accordion__heading">
              <button
                type="button"
                className="usa-accordion__button"
                aria-expanded="false"
                aria-controls="filter-focus-areas"
              >
                {selected.focusAreas.length > 0 ? `Focus Area (${selected.focusAreas.length})` : 'Focus Area'}
              </button>
            </h3>
            <div id="filter-focus-areas" className="usa-accordion__content usa-prose">
              <div className="filter-options">
                {focusAreas.map((area) => {
                  const id = `filter-focus-area-${slugify(area)}`;
                  return (
                    <div className="usa-checkbox" key={area}>
                      <input
                        className="usa-checkbox__input"
                        id={id}
                        type="checkbox"
                        checked={selected.focusAreas.includes(area)}
                        onChange={() => onToggle('focusAreas', area)}
                      />
                      <label className="usa-checkbox__label" htmlFor={id}>
                        {area}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {show('types') && (
          <>
            <h3 className="usa-accordion__heading">
              <button
                type="button"
                className="usa-accordion__button"
                aria-expanded="false"
                aria-controls="filter-types"
              >
                {selected.types.length > 0 ? `Type (${selected.types.length})` : 'Type'}
              </button>
            </h3>
            <div id="filter-types" className="usa-accordion__content usa-prose">
              <div className="filter-options">
                {types.map((type) => {
                  const id = `filter-type-${slugify(type)}`;
                  return (
                    <div className="usa-checkbox" key={type}>
                      <input
                        className="usa-checkbox__input"
                        id={id}
                        type="checkbox"
                        checked={selected.types.includes(type)}
                        onChange={() => onToggle('types', type)}
                      />
                      <label className="usa-checkbox__label" htmlFor={id}>
                        {type}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <h3 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="filter-years"
          >
            {selected.years.length > 0 ? `Year (${selected.years.length})` : 'Year'}
          </button>
        </h3>
        <div id="filter-years" className="usa-accordion__content usa-prose">
          <div className="filter-options">
            {years.map((year) => {
              const id = `filter-year-${slugify(year)}`;
              return (
                <div className="usa-checkbox" key={year}>
                  <input
                    className="usa-checkbox__input"
                    id={id}
                    type="checkbox"
                    checked={selected.years.includes(year)}
                    onChange={() => onToggle('years', year)}
                  />
                  <label className="usa-checkbox__label" htmlFor={id}>
                    {year}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FilterPills({ activeFilters, onRemove, baseUrl = '' }: FilterPillsProps) {
  const closeIconSrc = `${baseUrl}assets/img/usa-icons/close.svg`.replace(/\/+/g, '/');
  return (
    <div
      className={`filter-pills ${
        activeFilters.length === 0 ? 'filter-pills--empty' : ''
      }`}
    >
      {activeFilters.map((filter) => {
        const group =
          filter.type === 'Council'
            ? 'councils'
            : filter.type === 'Focus Area'
            ? 'focusAreas'
            : filter.type === 'Type'
            ? 'types'
            : 'years';
        return (
          <button
            key={`${filter.type}-${filter.value}`}
            type="button"
            className="usa-tag filter-pill"
            aria-label={`Remove ${filter.value}`}
            onClick={() => onRemove(group, filter.value)}
          >
            <span className="filter-pill__label">{filter.value}</span>
            <img
              src={closeIconSrc}
              alt=""
              aria-hidden
              className="filter-pill__icon"
            />
          </button>
        );
      })}
    </div>
  );
}
