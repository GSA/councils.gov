import { slugify, type Filters } from './filters';

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
};

type FilterPillsProps = {
  activeFilters: { type: string; value: string }[];
  onRemove: (group: keyof Filters, value: string) => void;
};

export function FilterPanel({ options, selected, onToggle, onReset }: FilterPanelProps) {
  const { councils, focusAreas, types, years } = options;

  return (
    <div className="filter-sidebar">
      <div className="filter-sidebar__header display-flex flex-column">
        <h2 className="font-sans-lg margin-top-0 margin-bottom-2">Filters</h2>
        <button
          type="button"
          className="usa-button--unstyled usa-link margin-bottom-2"
          onClick={onReset}
        >
          Reset filters
        </button>
      </div>
      <div className="usa-accordion" aria-multiselectable="true" data-allow-multiple="true">
        <h3 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="filter-councils"
          >
            Council
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

        <h3 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="filter-focus-areas"
          >
            Focus Area
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

        <h3 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="filter-types"
          >
            Type
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

        <h3 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="filter-years"
          >
            Year
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

export function FilterPills({ activeFilters, onRemove }: FilterPillsProps) {
  return (
    <div
      className={`filter-pills margin-bottom-2 ${
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
            <span aria-hidden="true" className="filter-pill__icon">
              ×
            </span>
          </button>
        );
      })}
    </div>
  );
}
