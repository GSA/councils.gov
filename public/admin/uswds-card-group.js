(function () {
  const START_COMMENT = '<!-- uswds-card-group:start -->';
  const END_COMMENT = '<!-- uswds-card-group:end -->';
  const CARD_GROUP_PATTERN =
    /<!--\s*uswds-card-group:start\s*-->[\s\S]*?<!--\s*uswds-card-group:end\s*-->/m;
  const DEFAULT_CARD_CLASS = 'usa-card desktop:grid-col-6';
  const DEFAULT_GROUP_CLASS = 'usa-card-group grid-gap';
  const DEFAULT_HEADING_LEVEL = 'h3';
  const FULL_CONTENT_MARKDOWN_PREFIX = 'uswds-card-full-content-markdown:';

  const {
    escapeHtml,
    escapeAttribute,
    decodeHtml,
    getValue,
    collectionToArray,
    findImageField,
    getPreviewAsset,
  } = window.CouncilsAdminEditorUtils;

  const valueToString = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  };

  const normalizeTextContent = (value) => valueToString(value).replace(/\s+/g, ' ');

  const encodeBase64 = (value) => {
    const bytes = new TextEncoder().encode(String(value || ''));
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  };

  const decodeBase64 = (value) => {
    try {
      const binary = window.atob(String(value || ''));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (error) {
      return '';
    }
  };

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

  const normalizeCards = (cards) =>
    collectionToArray(cards)
      .map((card) => ({
        header: valueToString(getValue(card, 'header')),
        image: valueToString(getValue(card, 'image')),
        imageAlt: valueToString(getValue(card, 'imageAlt')),
        description: valueToString(getValue(card, 'description')),
        fullContent: valueToString(getValue(card, 'fullContent')),
        buttonUrl: valueToString(getValue(card, 'buttonUrl')),
        buttonText: valueToString(getValue(card, 'buttonText')),
      }))
      .filter(
        (card) =>
          card.header ||
          card.image ||
          card.imageAlt ||
          card.description ||
          card.fullContent ||
          card.buttonUrl ||
          card.buttonText
      );

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

  const renderInlineMarkdown = (value) => {
    let html = escapeHtml(value);

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const decodedUrl = decodeHtml(url);
      return isSafeUrl(decodedUrl)
        ? `<a href="${escapeAttribute(decodedUrl)}">${text}</a>`
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

  const indentLines = (value, spaces) => {
    const indent = ' '.repeat(spaces);
    return String(value || '')
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n');
  };

  const getAccordionId = (card, index) => {
    const slug = slugify(card.header) || `card-${index + 1}`;
    const hash = hashString(`${index}:${card.header}:${card.fullContent}`);
    return `uswds-card-accordion-${index + 1}-${slug}-${hash}`;
  };

  const buildCardMarkup = (card, index, previewOptions) => {
    const resolvedImage =
      previewOptions && previewOptions.getAsset
        ? getPreviewAsset(card.image, previewOptions.getAsset, previewOptions.imageField)
        : card.image;
    const imageIsSafe = previewOptions
      ? Boolean(card.image && isSafeUrl(card.image, { allowHash: false }))
      : isSafeUrl(card.image, { allowHash: false });
    const buttonIsSafe = isSafeUrl(card.buttonUrl);

    const headerMarkup = card.header
      ? `
      <div class="usa-card__header">
        <${DEFAULT_HEADING_LEVEL} class="usa-card__heading">${escapeHtml(card.header)}</${DEFAULT_HEADING_LEVEL}>
      </div>`
      : '';
    const imageMarkup =
      card.image && imageIsSafe
        ? `
      <div class="usa-card__media">
        <div class="usa-card__img">
          <img src="${escapeAttribute(resolvedImage || '')}" alt="${escapeAttribute(card.imageAlt)}" loading="lazy" decoding="async" />
        </div>
      </div>`
        : '';
    const accordionId = card.fullContent ? getAccordionId(card, index) : '';
    const fullContentMarkup = card.fullContent
      ? `
        <div class="usa-card__full-content usa-accordion__content usa-prose" id="${escapeAttribute(accordionId)}" hidden>
          <!-- ${FULL_CONTENT_MARKDOWN_PREFIX}${encodeBase64(card.fullContent)} -->
${indentLines(renderMarkdownToHtml(card.fullContent), 10)}
        </div>`
      : '';
    const bodyMarkup = card.description || card.fullContent
      ? `
      <div class="usa-card__body">
        ${card.description ? `<p class="usa-card__description">${escapeHtml(card.description)}</p>` : ''}${fullContentMarkup}
      </div>`
      : '';
    const footerMarkup = card.fullContent
      ? `
      <div class="usa-card__footer">
        <button type="button" class="usa-button usa-accordion__button usa-card__accordion-button" aria-expanded="false" aria-controls="${escapeAttribute(accordionId)}" data-card-accordion-button data-card-accordion-close-label="Close details"><span class="usa-card__accordion-button-text">${escapeHtml(card.buttonText || 'Read more')}</span></button>
      </div>`
      : card.buttonUrl && card.buttonText && buttonIsSafe
        ? `
      <div class="usa-card__footer">
        <a class="usa-button" href="${escapeAttribute(card.buttonUrl)}">${escapeHtml(card.buttonText)}</a>
      </div>`
        : '';

    return `  <li class="${DEFAULT_CARD_CLASS}"${card.fullContent ? ' tabindex="-1"' : ''}>
    <div class="usa-card__container">${headerMarkup}${imageMarkup}${bodyMarkup}${footerMarkup}
    </div>
  </li>`;
  };

  const buildCardGroupMarkup = (data, previewOptions) => {
    const cards = normalizeCards(getValue(data, 'cards'));
    const groupClass = cards.some((card) => card.fullContent)
      ? `${DEFAULT_GROUP_CLASS} usa-accordion`
      : DEFAULT_GROUP_CLASS;
    const cardMarkup = cards
      .map((card, index) => buildCardMarkup(card, index, previewOptions))
      .join('\n');

    return `${START_COMMENT}
<ul class="${groupClass}">
${cardMarkup}
</ul>
${END_COMMENT}`;
  };

  const getBodyDescription = (body) => {
    if (!body) return '';

    const paragraph = Array.from(body.children).find(
      (child) => child.tagName.toLowerCase() === 'p'
    );
    if (paragraph) return paragraph.textContent;

    const clone = body.cloneNode(true);
    clone
      .querySelectorAll('.usa-card__full-content')
      .forEach((fullContent) => fullContent.remove());
    return clone.textContent;
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

  const renderHiddenHtmlAsMarkdown = (fullContent) =>
    Array.from(fullContent.children)
      .map(renderHtmlBlockAsMarkdown)
      .filter(Boolean)
      .join('\n\n');

  const getFullContentMarkdown = (body) => {
    const fullContent = body ? body.querySelector('.usa-card__full-content') : undefined;
    if (!fullContent) return '';

    const walker = document.createTreeWalker(fullContent, NodeFilter.SHOW_COMMENT);
    let node = walker.nextNode();

    while (node) {
      const comment = valueToString(node.nodeValue);
      if (comment.startsWith(FULL_CONTENT_MARKDOWN_PREFIX)) {
        return decodeBase64(comment.slice(FULL_CONTENT_MARKDOWN_PREFIX.length));
      }
      node = walker.nextNode();
    }

    return renderHiddenHtmlAsMarkdown(fullContent) || normalizeTextContent(fullContent.textContent);
  };

  const parseCardGroup = (block) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(block || ''), 'text/html');
    const cardElements = Array.from(doc.querySelectorAll('.usa-card'));

    return {
      cards: cardElements.map((card) => {
        const heading = card.querySelector('.usa-card__heading');
        const image = card.querySelector('.usa-card__img img[src]');
        const body = card.querySelector('.usa-card__body');
        const link = card.querySelector('.usa-card__footer a[href]');
        const accordionButton = card.querySelector('[data-card-accordion-button]');
        const button = accordionButton || link;
        const fullContent = getFullContentMarkdown(body);

        return {
          header: decodeHtml(heading ? heading.textContent : ''),
          image: decodeHtml(image ? image.getAttribute('src') : ''),
          imageAlt: decodeHtml(image ? image.getAttribute('alt') : ''),
          description: decodeHtml(normalizeTextContent(getBodyDescription(body))),
          fullContent,
          buttonUrl: fullContent || !link ? '' : decodeHtml(link.getAttribute('href')),
          buttonText: decodeHtml(button ? button.textContent : ''),
        };
      }),
    };
  };

  const registerUswdsCardGroup = () => {
    if (!window.CMS || typeof window.CMS.registerEditorComponent !== 'function') {
      return;
    }

    window.CMS.registerEditorComponent({
      id: 'uswds-card-group',
      label: 'USWDS Card Group',
      fields: [
        {
          label: 'Cards',
          name: 'cards',
          widget: 'list',
          required: false,
          allow_add: true,
          allow_delete: true,
          allow_reorder: true,
          collapsed: false,
          summary: '{{fields.header}}',
          fields: [
            {
              label: 'Header',
              name: 'header',
              widget: 'string',
              required: true,
            },
            {
              label: 'Image',
              name: 'image',
              widget: 'image',
              required: false,
              media_folder: '/public/assets/img',
              public_folder: '/assets/img',
              media_library: {
                allow_multiple: false,
              },
            },
            {
              label: 'Image alt text',
              name: 'imageAlt',
              widget: 'string',
              required: false,
              hint: 'Describe the image for screen reader users. Leave blank only when the image is decorative.',
            },
            {
              label: 'Description',
              name: 'description',
              widget: 'text',
              required: true,
            },
            {
              label: 'Full content',
              name: 'fullContent',
              widget: 'markdown',
              required: false,
              hint: 'Optional. Stores the full content for this card in hidden markup beneath the description.',
            },
            {
              label: 'Button URL',
              name: 'buttonUrl',
              widget: 'string',
              required: false,
              hint: 'Use a site-relative URL like /resources/, an asset path, http(s) URL, or page hash. Unsafe URLs are omitted.',
            },
            {
              label: 'Button text',
              name: 'buttonText',
              widget: 'string',
              required: false,
              hint: 'Use specific link text that makes sense out of context, such as "View council resources".',
            },
          ],
        },
      ],
      pattern: CARD_GROUP_PATTERN,
      fromBlock: (match) => parseCardGroup(match[0]),
      toBlock: (data) => buildCardGroupMarkup(data),
      toPreview: (data, getAsset, fields) =>
        buildCardGroupMarkup(data, {
          getAsset,
          imageField: findImageField(fields),
        }),
    });
  };

  if (window.CMS && typeof window.CMS.registerEditorComponent === 'function') {
    registerUswdsCardGroup();
  } else {
    window.addEventListener('load', registerUswdsCardGroup, { once: true });
  }
})();
