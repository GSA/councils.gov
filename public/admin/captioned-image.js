(function () {
  const figurePattern =
    /^<figure class="(?:news-item-thumbnail|cms-inline-image)(?: [^"]*)?">\s*<img src="([^"]*)" alt="([^"]*)"\s*\/?>\s*(?:<figcaption class="font-sans-3xs text-italic margin-top-1">([\s\S]*?)<\/figcaption>\s*)?<\/figure>/m;
  const markdownImagePattern = /^!\[([^\]]*)\]\((.*?)(\s"([^"]*)")?\)/;
  const imagePattern = new RegExp(
    `${figurePattern.source}|${markdownImagePattern.source}`,
    'm'
  );

  const {
    escapeHtml,
    escapeAttribute,
    decodeHtml,
    findImageField,
    getPreviewAsset,
  } = window.CouncilsAdminEditorUtils;

  const registerCaptionedImage = () => {
    if (!window.CMS || typeof window.CMS.registerEditorComponent !== 'function') {
      return;
    }

    window.CMS.registerEditorComponent({
      id: 'image',
      label: 'Image',
      fields: [
        {
          label: 'Image',
          name: 'image',
          widget: 'image',
          media_folder: '/public/assets/img',
          public_folder: '/assets/img',
          media_library: {
            allow_multiple: false,
          },
        },
        {
          label: 'Alt Text',
          name: 'alt',
          widget: 'string',
          required: false,
        },
        {
          label: 'Caption Text',
          name: 'caption',
          widget: 'text',
          required: false,
        },
      ],
      pattern: imagePattern,
      fromBlock: (match) => {
        if (match[1] !== undefined) {
          return {
            image: decodeHtml(match[1]),
            alt: decodeHtml(match[2]),
            caption: decodeHtml(match[3]),
          };
        }

        return {
          image: match[5],
          alt: match[4],
          caption: match[7] || '',
        };
      },
      toBlock: ({ image, alt, caption }) => {
        const captionMarkup = caption
          ? `\n  <figcaption class="font-sans-3xs text-italic margin-top-1">${escapeHtml(caption)}</figcaption>`
          : '';

        return `<figure class="news-item-thumbnail margin-x-0 margin-y-2">
  <img src="${escapeAttribute(image)}" alt="${escapeAttribute(alt)}" />${captionMarkup}
</figure>`;
      },
      toPreview: ({ image, alt, caption }, getAsset, fields) => {
        const imageField = findImageField(fields);
        const src = getPreviewAsset(image, getAsset, imageField);
        const captionMarkup = caption
          ? `<figcaption class="font-sans-3xs text-italic margin-top-1">${escapeHtml(caption)}</figcaption>`
          : '';

        return `<figure class="news-item-thumbnail margin-x-0 margin-y-2">
  <img src="${escapeAttribute(src || '')}" alt="${escapeAttribute(alt)}" />${captionMarkup}
</figure>`;
      },
    });
  };

  if (window.CMS && typeof window.CMS.registerEditorComponent === 'function') {
    registerCaptionedImage();
  } else {
    window.addEventListener('load', registerCaptionedImage, { once: true });
  }
})();
