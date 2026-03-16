import React, { useEffect, useState } from 'react';
import Pagination from './Pagination';
import { sanitizeHref } from './filters';

const RESULTS_PER_PAGE = 20;

interface WebResult {
  title: string;
  url: string;
  snippet: string;
  publication_date?: string;
  thumbnail_url?: string;
}

interface SearchGovResponse {
  query: string;
  web?: {
    total: number;
    next_offset?: number;
    spelling_correction?: string;
    results: WebResult[];
  };
  text_best_bets?: Array<{
    id: string;
    title: string;
    url: string;
    description: string;
  }>;
  route_to?: string;
}

const API_BASE = 'https://api.gsa.gov/technology/searchgov/v2/results/i14y';
const CLICKS_URL = 'https://api.gsa.gov/technology/searchgov/v2/clicks/';

const MODULE_WEB = 'I14Y';

function buildResultsUrl(
  affiliate: string,
  accessKey: string,
  query: string,
  offset = 0
): string {
  const params = new URLSearchParams({
    affiliate,
    access_key: accessKey,
    query,
    limit: String(RESULTS_PER_PAGE),
    offset: String(offset),
  });
  return `${API_BASE}?${params.toString()}`;
}

function trackClick(
  affiliate: string,
  accessKey: string,
  url: string,
  query: string,
  position: number,
  moduleCode: string
): void {
  if (!accessKey) return;
  const params = new URLSearchParams({
    affiliate,
    access_key: accessKey,
    url,
    query,
    position: String(position),
    module_code: moduleCode,
  });
  fetch(`${CLICKS_URL}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: '',
  }).catch(() => {});
}

/** Parse Search.gov highlighting markers (U+E000, U+E001) into React elements */
function HighlightedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}): React.ReactNode {
  const cls = className ? `bg-yellow ${className}` : 'bg-yellow';
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const start = remaining.indexOf('\uE000');
    if (start === -1) {
      parts.push(remaining);
      break;
    }
    const before = remaining.slice(0, start);
    if (before) parts.push(before);

    const end = remaining.indexOf('\uE001', start);
    if (end === -1) {
      parts.push(remaining.slice(start + 1));
      break;
    }
    const highlighted = remaining.slice(start + 1, end);
    parts.push(
      <span key={key++} className={cls}>
        {highlighted}
      </span>
    );
    remaining = remaining.slice(end + 1);
  }

  return <>{parts}</>;
}

export default function SearchResults() {
  const affiliate = (import.meta.env.PUBLIC_SEARCH_AFFILIATE || 'restorethegulf').trim();
  const accessKey = (import.meta.env.PUBLIC_SEARCH_ACCESS_KEY || '').trim();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WebResult[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = (params.get('q') || params.get('query'))?.trim() || '';
    const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

    if (!q) {
      setLoading(false);
      return;
    }

    setQuery(q);
    setCurrentPage(page);

    if (!accessKey) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const offset = (page - 1) * RESULTS_PER_PAGE;

    fetch(buildResultsUrl(affiliate, accessKey, q, offset))
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
          Array.isArray(data) ? data.join(' ') :
          data?.errors ? (Array.isArray(data.errors) ? data.errors.join(' ') : String(data.errors)) :
          data?.error || data?.message;
          throw new Error(msg || `API returned ${res.status}: ${res.statusText}`);
        }
        return data;
      })
      .then((data: SearchGovResponse & { error?: string }) => {
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.route_to) {
          window.location.href = data.route_to;
          return;
        }
        setResults(data.web?.results ?? []);
        setTotal(data.web?.total ?? 0);
      })
      .catch((err: Error) => {
        const msg = err?.message || 'Search failed. Please try again.';
        setError(
          /access_key.*invalid|invalid.*access_key/i.test(msg)
            ? `API ${msg}`
            : msg
        );
      })
      .finally(() => setLoading(false));
  }, [affiliate, accessKey]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const q = (params.get('q') || params.get('query'))?.trim() || '';
      const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
      if (!q || !accessKey) return;
      setCurrentPage(page);
      setLoading(true);
      const offset = (page - 1) * RESULTS_PER_PAGE;
      fetch(buildResultsUrl(affiliate, accessKey, q, offset))
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error('Failed to load page');
          return data;
        })
        .then((data: SearchGovResponse) => {
          setResults(data.web?.results ?? []);
          setTotal(data.web?.total ?? 0);
        })
        .catch(() => setError('Failed to load page.'))
        .finally(() => setLoading(false));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [affiliate, accessKey]);

  const totalPages = Math.ceil(total / RESULTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(page));
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    setCurrentPage(page);
    setLoading(true);
    const q = (params.get('q') || params.get('query'))?.trim() || '';
    const offset = (page - 1) * RESULTS_PER_PAGE;
    fetch(buildResultsUrl(affiliate, accessKey, q, offset))
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error('Failed to load page');
        return data;
      })
      .then((data: SearchGovResponse) => {
        setResults(data.web?.results ?? []);
        setTotal(data.web?.total ?? 0);
      })
      .catch(() => setError('Failed to load page.'))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="usa-prose" role="status" aria-live="polite">
        <p>Searching...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usa-alert usa-alert--error usa-alert--slim">
      <div className="usa-alert__body">
        <p className="usa-alert__text">
          {error}
        </p>
      </div>
    </div>
    );
  }

  if (!query) {
    return (
      <div className="usa-prose">
        <p>Enter a search term above to find content on Councils.gov.</p>
      </div>
    );
  }

  const isSingular = Math.abs(total) === 1;

  return (
    <div>
      <h2>Results for &ldquo;{query}&rdquo;</h2>
      <p>
        {total > 0
          ? `${(currentPage - 1) * RESULTS_PER_PAGE + 1}-${Math.min(currentPage * RESULTS_PER_PAGE, total)} of ${total} result${isSingular ? '' : 's'} found`
          : `${total} result${isSingular ? '' : 's'} found.`}
      </p>

      {results.length > 0 && (
        <ul className="usa-collection">
          {results.map((result, i) => {
            const linkHref = sanitizeHref(result.url) ?? '#';
            return (
            <li key={`${result.url}-${i}`} className="usa-collection__item">
              <div className="usa-collection__body">
                <h4 className="usa-collection__heading">
                  <a
                    href={linkHref}
                    className="usa-link font-serif"
                    onClick={() => trackClick(affiliate, accessKey, result.url, query, (currentPage - 1) * RESULTS_PER_PAGE + i + 1, MODULE_WEB)}
                  >
                    <HighlightedText text={result.title} className="font-serif" />
                  </a>
                </h4>
                <p className="usa-collection__description">
                  <HighlightedText text={result.snippet} className="font-sans" />
                </p>
                {result.publication_date && (
                  <ul className="usa-collection__meta" aria-label="More information">
                    <li className="usa-collection__meta-item">
                      <time dateTime={result.publication_date}>{result.publication_date}</time>
                    </li>
                  </ul>
                )}
              </div>
            </li>
          );
          })}
        </ul>
      )}

      {results.length === 0 && (
        <p>No results found. Try different keywords.</p>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="flex-justify-start"
          ariaLabel="Search results"
        />
      )}
    </div>
  );
}
