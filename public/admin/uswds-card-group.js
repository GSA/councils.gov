(function () {
  const START_COMMENT = '<!-- uswds-card-group:start -->';
  const END_COMMENT = '<!-- uswds-card-group:end -->';
  const CARD_GROUP_PATTERN =
    /<!--\s*uswds-card-group:start\s*-->[\s\S]*?<!--\s*uswds-card-group:end\s*-->/m;
  const DEFAULT_CARD_CLASS = 'usa-card tablet:grid-col-6';
  const DEFAULT_GROUP_CLASS = 'usa-card-group grid-gap';
  const DEFAULT_HEADING_LEVEL = 'h3';
  const MODAL_MARKDOWN_PREFIX = 'uswds-card-modal-markdown:';

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

  const normalizeCards = (cards) =>
    collectionToArray(cards)
      .map((card) => ({
        header: valueToString(getValue(card, 'header')),
        image: valueToString(getValue(card, 'image')),
        imageAlt: valueToString(getValue(card, 'imageAlt')),
        description: valueToString(getValue(card, 'description')),
        modalContent: valueToString(getValue(card, 'modalContent')),
        buttonUrl: valueToString(getValue(card, 'buttonUrl')),
        buttonText: valueToString(getValue(card, 'buttonText')),
      }))
      .filter(
        (card) =>
          card.header ||
          card.image ||
          card.imageAlt ||
          card.description ||
          card.modalContent ||
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
        const headingMatch = block.match(/^(#{1,4})\s+(.+)$/);
        const isUnorderedList = lines.every((line) => /^[-*]\s+/.test(line));
        const isOrderedList = lines.every((line) => /^\d+\.\s+/.test(line));

        if (headingMatch) {
          const headingLevel = Math.min(6, headingMatch[1].length + 2);
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

  const getModalId = (card, index) => {
    const slug = slugify(card.header) || `card-${index + 1}`;
    const hash = hashString(`${index}:${card.header}:${card.modalContent}`);
    return `uswds-card-modal-${index + 1}-${slug}-${hash}`;
  };

  const buildCardMarkup = (card, index, modalId, previewOptions) => {
    const resolvedImage =
      previewOptions && previewOptions.getAsset
        ? getPreviewAsset(card.image, previewOptions.getAsset, previewOptions.imageField)
        : card.image;
    const imageIsSafe = previewOptions
      ? Boolean(card.image && isSafeUrl(card.image, { allowHash: false }))
      : isSafeUrl(card.image, { allowHash: false });
    const hasModal = Boolean(card.modalContent);
    const buttonIsSafe = isSafeUrl(card.buttonUrl);
    const buttonText =
      card.buttonText || (card.header ? `Read more about ${card.header}` : 'Read more');

    const headerMarkup = card.header
      ? `
      <div class="usa-card__header text-center padding-top-1">
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
    const bodyMarkup = card.description
      ? `
      <div class="usa-card__body">
        <p>${escapeHtml(card.description)}</p>
      </div>`
      : '';
    const footerMarkup = hasModal
      ? `
      <div class="usa-card__footer text-center margin-top-2 margin-bottom-1">
        <button type="button" class="usa-button" aria-controls="${escapeAttribute(modalId)}" data-open-modal>${escapeHtml(buttonText)}</button>
      </div>`
      : card.buttonUrl && card.buttonText && buttonIsSafe
        ? `
      <div class="usa-card__footer text-center margin-top-2 margin-bottom-1">
        <a class="usa-button" href="${escapeAttribute(card.buttonUrl)}">${escapeHtml(card.buttonText)}</a>
      </div>`
        : '';

    return `  <li class="${DEFAULT_CARD_CLASS}">
    <div class="usa-card__container">${headerMarkup}${imageMarkup}${bodyMarkup}${footerMarkup}
    </div>
  </li>`;
  };

  const buildModalMarkup = (card, modalId) => {
    if (!card.modalContent) return '';

    const headingId = `${modalId}-heading`;
    const descriptionId = `${modalId}-description`;
    const renderedContent = renderMarkdownToHtml(card.modalContent);
    const encodedMarkdown = encodeBase64(card.modalContent);

    return `<div class="usa-modal usa-modal--lg" id="${escapeAttribute(modalId)}" aria-labelledby="${escapeAttribute(headingId)}" aria-describedby="${escapeAttribute(descriptionId)}">
  <!-- ${MODAL_MARKDOWN_PREFIX}${encodedMarkdown} -->
  <div class="usa-modal__content">
    <div class="usa-modal__main">
      <h2 class="usa-modal__heading" id="${escapeAttribute(headingId)}">${escapeHtml(card.header)}</h2>
      <div class="usa-prose" id="${escapeAttribute(descriptionId)}">
${renderedContent}
      </div>
      <div class="usa-modal__footer">
        <ul class="usa-button-group">
          <li class="usa-button-group__item">
            <button type="button" class="usa-button" data-close-modal>Close</button>
          </li>
        </ul>
      </div>
    </div>
    <button type="button" class="usa-button usa-modal__close" aria-label="Close this window" data-close-modal>
      <img class="usa-icon" src="/assets/img/usa-icons/close.svg" alt="" aria-hidden="true" />
    </button>
  </div>
</div>`;
  };

  const buildCardGroupMarkup = (data, previewOptions) => {
    const cards = normalizeCards(getValue(data, 'cards'));
    const cardMarkup = cards
      .map((card, index) =>
        buildCardMarkup(
          card,
          index,
          card.modalContent ? getModalId(card, index) : '',
          previewOptions
        )
      )
      .join('\n');
    const modalMarkup = cards
      .map((card, index) => buildModalMarkup(card, getModalId(card, index)))
      .filter(Boolean)
      .join('\n');

    return `${START_COMMENT}
<ul class="${DEFAULT_GROUP_CLASS}">
${cardMarkup}
</ul>
${modalMarkup}
${END_COMMENT}`;
  };

  const getModalMarkdown = (modal) => {
    if (!modal) return '';

    const walker = document.createTreeWalker(modal, NodeFilter.SHOW_COMMENT);
    let node = walker.nextNode();

    while (node) {
      const comment = valueToString(node.nodeValue);
      if (comment.startsWith(MODAL_MARKDOWN_PREFIX)) {
        return decodeBase64(comment.slice(MODAL_MARKDOWN_PREFIX.length));
      }
      node = walker.nextNode();
    }

    const body = modal.querySelector('.usa-prose');
    return normalizeTextContent(body ? body.textContent : '');
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
        const modalButton = card.querySelector('.usa-card__footer [data-open-modal][aria-controls]');
        const modal = modalButton
          ? doc.getElementById(modalButton.getAttribute('aria-controls'))
          : undefined;
        const modalContent = getModalMarkdown(modal);
        const link = card.querySelector('.usa-card__footer a[href]');
        const button = modalButton || link;

        return {
          header: decodeHtml(normalizeTextContent(heading ? heading.textContent : '')),
          image: decodeHtml(image ? image.getAttribute('src') : ''),
          imageAlt: decodeHtml(image ? image.getAttribute('alt') : ''),
          description: decodeHtml(normalizeTextContent(body ? body.textContent : '')),
          modalContent,
          buttonUrl: modalContent || !link ? '' : decodeHtml(link.getAttribute('href')),
          buttonText: decodeHtml(normalizeTextContent(button ? button.textContent : '')),
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
              label: 'Modal content',
              name: 'modalContent',
              widget: 'markdown',
              required: false,
              hint: 'Optional. When provided, the card button opens a large USWDS modal using the card header as the modal heading. Button URL is ignored.',
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
