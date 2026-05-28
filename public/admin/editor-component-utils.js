(function () {
  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const decodeHtml = (value) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(value || '');
    return textarea.value;
  };

  const valueToString = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  };

  const normalizeTextContent = (value) => valueToString(value).replace(/\s+/g, ' ');

  const slugify = (value) =>
    valueToString(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const hashString = (value) => {
    let hash = 0;
    const text = String(value || '');

    for (let index = 0; index < text.length; index += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash).toString(36);
  };

  const isSafeUrl = (url, options) => {
    const value = valueToString(url);
    if (!value || /[\u0000-\u001f\u007f\s]/.test(value)) return false;

    const allowHash = !options || options.allowHash !== false;
    if (allowHash && value.startsWith('#')) return /^#[A-Za-z][A-Za-z0-9_-]*$/.test(value);
    if (value.startsWith('/')) return !value.startsWith('//');

    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch (error) {
      return false;
    }
  };

  const getValue = (object, key) => {
    if (!object) return undefined;
    if (typeof object.get === 'function') return object.get(key);
    return object[key];
  };

  const collectionToArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value.toJS === 'function') {
      const jsValue = value.toJS();
      return Array.isArray(jsValue) ? jsValue : [];
    }
    if (typeof value.toArray === 'function') return value.toArray();
    return [];
  };

  const findImageField = (fields) => {
    const list = collectionToArray(fields);
    for (const field of list) {
      if (getValue(field, 'widget') === 'image') return field;

      const nestedField = findImageField(getValue(field, 'fields'));
      if (nestedField) return nestedField;
    }

    return undefined;
  };

  const getPreviewAsset = (image, getAsset, imageField) => {
    if (!image || !getAsset) return image;

    try {
      const asset = getAsset(image, imageField);
      return asset && typeof asset.toString === 'function' ? asset.toString() : asset;
    } catch (error) {
      return image;
    }
  };

  const renderInlineMarkdown = (value) => {
    let html = escapeHtml(value);

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const decodedUrl = decodeHtml(url);
      return isSafeUrl(decodedUrl)
        ? `<a href="${escapeHtml(decodedUrl)}">${text}</a>`
        : text;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return html;
  };

  const renderMarkdownToHtml = (markdown) => {
    const blocks = String(markdown || '')
      .replace(/\r\n?/g, '\n')
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks
      .map((block) => {
        const lines = block.split('\n').map((line) => line.trim());
        const headingMatch = block.match(/^(#{1,6})\s+(.+)$/);
        const isUnorderedList = lines.every((line) => /^[-*]\s+/.test(line));
        const isOrderedList = lines.every((line) => /^\d+\.\s+/.test(line));

        if (headingMatch) {
          const headingLevel = headingMatch[1].length;
          return `<h${headingLevel}>${renderInlineMarkdown(headingMatch[2])}</h${headingLevel}>`;
        }

        if (isUnorderedList) {
          const items = lines
            .map((line) => `<li>${renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`)
            .join('\n');
          return `<ul class="usa-list">\n${items}\n</ul>`;
        }

        if (isOrderedList) {
          const items = lines
            .map((line) => `<li>${renderInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`)
            .join('\n');
          return `<ol class="usa-list">\n${items}\n</ol>`;
        }

        return `<p>${lines.map(renderInlineMarkdown).join('<br />\n')}</p>`;
      })
      .join('\n');
  };

  const renderHtmlInlineAsMarkdown = (node) => {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const content = Array.from(node.childNodes).map(renderHtmlInlineAsMarkdown).join('');
    const tagName = node.tagName.toLowerCase();

    if (tagName === 'a') {
      const href = node.getAttribute('href');
      return href && isSafeUrl(href) ? `[${content}](${href})` : content;
    }
    if (tagName === 'strong' || tagName === 'b') return `**${content}**`;
    if (tagName === 'em' || tagName === 'i') return `*${content}*`;
    if (tagName === 'code') return `\`${content}\``;
    if (tagName === 'br') return '\n';

    return content;
  };

  const renderHtmlBlockAsMarkdown = (element) => {
    const tagName = element.tagName.toLowerCase();
    const headingMatch = tagName.match(/^h([1-6])$/);

    if (headingMatch) {
      return `${'#'.repeat(Number(headingMatch[1]))} ${renderHtmlInlineAsMarkdown(element).trim()}`;
    }

    if (tagName === 'p') return renderHtmlInlineAsMarkdown(element).trim();

    if (tagName === 'ul') {
      return Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((child) => `- ${renderHtmlInlineAsMarkdown(child).trim()}`)
        .join('\n');
    }

    if (tagName === 'ol') {
      return Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((child, index) => `${index + 1}. ${renderHtmlInlineAsMarkdown(child).trim()}`)
        .join('\n');
    }

    return renderHtmlInlineAsMarkdown(element).trim();
  };

  const indentLines = (value, spaces) => {
    const indent = ' '.repeat(spaces);
    return String(value || '')
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n');
  };

  window.CouncilsAdminEditorUtils = {
    escapeHtml,
    escapeAttribute: escapeHtml,
    decodeHtml,
    valueToString,
    normalizeTextContent,
    slugify,
    hashString,
    isSafeUrl,
    getValue,
    collectionToArray,
    findImageField,
    getPreviewAsset,
    renderMarkdownToHtml,
    renderHtmlBlockAsMarkdown,
    indentLines,
  };
})();
