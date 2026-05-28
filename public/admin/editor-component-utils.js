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

  window.CouncilsAdminEditorUtils = {
    escapeHtml,
    escapeAttribute: escapeHtml,
    decodeHtml,
    getValue,
    collectionToArray,
    findImageField,
    getPreviewAsset,
  };
})();
