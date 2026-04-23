export function prefixRootRelativeUrls(html: string, baseUrl: string | undefined): string {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return html;

  let updatedHtml = html.replace(
    /\b(href|src|poster)=(["'])(\/(?!\/)[^"']*)\2/g,
    (_, attr: string, quote: string, path: string) => `${attr}=${quote}${base}${path}${quote}`
  );

  updatedHtml = updatedHtml.replace(
    /\bsrcset=(["'])([^"']*)\1/g,
    (_, quote: string, value: string) => `srcset=${quote}${prefixSrcsetValue(value, base)}${quote}`
  );

  return updatedHtml;
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  if (!baseUrl || baseUrl === '/') return '';
  return baseUrl.replace(/\/$/, '');
}

function prefixSrcsetValue(value: string, base: string): string {
  return value
    .split(',')
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return trimmed;

      const parts = trimmed.split(/\s+/, 2);
      const [url, descriptor] = parts;
      return descriptor ? `${base}${url} ${descriptor}` : `${base}${url}`;
    })
    .join(', ');
}
