import React from 'react';

export interface PaginationProps {
  /** Current page (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when user selects a page */
  onPageChange: (page: number) => void;
  /** Accessible label for the nav (e.g. "Search results" or "Resources") */
  ariaLabel?: string;
  /** Optional class for wrapper (e.g. for centering) */
  className?: string;
}

/** USWDS 7-slot bounded pagination. See https://designsystem.digital.gov/components/pagination/ */
function getPaginationSlots(currentPage: number, totalPages: number): (number | 'overflow')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const s3 =
    currentPage <= 4 ? 3 : currentPage >= totalPages - 2 ? totalPages - 4 : currentPage - 1;
  const s4 =
    currentPage <= 4 ? 4 : currentPage >= totalPages - 2 ? totalPages - 3 : currentPage;
  const s5 =
    currentPage <= 4 ? 5 : currentPage >= totalPages - 2 ? totalPages - 2 : currentPage + 1;

  return [
    1,
    currentPage > 4 ? 'overflow' : 2,
    s3,
    s4,
    s5,
    currentPage < totalPages - 2 ? 'overflow' : totalPages - 1,
    totalPages,
  ];
}

const NavigateBeforeIcon = () => (
  <svg className="usa-icon" aria-hidden="true" role="img" width="24" height="24" viewBox="0 0 24 24">
    <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

const NavigateNextIcon = () => (
  <svg className="usa-icon" aria-hidden="true" role="img" width="24" height="24" viewBox="0 0 24 24">
    <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = 'Pagination',
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const slots = getPaginationSlots(currentPage, totalPages);

  return (
    <nav
      className={`usa-pagination${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      <ul className="usa-pagination__list">
        <li className="usa-pagination__item usa-pagination__arrow">
          <button
            type="button"
            className="usa-pagination__link usa-pagination__previous-page"
            aria-label="Previous page"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <NavigateBeforeIcon />
            <span className="usa-pagination__link-text">Previous</span>
          </button>
        </li>

        {slots.map((slot, index) =>
          slot === 'overflow' ? (
            <li
              key={`overflow-${index}`}
              className="usa-pagination__item usa-pagination__overflow"
              aria-label="ellipsis indicating non-visible pages"
            >
              <span>…</span>
            </li>
          ) : (
            <li key={slot} className="usa-pagination__item usa-pagination__page-no">
              <button
                type="button"
                className={`usa-pagination__button${slot === currentPage ? ' usa-current' : ''}`}
                aria-label={slot === totalPages ? `Last page, page ${slot}` : `Page ${slot}`}
                aria-current={slot === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(slot)}
              >
                {slot}
              </button>
            </li>
          )
        )}

        <li className="usa-pagination__item usa-pagination__arrow">
          <button
            type="button"
            className="usa-pagination__link usa-pagination__next-page"
            aria-label="Next page"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <span className="usa-pagination__link-text">Next</span>
            <NavigateNextIcon />
          </button>
        </li>
      </ul>
    </nav>
  );
}
