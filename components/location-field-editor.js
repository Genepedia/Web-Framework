const LOCATION_FIELD_EDITOR_STYLE_ID = 'location-field-editor-styles';
const LOCATION_FIELD_EDITOR_STYLES = String.raw`
location-field-editor {
  display: block;
  width: 100%;
  min-width: 0;
}

location-field-editor .location-field-editor {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 100%;
  min-width: 0;
}

location-field-editor .location-field-editor__search-wrap {
  position: relative;
  width: 100%;
}

location-field-editor .location-field-editor__search,
location-field-editor .location-field-editor__detail-row input {
  width: 100%;
}

location-field-editor .location-field-editor__results {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 30;
  margin: 0;
  padding: 0.3rem 0;
  list-style: none;
  border: 1px solid #a2a9b1;
  border-radius: 0.125rem;
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.16);
  max-height: 16rem;
  overflow: auto;
}

location-field-editor .location-field-editor__results[hidden] {
  display: none !important;
}

body.theme-dark location-field-editor .location-field-editor__results {
  border-color: rgba(255, 255, 255, 0.18);
  background: #171b20;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
}

location-field-editor .location-field-editor__option {
  margin: 0;
}

location-field-editor .location-field-editor__option-button {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

location-field-editor .location-field-editor__option-button:hover,
location-field-editor .location-field-editor__option-button.is-active {
  background: rgba(51, 102, 204, 0.08);
}

body.theme-dark location-field-editor .location-field-editor__option-button:hover,
body.theme-dark location-field-editor .location-field-editor__option-button.is-active {
  background: rgba(107, 158, 255, 0.16);
}

location-field-editor .location-field-editor__option-title {
  color: #202122;
  font-size: 0.9rem;
  font-weight: 600;
}

body.theme-dark location-field-editor .location-field-editor__option-title {
  color: #eaecf0;
}

location-field-editor .location-field-editor__option-meta,
location-field-editor .location-field-editor__empty {
  color: #72777d;
  font-size: 0.8rem;
  line-height: 1.35;
}

body.theme-dark location-field-editor .location-field-editor__option-meta,
body.theme-dark location-field-editor .location-field-editor__empty {
  color: #a7adb4;
}

location-field-editor .location-field-editor__empty {
  display: block;
  padding: 0.5rem 0.65rem;
}

location-field-editor .location-field-editor__details {
  padding: 0.8rem 0.95rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.125rem;
  background: rgba(0, 0, 0, 0.03);
}

location-field-editor .location-field-editor__details[hidden] {
  display: none !important;
}

body.theme-dark location-field-editor .location-field-editor__details {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
}

location-field-editor .location-field-editor__detail-row {
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.45rem 0.75rem;
}

location-field-editor .location-field-editor__detail-row + .location-field-editor__detail-row {
  margin-top: 0.45rem;
}

location-field-editor .location-field-editor__detail-label {
  color: #54595d;
  font-size: 0.875rem;
  text-align: right;
}

body.theme-dark location-field-editor .location-field-editor__detail-label {
  color: #c8ccd1;
}

location-field-editor .location-field-editor__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  color: #3366cc;
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}

location-field-editor .location-field-editor__toggle:hover {
  text-decoration: underline;
}

body.theme-dark location-field-editor .location-field-editor__toggle {
  color: #6b9eff;
}

location-field-editor .location-field-editor__toggle-icon {
  font-size: 0.72rem;
  line-height: 1;
}

@media (max-width: 600px) {
  location-field-editor .location-field-editor__detail-row {
    grid-template-columns: 1fr;
  }

  location-field-editor .location-field-editor__detail-label {
    text-align: left;
  }
}
`;

function ensureLocationFieldEditorStyles() {
    if (document.getElementById(LOCATION_FIELD_EDITOR_STYLE_ID)) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = LOCATION_FIELD_EDITOR_STYLE_ID;
    styleElement.textContent = LOCATION_FIELD_EDITOR_STYLES;
    document.head.append(styleElement);
}

function escapeLocationFieldEditorHtml(value) {
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

function cloneLocationFieldEditorValue(value) {
    if (!value || typeof value !== 'object') {
        return {};
    }
    return JSON.parse(JSON.stringify(value));
}

class LocationFieldEditor extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'input-id', 'placeholder', 'toggle-label'];
    }

    connectedCallback() {
        ensureLocationFieldEditorStyles();
        this.classList.add('pie__field', 'pie__field--location');
        if (!this.__value) {
            this.__value = this.#normalizeValue({});
        }
        this.#render();
    }

    attributeChangedCallback() {
        if (!this.isConnected) {
            return;
        }
        this.#render();
    }

    get detailFields() {
        return Array.isArray(this.__detailFields) ? this.__detailFields : [];
    }

    set detailFields(value) {
        this.__detailFields = Array.isArray(value)
            ? value.map((field) => ({
                key: String(field?.key || '').trim(),
                label: String(field?.label || '').trim(),
            })).filter((field) => field.key)
            : [];
        if (this.isConnected) {
            this.#render();
        }
    }

    get searchProvider() {
        return this.__searchProvider || null;
    }

    set searchProvider(value) {
        this.__searchProvider = typeof value === 'function' ? value : null;
    }

    get formatSummary() {
        return this.__formatSummary || null;
    }

    set formatSummary(value) {
        this.__formatSummary = typeof value === 'function' ? value : null;
        this.#syncSearchFromValue();
    }

    get normalizeValue() {
        return this.__normalizeValue || null;
    }

    set normalizeValue(value) {
        this.__normalizeValue = typeof value === 'function' ? value : null;
    }

    get ensureDetails() {
        return this.__ensureDetails || null;
    }

    set ensureDetails(value) {
        this.__ensureDetails = typeof value === 'function' ? value : null;
    }

    get hasDetails() {
        return this.__hasDetails || null;
    }

    set hasDetails(value) {
        this.__hasDetails = typeof value === 'function' ? value : null;
    }

    get emptyValueFactory() {
        return this.__emptyValueFactory || null;
    }

    set emptyValueFactory(value) {
        this.__emptyValueFactory = typeof value === 'function' ? value : null;
    }

    get value() {
        return this.getValue();
    }

    set value(nextValue) {
        this.setValue(nextValue);
    }

    getValue() {
        if (!this.isConnected) {
            return cloneLocationFieldEditorValue(this.__value);
        }
        return this.#collectValueFromControls();
    }

    setValue(nextValue, { expanded } = {}) {
        this.__value = this.#ensureDetailsValue(this.#normalizeValue(nextValue));
        if (typeof expanded === 'boolean') {
            this.__expanded = expanded;
        }
        this.#syncControls();
        this.#syncExpandedState(typeof expanded === 'boolean' ? expanded : this.__expanded);
        this.closeDropdown();
    }

    focusSearch(options) {
        this.querySelector('.location-field-editor__search')?.focus(options);
    }

    setExpanded(expanded) {
        this.__expanded = Boolean(expanded);
        this.#syncExpandedState(this.__expanded);
    }

    closeDropdown() {
        const results = this.querySelector('.location-field-editor__results');
        if (!results) {
            return;
        }
        results.hidden = true;
        this.__activeIndex = -1;
        this.querySelector('.location-field-editor__search')?.setAttribute('aria-expanded', 'false');
        this.#setActiveMatch(-1);
    }

    syncSearchFromValue() {
        this.#syncSearchFromValue();
    }

    #render() {
        const disabled = this.hasAttribute('disabled');
        const inputId = this.#inputId();
        const resultsId = `${inputId}-results`;
        const detailsId = `${inputId}-details`;
        const placeholder = escapeLocationFieldEditorHtml(this.getAttribute('placeholder') || 'Start typing a location');
        const toggleLabel = escapeLocationFieldEditorHtml(this.getAttribute('toggle-label') || 'Show and Edit Location Details');
        const detailRows = this.detailFields.map((field) => `
      <div class="location-field-editor__detail-row pie__location-detail-row">
        <label class="location-field-editor__detail-label pie__location-detail-label" for="${escapeLocationFieldEditorHtml(`${inputId}-${field.key}`)}">${escapeLocationFieldEditorHtml(field.label)}:</label>
        <input id="${escapeLocationFieldEditorHtml(`${inputId}-${field.key}`)}" type="text" data-detail-key="${escapeLocationFieldEditorHtml(field.key)}"${disabled ? ' disabled' : ''}>
      </div>`).join('');

        this.innerHTML = `
      <div class="location-field-editor">
        <div class="location-field-editor__search-wrap pie__location-search-wrap">
          <input id="${escapeLocationFieldEditorHtml(inputId)}" class="location-field-editor__search pie__location-search" type="search" placeholder="${placeholder}" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-expanded="false" aria-controls="${escapeLocationFieldEditorHtml(resultsId)}"${disabled ? ' disabled' : ''}>
          <ul class="location-field-editor__results pie__location-results" id="${escapeLocationFieldEditorHtml(resultsId)}" role="listbox" hidden></ul>
        </div>
        <div class="location-field-editor__details pie__location-details" id="${escapeLocationFieldEditorHtml(detailsId)}" hidden>${detailRows}</div>
        <button type="button" class="location-field-editor__toggle pie__location-toggle" aria-expanded="false" aria-controls="${escapeLocationFieldEditorHtml(detailsId)}"${disabled ? ' disabled' : ''}>
          <span class="location-field-editor__toggle-icon pie__location-toggle-icon" aria-hidden="true">▾</span>
          <span>${toggleLabel}</span>
        </button>
      </div>
    `;

        const searchInput = this.querySelector('.location-field-editor__search');
        const results = this.querySelector('.location-field-editor__results');
        const details = this.querySelector('.location-field-editor__details');
        const toggle = this.querySelector('.location-field-editor__toggle');

        searchInput?.addEventListener('input', (event) => {
            event.stopPropagation();
            this.#scheduleSearch();
            this.#emit('input', 'search', { query: searchInput.value.trim() });
        });

        searchInput?.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                this.#scheduleSearch();
            }
        });

        searchInput?.addEventListener('blur', () => {
            window.setTimeout(() => {
                this.closeDropdown();
                this.#syncSearchFromValue();
            }, 120);
        });

        searchInput?.addEventListener('keydown', (event) => {
            this.#handleSearchKeydown(event);
        });

        results?.addEventListener('mousedown', (event) => {
            event.preventDefault();
        });

        results?.addEventListener('click', (event) => {
            const option = event.target.closest('[data-match-index]');
            if (!option) {
                return;
            }
            const index = Number(option.getAttribute('data-match-index'));
            const match = this.__matches?.[index];
            if (!match) {
                return;
            }
            this.#selectMatch(match);
        });

        details?.querySelectorAll('[data-detail-key]').forEach((input) => {
            input.addEventListener('input', (event) => {
                event.stopPropagation();
                this.setExpanded(true);
                this.__value = this.#collectValueFromControls();
                this.#syncSearchFromValue();
                this.#emit('input', 'details');
            });
            input.addEventListener('change', (event) => {
                event.stopPropagation();
                this.setExpanded(true);
                this.__value = this.#collectValueFromControls();
                this.#syncSearchFromValue();
                this.#emit('change', 'details');
            });
        });

        toggle?.addEventListener('click', (event) => {
            event.preventDefault();
            const nextExpanded = details ? details.hidden : false;
            this.setExpanded(nextExpanded);
            if (nextExpanded) {
                details?.querySelector('input')?.focus();
            }
        });

        this.#syncControls();
        this.#syncExpandedState(Boolean(this.__expanded));
    }

    #inputId() {
        return String(this.getAttribute('input-id') || '').trim() || 'location-field-editor-input';
    }

    #emptyValue() {
        const base = this.__emptyValueFactory ? this.__emptyValueFactory() : {};
        return base && typeof base === 'object' ? { ...base } : {};
    }

    #normalizeValue(value) {
        const base = this.#emptyValue();
        const incoming = value && typeof value === 'object' ? value : {};
        Object.assign(base, cloneLocationFieldEditorValue(incoming));
        if (!Object.prototype.hasOwnProperty.call(base, 'label')) {
            base.label = '';
        }
        this.detailFields.forEach((field) => {
            base[field.key] = String(base[field.key] ?? '').trim();
        });
        base.label = String(base.label || '').trim();
        const label = this.#formatSummary(base, base.label);
        return this.__normalizeValue ? this.__normalizeValue(base, label) : { ...base, label };
    }

    #ensureDetailsValue(value) {
        if (this.__ensureDetails) {
            return this.__ensureDetails(cloneLocationFieldEditorValue(value));
        }
        return value;
    }

    #hasDetailsValue(value) {
        if (this.__hasDetails) {
            return Boolean(this.__hasDetails(value));
        }
        return this.detailFields.some((field) => String(value?.[field.key] || '').trim());
    }

    #formatSummary(value, label) {
        if (this.__formatSummary) {
            return String(this.__formatSummary(value, label) || '').trim();
        }
        return String(label || value?.label || value?.placeName || '').trim();
    }

    #syncControls() {
        const value = this.#ensureDetailsValue(this.#normalizeValue(this.__value || {}));
        this.__value = value;
        this.querySelectorAll('[data-detail-key]').forEach((input) => {
            const key = String(input.getAttribute('data-detail-key') || '').trim();
            input.value = String(value[key] ?? '').trim();
        });
        this.#syncSearchFromValue();
    }

    #syncSearchFromValue() {
        const searchInput = this.querySelector('.location-field-editor__search');
        if (!searchInput) {
            return;
        }
        const value = this.#collectValueFromControls();
        searchInput.value = this.#formatSummary(value, value.label || '');
    }

    #collectValueFromControls() {
        const value = this.#emptyValue();
        const existing = this.__value && typeof this.__value === 'object' ? this.__value : {};
        Object.assign(value, cloneLocationFieldEditorValue(existing));
        this.querySelectorAll('[data-detail-key]').forEach((input) => {
            const key = String(input.getAttribute('data-detail-key') || '').trim();
            value[key] = input.value.trim();
        });
        const label = this.#formatSummary(value, String(value.label || '').trim());
        value.label = label;
        return this.#normalizeValue(value);
    }

    #syncExpandedState(expanded) {
        const details = this.querySelector('.location-field-editor__details');
        const toggle = this.querySelector('.location-field-editor__toggle');
        const icon = toggle?.querySelector('.location-field-editor__toggle-icon');
        if (details) {
            details.hidden = !expanded;
        }
        if (toggle) {
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
        if (icon) {
            icon.textContent = expanded ? '▴' : '▾';
        }
    }

    #scheduleSearch() {
        window.clearTimeout(this.__debounceTimer);
        this.__debounceTimer = window.setTimeout(() => {
            void this.#runSearch();
        }, 180);
    }

    async #runSearch() {
        const searchInput = this.querySelector('.location-field-editor__search');
        if (!searchInput || typeof this.__searchProvider !== 'function') {
            this.closeDropdown();
            return;
        }
        const query = searchInput.value.trim();
        if (!query) {
            this.__matches = [];
            this.closeDropdown();
            return;
        }

        this.__abortController?.abort?.();
        this.__abortController = typeof AbortController === 'function' ? new AbortController() : null;

        try {
            const matches = await this.__searchProvider(query, {
                signal: this.__abortController?.signal,
                component: this,
            });
            if (searchInput.value.trim() !== query) {
                return;
            }
            this.#renderMatches(Array.isArray(matches) ? matches : [], query);
        } catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
            this.#renderMatches([], query);
        }
    }

    #renderMatches(matches, query) {
        const results = this.querySelector('.location-field-editor__results');
        const searchInput = this.querySelector('.location-field-editor__search');
        if (!results || !searchInput) {
            return;
        }
        results.textContent = '';
        this.__matches = matches;
        this.__activeIndex = -1;

        if (!matches.length) {
            const empty = document.createElement('li');
            empty.className = 'location-field-editor__empty pie__location-empty';
            empty.textContent = query ? `No locations match "${query}".` : 'Start typing a location.';
            results.append(empty);
            results.hidden = false;
            searchInput.setAttribute('aria-expanded', 'true');
            return;
        }

        matches.forEach((match, index) => {
            const item = document.createElement('li');
            item.className = 'location-field-editor__option pie__location-option';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'location-field-editor__option-button pie__location-option-button';
            button.setAttribute('role', 'option');
            button.setAttribute('data-match-index', String(index));

            const title = document.createElement('span');
            title.className = 'location-field-editor__option-title pie__location-option-title';
            title.textContent = this.#formatSummary(match.location || {}, match.label || '') || String(match.label || '');
            button.append(title);

            const meta = document.createElement('span');
            meta.className = 'location-field-editor__option-meta pie__location-option-meta';
            meta.textContent = match.type === 'manual'
                ? `Use "${query}" as entered`
                : String(match.label || 'Search result');
            button.append(meta);

            item.append(button);
            results.append(item);
        });

        results.hidden = false;
        searchInput.setAttribute('aria-expanded', 'true');
    }

    #setActiveMatch(index) {
        const buttons = [...this.querySelectorAll('[data-match-index]')];
        buttons.forEach((button, buttonIndex) => {
            button.classList.toggle('is-active', buttonIndex === index);
            button.setAttribute('aria-selected', buttonIndex === index ? 'true' : 'false');
        });
        this.__activeIndex = index;
        return buttons[index] || null;
    }

    #handleSearchKeydown(event) {
        const options = [...this.querySelectorAll('[data-match-index]')];
        if (event.key === 'ArrowDown') {
            if (!options.length) {
                return;
            }
            event.preventDefault();
            const nextIndex = Math.min((this.__activeIndex ?? -1) + 1, options.length - 1);
            this.#setActiveMatch(nextIndex)?.scrollIntoView({ block: 'nearest' });
            return;
        }
        if (event.key === 'ArrowUp') {
            if (!options.length) {
                return;
            }
            event.preventDefault();
            const nextIndex = Math.max((this.__activeIndex ?? 0) - 1, 0);
            this.#setActiveMatch(nextIndex)?.scrollIntoView({ block: 'nearest' });
            return;
        }
        if (event.key === 'Enter') {
            if (!options.length) {
                return;
            }
            event.preventDefault();
            const selectedIndex = this.__activeIndex >= 0 ? this.__activeIndex : 0;
            const match = this.__matches?.[selectedIndex];
            if (match) {
                this.#selectMatch(match);
            }
            return;
        }
        if (event.key === 'Escape') {
            this.closeDropdown();
        }
    }

    #selectMatch(match) {
        const location = this.#ensureDetailsValue(this.#normalizeValue(match?.location || {}, match?.label || ''));
        this.setValue(location, { expanded: this.#hasDetailsValue(location) });
        this.focusSearch();
        this.#emit('input', 'selection', { match, query: this.querySelector('.location-field-editor__search')?.value.trim() || '' });
        this.#emit('change', 'selection', { match, query: this.querySelector('.location-field-editor__search')?.value.trim() || '' });
    }

    #emit(type, field, extra = {}) {
        this.dispatchEvent(new CustomEvent(type, {
            bubbles: true,
            detail: {
                field,
                value: this.getValue(),
                query: String(extra.query || '').trim(),
                match: extra.match || null,
            },
        }));
    }
}

if (!customElements.get('location-field-editor')) {
    customElements.define('location-field-editor', LocationFieldEditor);
}