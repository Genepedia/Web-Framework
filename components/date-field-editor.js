const DATE_FIELD_EDITOR_STYLE_ID = 'date-field-editor-styles';
const DATE_FIELD_EDITOR_STYLES = String.raw`
date-field-editor {
  display: block;
  min-width: 0;
}

date-field-editor .date-field-editor {
  display: grid;
  min-width: 0;
}

date-field-editor[layout="stacked"] .date-field-editor {
  gap: 0.45rem;
}

date-field-editor .date-field-editor__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

date-field-editor[layout="stacked"] .date-field-editor__controls {
  display: grid;
  grid-template-columns: minmax(8rem, 10rem) minmax(0, 1fr);
  align-items: start;
}

date-field-editor .date-field-editor__precision {
  width: auto;
  flex: 0 0 auto;
}

date-field-editor[layout="stacked"] .date-field-editor__precision {
  width: 100%;
  min-width: 0;
}

date-field-editor .date-field-editor__range {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}

date-field-editor .date-field-editor__range-row {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

date-field-editor .date-field-editor__range-row--divider,
date-field-editor .date-field-editor__range-row--to {
  display: none;
}

date-field-editor.is-between .date-field-editor__controls {
  align-items: start;
}

date-field-editor.is-between:not([layout="stacked"]) .date-field-editor__controls {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 0.5rem;
  row-gap: 0.65rem;
}

date-field-editor.is-between .date-field-editor__range {
  display: grid;
  gap: 0.65rem;
  /* Wide enough to keep the date input, Circa checkbox and the parsed-date
     preview on one line (the preview otherwise wraps below the field). */
  width: min(100%, 34rem);
}

date-field-editor[layout="stacked"].is-between .date-field-editor__range {
  width: 100%;
}

date-field-editor.is-between:not([layout="stacked"]) .date-field-editor__range {
  min-width: 0;
}

date-field-editor.is-between .date-field-editor__range-row,
date-field-editor.is-between .date-field-editor__range-row--divider,
date-field-editor.is-between .date-field-editor__range-row--to {
  display: flex;
}

date-field-editor .date-field-editor__range-row--divider {
  color: #6b7280;
  font-size: 0.875rem;
}

body.theme-dark date-field-editor .date-field-editor__range-row--divider {
  color: #a7adb4;
}

date-field-editor .date-field-editor__input-wrap {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  min-width: 12rem;
}

date-field-editor[layout="stacked"] .date-field-editor__input-wrap {
  width: 100%;
}

date-field-editor .date-field-editor__date-input,
date-field-editor .date-field-editor__input-wrap {
  box-sizing: border-box;
  height: 2.4rem;
}

date-field-editor .date-field-editor__date-input {
  min-width: 0;
  width: 100%;
  padding: 0.45rem 2.35rem 0.45rem 0.6rem;
  color-scheme: light;
}

body.theme-dark date-field-editor .date-field-editor__date-input {
  color-scheme: dark;
}

date-field-editor .date-field-editor__date-input::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 2.35rem;
  height: 100%;
  cursor: pointer;
}

date-field-editor .date-field-editor__picker-button {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0 0.125rem 0.125rem 0;
  background: transparent;
  color: #54595d;
  cursor: pointer;
}

date-field-editor .date-field-editor__picker-button:hover,
date-field-editor .date-field-editor__picker-button:focus-visible {
  color: #3366cc;
  outline: none;
  background: rgba(51, 102, 204, 0.08);
}

body.theme-dark date-field-editor .date-field-editor__picker-button {
  color: #a7adb4;
}

body.theme-dark date-field-editor .date-field-editor__picker-button:hover,
body.theme-dark date-field-editor .date-field-editor__picker-button:focus-visible {
  color: #6b9eff;
  background: rgba(107, 158, 255, 0.12);
}

date-field-editor .date-field-editor__circa {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

date-field-editor .date-field-editor__preview {
  font-size: 0.85rem;
  color: #54595d;
  font-style: italic;
}

date-field-editor .date-field-editor__preview--from,
date-field-editor .date-field-editor__preview--to {
  display: none;
}

date-field-editor.is-between .date-field-editor__preview--from,
date-field-editor.is-between .date-field-editor__preview--to {
  display: inline-flex;
}

date-field-editor.is-between .date-field-editor__preview--combined {
  display: none !important;
}

date-field-editor[layout="stacked"] .date-field-editor__preview {
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
}

body.theme-dark date-field-editor .date-field-editor__preview {
  color: #a7adb4;
}

date-field-editor .date-field-editor__preview[hidden] {
  display: none !important;
}

date-field-editor .date-field-editor__picker-proxy {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 900px) {
  date-field-editor[layout="stacked"] .date-field-editor__controls {
    grid-template-columns: 1fr;
  }
}
`;

const DATE_FIELD_EDITOR_OPTION_LABELS = {
  exact: 'Exact',
  before: 'Before',
  after: 'After',
  about: 'About',
  between: 'Between',
};

function ensureDateFieldEditorStyles() {
  if (document.getElementById(DATE_FIELD_EDITOR_STYLE_ID)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = DATE_FIELD_EDITOR_STYLE_ID;
  styleElement.textContent = DATE_FIELD_EDITOR_STYLES;
  document.head.append(styleElement);
}

function escapeDateFieldEditorHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

function normalizeDateFieldEditorPrecisions(value) {
  const requested = String(value || '')
    .split(',')
    .map((entry) => String(entry || '').trim().toLowerCase())
    .filter(Boolean);
  const unique = [];
  requested.forEach((entry) => {
    if (!DATE_FIELD_EDITOR_OPTION_LABELS[entry] || unique.includes(entry)) {
      return;
    }
    unique.push(entry);
  });
  return unique.length ? unique : ['exact', 'before', 'after', 'about', 'between'];
}

function normalizeDateFieldEditorValue(value, precisions) {
  const allowed = Array.isArray(precisions) && precisions.length ? precisions : ['exact', 'before', 'after', 'about', 'between'];
  const fallbackPrecision = allowed.includes('exact') ? 'exact' : allowed[0];
  const precision = allowed.includes(String(value?.precision || '').trim())
    ? String(value.precision).trim()
    : fallbackPrecision;
  return {
    precision,
    date: String(value?.date || '').trim(),
    dateTo: String(value?.dateTo || '').trim(),
    circa: Boolean(value?.circa),
    circaTo: Boolean(value?.circaTo),
  };
}

function formatDateFieldEditorDate(isoDate) {
  const normalized = String(isoDate || '').trim();
  if (!normalized) {
    return '';
  }
  const match = normalized.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!match) {
    return normalized;
  }
  const year = match[1];
  const month = match[2];
  const day = match[3];
  if (!month || !day) {
    return year;
  }
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatDefaultDateFieldEditorPreviewParts(value) {
  return {
    from: formatDefaultDateFieldEditorPreview({
      precision: 'exact',
      date: value?.date,
      circa: value?.circa,
    }),
    to: formatDefaultDateFieldEditorPreview({
      precision: 'exact',
      date: value?.dateTo,
      circa: value?.circaTo,
    }),
  };
}

function dateFieldEditorInputKind(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return 'empty';
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return 'day';
  if (/^\d{4}-\d{2}$/.test(normalized)) return 'month';
  if (/^\d{4}$/.test(normalized)) return 'year';
  return 'text';
}

function usesTextDateFieldInput(value) {
  return !['empty', 'day'].includes(dateFieldEditorInputKind(value));
}

function pickerProxyValue(value) {
  const normalized = String(value || '').trim();
  const kind = dateFieldEditorInputKind(normalized);
  if (kind === 'day') return normalized;
  if (kind === 'month') return `${normalized}-01`;
  if (kind === 'year') return `${normalized}-01-01`;
  return '';
}

function formatDefaultDateFieldEditorPreview(value) {
  const formatDate = formatDateFieldEditorDate;

  const precision = String(value?.precision || 'exact').trim();
  if (precision === 'between') {
    const from = formatDate(value?.date);
    const to = formatDate(value?.dateTo);
    return from && to ? `${from} and ${to}` : (from || to || '');
  }

  const formatted = formatDate(value?.date);
  if (!formatted) {
    return '';
  }

  const prefix = {
    before: 'Before ',
    after: 'After ',
    about: 'About ',
  }[precision] || '';
  const circa = value?.circa ? 'Circa ' : '';
  return `${prefix}${circa}${formatted}`;
}

class DateFieldEditor extends HTMLElement {
  static get observedAttributes() {
    return ['disabled', 'input-id', 'layout', 'precisions', 'show-preview'];
  }

  connectedCallback() {
    ensureDateFieldEditorStyles();
    this.classList.add('pie__field', 'pie__field--date');
    if (!this.__value) {
      this.__value = normalizeDateFieldEditorValue({
        precision: this.getAttribute('value-precision'),
        date: this.getAttribute('value-date'),
        dateTo: this.getAttribute('value-date-to'),
        circa: this.getAttribute('value-circa') === 'true',
        circaTo: this.getAttribute('value-circa-to') === 'true',
      }, this.#precisionOptions());
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (!this.isConnected) {
      return;
    }
    this.#render();
  }

  get previewFormatter() {
    return this.__previewFormatter || null;
  }

  set previewFormatter(value) {
    this.__previewFormatter = typeof value === 'function' ? value : null;
    this.#syncPreview();
  }

  get value() {
    return this.getValue();
  }

  set value(nextValue) {
    this.setValue(nextValue);
  }

  getValue() {
    return { ...normalizeDateFieldEditorValue(this.__value, this.#precisionOptions()) };
  }

  setValue(nextValue) {
    const wasPrimaryText = usesTextDateFieldInput(this.__value?.date);
    const wasSecondaryText = usesTextDateFieldInput(this.__value?.dateTo);
    this.__value = normalizeDateFieldEditorValue(nextValue, this.#precisionOptions());
    const nowPrimaryText = usesTextDateFieldInput(this.__value?.date);
    const nowSecondaryText = usesTextDateFieldInput(this.__value?.dateTo);
    if (wasPrimaryText !== nowPrimaryText || wasSecondaryText !== nowSecondaryText) {
      this.#render();
    } else {
      this.#syncControls();
      this.#syncLayout();
      this.#syncPreview();
    }
  }

  focusPrimary(options) {
    this.querySelector('.date-field-editor__date-input')?.focus(options);
  }

  #precisionOptions() {
    return normalizeDateFieldEditorPrecisions(this.getAttribute('precisions'));
  }

  #layout() {
    return this.getAttribute('layout') === 'stacked' ? 'stacked' : 'inline';
  }

  #showPreview() {
    return this.hasAttribute('show-preview');
  }

  #primaryInputId() {
    return String(this.getAttribute('input-id') || '').trim() || 'date-field-editor-input';
  }

  #secondaryInputId() {
    return `${this.#primaryInputId()}-to`;
  }

  #render() {
    const disabled = this.hasAttribute('disabled');
    const showPreview = this.#showPreview();
    const layout = this.#layout();
    const rootClass = layout === 'stacked' ? 'date-field-editor prel__date-stack' : 'date-field-editor';
    const controlsClass = layout === 'stacked' ? 'date-field-editor__controls prel__date-row' : 'date-field-editor__controls';
    const previewClass = layout === 'stacked'
      ? 'date-field-editor__preview pie__date-preview prel__date-preview'
      : 'date-field-editor__preview pie__date-preview';
    const primaryId = this.#primaryInputId();
    const secondaryId = this.#secondaryInputId();
    const precisionOptions = this.#precisionOptions()
      .map((value) => `<option value="${escapeDateFieldEditorHtml(value)}">${escapeDateFieldEditorHtml(DATE_FIELD_EDITOR_OPTION_LABELS[value] || value)}</option>`)
      .join('');

    const primaryUsesTextInput = usesTextDateFieldInput(this.__value?.date);
    const secondaryUsesTextInput = usesTextDateFieldInput(this.__value?.dateTo);
    const primaryType = primaryUsesTextInput ? 'text' : 'date';
    const secondaryType = secondaryUsesTextInput ? 'text' : 'date';
    const inlinePreviewMarkup = showPreview && layout === 'inline'
      ? `<span class="${previewClass} date-field-editor__preview--combined" data-role="preview"></span>`
      : '';
    const fromPreviewMarkup = showPreview && layout === 'inline'
      ? `<span class="${previewClass} date-field-editor__preview--from" data-role="preview-from"></span>`
      : '';
    const toPreviewMarkup = showPreview && layout === 'inline'
      ? `<span class="${previewClass} date-field-editor__preview--to" data-role="preview-to"></span>`
      : '';

    this.innerHTML = `
      <div class="${rootClass}">
        <div class="${controlsClass}">
          <select class="date-field-editor__precision" data-part="precision"${disabled ? ' disabled' : ''}>
            ${precisionOptions}
          </select>
          <div class="date-field-editor__range pie__date-range">
            <div class="date-field-editor__range-row pie__date-range-row date-field-editor__range-row--from pie__date-range-row--from">
              <span class="date-field-editor__input-wrap pie__date-input-wrap">
                <input id="${escapeDateFieldEditorHtml(primaryId)}" type="${primaryType}" class="date-field-editor__date-input pie__date-input" data-part="date"${disabled ? ' disabled' : ''}>
                <input type="date" class="date-field-editor__picker-proxy" data-proxy-for="date" tabindex="-1" aria-hidden="true"${disabled ? ' disabled' : ''}>
                <button type="button" class="date-field-editor__picker-button pie__date-picker-button" data-picker-for="date" aria-label="Choose date"${disabled ? ' disabled' : ''}>
                  <i class="bi bi-calendar3" aria-hidden="true"></i>
                </button>
              </span>
              <label class="date-field-editor__circa pie__circa"><input type="checkbox" data-part="circa"${disabled ? ' disabled' : ''}> Circa</label>${fromPreviewMarkup}${inlinePreviewMarkup}
            </div>
            <div class="date-field-editor__range-row pie__date-range-row date-field-editor__range-row--divider pie__date-range-row--divider">
              <span class="date-field-editor__and pie__date-and">and</span>
            </div>
            <div class="date-field-editor__range-row pie__date-range-row date-field-editor__range-row--to pie__date-range-row--to">
              <span class="date-field-editor__input-wrap pie__date-input-wrap">
                <input id="${escapeDateFieldEditorHtml(secondaryId)}" type="${secondaryType}" class="date-field-editor__date-input pie__date-input" data-part="dateTo"${disabled ? ' disabled' : ''}>
                <input type="date" class="date-field-editor__picker-proxy" data-proxy-for="dateTo" tabindex="-1" aria-hidden="true"${disabled ? ' disabled' : ''}>
                <button type="button" class="date-field-editor__picker-button pie__date-picker-button" data-picker-for="dateTo" aria-label="Choose date"${disabled ? ' disabled' : ''}>
                  <i class="bi bi-calendar3" aria-hidden="true"></i>
                </button>
              </span>
              <label class="date-field-editor__circa pie__circa"><input type="checkbox" data-part="circaTo"${disabled ? ' disabled' : ''}> Circa</label>${toPreviewMarkup}
            </div>
          </div>
        </div>
        ${showPreview && layout === 'stacked' ? `<p class="${previewClass}" data-role="preview"></p>` : ''}
      </div>
    `;

    this.querySelectorAll('.date-field-editor__picker-button').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const field = String(button.getAttribute('data-picker-for') || 'date');
        const input = this.querySelector(`[data-part="${field}"]`);
        const proxy = this.querySelector(`[data-proxy-for="${field}"]`);
        const target = input instanceof HTMLInputElement && input.type === 'date'
          ? input
          : (proxy instanceof HTMLInputElement ? proxy : input);
        if (!(target instanceof HTMLInputElement) || target.disabled) {
          return;
        }
        if (target === proxy) {
          target.value = pickerProxyValue(input?.value || this.getValue()?.[field] || '');
        }
        target.focus({ preventScroll: true });
        try {
          if (typeof target.showPicker === 'function') {
            target.showPicker();
          }
        } catch (error) {
          // Ignore browsers that disallow programmatic picker opening.
        }
      });
    });

    this.querySelectorAll('[data-proxy-for]').forEach((proxy) => {
      proxy.addEventListener('input', (event) => {
        event.stopPropagation();
        this.#syncValueFromPickerProxy(String(proxy.getAttribute('data-proxy-for') || 'date'));
        this.#emit('input', String(proxy.getAttribute('data-proxy-for') || 'value'));
      });
      proxy.addEventListener('change', (event) => {
        event.stopPropagation();
        this.#syncValueFromPickerProxy(String(proxy.getAttribute('data-proxy-for') || 'date'));
        this.#emit('change', String(proxy.getAttribute('data-proxy-for') || 'value'));
      });
    });

    this.querySelectorAll('[data-part]').forEach((control) => {
      control.addEventListener('input', (event) => {
        event.stopPropagation();
        this.#syncValueFromControls();
        this.#syncLayout();
        this.#syncPreview();
        this.#emit('input', control.getAttribute('data-part') || 'value');
      });
      control.addEventListener('change', (event) => {
        event.stopPropagation();
        this.#syncValueFromControls();
        this.#syncLayout();
        this.#syncPreview();
        this.#emit('change', control.getAttribute('data-part') || 'value');
      });
    });

    this.#syncControls();
    this.#syncLayout();
    this.#syncPreview();
  }

  #syncValueFromControls() {
    const precision = this.querySelector('[data-part="precision"]')?.value || this.__value?.precision;
    const date = this.querySelector('[data-part="date"]')?.value || '';
    const dateTo = this.querySelector('[data-part="dateTo"]')?.value || '';
    const circa = Boolean(this.querySelector('[data-part="circa"]')?.checked);
    const circaTo = Boolean(this.querySelector('[data-part="circaTo"]')?.checked);
    this.__value = normalizeDateFieldEditorValue({ precision, date, dateTo, circa, circaTo }, this.#precisionOptions());
  }

  #syncControls() {
    const value = this.getValue();
    const precision = this.querySelector('[data-part="precision"]');
    const date = this.querySelector('[data-part="date"]');
    const dateTo = this.querySelector('[data-part="dateTo"]');
    const circa = this.querySelector('[data-part="circa"]');
    const circaTo = this.querySelector('[data-part="circaTo"]');

    if (precision) precision.value = value.precision;
    if (date) date.value = value.date;
    if (dateTo) dateTo.value = value.dateTo;
    if (circa) circa.checked = value.circa;
    if (circaTo) circaTo.checked = value.circaTo;

    const dateProxy = this.querySelector('[data-proxy-for="date"]');
    const dateToProxy = this.querySelector('[data-proxy-for="dateTo"]');
    if (dateProxy) dateProxy.value = pickerProxyValue(value.date);
    if (dateToProxy) dateToProxy.value = pickerProxyValue(value.dateTo);
  }

  #syncValueFromPickerProxy(field) {
    const key = field === 'dateTo' ? 'dateTo' : 'date';
    const proxy = this.querySelector(`[data-proxy-for="${key}"]`);
    if (!(proxy instanceof HTMLInputElement)) {
      return;
    }
    this.setValue({
      ...this.getValue(),
      [key]: String(proxy.value || '').trim(),
    });
  }

  #syncLayout() {
    const isBetween = this.getValue().precision === 'between';
    this.classList.toggle('is-between', isBetween);
  }

  #syncPreview() {
    const formatter = this.__previewFormatter || formatDefaultDateFieldEditorPreview;
    const value = this.getValue();
    const preview = this.querySelector('[data-role="preview"]');
    if (preview) {
      const text = String(formatter(value, { component: this }) || '').trim();
      preview.textContent = text;
      preview.hidden = !text;
    }

    const fromPreview = this.querySelector('[data-role="preview-from"]');
    const toPreview = this.querySelector('[data-role="preview-to"]');
    if (!fromPreview && !toPreview) {
      return;
    }

    const partsFormatter = this.__previewPartsFormatter || formatDefaultDateFieldEditorPreviewParts;
    const parts = value.precision === 'between'
      ? (partsFormatter(value, { component: this }) || {})
      : {};
    const fromText = String(parts.from || '').trim();
    const toText = String(parts.to || '').trim();

    if (fromPreview) {
      fromPreview.textContent = fromText;
      fromPreview.hidden = !fromText;
    }
    if (toPreview) {
      toPreview.textContent = toText;
      toPreview.hidden = !toText;
    }
  }

  #emit(type, field) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      detail: {
        field,
        value: this.getValue(),
      },
    }));
  }
}

if (!customElements.get('date-field-editor')) {
  customElements.define('date-field-editor', DateFieldEditor);
}
