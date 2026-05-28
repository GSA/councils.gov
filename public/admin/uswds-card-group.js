(function () {
  const START_COMMENT = '<!-- uswds-card-group:start -->';
  const END_COMMENT = '<!-- uswds-card-group:end -->';
  const CARD_GROUP_PATTERN =
    /<!--\s*uswds-card-group:start\s*-->[\s\S]*?<!--\s*uswds-card-group:end\s*-->/m;
  const DEFAULT_CARD_CLASS = 'usa-card tablet:grid-col-6';
  const DEFAULT_GROUP_CLASS = 'usa-card-group grid-gap';
  const DEFAULT_HEADING_LEVEL = 'h3';

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

  const normalizeCards = (cards) =>
    collectionToArray(cards)
      .map((card) => ({
        header: valueToString(getValue(card, 'header')),
        image: valueToString(getValue(card, 'image')),
        imageAlt: valueToString(getValue(card, 'imageAlt')),
        description: valueToString(getValue(card, 'description')),
        buttonUrl: valueToString(getValue(card, 'buttonUrl')),
        buttonText: valueToString(getValue(card, 'buttonText')),
      }))
      .filter(
        (card) =>
          card.header ||
          card.image ||
          card.imageAlt ||
          card.description ||
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

  const buildCardMarkup = (card, previewOptions) => {
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
    const bodyMarkup = card.description
      ? `
      <div class="usa-card__body">
        <p>${escapeHtml(card.description)}</p>
      </div>`
      : '';
    const footerMarkup =
      card.buttonUrl && card.buttonText && buttonIsSafe
        ? `
      <div class="usa-card__footer">
        <a class="usa-button" href="${escapeAttribute(card.buttonUrl)}">${escapeHtml(card.buttonText)}</a>
      </div>`
        : '';

    return `  <li class="${DEFAULT_CARD_CLASS}">
    <div class="usa-card__container">${headerMarkup}${imageMarkup}${bodyMarkup}${footerMarkup}
    </div>
  </li>`;
  };

  const buildCardGroupMarkup = (data, previewOptions) => {
    const cards = normalizeCards(getValue(data, 'cards'));
    const cardMarkup = cards
      .map((card) => buildCardMarkup(card, previewOptions))
      .join('\n');

    return `${START_COMMENT}
<ul class="${DEFAULT_GROUP_CLASS}">
${cardMarkup}
</ul>
${END_COMMENT}`;
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
        const button = card.querySelector('.usa-card__footer a[href]');

        return {
          header: decodeHtml(heading ? heading.textContent : ''),
          image: decodeHtml(image ? image.getAttribute('src') : ''),
          imageAlt: decodeHtml(image ? image.getAttribute('alt') : ''),
          description: decodeHtml(body ? body.textContent : ''),
          buttonUrl: decodeHtml(button ? button.getAttribute('href') : ''),
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
