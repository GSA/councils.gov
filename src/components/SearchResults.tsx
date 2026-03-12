import { useEffect, useState } from 'react';
import Pagination from './Pagination';

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

/** Replace Search.gov highlighting markers (U+E000, U+E001) with HTML */
function highlightSnippet(text: string): string {
  return text
    .replace(/\uE000/g, '<span class="bg-yellow">')
    .replace(/\uE001/g, '</span>');
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
      .catch((err: Error) =>
        setError(err?.message || 'Search failed. Please try again.')
      )
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

  return (
    <div>
      <h2>Results for &ldquo;{query}&rdquo;</h2>
      <p>
        {total > 0
          ? `${(currentPage - 1) * RESULTS_PER_PAGE + 1}-${Math.min(currentPage * RESULTS_PER_PAGE, total)} of ${total} result${total !== 1 ? 's' : ''} found`
          : `${total} result${total !== 1 ? 's' : ''} found.`}
      </p>

      {results.length > 0 && (
        <ul className="usa-collection">
          {results.map((result, i) => (
            <li key={`${result.url}-${i}`} className="usa-collection__item">
              {result.thumbnail_url && (
                <img
                  className="usa-collection__img"
                  src={result.thumbnail_url}
                  alt=""
                />
              )}
              <div className="usa-collection__body">
                <h4 className="usa-collection__heading">
                  <a
                    href={result.url}
                    className="usa-link font-serif"
                    onClick={() => trackClick(affiliate, accessKey, result.url, query, (currentPage - 1) * RESULTS_PER_PAGE + i + 1, MODULE_WEB)}
                    dangerouslySetInnerHTML={{ __html: highlightSnippet(result.title) }}
                  />
                </h4>
                <p
                  className="usa-collection__description"
                  dangerouslySetInnerHTML={{ __html: highlightSnippet(result.snippet) }}
                />
                {result.publication_date && (
                  <ul className="usa-collection__meta" aria-label="More information">
                    <li className="usa-collection__meta-item">
                      <time dateTime={result.publication_date}>{result.publication_date}</time>
                    </li>
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {query && results.length === 0 && (
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
