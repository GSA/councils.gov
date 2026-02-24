import { useEffect, useState } from 'react';

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
const MODULE_BEST_BET = 'BOOS';

/** Mock results for preview when API key is not configured */
const MOCK_RESULTS: WebResult[] = [
  {
    title: 'CIO Council - About',
    url: '/councils/cioc/about/',
    snippet:
      'The CIO Council serves as the principal interagency forum for improving agency practices related to the design, acquisition, development, modernization, use, sharing, and performance of Federal information resources.',
    publication_date: '2024-01-15',
  },
  {
    title: 'CFO Council - Members & Leaders',
    url: '/councils/cfoc/members-leaders/',
    snippet:
      'The CFO Council is comprised of Chief Financial Officers and Deputy CFOs from cabinet departments and major agencies. Margaret Pearson serves as the Council leader.',
    publication_date: '2024-03-01',
  },
  {
    title: 'Resources - Councils.gov',
    url: '/resources/',
    snippet:
      'Access valuable resources, tools, and documentation to support your initiatives and improve agency practices across all councils.',
  },
  {
    title: '2025 CDO Summit - News',
    url: '/news-events/news/2025-cdo-summit/',
    snippet:
      'The 2025 CDO Council Summit brought together Chief Data Officers from across the federal government to discuss data strategy and governance.',
    publication_date: '2025-01-20',
  },
  {
    title: 'FRPC - About',
    url: '/councils/frpc/about/',
    snippet:
      'The Federal Records Policy Council (FRPC) promotes effective records management across the federal government and advises on records policy.',
    publication_date: '2023-11-10',
  },
];

const MOCK_BEST_BETS = [
  {
    id: 'mock-1',
    title: 'Federal Executive Councils - Home',
    url: '/',
    description: 'Welcome to Councils.gov. The Federal Executive Councils strengthen core functional areas within the government.',
  },
];

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
    limit: '20',
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
  if (!accessKey) return; // Skip when using mock data
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

export default function SearchResults() {
  const affiliate = import.meta.env.PUBLIC_SEARCH_AFFILIATE || 'councils.gov';
  const accessKey = import.meta.env.PUBLIC_SEARCH_ACCESS_KEY || '';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WebResult[]>([]);
  const [bestBets, setBestBets] = useState<SearchGovResponse['text_best_bets']>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q')?.trim() || '';

    if (!q) {
      setLoading(false);
      return;
    }

    setQuery(q);

    if (!accessKey) {
      // Show mock results for preview when API key is not configured
      setResults(MOCK_RESULTS);
      setBestBets(MOCK_BEST_BETS);
      setTotal(MOCK_RESULTS.length);
      setLoading(false);
      return;
    }

    fetch(buildResultsUrl(affiliate, accessKey, q))
      .then((res) => res.json())
      .then((data: SearchGovResponse) => {
        if (data.route_to) {
          window.location.href = data.route_to;
          return;
        }
        setResults(data.web?.results ?? []);
        setBestBets(data.text_best_bets ?? []);
        setTotal(data.web?.total ?? 0);
      })
      .catch(() => setError('Search failed. Please try again.'))
      .finally(() => setLoading(false));
  }, [affiliate, accessKey]);

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
    <div className="usa-prose">
      <h2>Results for &ldquo;{query}&rdquo;</h2>
      <p>
        {total} result{total !== 1 ? 's' : ''} found.
      </p>

      {bestBets && bestBets.length > 0 && (
        <section className="margin-bottom-4">
          <h3>Recommended</h3>
          <ul className="usa-list usa-list--unstyled">
            {bestBets.map((bet) => (
              <li key={bet.id} className="margin-bottom-2">
                <a
                  href={bet.url}
                  className="usa-link font-weight-bold"
                  onClick={() =>
                    trackClick(affiliate, accessKey, bet.url, query, -1, MODULE_BEST_BET)
                  }
                >
                  {bet.title}
                </a>
                <p className="margin-top-0">{bet.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="usa-list usa-list--unstyled">
        {results.map((result, i) => (
          <li key={`${result.url}-${i}`} className="margin-bottom-3">
            <a
              href={result.url}
              className="usa-link"
              onClick={() => trackClick(affiliate, accessKey, result.url, query, i + 1, MODULE_WEB)}
            >
              {result.title}
            </a>
            <p className="margin-top-0">{result.snippet}</p>
            {result.publication_date && (
              <p className="margin-top-0">{result.publication_date}</p>
            )}
          </li>
        ))}
      </ul>

      {query && results.length === 0 && (!bestBets || bestBets.length === 0) && (
        <p>No results found. Try different keywords.</p>
      )}
    </div>
  );
}
