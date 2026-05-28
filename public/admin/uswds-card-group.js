(function () {
  const START_COMMENT = "<!-- uswds-card-group:start -->";
  const END_COMMENT = "<!-- uswds-card-group:end -->";
  const CARD_GROUP_PATTERN =
    /<!--\s*uswds-card-group:start\s*-->[\s\S]*?<!--\s*uswds-card-group:end\s*-->/m;
  const DEFAULT_CARD_CLASS =
    "usa-card display-block text-no-underline resource-card-link resource-card-link--bordered";
  const DEFAULT_CARD_GRID_CLASS = "desktop:grid-col-6";
  const DEFAULT_GROUP_CLASS = "usa-card-group grid-row grid-gap resource-cards-grid";
  const DEFAULT_HEADING_LEVEL = "h3";

  const {
    escapeHtml,
    escapeAttribute,
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
  } = window.CouncilsAdminEditorUtils;

  const normalizeCards = (cards) =>
    collectionToArray(cards)
      .map((card) => ({
        header: valueToString(getValue(card, "header")),
        image: valueToString(getValue(card, "image")),
        imageAlt: valueToString(getValue(card, "imageAlt")),
        description: valueToString(getValue(card, "description")),
        fullContent: valueToString(getValue(card, "fullContent")),
        buttonUrl: valueToString(getValue(card, "buttonUrl")),
        buttonText: valueToString(getValue(card, "buttonText")),
      }))
      .filter(
        (card) =>
          card.header ||
          card.image ||
          card.imageAlt ||
          card.description ||
          card.fullContent ||
          card.buttonUrl ||
          card.buttonText,
      );

  const getCardGroupHash = (cards) =>
    hashString(
      cards
        .map((card) =>
          [
            card.header,
            card.image,
            card.imageAlt,
            card.description,
            card.fullContent,
            card.buttonUrl,
            card.buttonText,
          ].join("\u001f"),
        )
        .join("\u001e"),
    );

  const getAccordionId = (card, index, groupHash) => {
    const slug = slugify(card.header) || `card-${index + 1}`;
    const hash = hashString(`${index}:${card.header}:${card.fullContent}`);
    return `uswds-card-accordion-${groupHash}-${index + 1}-${slug}-${hash}`;
  };

  const buildCardMarkup = (card, index, groupHash, previewOptions) => {
    const resolvedImage =
      previewOptions && previewOptions.getAsset
        ? getPreviewAsset(
            card.image,
            previewOptions.getAsset,
            previewOptions.imageField,
          )
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
      : "";
    const imageMarkup =
      card.image && imageIsSafe
        ? `
      <div class="usa-card__media">
        <div class="usa-card__img">
          <img src="${escapeAttribute(resolvedImage || "")}" alt="${escapeAttribute(card.imageAlt)}" loading="lazy" decoding="async" />
        </div>
      </div>`
        : "";
    const accordionId = card.fullContent
      ? getAccordionId(card, index, groupHash)
      : "";
    const fullContentMarkup = card.fullContent
      ? `
      <div class="usa-card__full-content usa-accordion__content usa-prose" id="${escapeAttribute(accordionId)}" hidden>
${indentLines(renderMarkdownToHtml(card.fullContent), 10)}
      </div>`
      : "";
    const bodyMarkup =
      card.description
        ? `
      <div class="usa-card__body${card.fullContent ? " order-1" : ""}">
        <p class="usa-card__description">${escapeHtml(card.description)}</p>${fullContentMarkup}
      </div>`
        : "";
    const footerMarkup = card.fullContent
      ? `
      <div class="usa-card__footer order-2">
        <button type="button" class="usa-link font-sans-sm usa-card__accordion-button" aria-expanded="false" aria-controls="${escapeAttribute(accordionId)}" aria-label="${escapeAttribute(`${card.buttonText || "Read more"}: ${card.header}`)}" data-card-accordion-button data-card-accordion-close-label="Close details"><span class="usa-card__accordion-button-text">${escapeHtml(card.buttonText || "Read more")}</span></button>
      </div>`
      : card.buttonUrl && card.buttonText && buttonIsSafe
        ? `
      <div class="usa-card__footer">
        <a class="usa-link font-sans-sm" href="${escapeAttribute(card.buttonUrl)}">${escapeHtml(card.buttonText)}</a>
      </div>`
        : "";

    const cardIsClickable =
      card.fullContent || (card.buttonUrl && card.buttonText && buttonIsSafe);
    const cardClass = cardIsClickable
      ? `${DEFAULT_CARD_CLASS} usa-card--clickable`
      : DEFAULT_CARD_CLASS;

    return `  <li class="${DEFAULT_CARD_GRID_CLASS}" data-card-grid-item>
    <div class="${cardClass}"${card.fullContent ? ' tabindex="-1"' : ""}>
      <div class="usa-card__container${card.fullContent ? " display-flex flex-column" : ""}">${headerMarkup}${imageMarkup}${footerMarkup}${bodyMarkup}
      </div>
    </div>
  </li>`;
  };

  const buildCardGroupMarkup = (data, previewOptions) => {
    const cards = normalizeCards(getValue(data, "cards"));
    const groupHash = getCardGroupHash(cards);
    const groupClass = cards.some((card) => card.fullContent)
      ? `${DEFAULT_GROUP_CLASS} usa-accordion`
      : DEFAULT_GROUP_CLASS;
    const cardMarkup = cards
      .map((card, index) =>
        buildCardMarkup(card, index, groupHash, previewOptions),
      )
      .join("\n");

    return `${START_COMMENT}
<ul class="${groupClass}">
${cardMarkup}
</ul>
${END_COMMENT}`;
  };

  const getBodyDescription = (body) => {
    if (!body) return "";

    const paragraph = Array.from(body.children).find(
      (child) => child.tagName.toLowerCase() === "p",
    );
    if (paragraph) return paragraph.textContent;

    const clone = body.cloneNode(true);
    clone
      .querySelectorAll(".usa-card__full-content")
      .forEach((fullContent) => fullContent.remove());
    return clone.textContent;
  };

  const renderHiddenHtmlAsMarkdown = (fullContent) =>
    Array.from(fullContent.children)
      .map(renderHtmlBlockAsMarkdown)
      .filter(Boolean)
      .join("\n\n");

  const getFullContentMarkdown = (body) => {
    const fullContent = body
      ? body.querySelector(".usa-card__full-content")
      : undefined;
    if (!fullContent) return "";

    return (
      renderHiddenHtmlAsMarkdown(fullContent) ||
      normalizeTextContent(fullContent.textContent)
    );
  };

  const parseCardGroup = (block) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(block || ""), "text/html");
    const cardElements = Array.from(doc.querySelectorAll(".usa-card"));

    return {
      cards: cardElements.map((card) => {
        const heading = card.querySelector(".usa-card__heading");
        const image = card.querySelector(".usa-card__img img[src]");
        const body = card.querySelector(".usa-card__body");
        const link = card.querySelector(".usa-card__footer a[href]");
        const accordionButton = card.querySelector(
          "[data-card-accordion-button]",
        );
        const button = accordionButton || link;
        const fullContent = getFullContentMarkdown(body);

        return {
          header: decodeHtml(heading ? heading.textContent : ""),
          image: decodeHtml(image ? image.getAttribute("src") : ""),
          imageAlt: decodeHtml(image ? image.getAttribute("alt") : ""),
          description: decodeHtml(
            normalizeTextContent(getBodyDescription(body)),
          ),
          fullContent,
          buttonUrl:
            fullContent || !link ? "" : decodeHtml(link.getAttribute("href")),
          buttonText: decodeHtml(button ? button.textContent : ""),
        };
      }),
    };
  };

  const registerUswdsCardGroup = () => {
    if (
      !window.CMS ||
      typeof window.CMS.registerEditorComponent !== "function"
    ) {
      return;
    }

    window.CMS.registerEditorComponent({
      id: "uswds-card-group",
      label: "USWDS Card Group",
      fields: [
        {
          label: "Cards",
          name: "cards",
          widget: "list",
          required: false,
          allow_add: true,
          allow_delete: true,
          allow_reorder: true,
          collapsed: true,
          summary: "{{fields.header}}",
          fields: [
            {
              label: "Header",
              name: "header",
              widget: "string",
              required: true,
            },
            {
              label: "Image",
              name: "image",
              widget: "image",
              required: false,
              media_folder: "/public/assets/img",
              public_folder: "/assets/img",
              media_library: {
                allow_multiple: false,
              },
            },
            {
              label: "Image alt text",
              name: "imageAlt",
              widget: "string",
              required: false,
              hint: "Describe the image for screen reader users. Leave blank only when the image is decorative.",
            },
            {
              label: "Description",
              name: "description",
              widget: "text",
              required: true,
            },
            {
              label: "Full content",
              name: "fullContent",
              widget: "markdown",
              required: false,
              hint: "Optional. Stores the full content for this card in hidden markup beneath the description.",
            },
            {
              label: "Button URL",
              name: "buttonUrl",
              widget: "string",
              required: false,
              hint: "Only applies when Full content is empty. Use a site-relative URL like /resources/, an asset path, http(s) URL, or page hash. Unsafe URLs are omitted.",
            },
            {
              label: "Button text",
              name: "buttonText",
              widget: "string",
              required: false,
              hint: 'Use specific button or link text that makes sense out of context, such as "View council resources".',
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

  if (window.CMS && typeof window.CMS.registerEditorComponent === "function") {
    registerUswdsCardGroup();
  } else {
    window.addEventListener("load", registerUswdsCardGroup, { once: true });
  }
})();
