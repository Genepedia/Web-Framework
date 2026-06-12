const PAGE_EDITOR_SCRIPT_URL = (() => {
  if (document.currentScript?.src) return document.currentScript.src;
  try {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const script = scripts[i];
      if (script?.src && script.src.includes('page-editor.js')) {
        return script.src;
      }
    }
  } catch (error) {
    // ignore
  }
  return window.location.href;
})();

const CODEMIRROR_VERSION = '5.65.18';
const CODEMIRROR_BASE = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}`;
const JS_BEAUTIFY_URL = 'https://cdn.jsdelivr.net/npm/js-beautify@1.15.4/js/lib/beautify-html.min.js';

const PAGE_EDITOR_TEMPLATE = String.raw`
<div class="page-editor">
  <header class="page-editor__header">
    <div class="page-editor__header-start">
      <a class="page-editor__back" href="#" hidden>
        <i class="bi bi-arrow-left" aria-hidden="true"></i>
        <span>Back to page</span>
      </a>
      <div class="page-editor__title-wrap">
        <p class="page-editor__eyebrow">Editing</p>
        <label class="page-editor__title-field">
          <span class="page-editor__title-label">Page title</span>
          <input type="text" class="page-editor__title-input" name="page_title" autocomplete="off" aria-label="Page title">
        </label>
        <p class="page-editor__source"><code></code></p>
      </div>
    </div>
    <div class="page-editor__header-end">
      <div class="page-editor__save-group">
        <p class="page-editor__counts" aria-live="polite" hidden></p>
        <p class="page-editor__unsaved-notice" hidden>Unsaved changes</p>
        <button type="button" class="page-editor__button page-editor__button--save" data-action="publish">
          <i class="bi bi-check2-circle" aria-hidden="true"></i>
          <span>Save</span>
        </button>
      </div>
    </div>
  </header>

  <div class="page-editor__status" role="status" aria-live="polite"></div>

  <div class="page-editor__toolbar-row">
    <div class="page-editor__mode-tabs" role="tablist" aria-label="Editor mode">
      <button type="button" class="page-editor__mode-tab is-active" data-mode="page" role="tab" aria-selected="true">
        Page
      </button>
      <button type="button" class="page-editor__mode-tab" data-mode="source" role="tab" aria-selected="false">
        HTML
      </button>
    </div>
  </div>

  <div class="page-editor__workspace">
    <div class="page-editor__panel page-editor__panel--page is-active" data-panel="page">
      <profile-prose-toolbar add-block class="page-editor__format-toolbar"></profile-prose-toolbar>
      <div class="page-editor__layout">
        <div class="page-editor__page-frame">
          <div class="page-editor__page-content" aria-label="Editable page canvas"></div>
        </div>
      </div>
      <div class="page-editor__slash-menu" role="listbox" aria-label="Insert block" hidden></div>
      <div class="page-editor__inline-toolbar" role="toolbar" aria-label="Text formatting" hidden>
        <button type="button" class="page-editor__format-button" data-cmd="bold" title="Bold"><i class="bi bi-type-bold" aria-hidden="true"></i></button>
        <button type="button" class="page-editor__format-button" data-cmd="italic" title="Italic"><i class="bi bi-type-italic" aria-hidden="true"></i></button>
        <button type="button" class="page-editor__format-button" data-cmd="underline" title="Underline"><i class="bi bi-type-underline" aria-hidden="true"></i></button>
        <button type="button" class="page-editor__format-button" data-cmd="strikeThrough" title="Strikethrough"><i class="bi bi-type-strikethrough" aria-hidden="true"></i></button>
        <button type="button" class="page-editor__format-button" data-action="inline-code" title="Inline code"><i class="bi bi-code" aria-hidden="true"></i></button>
        <button type="button" class="page-editor__format-button" data-action="insert-link" title="Link"><i class="bi bi-link-45deg" aria-hidden="true"></i></button>
        <button type="button" class="page-editor__format-button" data-cmd="removeFormat" title="Clear formatting"><i class="bi bi-eraser" aria-hidden="true"></i></button>
      </div>
    </div>
    <div class="page-editor__panel page-editor__panel--source" data-panel="source" hidden>
      <div class="page-editor__source-bar">
        <button type="button" class="page-editor__button page-editor__button--small" data-action="format-source">
          <i class="bi bi-text-indent-left" aria-hidden="true"></i>
          <span>Format HTML</span>
        </button>
      </div>
      <div class="page-editor__codemirror" aria-label="HTML editor"></div>
    </div>
  </div>

  <dialog class="page-editor__inserter" aria-label="Block library">
    <form method="dialog" class="page-editor__inserter-form">
      <header class="page-editor__inserter-header">
        <h2 class="page-editor__inserter-title">Add block</h2>
        <input type="search" class="page-editor__inserter-search" placeholder="Search blocks…" autocomplete="off">
        <button type="button" class="page-editor__icon-button" data-action="close-inserter" aria-label="Close">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>
      <div class="page-editor__inserter-body" role="listbox" aria-label="Available blocks"></div>
    </form>
  </dialog>

  <dialog class="page-editor__publish-dialog">
    <form method="dialog" class="page-editor__publish-form">
      <header class="page-editor__publish-header">
        <h2 class="page-editor__publish-title">Save</h2>
        <button type="button" class="page-editor__icon-button" data-action="close-publish" aria-label="Close">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>
      <p class="page-editor__publish-intro">
        If you manage this page, your edits will be committed immediately. Otherwise, they will open a pull request for review.
      </p>
      <label class="page-editor__field">
        <span class="page-editor__field-label">Commit message</span>
        <input type="text" class="page-editor__field-input" name="commit_message" required>
      </label>
      <label class="page-editor__field">
        <span class="page-editor__field-label">Review title</span>
        <input type="text" class="page-editor__field-input" name="pr_title" required>
      </label>
      <label class="page-editor__field">
        <span class="page-editor__field-label">Review description</span>
        <textarea class="page-editor__field-textarea" name="pr_body" rows="5"></textarea>
      </label>
      <footer class="page-editor__publish-footer">
        <button type="button" class="page-editor__button" data-action="close-publish">Cancel</button>
        <button type="submit" class="page-editor__button page-editor__button--save" data-action="submit-publish">
          Save
        </button>
      </footer>
    </form>
  </dialog>

  <div class="page-editor__leave-overlay" hidden>
    <div class="page-editor__leave-panel" role="dialog" aria-modal="true" aria-labelledby="page-editor-leave-title">
      <header class="page-editor__publish-header">
        <h2 id="page-editor-leave-title" class="page-editor__publish-title">Unsaved changes</h2>
      </header>
      <p class="page-editor__publish-intro">
        You have unsaved changes on this page. Leave without saving?
      </p>
      <footer class="page-editor__publish-footer">
        <button type="button" class="page-editor__button" data-action="close-leave">Stay on page</button>
        <button type="button" class="page-editor__button page-editor__button--save" data-action="confirm-leave">
          Leave without saving
        </button>
      </footer>
    </div>
  </div>
</div>
`;

function getBlockDefinition(typeId) {
  return window.EditorBlocks?.getById(typeId) || window.EditorBlocks?.getById("paragraph");
}

const FRAGMENT_CONTENT_SELECTOR = "__fragment__";
const HISTORY_DEBOUNCE_MS = 900;
const HISTORY_MAX_ENTRIES = 60;

let blockUidCounter = 0;

function createBlockUid() {
  blockUidCounter += 1;
  return `block-${Date.now()}-${blockUidCounter}`;
}

let codeMirrorLoaderPromise = null;
let beautifyLoaderPromise = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function normalizeSitePath(path) {
  return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
}

function isAllowedEditorSource(path) {
  const normalized = normalizeSitePath(path);
  return /^(pages|people)\/[a-zA-Z0-9_./-]+\.html$/.test(normalized);
}

function parseClassFromOpenTag(openTag) {
  if (!openTag) return 'main-content';
  const match = String(openTag).match(/\bclass=(["'])(.*?)\1/i);
  return match ? match[2].trim() : 'main-content';
}

function getEditorQueryParams() {
  return new URLSearchParams(window.location.search);
}

function resolveGitHubApiBase() {
  return String(
    window.App?.getGitHubApiBase?.()
    || window.App?.GitHubApiBase
    || '',
  ).trim().replace(/\/+$/, '');
}

function resolveGitHubApiUrl(fileName) {
  const apiBase = resolveGitHubApiBase();
  if (!apiBase) {
    return '';
  }
  return new URL(fileName, `${apiBase}/`).href;
}

function resolveSourcePageUrl(sourcePath) {
  if (window.App?.resolveSiteUrl) {
    return window.App.resolveSiteUrl(sourcePath);
  }
  return new URL(normalizeSitePath(sourcePath), window.location.href).href;
}

function resolveReturnPageUrl(returnPath) {
  if (window.App?.resolveSiteUrl) {
    return window.App.resolveSiteUrl(returnPath);
  }
  return new URL(normalizeSitePath(returnPath), window.location.href).href;
}

function loadStylesheet(href, id) {
  if (id && document.getElementById(id)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (id) link.id = id;
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', reject, { once: true });
    document.head.append(link);
  });
}

function loadScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.append(script);
  });
}

function ensureCodeMirror() {
  if (window.CodeMirror) return Promise.resolve(window.CodeMirror);
  if (!codeMirrorLoaderPromise) {
    codeMirrorLoaderPromise = loadStylesheet(`${CODEMIRROR_BASE}/codemirror.min.css`, 'page-editor-codemirror-theme')
      .then(() => loadStylesheet(`${CODEMIRROR_BASE}/theme/material.min.css`, 'page-editor-codemirror-material'))
      .then(() => loadScript(`${CODEMIRROR_BASE}/codemirror.min.js`))
      .then(() => loadScript(`${CODEMIRROR_BASE}/mode/xml/xml.min.js`))
      .then(() => loadScript(`${CODEMIRROR_BASE}/mode/javascript/javascript.min.js`))
      .then(() => loadScript(`${CODEMIRROR_BASE}/mode/css/css.min.js`))
      .then(() => loadScript(`${CODEMIRROR_BASE}/mode/htmlmixed/htmlmixed.min.js`))
      .then(() => window.CodeMirror);
  }
  return codeMirrorLoaderPromise;
}

function ensureHtmlBeautify() {
  if (window.html_beautify) return Promise.resolve(window.html_beautify);
  if (!beautifyLoaderPromise) {
    beautifyLoaderPromise = loadScript(JS_BEAUTIFY_URL).then(() => window.html_beautify);
  }
  return beautifyLoaderPromise;
}

function isDarkThemeActive() {
  return document.body?.classList.contains('theme-dark');
}

function formatHtmlSource(html) {
  const value = String(html || '').trim();
  if (!value) return '<p></p>';
  if (!window.html_beautify) return value;
  return window.html_beautify(value, {
    indent_size: 2,
    wrap_line_length: 0,
    preserve_newlines: false,
    max_preserve_newlines: 1,
    indent_inner_html: true,
  });
}

function getBrandToken() {
  return window.App?.BrandToken || '{{APP_NAME}}';
}

function extractPageTitle(doc) {
  const titleEl = doc.querySelector('title');
  const toolbarTitle = doc.querySelector('full-page-toolbar')?.getAttribute('title')?.trim();
  if (toolbarTitle) {
    return toolbarTitle;
  }

  const brandToken = getBrandToken();
  const template = titleEl?.getAttribute('data-brand-template')?.trim();
  if (template) {
    const withoutBrand = template.replace(brandToken, '').trim().replace(/^\s*-\s*/, '').trim();
    if (withoutBrand) {
      return withoutBrand;
    }
  }

  const text = titleEl?.textContent?.trim() || '';
  if (text && text.includes(brandToken)) {
    const withoutBrand = text.replace(brandToken, '').trim().replace(/^\s*-\s*/, '').trim();
    if (withoutBrand) {
      return withoutBrand;
    }
  }

  const appName = window.App?.getName?.() || window.App?.Name || '';
  if (appName && text.startsWith(appName)) {
    const withoutApp = text.slice(appName.length).trim().replace(/^\s*-\s*/, '').trim();
    if (withoutApp) {
      return withoutApp;
    }
  }

  return text;
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function isFragmentContentSelector(contentSelector) {
  const selector = String(contentSelector || '').trim();
  return selector === FRAGMENT_CONTENT_SELECTOR || selector === 'fragment' || selector === 'body';
}

function isHtmlFragmentDocument(html) {
  const trimmed = String(html || '').trim();
  if (!trimmed) return false;
  return !/<!DOCTYPE\s+html/i.test(trimmed) && !/<html[\s>]/i.test(trimmed);
}

function shouldUseFragmentMode(html, contentSelector) {
  if (isFragmentContentSelector(contentSelector)) {
    return true;
  }
  if (findWrappedContentRegion(html, contentSelector)) {
    return false;
  }
  return isHtmlFragmentDocument(html);
}

function extractFragmentTitle(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector('h1')?.textContent?.trim() || '';
}

function applyFragmentTitleToHtml(html, pageTitle) {
  const cleanTitle = String(pageTitle || '').trim();
  if (!cleanTitle) {
    return html;
  }

  const doc = new DOMParser().parseFromString(`<div data-root>${html}</div>`, 'text/html');
  const root = doc.querySelector('[data-root]');
  const h1 = root?.querySelector('h1');
  if (!h1) {
    return html;
  }

  h1.textContent = cleanTitle;
  return [...root.childNodes].map((node) => node.outerHTML ?? node.textContent ?? '').join('');
}

function extractPageContent(html, contentSelector) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const fragmentMode = shouldUseFragmentMode(html, contentSelector);
  if (fragmentMode) {
    const trimmed = String(html || '').trim();
    return {
      title: extractFragmentTitle(trimmed),
      content: trimmed,
      mainClassName: 'main-content',
      document: doc,
      fragmentMode: true,
    };
  }

  const region = findContentRegion(html, contentSelector);
  const container = doc.querySelector(contentSelector) || doc.querySelector('main');
  return {
    title: extractPageTitle(doc),
    content: region?.inner ?? container?.innerHTML ?? '',
    mainClassName: parseClassFromOpenTag(region?.open) || container?.className?.trim() || 'main-content',
    document: doc,
    fragmentMode: false,
  };
}

function hardenLiveEditorRoot(root) {
  if (!root) return;
  root.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => event.preventDefault());
  });
  root.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', (event) => event.preventDefault());
  });
}

function applyBrandingToNode(node) {
  if (!node) return;
  try {
    window.App?.applyBranding?.(node);
  } catch (error) {
    // ignore
  }
}

function splitHtmlIntoTopLevelFragments(html) {
  const blocks = extractContentBlocksFromEditor(html);
  if (blocks.length > 0) {
    return blocks.map((block) => block.outerHtml);
  }
  const trimmed = String(html || '').trim();
  return trimmed ? [trimmed] : ['<p></p>'];
}

function detectBlockType(html) {
  const doc = new DOMParser().parseFromString(`<div data-root>${html}</div>`, 'text/html');
  const root = doc.querySelector('[data-root]');
  const el = root?.firstElementChild;
  if (!el) return 'paragraph';

  for (const library of window.EditorBlocks?.getLibraries?.() || []) {
    try {
      const id = library.detect?.(el, html);
      if (id && window.EditorBlocks.getById(id)) return id;
    } catch (error) {
      // ignore detector failures and fall through to the base rules
    }
  }

  if (el.hasAttribute('data-editor-include')) return 'include-fragment';
  if (el.tagName.toLowerCase() === 'include' || el.hasAttribute('data-include')) return 'include-locked';

  const cls = String(el.className || '');
  const tag = el.tagName.toLowerCase();

  if (tag === 'section' && cls.includes('home-page__hero')) return 'hero';
  if (tag === 'section' && cls.includes('home-page__section')) {
    return el.querySelector('.home-page__grid') ? 'tiles' : 'section';
  }
  if (cls.includes('home-page__grid')) return 'columns';
  if (cls.includes('home-page__actions')) return 'buttons';
  if (cls.includes('home-page__chips')) return 'chip';
  if (tag === 'table' || el.querySelector('table')) return 'table';
  if (tag === 'ul' || tag === 'ol') return 'list';
  if (tag === 'blockquote') return 'quote';
  if (tag === 'img' || el.querySelector('img')) return 'image';
  if (el.querySelector('.pure-button') && !cls.includes('home-page__actions')) return 'button';
  if (tag === 'hr') return 'divider';
  if (tag === 'h1' || tag === 'h2' || tag === 'h3') return 'heading';
  if (el.querySelector('.home-page__newsletter-form')) return 'newsletter';
  if (el.querySelector('.home-page__updates')) return 'updates';
  if ((tag === 'div' && el.getAttribute('aria-hidden') === 'true' && el.style.height && !el.textContent.trim())
    || cls.includes('page-editor__spacer')) return 'spacer';
  return 'paragraph';
}

function updateBlockChrome(block) {
  if (!block) return;
  const body = block.querySelector('.page-editor__block-body');
  if (!body) return;
  const typeId = detectBlockType(body.innerHTML);
  block.dataset.blockType = typeId;
  const definition = getBlockDefinition(typeId);
  const label = block.querySelector('.page-editor__block-type-label');
  const icon = block.querySelector('.page-editor__block-type i');
  if (label) label.textContent = definition.label;
  if (icon) icon.className = `bi ${definition.icon}`;
  applyBlockLockState(block, body, definition);
}

function applyBlockLockState(block, body, definition) {
  const locked = Boolean(definition?.locked);
  block.classList.toggle('is-locked', locked);
  if (body) {
    body.setAttribute('contenteditable', locked ? 'false' : 'true');
  }
}

function restoreEditorAssetUrls(html) {
  const value = String(html || '');
  if (!value.includes('data-editor-src')) {
    return value;
  }

  const doc = new DOMParser().parseFromString(`<div data-root>${value}</div>`, 'text/html');
  const root = doc.querySelector('[data-root]');
  if (!root) {
    return value;
  }

  root.querySelectorAll('[data-editor-src]').forEach((el) => {
    el.setAttribute('src', el.getAttribute('data-editor-src') || '');
    el.removeAttribute('data-editor-src');
  });

  return root.innerHTML;
}

function sanitizeBlockHtmlForPublish(html) {
  return restoreEditorAssetUrls(
    String(html || '')
      .replace(/\sclass="page-editor__spacer"/gi, '')
      .replace(/class="page-editor__spacer"\s*/gi, ''),
  );
}

function serializeBlockCanvas(blocksRoot) {
  if (!blocksRoot) return '';
  const blocks = [...blocksRoot.querySelectorAll(':scope > .page-editor__block')];
  return blocks
    .map((block) => sanitizeBlockHtmlForPublish(
      block.querySelector('.page-editor__block-body')?.innerHTML.trim() || '',
    ))
    .filter(Boolean)
    .join('\n\n');
}

function createBlockElement(fragmentHtml) {
  const typeId = detectBlockType(fragmentHtml);
  const definition = getBlockDefinition(typeId);
  const block = document.createElement('div');
  block.className = 'page-editor__block';
  block.dataset.blockType = typeId;
  block.dataset.blockUid = createBlockUid();
  block.innerHTML = `
    <div class="page-editor__block-toolbar" contenteditable="false">
      <button type="button" class="page-editor__block-tool page-editor__block-drag" data-block-action="drag" title="Drag to reorder" aria-label="Drag block" draggable="true">
        <i class="bi bi-grip-vertical" aria-hidden="true"></i>
      </button>
      <button type="button" class="page-editor__block-tool" data-block-action="insert-before" title="Insert above" aria-label="Insert block above">
        <i class="bi bi-plus" aria-hidden="true"></i>
      </button>
      <span class="page-editor__block-type">
        <i class="bi ${definition.icon}" aria-hidden="true"></i>
        <span class="page-editor__block-type-label">${escapeHtml(definition.label)}</span>
      </span>
      <div class="page-editor__block-actions">
        <button type="button" class="page-editor__block-tool" data-block-action="settings" title="Block settings" aria-label="Block settings">
          <i class="bi bi-gear" aria-hidden="true"></i>
        </button>
        <button type="button" class="page-editor__block-tool" data-block-action="duplicate" title="Duplicate" aria-label="Duplicate block">
          <i class="bi bi-copy" aria-hidden="true"></i>
        </button>
        <button type="button" class="page-editor__block-tool" data-block-action="insert-after" title="Insert below" aria-label="Insert block below">
          <i class="bi bi-plus-circle" aria-hidden="true"></i>
        </button>
        <button type="button" class="page-editor__block-tool" data-block-action="move-up" title="Move up" aria-label="Move block up">
          <i class="bi bi-arrow-up" aria-hidden="true"></i>
        </button>
        <button type="button" class="page-editor__block-tool" data-block-action="move-down" title="Move down" aria-label="Move block down">
          <i class="bi bi-arrow-down" aria-hidden="true"></i>
        </button>
        <button type="button" class="page-editor__block-tool page-editor__block-tool--danger" data-block-action="delete" title="Delete" aria-label="Delete block">
          <i class="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <div class="page-editor__block-body" contenteditable="true" spellcheck="true"></div>
  `;
  const body = block.querySelector('.page-editor__block-body');
  if (body) {
    body.innerHTML = fragmentHtml;
    hardenLiveEditorRoot(body);
  }
  applyBlockLockState(block, body, definition);
  return block;
}

function createBlockGapElement() {
  const gap = document.createElement('div');
  gap.className = 'page-editor__block-gap';
  gap.innerHTML = '<button type="button" class="page-editor__block-gap-button" data-block-action="insert-at-gap" aria-label="Insert block here"><i class="bi bi-plus" aria-hidden="true"></i></button>';
  return gap;
}

function findFragmentContentRegion(html) {
  const trimmed = String(html || '');
  return {
    open: '',
    inner: trimmed,
    close: '',
    innerStart: 0,
    innerEnd: trimmed.length,
    end: trimmed.length,
    fragmentMode: true,
  };
}

function findWrappedContentRegion(html, contentSelector) {
  const selector = String(contentSelector || '.main-content').trim();
  const patterns = [];

  if (selector === '.main-content' || selector.includes('main-content')) {
    patterns.push(
      /(<main\b[^>]*\bclass="[^"]*\bmain-content\b[^"]*"[^>]*>)([\s\S]*?)(<\/main>)/i,
      /(<main\b[^>]*>)([\s\S]*?)(<\/main>)/i,
    );
  }

  if (selector.startsWith('.')) {
    const className = selector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    patterns.push(
      new RegExp(`(<([a-z][a-z0-9]*)\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'i'),
    );
  }

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match || match.index === undefined) {
      continue;
    }

    const open = match[1];
    const inner = match[match.length - 2];
    const close = match[match.length - 1];
    const innerStart = match.index + open.length;
    const innerEnd = innerStart + inner.length;

    return {
      open,
      inner,
      close,
      innerStart,
      innerEnd,
      end: match.index + match[0].length,
    };
  }

  return null;
}

function findContentRegion(html, contentSelector) {
  const selector = String(contentSelector || '.main-content').trim();
  if (isFragmentContentSelector(selector)) {
    return findFragmentContentRegion(html);
  }

  const wrapped = findWrappedContentRegion(html, selector);
  if (wrapped) {
    return wrapped;
  }

  if (isHtmlFragmentDocument(html)) {
    return findFragmentContentRegion(html);
  }

  return null;
}

function blockFingerprint(element) {
  const tag = element.tagName.toLowerCase();
  const cls = String(element.className || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  const text = (element.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${tag}:${cls}:${text}`;
}

function preserveContentRegionWhitespace(originalInner, mergedInner) {
  const original = String(originalInner || '');
  const merged = String(mergedInner || '');
  if (!original) {
    return merged;
  }
  if (merged === original) {
    return original;
  }

  const lead = (original.match(/^(\s+)/) || ['', ''])[1];
  const trail = (original.match(/(\s+)$/) || ['', ''])[1];
  const mergedBody = merged.trim();
  if (!mergedBody) {
    return original;
  }
  if (original.trim() === mergedBody) {
    return original;
  }

  return `${lead}${mergedBody}${trail}`;
}

function joinOriginalBlocksWithGaps(blocks) {
  if (blocks.length === 0) {
    return '';
  }

  let result = blocks[0].outerHtml;
  for (let i = 0; i < blocks.length - 1; i += 1) {
    result += blocks[i].gapAfter ?? '';
    result += blocks[i + 1].outerHtml;
  }

  return result;
}

function buildAppendedSuffixFromEdited(editedInner, editedBlocks, originalBlockCount) {
  if (editedBlocks.length <= originalBlockCount) {
    return '';
  }

  const editTrim = String(editedInner || '').trim();
  let suffix = '';

  for (let i = originalBlockCount; i < editedBlocks.length; i += 1) {
    const block = editedBlocks[i].outerHtml;
    const previous = editedBlocks[i - 1].outerHtml;
    const previousStart = editTrim.indexOf(previous);
    if (previousStart === -1) {
      suffix += `${suffix ? '\n\n' : ''}${block}`;
      continue;
    }

    const previousEnd = previousStart + previous.length;
    const blockStart = editTrim.indexOf(block, previousEnd);
    const gap = blockStart === -1 ? '\n\n' : editTrim.slice(previousEnd, blockStart);
    suffix += gap + block;
  }

  return suffix;
}

function tryAppendBlocksMerge(originalInner, editedInner) {
  const originalBlocks = extractContentBlocksExact(originalInner);
  const editedBlocks = extractContentBlocksFromEditor(editedInner);
  if (editedBlocks.length <= originalBlocks.length) {
    return null;
  }

  for (let i = 0; i < originalBlocks.length; i += 1) {
    if (originalBlocks[i].fingerprint !== editedBlocks[i].fingerprint) {
      return null;
    }
  }

  const lastOriginalBlock = originalBlocks[originalBlocks.length - 1];
  const lastBlockStart = originalInner.indexOf(lastOriginalBlock.outerHtml);
  if (lastBlockStart === -1) {
    return null;
  }

  const prefix = originalInner.slice(0, lastBlockStart + lastOriginalBlock.outerHtml.length);
  const trail = (originalInner.match(/(\s+)$/) || ['', ''])[1];
  const suffix = buildAppendedSuffixFromEdited(editedInner, editedBlocks, originalBlocks.length);

  return `${prefix}${suffix}${trail}`;
}

function joinMergedBlocksPreservingGaps(mergedPieces, originalBlocks) {
  if (mergedPieces.length === 0) {
    return '';
  }

  const originalIndexByHtml = new Map(
    originalBlocks.map((block, index) => [block.outerHtml, index]),
  );

  let result = '';
  let lastOriginalIndex = -1;

  mergedPieces.forEach((piece, pieceIndex) => {
    const originalIndex = originalIndexByHtml.get(piece) ?? -1;

    if (pieceIndex === 0) {
      result = piece;
      if (originalIndex !== -1) {
        lastOriginalIndex = originalIndex;
      }
      return;
    }

    if (originalIndex !== -1 && lastOriginalIndex !== -1 && originalIndex === lastOriginalIndex + 1) {
      result += originalBlocks[lastOriginalIndex].gapAfter ?? '';
    } else if (lastOriginalIndex !== -1) {
      result += originalBlocks[lastOriginalIndex].gapAfter ?? '\n';
    } else {
      result += '\n\n';
    }

    result += piece;
    if (originalIndex !== -1) {
      lastOriginalIndex = originalIndex;
    }
  });

  return result;
}

function findBalancedElementEnd(source, openIdx, tag) {
  const tagLower = tag.toLowerCase();
  const openTagPattern = new RegExp(`<${tagLower}(?:\\s[^>]*)?>`, 'gi');
  const closeTagPattern = new RegExp(`</${tagLower}>`, 'gi');
  const selfClosePattern = new RegExp(`<${tagLower}(?:\\s[^>]*)?/>`, 'i');

  const opening = source.slice(openIdx).match(openTagPattern);
  if (!opening?.[0]) {
    return -1;
  }

  if (selfClosePattern.test(opening[0])) {
    return openIdx + opening[0].length;
  }

  let depth = 1;
  let pos = openIdx + opening[0].length;

  while (depth > 0 && pos < source.length) {
    openTagPattern.lastIndex = pos;
    closeTagPattern.lastIndex = pos;

    const nextOpen = openTagPattern.exec(source);
    const nextClose = closeTagPattern.exec(source);

    if (!nextClose) {
      return -1;
    }

    const openAt = nextOpen ? nextOpen.index : Number.POSITIVE_INFINITY;
    const closeAt = nextClose.index;

    if (openAt < closeAt) {
      const openTag = nextOpen[0];
      if (!/<\/\s*>$/.test(openTag) && !/\/>$/.test(openTag)) {
        depth += 1;
      }
      pos = openAt + openTag.length;
      continue;
    }

    depth -= 1;
    pos = closeAt + nextClose[0].length;
    if (depth === 0) {
      return pos;
    }
  }

  return -1;
}

function extractContentBlocksExact(html) {
  const source = String(html || '').trim();
  if (!source) {
    return [];
  }

  const doc = new DOMParser().parseFromString(`<div data-root>${source}</div>`, 'text/html');
  const root = doc.querySelector('[data-root]');
  if (!root) {
    return [];
  }

  let previousEnd = 0;
  const blocks = [];

  for (const child of root.children) {
    const tag = child.tagName.toLowerCase();
    const openIdx = source.indexOf(`<${tag}`, previousEnd);
    if (openIdx === -1) {
      blocks.push({
        fingerprint: blockFingerprint(child),
        outerHtml: child.outerHTML,
        gapAfter: '',
      });
      continue;
    }

    if (blocks.length > 0) {
      blocks[blocks.length - 1].gapAfter = source.slice(previousEnd, openIdx);
    }

    const endIdx = findBalancedElementEnd(source, openIdx, tag);
    if (endIdx === -1) {
      blocks.push({
        fingerprint: blockFingerprint(child),
        outerHtml: child.outerHTML,
        gapAfter: '',
      });
      previousEnd = source.length;
      continue;
    }

    blocks.push({
      fingerprint: blockFingerprint(child),
      outerHtml: source.slice(openIdx, endIdx),
      gapAfter: '',
    });
    previousEnd = endIdx;
  }

  return blocks;
}

function extractContentBlocksFromEditor(html) {
  const source = String(html || '').trim();
  if (!source) {
    return [];
  }

  const doc = new DOMParser().parseFromString(`<div data-root>${source}</div>`, 'text/html');
  const root = doc.querySelector('[data-root]');
  if (!root) {
    return [];
  }

  return [...root.children].map((child) => ({
    fingerprint: blockFingerprint(child),
    outerHtml: child.outerHTML,
  }));
}

function mergeBlocksByFingerprint(originalBlocks, editedBlocks) {
  const originalCount = originalBlocks.length;
  const editedCount = editedBlocks.length;
  const lcs = Array.from({ length: originalCount + 1 }, () => Array(editedCount + 1).fill(0));

  for (let i = 1; i <= originalCount; i += 1) {
    for (let j = 1; j <= editedCount; j += 1) {
      if (originalBlocks[i - 1].fingerprint === editedBlocks[j - 1].fingerprint) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  const merged = [];
  let i = originalCount;
  let j = editedCount;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalBlocks[i - 1].fingerprint === editedBlocks[j - 1].fingerprint) {
      merged.push(originalBlocks[i - 1].outerHtml);
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      merged.push(editedBlocks[j - 1].outerHtml);
      j -= 1;
    } else {
      i -= 1;
    }
  }

  return merged.reverse();
}

function mergeContentPreservingUnchanged(originalHtml, editedHtml) {
  const original = String(originalHtml || '');
  const edited = String(editedHtml || '').trim();
  if (!edited) {
    return original;
  }
  if (!original) {
    return edited;
  }
  if (original.trim() === edited) {
    return original;
  }

  const appendMerge = tryAppendBlocksMerge(original, edited);
  if (appendMerge !== null) {
    return appendMerge;
  }

  const originalBlocks = extractContentBlocksExact(original);
  const editedBlocks = extractContentBlocksFromEditor(edited);
  if (originalBlocks.length === 0) {
    return preserveContentRegionWhitespace(original, edited);
  }
  if (editedBlocks.length === 0) {
    return original;
  }

  const merged = mergeBlocksByFingerprint(originalBlocks, editedBlocks);
  const mergedInner = joinMergedBlocksPreservingGaps(merged, originalBlocks);

  // Keep any prefix that sits before the first block (for example the HTML
  // comments at the top of profile fragments) — block extraction only tracks
  // the blocks themselves, so it would otherwise be dropped.
  const firstBlockStart = original.indexOf(originalBlocks[0].outerHtml);
  const prefix = firstBlockStart > 0 ? original.slice(0, firstBlockStart) : '';
  if (prefix.trim()) {
    const trail = (original.match(/(\s+)$/) || ['', ''])[1];
    return `${prefix}${mergedInner}${trail}`;
  }

  return preserveContentRegionWhitespace(original, mergedInner);
}

function applyPageTitleToHtmlString(html, pageTitle) {
  const cleanTitle = String(pageTitle || '').trim();
  if (!cleanTitle) {
    return html;
  }

  const brandToken = getBrandToken();
  const brandedTitle = `${brandToken} - ${cleanTitle}`;
  let result = html;

  result = result.replace(
    /<title\b[^>]*>[\s\S]*?<\/title>/i,
    `<title data-brand-template="${escapeHtmlAttribute(brandedTitle)}"></title>`,
  );

  result = result.replace(
    /(<full-page-toolbar\b[^>]*\btitle=)(["'])(.*?)\2/i,
    `$1$2${escapeHtmlAttribute(cleanTitle)}$2`,
  );

  return result;
}

function replacePageContent(html, contentSelector, nextContent, pageTitle) {
  const region = findContentRegion(html, contentSelector);
  if (!region) {
    throw new Error('Could not find the page content container.');
  }

  const mergedContent = mergeContentPreservingUnchanged(region.inner, nextContent);
  let result = html;

  if (region.fragmentMode) {
    result = mergedContent;
    if (pageTitle) {
      result = applyFragmentTitleToHtml(result, pageTitle);
    }
    return result;
  }

  if (mergedContent !== region.inner) {
    result = `${html.slice(0, region.innerStart)}${mergedContent}${html.slice(region.innerEnd)}`;
  }

  if (pageTitle) {
    result = applyPageTitleToHtmlString(result, pageTitle);
  }

  return result;
}

function formatPageTitle(sourcePath, extractedTitle) {
  if (extractedTitle) {
    return extractedTitle;
  }
  const fileName = normalizeSitePath(sourcePath).split('/').pop() || 'Page';
  return fileName.replace(/\.html$/i, '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

class PageEditor extends HTMLElement {
  static get observedAttributes() {
    return ['source', 'return', 'content-selector', 'title', 'block-library', 'canvas-class', 'asset-base', 'inline-includes', 'hide-mode-tabs'];
  }

  connectedCallback() {
    if (this.__rendered) return;
    this.__rendered = true;
    this.innerHTML = PAGE_EDITOR_TEMPLATE;
    this.__codeMirror = null;
    this.__originalHtml = '';
    this.__originalContentHtml = '';
    this.__mainClassName = 'main-content';
    this.__sourcePath = '';
    this.__pageTitle = 'Page';
    this.__savedPageTitle = '';
    this.__savedContentHtml = '';
    this.__session = null;
    this.__activeMode = 'page';
    this.__dirty = false;
    this.__syncing = false;
    this.__liveSyncTimer = null;
    this.__sourceSyncTimer = null;
    this.__inserterContext = null;
    this.__draggingBlock = null;
    this.__slashBlock = null;
    this.__chromeSyncTimer = null;
    this.__selectedBlock = null;
    this.__fragmentMode = false;
    this.__history = [];
    this.__historyIndex = -1;
    this.__historyTimer = null;
    this.__recordingHistory = false;
    this.__slashHighlightIndex = 0;
    this.__slashFilter = '';
    this.__contentSelector = this.getAttribute('content-selector')?.trim() || '.main-content';
    this.__beforeUnloadHandler = null;
    this.__navigationClickHandler = null;
    this.__inlineToolbarRaf = null;
    this.__includeSources = new Map();
    this.__selectionChangeHandler = () => this.#onSelectionChange();
    document.addEventListener('selectionchange', this.__selectionChangeHandler);
    this.#bindUi();
    this.#bindProseToolbar();
    this.#syncModeTabsVisibility();
    this.#bindNavigationGuard();
    void this.#init();
  }

  disconnectedCallback() {
    if (this.__beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.__beforeUnloadHandler);
      this.__beforeUnloadHandler = null;
    }
    if (this.__navigationClickHandler) {
      document.removeEventListener('click', this.__navigationClickHandler, true);
      this.__navigationClickHandler = null;
    }
    if (this.__leaveKeydownHandler) {
      document.removeEventListener('keydown', this.__leaveKeydownHandler);
      this.__leaveKeydownHandler = null;
    }
    this.#restoreLeaveOverlay();
    if (this.__selectionChangeHandler) {
      document.removeEventListener('selectionchange', this.__selectionChangeHandler);
      this.__selectionChangeHandler = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.__rendered) return;
    this.#syncModeTabsVisibility();
    if (name === 'hide-mode-tabs' || oldValue === newValue) return;
    void this.#init();
  }

  setMode(mode) {
    return this.#setMode(mode);
  }

  refreshDirtyState() {
    this.#updateDirtyState();
  }

  isDirty() {
    return Boolean(this.__dirty);
  }

  confirmLeaveWithoutSaving() {
    if (!this.__dirty) {
      return Promise.resolve(true);
    }
    return this.#confirmLeaveWithoutSaving();
  }

  discardUnsavedEdits() {
    this.#discardUnsavedEdits();
  }

  #bindProseToolbar() {
    const toolbar = this.querySelector('profile-prose-toolbar');
    if (!toolbar) return;

    this.__proseToolbar = toolbar;
    toolbar.setAttribute('block-context', 'page');
    toolbar.commandRootProvider = () => this.#getActiveBlockBody();
    toolbar.getBlockCatalog = () => this.#getActiveBlockLibrary();
    toolbar.addEventListener('ppe-block-selected', (event) => {
      this.__inserterContext = { position: 'append' };
      this.#insertBlockById(event.detail?.blockId);
    });
    toolbar.addEventListener('ppe-toolbar-change', () => {
      if (this.__syncing) return;
      this.#scheduleHistorySnapshot();
      this.#updateDirtyState();
      this.#scheduleLiveSync();
    });
  }

  #bindUi() {
    const root = this.querySelector('.page-editor');
    if (!root) return;

    root.addEventListener('mousedown', (event) => {
      if (event.target.closest('profile-prose-toolbar .ppe__tool, profile-prose-toolbar .ppe__menu-toggle, .page-editor__inline-toolbar button, .page-editor__block-gap-button')) {
        event.preventDefault();
      }
      if (event.target.closest('.page-editor__block-toolbar button:not(.page-editor__block-drag)')) {
        event.preventDefault();
      }
    });

    root.addEventListener('click', (event) => {
      // Close the floating block settings panel when clicking elsewhere.
      if (this.#getOpenBlockSettings()
        && !event.target.closest('.page-editor__block-settings-pop')
        && !event.target.closest('[data-block-action="settings"]')) {
        this.#closeBlockSettings();
      }

      const slashChoice = event.target.closest('.page-editor__slash-item[data-block-id]');
      if (slashChoice) {
        event.preventDefault();
        this.#insertBlockFromSlash(slashChoice.dataset.blockId);
        return;
      }

      const blockAction = event.target.closest('[data-block-action]');
      if (blockAction) {
        event.preventDefault();
        const block = blockAction.closest('.page-editor__block');
        this.#handleBlockAction(blockAction.dataset.blockAction, block, blockAction);
        return;
      }

      const inserterChoice = event.target.closest('[data-block-id]');
      if (inserterChoice && inserterChoice.closest('.page-editor__inserter')) {
        event.preventDefault();
        this.#insertBlockById(inserterChoice.dataset.blockId);
        return;
      }

      const sidebarControl = event.target.closest('[data-sidebar-action]');
      if (sidebarControl) {
        event.preventDefault();
        this.#handleSidebarAction(sidebarControl);
        return;
      }

      const formatButton = event.target.closest(
        '.page-editor__inline-toolbar [data-cmd], .page-editor__inline-toolbar [data-action]',
      );
      if (formatButton) {
        event.preventDefault();
        this.#handleFormatAction(formatButton);
        return;
      }

      const button = event.target.closest('[data-action], [data-mode]');
      if (!button) return;

      if (button.dataset.mode) {
        event.preventDefault();
        this.#setMode(button.dataset.mode);
        return;
      }

      const action = button.dataset.action;
      if (action === 'publish') void this.#openPublishDialog();
      else if (action === 'format-source') void this.#formatSource();
      else if (action === 'close-publish') this.#closePublishDialog();
      else if (action === 'close-inserter') this.#closeInserter();
      else if (action === 'open-inserter') this.#openInserter({ position: 'append' });
    });

    root.addEventListener('input', (event) => {
      if (event.target.closest('.page-editor__block-sidebar')) {
        if (event.target.matches('[data-sidebar-field="spacer-height"]')) {
          this.#handleSidebarInput(event.target);
        }
        return;
      }
      if (!event.target.closest('.page-editor__block-body')) return;
      if (this.__syncing) return;
      const block = event.target.closest('.page-editor__block');
      this.#scheduleBlockChromeSync(block);
      this.#scheduleHistorySnapshot();
      this.#updateDirtyState();
      this.#scheduleLiveSync();
    });

    root.addEventListener('change', (event) => {
      if (!event.target.closest('.page-editor__block-sidebar')) return;
      this.#handleSidebarInput(event.target);
    });

    root.addEventListener('keydown', (event) => {
      if (this.__activeMode !== 'page') return;
      if (event.target.closest('.page-editor__inserter, .page-editor__publish-dialog')) return;

      const { slashMenu } = this.#els();
      const slashOpen = slashMenu && !slashMenu.hidden;

      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.#undo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        this.#redo();
        return;
      }

      if (slashOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.#moveSlashHighlight(1);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          this.#moveSlashHighlight(-1);
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          this.#activateSlashHighlight();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          this.#closeSlashMenu();
          return;
        }
      }

      const body = event.target.closest('.page-editor__block-body');
      if (body && event.key === '/' && this.#shouldOpenSlashMenu(body)) {
        event.preventDefault();
        this.__slashFilter = '';
        this.#openSlashMenu(body.closest('.page-editor__block'));
        return;
      }

      if (body && slashOpen && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (event.key === 'Backspace') {
          this.__slashFilter = this.__slashFilter.slice(0, -1);
        } else if (!event.key.startsWith('Arrow') && event.key !== 'Tab') {
          this.__slashFilter += event.key;
        }
        this.#renderSlashMenu();
        return;
      }

      if (event.key === 'Escape') {
        this.#closeSlashMenu();
        this.#closeBlockSettings();
        return;
      }

      if (body && event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const currentBlock = body.closest('.page-editor__block');
        if (currentBlock && this.#shouldSplitOnEnter(currentBlock, body)) {
          event.preventDefault();
          this.#splitBlockAtCaret(currentBlock, body);
          return;
        }
      }

      const block = this.__selectedBlock || body?.closest('.page-editor__block');
      if (!block) return;

      if (event.key === 'Backspace' && body && this.#isBlockBodyEmpty(body) && !event.defaultPrevented) {
        const blocksRoot = this.#els().blocksRoot();
        if (blocksRoot && blocksRoot.querySelectorAll(':scope > .page-editor__block').length > 1) {
          event.preventDefault();
          this.#handleBlockAction('delete', block);
        }
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key === 'ArrowUp') {
        event.preventDefault();
        this.#handleBlockAction('move-up', block);
      } else if (event.ctrlKey && event.shiftKey && event.key === 'ArrowDown') {
        event.preventDefault();
        this.#handleBlockAction('move-down', block);
      }
    });

    const inserterSearch = this.querySelector('.page-editor__inserter-search');
    inserterSearch?.addEventListener('input', () => {
      this.#renderInserterPanel(inserterSearch.value);
    });

    const publishForm = this.querySelector('.page-editor__publish-form');
    publishForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.#submitPublish();
    });

    this.#els().titleInput?.addEventListener('input', () => {
      this.__pageTitle = this.#getPageTitle();
      document.title = `Edit ${this.__pageTitle}`;
      this.#scheduleHistorySnapshot();
      this.#updateDirtyState();
    });
  }

  #syncModeTabsVisibility() {
    const toolbarRow = this.querySelector('.page-editor__toolbar-row');
    if (toolbarRow) {
      toolbarRow.hidden = this.hasAttribute('hide-mode-tabs');
    }
  }

  #getActiveBlockLibrary() {
    const names = (this.getAttribute('block-library') || '')
      .split(/[\s,]+/)
      .map((name) => name.trim())
      .filter(Boolean);

    return window.EditorBlocks?.getCatalog('page', { libraryNames: names })
      || { definitions: [], categories: [] };
  }

  // Gutenberg-style Enter handling: pressing Enter in a text block starts a
  // new block instead of growing the current one.
  #shouldSplitOnEnter(block, body) {
    if (body.getAttribute('contenteditable') === 'false') return false;

    const typeId = block.dataset.blockType || detectBlockType(body.innerHTML);
    if (!['paragraph', 'heading', 'quote'].includes(typeId)) return false;

    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    if (!body.contains(selection.anchorNode)) return false;

    const anchorEl = selection.anchorNode.nodeType === Node.TEXT_NODE
      ? selection.anchorNode.parentElement
      : selection.anchorNode;
    if (anchorEl?.closest('li, td, th, pre')) return false;

    return true;
  }

  #splitBlockAtCaret(block, body) {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const caret = selection.getRangeAt(0);
    caret.deleteContents();

    const tail = document.createRange();
    tail.setStart(caret.endContainer, caret.endOffset);
    tail.setEnd(body, body.childNodes.length);

    const wrapper = document.createElement('div');
    wrapper.appendChild(tail.extractContents());

    let nextHtml = '<p></p>';
    if (wrapper.textContent?.trim() || wrapper.querySelector('img, hr, table')) {
      const hasBlockChild = [...wrapper.children].some((child) => (
        /^(p|h[1-6]|blockquote|ul|ol|div|figure|table)$/i.test(child.tagName)
      ));
      nextHtml = hasBlockChild ? wrapper.innerHTML : `<p>${wrapper.innerHTML}</p>`;
    }

    // Drop empty elements the extraction may have left at the end of the
    // current block, but never empty the block out completely.
    [...body.children].forEach((child) => {
      if (body.children.length > 1 && !child.textContent.trim() && !child.querySelector('img, hr, table, br')) {
        child.remove();
      }
    });
    if (!body.innerHTML.trim()) {
      body.innerHTML = '<p></p>';
    }

    const newBlock = createBlockElement(nextHtml);
    block.after(newBlock);
    this.#rebuildBlockGaps();
    updateBlockChrome(block);
    this.#selectBlock(newBlock);

    const newBody = newBlock.querySelector('.page-editor__block-body');
    if (newBody) {
      newBody.focus();
      const range = document.createRange();
      range.selectNodeContents(newBody.firstElementChild || newBody);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    this.#pushHistorySnapshot({ immediate: true });
    this.#updateDirtyState();
    this.#scheduleLiveSync();
  }

  #onSelectionChange() {
    if (this.__inlineToolbarRaf) return;
    this.__inlineToolbarRaf = requestAnimationFrame(() => {
      this.__inlineToolbarRaf = null;
      this.#updateInlineToolbar();
      const body = this.#getActiveBlockBody();
      if (body && this.contains(body)) {
        this.__proseToolbar?.updateToolbarState();
      }
    });
  }

  #updateInlineToolbar() {
    const toolbar = this.querySelector('.page-editor__inline-toolbar');
    if (!toolbar) return;

    const hide = () => {
      toolbar.hidden = true;
    };

    if (this.__activeMode !== 'page') {
      hide();
      return;
    }

    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      hide();
      return;
    }

    const anchorEl = selection.anchorNode?.nodeType === Node.TEXT_NODE
      ? selection.anchorNode.parentElement
      : selection.anchorNode;
    const body = anchorEl?.closest?.('.page-editor__block-body');
    if (!body || !this.contains(body) || body.getAttribute('contenteditable') === 'false') {
      hide();
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      hide();
      return;
    }

    toolbar.hidden = false;
    const toolbarRect = toolbar.getBoundingClientRect();
    let top = rect.top - toolbarRect.height - 8;
    if (top < 8) {
      top = rect.bottom + 8;
    }
    let left = rect.left + rect.width / 2 - toolbarRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - toolbarRect.width - 8));
    toolbar.style.top = `${Math.round(top)}px`;
    toolbar.style.left = `${Math.round(left)}px`;
  }

  #updateCounts() {
    const counts = this.querySelector('.page-editor__counts');
    if (!counts) return;

    const blocksRoot = this.#els().blocksRoot();
    const blockCount = blocksRoot
      ? blocksRoot.querySelectorAll(':scope > .page-editor__block').length
      : 0;
    const text = (this.#els().pageContent?.textContent || '').trim();
    const words = text ? text.split(/\s+/).length : 0;
    counts.textContent = `${blockCount} block${blockCount === 1 ? '' : 's'} · ${words} word${words === 1 ? '' : 's'}`;
    counts.hidden = blockCount === 0;
  }

  #captureHistoryState() {
    return {
      pageTitle: this.#getPageTitle(),
      contentHtml: this.#getLiveHtml(),
    };
  }

  #updateUndoRedoButtons() {
    const undoButton = this.querySelector('[data-action="undo"]');
    const redoButton = this.querySelector('[data-action="redo"]');
    if (undoButton) undoButton.disabled = this.__historyIndex <= 0;
    if (redoButton) redoButton.disabled = this.__historyIndex >= this.__history.length - 1;
  }

  #resetHistory() {
    this.__history = [this.#captureHistoryState()];
    this.__historyIndex = 0;
    this.#updateUndoRedoButtons();
  }

  #scheduleHistorySnapshot() {
    if (this.__recordingHistory) return;
    if (this.__historyTimer) clearTimeout(this.__historyTimer);
    this.__historyTimer = setTimeout(() => {
      this.__historyTimer = null;
      this.#pushHistorySnapshot({ immediate: true });
    }, HISTORY_DEBOUNCE_MS);
  }

  #pushHistorySnapshot({ immediate = false } = {}) {
    if (this.__recordingHistory) return;

    if (!immediate) {
      this.#scheduleHistorySnapshot();
      return;
    }

    if (this.__historyTimer) {
      clearTimeout(this.__historyTimer);
      this.__historyTimer = null;
    }

    const state = this.#captureHistoryState();
    const current = this.__history[this.__historyIndex];
    if (current
      && current.pageTitle === state.pageTitle
      && current.contentHtml === state.contentHtml) {
      return;
    }

    this.__history = this.__history.slice(0, this.__historyIndex + 1);
    this.__history.push(state);
    if (this.__history.length > HISTORY_MAX_ENTRIES) {
      this.__history.shift();
    } else {
      this.__historyIndex += 1;
    }
    this.#updateUndoRedoButtons();
  }

  #restoreHistoryState(state) {
    if (!state) return;
    this.__recordingHistory = true;
    try {
      const { titleInput } = this.#els();
      if (titleInput) titleInput.value = state.pageTitle;
      this.__pageTitle = state.pageTitle;
      document.title = `Edit ${state.pageTitle}`;
      this.#populateLiveEditor(state.contentHtml || '<p></p>');
      if (this.__codeMirror) {
        this.__syncing = true;
        try {
          this.__codeMirror.setValue(state.contentHtml || '<p></p>');
        } finally {
          this.__syncing = false;
        }
      }
      this.#updateDirtyState();
    } finally {
      this.__recordingHistory = false;
      this.#updateUndoRedoButtons();
    }
  }

  #undo() {
    if (this.__historyIndex <= 0) return;
    this.__historyIndex -= 1;
    this.#restoreHistoryState(this.__history[this.__historyIndex]);
  }

  #redo() {
    if (this.__historyIndex >= this.__history.length - 1) return;
    this.__historyIndex += 1;
    this.#restoreHistoryState(this.__history[this.__historyIndex]);
  }

  #setDirty(dirty) {
    this.__dirty = Boolean(dirty);
    const { unsavedNotice } = this.#els();
    if (unsavedNotice) {
      unsavedNotice.hidden = !this.__dirty;
    }
    this.classList.toggle('is-dirty', this.__dirty);
  }

  #flushPendingSync() {
    if (this.__liveSyncTimer) {
      clearTimeout(this.__liveSyncTimer);
      this.__liveSyncTimer = null;
      this.#syncLiveToSource();
    }
    if (this.__sourceSyncTimer) {
      clearTimeout(this.__sourceSyncTimer);
      this.__sourceSyncTimer = null;
      this.#syncSourceToLive();
    }
  }

  #setSavedBaseline() {
    this.#flushPendingSync();
    this.__savedPageTitle = this.#getPageTitle();
    const currentHtml = this.#getSourceHtml();
    this.__savedContentHtml = currentHtml || this.__originalContentHtml || '';
    if (Array.isArray(window.__extraDirtyStateResetCallbacks)) {
      for (const reset of window.__extraDirtyStateResetCallbacks) {
        try {
          reset();
        } catch (error) {
          console.warn('extra dirty state reset callback threw', error);
        }
      }
    }
    this.#setDirty(false);
    this.#resetHistory();
  }

  #updateDirtyState() {
    const { pageContent } = this.#els();
    if (!pageContent) {
      this.#setDirty(false);
      return;
    }

    if (this.__liveSyncTimer) {
      clearTimeout(this.__liveSyncTimer);
      this.__liveSyncTimer = null;
      this.#syncLiveToSource();
    }
    if (this.__sourceSyncTimer) {
      clearTimeout(this.__sourceSyncTimer);
      this.__sourceSyncTimer = null;
    }

    const titleChanged = this.#getPageTitle() !== this.__savedPageTitle;
    const contentBaseline = this.__savedContentHtml || this.__originalContentHtml || '';
    const mergedContent = mergeContentPreservingUnchanged(
      contentBaseline,
      this.#getSourceHtml(),
    );
    const contentChanged = mergedContent !== contentBaseline;
    let externalDirty = false;
    if (Array.isArray(window.__extraDirtyStateProviders)) {
      externalDirty = window.__extraDirtyStateProviders.some((provider) => {
        try {
          return Boolean(provider());
        } catch (error) {
          console.warn('extra dirty state provider threw', error);
          return false;
        }
      });
    }
    this.#setDirty(titleChanged || contentChanged || externalDirty);
  }

  #discardUnsavedEdits() {
    document.querySelector('profile-infobox-editor')?.discardUnsavedChanges?.();
    this.#setDirty(false);
  }

  #completeLeaveNavigation(url) {
    if (!url) {
      return;
    }
    this.#discardUnsavedEdits();
    window.location.href = url;
  }

  #getLeaveOverlay() {
    if (this.__leaveOverlayRef) {
      return this.__leaveOverlayRef;
    }

    const overlay = this.querySelector('.page-editor__leave-overlay');
    if (overlay) {
      this.__leaveOverlayRef = overlay;
    }
    return overlay;
  }

  #mountLeaveOverlay() {
    const leaveOverlay = this.#getLeaveOverlay();
    if (!leaveOverlay) {
      return null;
    }
    if (!this.__leaveOverlayHome) {
      this.__leaveOverlayHome = { parent: leaveOverlay.parentNode, next: leaveOverlay.nextSibling };
    }
    if (leaveOverlay.parentNode !== document.body) {
      document.body.append(leaveOverlay);
    }
    return leaveOverlay;
  }

  #restoreLeaveOverlay() {
    const leaveOverlay = this.#getLeaveOverlay();
    if (!leaveOverlay || !this.__leaveOverlayHome?.parent) {
      return;
    }
    if (leaveOverlay.parentNode === document.body) {
      this.__leaveOverlayHome.parent.insertBefore(leaveOverlay, this.__leaveOverlayHome.next);
    }
  }

  #closeLeavePrompt(confirmed) {
    const leaveOverlay = this.#getLeaveOverlay();
    if (leaveOverlay) {
      leaveOverlay.hidden = true;
    }
    this.#restoreLeaveOverlay();
    const resolve = this.__leaveDialogResolve;
    this.__leaveDialogResolve = null;
    resolve?.(Boolean(confirmed));
  }

  #confirmLeaveWithoutSaving() {
    const leaveOverlay = this.#mountLeaveOverlay();
    if (!leaveOverlay) {
      try {
        return Promise.resolve(window.confirm(
          'You have unsaved changes on this page. Leave without saving?',
        ));
      } catch (error) {
        return Promise.resolve(true);
      }
    }

    if (this.__leaveDialogResolve) {
      this.#closeLeavePrompt(false);
    }

    return new Promise((resolve) => {
      this.__leaveDialogResolve = resolve;
      leaveOverlay.hidden = false;
      leaveOverlay.querySelector('[data-action="confirm-leave"]')?.focus?.();
    });
  }

  #bindNavigationGuard() {
    this.__beforeUnloadHandler = (event) => {
      if (!this.__dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', this.__beforeUnloadHandler);

    this.__navigationClickHandler = (event) => {
      if (!this.__dirty) return;

      const link = event.target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (link.dataset.action) return;

      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:')) return;

      if (link.closest('.page-editor__publish-dialog, .page-editor__inserter, .page-editor__leave-overlay')) return;

      try {
        const nextUrl = new URL(link.href, window.location.href);
        const currentUrl = new URL(window.location.href);
        if (nextUrl.origin === currentUrl.origin
          && nextUrl.pathname === currentUrl.pathname
          && nextUrl.search === currentUrl.search
          && nextUrl.hash === currentUrl.hash) {
          return;
        }
      } catch (error) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const destination = link.href;
      this.__pendingLeaveUrl = destination;
      void this.#confirmLeaveWithoutSaving().then((confirmed) => {
        const url = this.__pendingLeaveUrl || destination;
        this.__pendingLeaveUrl = '';
        if (confirmed) {
          this.#completeLeaveNavigation(url);
        }
      });
    };
    document.addEventListener('click', this.__navigationClickHandler, true);

    const leaveOverlay = this.#getLeaveOverlay();
    leaveOverlay?.addEventListener('click', (event) => {
      if (event.target === leaveOverlay) {
        event.preventDefault();
        this.__pendingLeaveUrl = '';
        this.#closeLeavePrompt(false);
        return;
      }

      const action = event.target.closest('[data-action]')?.dataset?.action;
      if (action === 'close-leave') {
        event.preventDefault();
        this.__pendingLeaveUrl = '';
        this.#closeLeavePrompt(false);
      } else if (action === 'confirm-leave') {
        event.preventDefault();
        this.#closeLeavePrompt(true);
      }
    });

    this.__leaveKeydownHandler = (event) => {
      const activeLeaveOverlay = this.#getLeaveOverlay();
      if (event.key !== 'Escape' || !activeLeaveOverlay || activeLeaveOverlay.hidden) {
        return;
      }
      event.preventDefault();
      this.__pendingLeaveUrl = '';
      this.#closeLeavePrompt(false);
    };
    document.addEventListener('keydown', this.__leaveKeydownHandler);
  }

  #els() {
    return {
      back: this.querySelector('.page-editor__back'),
      titleInput: this.querySelector('.page-editor__title-input'),
      source: this.querySelector('.page-editor__source code'),
      status: this.querySelector('.page-editor__status'),
      pageContent: this.querySelector('.page-editor__page-content'),
      codeMount: this.querySelector('.page-editor__codemirror'),
      unsavedNotice: this.querySelector('.page-editor__unsaved-notice'),
      pagePanel: this.querySelector('[data-panel="page"]'),
      sourcePanel: this.querySelector('[data-panel="source"]'),
      modeTabs: [...this.querySelectorAll('.page-editor__mode-tab')],
      publishDialog: this.querySelector('.page-editor__publish-dialog'),
      leaveOverlay: this.#getLeaveOverlay(),
      publishForm: this.querySelector('.page-editor__publish-form'),
      inserterDialog: this.querySelector('.page-editor__inserter'),
      inserterBody: this.querySelector('.page-editor__inserter-body'),
      inserterSearch: this.querySelector('.page-editor__inserter-search'),
      slashMenu: this.querySelector('.page-editor__slash-menu'),
      blocksRoot: () => this.querySelector('.page-editor__blocks'),
    };
  }

  #setStatus(message, type = 'info') {
    const { status } = this.#els();
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
    status.hidden = !message;
  }

  async #fetchSession() {
    const sessionUrl = resolveGitHubApiUrl('github-session.php');
    if (!sessionUrl) return null;
    try {
      const response = await fetch(
        sessionUrl,
        window.App?.getGitHubFetchInit?.({ cache: 'no-store' }) || { credentials: 'include', cache: 'no-store' },
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  #storeSession(session) {
    this.__session = session;
  }

  async #init() {
    const params = getEditorQueryParams();
    const sourcePath = normalizeSitePath(this.getAttribute('source') || params.get('source') || '');
    const returnPath = normalizeSitePath(this.getAttribute('return') || params.get('return') || sourcePath);
    const titleOverride = this.getAttribute('title')?.trim() || '';
    const contentSelectorParam = (
      this.getAttribute('content-selector')
      || params.get('content-selector')
      || params.get('content_selector')
      || ''
    ).trim();
    if (contentSelectorParam) {
      this.__contentSelector = contentSelectorParam;
    }
    const { back, titleInput, source, pageContent } = this.#els();

    if (!sourcePath || !isAllowedEditorSource(sourcePath)) {
      if (pageContent) {
        pageContent.innerHTML = '<p class="page-editor__error">A valid <code>source</code> page path is required, for example <code>pages/privacy_policy.html</code>.</p>';
        pageContent.removeAttribute('contenteditable');
      }
      this.#setStatus('This editor could not determine which page to load.', 'error');
      return;
    }

    this.__sourcePath = sourcePath;
    if (source) source.textContent = sourcePath;
    if (back) {
      back.href = resolveReturnPageUrl(returnPath);
      back.hidden = false;
    }

    this.#setStatus('Loading page content…');
    const session = await this.#fetchSession();
    this.#storeSession(session);

    try {
      const response = await fetch(resolveSourcePageUrl(sourcePath), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${sourcePath} (${response.status}).`);

      this.__originalHtml = await response.text();
      const extracted = extractPageContent(this.__originalHtml, this.__contentSelector);
      this.__fragmentMode = Boolean(extracted.fragmentMode);
      if (this.__fragmentMode && !isFragmentContentSelector(this.__contentSelector)) {
        this.__contentSelector = FRAGMENT_CONTENT_SELECTOR;
      }

      this.__includeSources = new Map();
      let initialContent = extracted.content;
      if (this.hasAttribute('inline-includes')) {
        initialContent = await this.#inlineIncludes(initialContent);
      }

      this.__originalContentHtml = initialContent;
      this.__mainClassName = extracted.mainClassName || 'main-content';
      this.__pageTitle = titleOverride || formatPageTitle(sourcePath, extracted.title);
      if (titleInput) titleInput.value = this.__pageTitle;
      document.title = `Edit ${this.__pageTitle}`;

      this.#renderInserterPanel('');
      this.#populateLiveEditor(initialContent || '<p></p>');
      this.#setSavedBaseline();
      this.#setStatus('Type / to insert blocks, drag to reorder, and use the sidebar for block settings. Ctrl+Z to undo. Switch to HTML for full control.');
    } catch (error) {
      console.error(error);
      if (pageContent) {
        pageContent.innerHTML = `<p class="page-editor__error">${escapeHtml(error.message || 'Could not load this page.')}</p>`;
        pageContent.removeAttribute('contenteditable');
      }
      this.#setStatus(error.message || 'Could not load this page.', 'error');
    }
  }

  // Replaces <include src="…"> elements with editable wrappers containing the
  // fragment's content, so included files (e.g. the profile infobox) can be
  // edited inline. The originals are kept for the multi-file publish step.
  async #inlineIncludes(content) {
    const doc = new DOMParser().parseFromString(`<div data-root>${content}</div>`, 'text/html');
    const root = doc.querySelector('[data-root]');
    if (!root) {
      return content;
    }

    const includeEls = [...root.querySelectorAll('include[src], [data-include]')];
    if (!includeEls.length) {
      return content;
    }

    const sourceDir = this.__sourcePath.split('/').slice(0, -1).join('/');

    for (const el of includeEls) {
      const src = (el.getAttribute('src') || el.dataset.include || '').trim();
      if (!src || /^https?:/i.test(src) || src.startsWith('/') || src.includes('..')) {
        continue;
      }

      const repoPath = `${sourceDir}/${src.replace(/^\.\//, '')}`;
      try {
        const response = await fetch(resolveSourcePageUrl(repoPath), { cache: 'no-store' });
        if (!response.ok) {
          continue;
        }

        const text = await response.text();
        this.__includeSources.set(src, { path: repoPath, original: text });

        const wrapper = doc.createElement('div');
        wrapper.setAttribute('data-editor-include', src);
        wrapper.innerHTML = text;
        el.replaceWith(wrapper);
      } catch (error) {
        console.warn('Could not inline include', src, error);
      }
    }

    return root.innerHTML;
  }

  // Resolves relative asset URLs (e.g. images/…) against asset-base for the
  // editor preview; the original values are restored when publishing.
  #resolveCanvasAssets(root) {
    const assetBase = this.getAttribute('asset-base')?.trim();
    if (!assetBase || !root) return;

    root.querySelectorAll('img[src]').forEach((img) => {
      if (img.hasAttribute('data-editor-src')) return;
      const src = img.getAttribute('src') || '';
      if (!src || /^(https?:|data:|blob:)/i.test(src)) return;

      try {
        const resolved = new URL(src, new URL(`${assetBase.replace(/\/+$/, '')}/`, window.location.href)).href;
        img.setAttribute('data-editor-src', src);
        img.setAttribute('src', resolved);
      } catch (error) {
        // leave the original src in place
      }
    });
  }

  #populateLiveEditor(html) {
    const { pageContent } = this.#els();
    if (!pageContent) return;

    const canvasClass = this.getAttribute('canvas-class')?.trim() || '';
    pageContent.className = [this.__mainClassName, canvasClass, 'page-editor__page-content']
      .filter(Boolean)
      .join(' ');
    pageContent.replaceChildren();

    const blocksRoot = document.createElement('div');
    blocksRoot.className = 'page-editor__blocks';
    splitHtmlIntoTopLevelFragments(html).forEach((fragment) => {
      blocksRoot.appendChild(createBlockElement(fragment));
    });
    pageContent.appendChild(blocksRoot);

    const append = document.createElement('div');
    append.className = 'page-editor__canvas-append';
    append.dataset.dropZone = 'append';
    append.innerHTML = '<button type="button" class="page-editor__add-block" data-action="open-inserter"><i class="bi bi-plus-lg" aria-hidden="true"></i><span>Add block</span></button>';
    pageContent.appendChild(append);

    this.#rebuildBlockGaps();
    this.#bindBlocksCanvas(pageContent);
    applyBrandingToNode(pageContent);
    this.#resolveCanvasAssets(pageContent);
    this.#updateCounts();
  }

  #rebuildBlockGaps() {
    const blocksRoot = this.#els().blocksRoot();
    if (!blocksRoot) return;

    blocksRoot.querySelectorAll(':scope > .page-editor__block-gap').forEach((gap) => gap.remove());
    const blocks = [...blocksRoot.querySelectorAll(':scope > .page-editor__block')];
    blocks.forEach((block) => {
      blocksRoot.insertBefore(createBlockGapElement(), block);
    });
  }

  #bindBlocksCanvas(pageContent) {
    if (pageContent.__blocksBound) return;
    pageContent.__blocksBound = true;

    const blocksRoot = pageContent.querySelector('.page-editor__blocks');
    if (!blocksRoot) return;

    pageContent.addEventListener('focusin', (event) => {
      const block = event.target.closest('.page-editor__block');
      if (!block) return;
      this.#selectBlock(block);
    });

    blocksRoot.addEventListener('dragstart', (event) => {
      const handle = event.target.closest('[data-block-action="drag"]');
      if (!handle) return;
      const block = handle.closest('.page-editor__block');
      if (!block) return;
      this.__draggingBlock = block;
      block.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', block.dataset.blockUid || '');
    });

    blocksRoot.addEventListener('dragend', () => {
      if (this.__draggingBlock) {
        this.__draggingBlock.classList.remove('is-dragging');
        this.__draggingBlock = null;
      }
      blocksRoot.querySelectorAll('.page-editor__block.is-drop-target').forEach((el) => {
        el.classList.remove('is-drop-target');
      });
      appendZone?.classList.remove('is-drop-target');
    });

    const appendZone = pageContent.querySelector('.page-editor__canvas-append');

    const handleDragOver = (event) => {
      if (!this.__draggingBlock) return;
      event.preventDefault();
      const target = event.target.closest('.page-editor__block');
      const overAppend = Boolean(event.target.closest('.page-editor__canvas-append'));
      blocksRoot.querySelectorAll('.page-editor__block.is-drop-target').forEach((el) => {
        el.classList.toggle('is-drop-target', el === target && el !== this.__draggingBlock);
      });
      appendZone?.classList.toggle('is-drop-target', overAppend);
    };

    blocksRoot.addEventListener('dragover', handleDragOver);
    appendZone?.addEventListener('dragover', handleDragOver);

    const handleDrop = (event) => {
      if (!this.__draggingBlock) return;
      event.preventDefault();
      appendZone?.classList.remove('is-drop-target');

      if (event.target.closest('.page-editor__canvas-append')) {
        blocksRoot.appendChild(this.__draggingBlock);
        this.#rebuildBlockGaps();
        this.#selectBlock(this.__draggingBlock);
        this.#pushHistorySnapshot({ immediate: true });
        this.#updateDirtyState();
        this.#scheduleLiveSync();
        return;
      }

      const target = event.target.closest('.page-editor__block');
      if (!target || target === this.__draggingBlock) return;
      const rect = target.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      if (before) {
        target.before(this.__draggingBlock);
      } else {
        target.after(this.__draggingBlock);
      }
      this.#rebuildBlockGaps();
      this.#selectBlock(this.__draggingBlock);
      this.#pushHistorySnapshot({ immediate: true });
      this.#updateDirtyState();
      this.#scheduleLiveSync();
    };

    blocksRoot.addEventListener('drop', handleDrop);
    appendZone?.addEventListener('drop', handleDrop);
  }

  #selectBlock(block) {
    const { pageContent } = this.#els();
    if (!block || !pageContent) return;
    this.__selectedBlock = block;
    pageContent.querySelectorAll('.page-editor__block').forEach((item) => {
      item.classList.toggle('is-selected', item === block);
    });
    this.#renderBlockSidebar(block);
  }

  #scheduleBlockChromeSync(block) {
    if (!block) return;
    if (this.__chromeSyncTimer) clearTimeout(this.__chromeSyncTimer);
    this.__chromeSyncTimer = setTimeout(() => {
      this.__chromeSyncTimer = null;
      updateBlockChrome(block);
      if (this.__selectedBlock === block) {
        this.#renderBlockSidebar(block);
      }
    }, 250);
  }

  #getActiveBlockBody() {
    const selection = document.getSelection();
    if (selection?.anchorNode) {
      const node = selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode;
      const body = node?.closest?.('.page-editor__block-body');
      if (body) return body;
    }

    const { pageContent } = this.#els();
    return pageContent?.querySelector('.page-editor__block.is-selected .page-editor__block-body')
      || pageContent?.querySelector('.page-editor__block-body');
  }

  #renderInserterPanel(query = '') {
    const { inserterBody } = this.#els();
    if (!inserterBody || !window.EditorBlockInserter) return;

    const { definitions, categories } = this.#getActiveBlockLibrary();
    window.EditorBlockInserter.renderPanel(inserterBody, {
      context: 'page',
      definitions,
      categories,
      query,
    });
  }

  #openInserter(context = {}) {
    const { inserterDialog, inserterSearch } = this.#els();
    if (!inserterDialog) return;

    this.__inserterContext = {
      block: context.block || null,
      position: context.position || 'append',
    };

    if (inserterSearch) inserterSearch.value = '';
    this.#renderInserterPanel('');

    if (typeof inserterDialog.showModal === 'function') inserterDialog.showModal();
    else inserterDialog.setAttribute('open', 'open');

    requestAnimationFrame(() => inserterSearch?.focus());
  }

  #closeInserter() {
    const { inserterDialog } = this.#els();
    this.__inserterContext = null;
    if (inserterDialog?.open) inserterDialog.close();
    else inserterDialog?.removeAttribute('open');
  }

  #insertBlockById(blockId) {
    const definition = getBlockDefinition(blockId);
    if (!definition) return;

    const blocksRoot = this.#els().blocksRoot();
    if (!blocksRoot) return;

    const newBlock = createBlockElement(definition.html);
    const context = this.__inserterContext || { position: 'append' };

    if (context.block && context.position === 'before') {
      context.block.before(newBlock);
    } else if (context.block && context.position === 'after') {
      context.block.after(newBlock);
    } else {
      blocksRoot.appendChild(newBlock);
    }

    applyBrandingToNode(newBlock);
    this.#resolveCanvasAssets(newBlock);
    this.#rebuildBlockGaps();
    this.#closeInserter();
    this.#selectBlock(newBlock);
    newBlock.querySelector('.page-editor__block-body')?.focus();
    this.#pushHistorySnapshot({ immediate: true });
    this.#updateDirtyState();
    this.#scheduleLiveSync();
  }

  #insertBlockFromSlash(blockId) {
    const block = this.__slashBlock;
    this.#closeSlashMenu();
    if (block) {
      this.__inserterContext = { block, position: 'after' };
    } else {
      this.__inserterContext = { position: 'append' };
    }
    this.#insertBlockById(blockId);
    if (block) {
      block.remove();
      this.#rebuildBlockGaps();
    }
  }

  #shouldOpenSlashMenu(body) {
    return this.#isBlockBodyEmpty(body);
  }

  #isBlockBodyEmpty(body) {
    const html = body?.innerHTML || '';
    const text = (body?.textContent || '').replace(/\u00a0/g, '').trim();
    if (text && text !== '/') {
      return false;
    }

    const doc = new DOMParser().parseFromString(`<div data-root>${html}</div>`, 'text/html');
    const root = doc.querySelector('[data-root]');
    if (!root) {
      return !text || text === '/';
    }

    const meaningfulChildren = [...root.childNodes].filter((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return Boolean(node.textContent?.replace(/\u00a0/g, '').trim());
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }
      const tag = node.tagName.toLowerCase();
      return tag !== 'br';
    });

    return meaningfulChildren.length === 0;
  }

  #getSlashMenuMatches() {
    const needle = String(this.__slashFilter || '').trim().toLowerCase();
    const { definitions } = this.#getActiveBlockLibrary();
    return definitions.filter((block) => {
      if (block.hidden) return false;
      if (!needle) return true;
      return block.label.toLowerCase().includes(needle)
        || block.id.toLowerCase().includes(needle)
        || block.category.toLowerCase().includes(needle);
    });
  }

  #renderSlashMenu() {
    const { slashMenu } = this.#els();
    if (!slashMenu) return;

    const matches = this.#getSlashMenuMatches();
    if (this.__slashHighlightIndex >= matches.length) {
      this.__slashHighlightIndex = Math.max(0, matches.length - 1);
    }

    slashMenu.innerHTML = matches.map((item, index) => `
      <button type="button" class="page-editor__slash-item${index === this.__slashHighlightIndex ? ' is-highlighted' : ''}" data-block-id="${escapeHtml(item.id)}" role="option" aria-selected="${index === this.__slashHighlightIndex ? 'true' : 'false'}">
        <i class="bi ${escapeHtml(item.icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(item.label)}</span>
      </button>
    `).join('') || '<p class="page-editor__slash-empty">No matching blocks</p>';
  }

  #openSlashMenu(block) {
    const { slashMenu } = this.#els();
    if (!slashMenu) return;
    this.__slashBlock = block || null;
    this.__slashHighlightIndex = 0;
    this.#renderSlashMenu();
    slashMenu.hidden = false;
    const body = block?.querySelector('.page-editor__block-body');
    if (body) {
      const rect = body.getBoundingClientRect();
      slashMenu.style.top = `${Math.min(rect.top + 8, window.innerHeight - 320)}px`;
      slashMenu.style.left = `${Math.min(rect.left + 8, window.innerWidth - 280)}px`;
    }
  }

  #closeSlashMenu() {
    const { slashMenu } = this.#els();
    if (slashMenu) slashMenu.hidden = true;
    this.__slashBlock = null;
    this.__slashFilter = '';
    this.__slashHighlightIndex = 0;
  }

  #moveSlashHighlight(delta) {
    const matches = this.#getSlashMenuMatches();
    if (!matches.length) return;
    this.__slashHighlightIndex = (this.__slashHighlightIndex + delta + matches.length) % matches.length;
    this.#renderSlashMenu();
    const { slashMenu } = this.#els();
    slashMenu?.querySelector('.page-editor__slash-item.is-highlighted')?.scrollIntoView({ block: 'nearest' });
  }

  #activateSlashHighlight() {
    const matches = this.#getSlashMenuMatches();
    const item = matches[this.__slashHighlightIndex];
    if (!item) return;
    this.#insertBlockFromSlash(item.id);
  }

  #duplicateBlock(block) {
    const body = block?.querySelector('.page-editor__block-body');
    const newBlock = createBlockElement(body?.innerHTML || '<p></p>');
    block.after(newBlock);
    applyBrandingToNode(newBlock);
    this.#resolveCanvasAssets(newBlock);
    this.#rebuildBlockGaps();
    this.#selectBlock(newBlock);
    this.#pushHistorySnapshot({ immediate: true });
    this.#updateDirtyState();
    this.#scheduleLiveSync();
  }

  #transformBlock(block, typeId) {
    const definition = getBlockDefinition(typeId);
    const body = block?.querySelector('.page-editor__block-body');
    if (!definition || !body) return;

    const preservedText = body.textContent?.trim() || '';
    body.innerHTML = definition.html;
    if (preservedText && ['paragraph', 'heading', 'quote'].includes(typeId)) {
      const target = body.querySelector('p, h1, h2, h3, blockquote p');
      if (target) target.textContent = preservedText;
    }
    hardenLiveEditorRoot(body);
    applyBrandingToNode(block);
    updateBlockChrome(block);
    this.#renderBlockSidebar(block);
    this.#pushHistorySnapshot({ immediate: true });
    this.#updateDirtyState();
    this.#scheduleLiveSync();
  }

  #getOpenBlockSettings() {
    return this.querySelector('.page-editor__block-settings-pop');
  }

  #closeBlockSettings() {
    this.#getOpenBlockSettings()?.remove();
  }

  #toggleBlockSettings(block) {
    if (!block) return;
    const existing = this.#getOpenBlockSettings();
    const wasOpenForBlock = existing?.closest('.page-editor__block') === block;
    this.#closeBlockSettings();
    if (wasOpenForBlock) return;

    this.#selectBlock(block);
    const definition = getBlockDefinition(block.dataset.blockType || 'paragraph');
    const pop = document.createElement('div');
    pop.className = 'page-editor__block-sidebar page-editor__block-settings-pop';
    pop.setAttribute('contenteditable', 'false');
    pop.innerHTML = `
      <header class="page-editor__block-sidebar-header">
        <h3 class="page-editor__block-sidebar-title">Block settings</h3>
        <p class="page-editor__block-sidebar-type">${escapeHtml(definition.description || definition.label)}</p>
      </header>
      <div class="page-editor__block-sidebar-body">${this.#buildBlockSettingsHtml(block)}</div>
    `;
    block.appendChild(pop);
  }

  // Refresh (or close) the floating settings panel when the selection or
  // block type changes. Replaces the old fixed right-hand sidebar.
  #renderBlockSidebar(block) {
    const pop = this.#getOpenBlockSettings();
    if (!pop) return;

    const owner = pop.closest('.page-editor__block');
    if (!block || owner !== block || this.__activeMode !== 'page') {
      this.#closeBlockSettings();
      return;
    }

    const definition = getBlockDefinition(block.dataset.blockType || 'paragraph');
    const typeEl = pop.querySelector('.page-editor__block-sidebar-type');
    if (typeEl) typeEl.textContent = definition.description || definition.label;
    const bodyEl = pop.querySelector('.page-editor__block-sidebar-body');
    if (bodyEl) bodyEl.innerHTML = this.#buildBlockSettingsHtml(block);
  }

  #buildBlockSettingsHtml(block) {
    const typeId = block.dataset.blockType || 'paragraph';
    const definition = getBlockDefinition(typeId);

    const transforms = (definition.transforms || [])
      .map((id) => getBlockDefinition(id))
      .filter(Boolean);

    const body = block.querySelector('.page-editor__block-body');
    const image = body?.querySelector('img');
    const buttons = body ? [...body.querySelectorAll('a.pure-button, a.site-chip')] : [];
    const spacer = body?.querySelector('[aria-hidden="true"][style*="height"]');

    let fields = '';

    if (transforms.length > 0) {
      fields += `
        <label class="page-editor__sidebar-field">
          <span class="page-editor__sidebar-label">Transform to</span>
          <select class="page-editor__sidebar-input" data-sidebar-field="transform">
            <option value="">— Keep as ${escapeHtml(definition.label)} —</option>
            ${transforms.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('')}
          </select>
        </label>
      `;
    }

    if (image) {
      fields += `
        <label class="page-editor__sidebar-field">
          <span class="page-editor__sidebar-label">Image URL</span>
          <input type="url" class="page-editor__sidebar-input" data-sidebar-field="image-src" value="${escapeHtmlAttribute(image.getAttribute('src') || '')}">
        </label>
        <label class="page-editor__sidebar-field">
          <span class="page-editor__sidebar-label">Alt text</span>
          <input type="text" class="page-editor__sidebar-input" data-sidebar-field="image-alt" value="${escapeHtmlAttribute(image.getAttribute('alt') || '')}">
        </label>
      `;
    }

    buttons.slice(0, 4).forEach((button, index) => {
      fields += `
        <fieldset class="page-editor__sidebar-fieldset">
          <legend class="page-editor__sidebar-label">Link ${index + 1}</legend>
          <label class="page-editor__sidebar-field">
            <span class="page-editor__sidebar-sublabel">Label</span>
            <input type="text" class="page-editor__sidebar-input" data-sidebar-field="button-text" data-button-index="${index}" value="${escapeHtmlAttribute(button.textContent?.trim() || '')}">
          </label>
          <label class="page-editor__sidebar-field">
            <span class="page-editor__sidebar-sublabel">URL</span>
            <input type="text" class="page-editor__sidebar-input" data-sidebar-field="button-href" data-button-index="${index}" value="${escapeHtmlAttribute(button.getAttribute('href') || '')}">
          </label>
        </fieldset>
      `;
    });

    if (typeId === 'spacer' && spacer) {
      const heightMatch = String(spacer.style.height || '1.5rem').match(/([\d.]+)/);
      const heightRem = heightMatch ? Number(heightMatch[1]) : 1.5;
      fields += `
        <label class="page-editor__sidebar-field">
          <span class="page-editor__sidebar-label">Spacer height (rem)</span>
          <input type="range" class="page-editor__sidebar-range" data-sidebar-field="spacer-height" min="0.5" max="6" step="0.25" value="${heightRem}">
          <span class="page-editor__sidebar-range-value">${heightRem}rem</span>
        </label>
      `;
    }

    fields += `
      <div class="page-editor__sidebar-actions">
        <button type="button" class="page-editor__button page-editor__button--small" data-sidebar-action="duplicate">Duplicate block</button>
        <button type="button" class="page-editor__button page-editor__button--small page-editor__sidebar-delete" data-sidebar-action="delete">Delete block</button>
      </div>
      <p class="page-editor__sidebar-hint"><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> redo · <kbd>/</kbd> in empty block to insert</p>
    `;

    return fields;
  }

  #handleSidebarAction(control) {
    const block = this.__selectedBlock;
    if (!block) return;
    const action = control.dataset.sidebarAction;
    if (action === 'duplicate') this.#duplicateBlock(block);
    else if (action === 'delete') this.#handleBlockAction('delete', block);
  }

  #handleSidebarInput(input) {
    const block = this.__selectedBlock;
    const body = block?.querySelector('.page-editor__block-body');
    if (!block || !body) return;

    const field = input.dataset.sidebarField;
    if (field === 'transform' && input.value) {
      this.#transformBlock(block, input.value);
      input.value = '';
      return;
    }

    if (field === 'image-src') {
      const image = body.querySelector('img');
      if (image) image.setAttribute('src', input.value.trim());
    } else if (field === 'image-alt') {
      const image = body.querySelector('img');
      if (image) image.setAttribute('alt', input.value);
    } else if (field === 'button-text' || field === 'button-href') {
      const buttons = [...body.querySelectorAll('a.pure-button, a.site-chip')];
      const index = Number(input.dataset.buttonIndex || 0);
      const button = buttons[index];
      if (button) {
        if (field === 'button-text') button.textContent = input.value;
        else button.setAttribute('href', input.value.trim() || '#');
        hardenLiveEditorRoot(body);
      }
    } else if (field === 'spacer-height') {
      const spacer = body.querySelector('[aria-hidden="true"][style*="height"]');
      if (spacer) {
        spacer.style.height = `${input.value}rem`;
        const valueEl = input.parentElement?.querySelector('.page-editor__sidebar-range-value');
        if (valueEl) valueEl.textContent = `${input.value}rem`;
      }
    }

    this.#scheduleHistorySnapshot();
    this.#updateDirtyState();
    this.#scheduleLiveSync();
  }

  #handleBlockAction(action, block, control) {
    const blocksRoot = this.#els().blocksRoot();
    if (!blocksRoot) return;

    if (action === 'drag') return;

    if (action === 'settings') {
      this.#toggleBlockSettings(block);
      return;
    }

    if (action === 'insert-at-gap') {
      const gap = control?.closest('.page-editor__block-gap');
      const next = gap?.nextElementSibling;
      if (next?.classList.contains('page-editor__block')) {
        this.#openInserter({ block: next, position: 'before' });
      } else {
        this.#openInserter({ position: 'append' });
      }
      return;
    }

    if (!block) return;

    if (action === 'insert-before') {
      this.#openInserter({ block, position: 'before' });
      return;
    }

    if (action === 'insert-after') {
      this.#openInserter({ block, position: 'after' });
      return;
    }

    if (action === 'duplicate') {
      this.#duplicateBlock(block);
      return;
    }

    if (action === 'delete') {
      const blockCount = blocksRoot.querySelectorAll(':scope > .page-editor__block').length;
      if (blockCount <= 1) {
        window.alert('A page must have at least one block.');
        return;
      }
      if (!window.confirm('Delete this block?')) return;
      const wasSelected = this.__selectedBlock === block;
      block.remove();
      this.#rebuildBlockGaps();
      if (wasSelected) {
        const fallback = blocksRoot.querySelector(':scope > .page-editor__block');
        if (fallback) this.#selectBlock(fallback);
        else this.#renderBlockSidebar(null);
      }
      this.#pushHistorySnapshot({ immediate: true });
      this.#updateDirtyState();
      this.#scheduleLiveSync();
      return;
    }

    if (action === 'move-up') {
      let previous = block.previousElementSibling;
      while (previous && !previous.classList.contains('page-editor__block')) {
        previous = previous.previousElementSibling;
      }
      if (previous?.classList.contains('page-editor__block')) {
        blocksRoot.insertBefore(block, previous);
        this.#rebuildBlockGaps();
        this.#selectBlock(block);
        this.#pushHistorySnapshot({ immediate: true });
        this.#updateDirtyState();
        this.#scheduleLiveSync();
      }
      return;
    }

    if (action === 'move-down') {
      let next = block.nextElementSibling;
      while (next && !next.classList.contains('page-editor__block')) {
        next = next.nextElementSibling;
      }
      if (next?.classList.contains('page-editor__block')) {
        blocksRoot.insertBefore(next, block);
        this.#rebuildBlockGaps();
        this.#selectBlock(block);
        this.#pushHistorySnapshot({ immediate: true });
        this.#updateDirtyState();
        this.#scheduleLiveSync();
      }
    }
  }

  #handleFormatAction(button) {
    if (this.__activeMode !== 'page') return;

    const body = this.#getActiveBlockBody();
    if (!body) return;
    body.focus();

    const action = button.dataset.action;
    if (action === 'insert-link') {
      const url = window.prompt('Enter the link URL');
      if (!url?.trim()) return;
      try {
        new URL(url.trim(), window.location.href);
      } catch (error) {
        window.alert('Please enter a valid URL.');
        return;
      }
      document.execCommand('createLink', false, url.trim());
      hardenLiveEditorRoot(body);
      this.#updateDirtyState();
      this.#scheduleLiveSync();
      return;
    }

    if (action === 'inline-code') {
      const selection = document.getSelection();
      const text = selection?.toString() || '';
      if (!text) return;

      const anchorEl = selection.anchorNode?.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode;
      if (anchorEl?.closest('code')) {
        document.execCommand('removeFormat');
      } else {
        document.execCommand('insertHTML', false, `<code>${escapeHtml(text)}</code>`);
      }
      this.#updateDirtyState();
      this.#scheduleLiveSync();
      return;
    }

    const cmd = button.dataset.cmd;
    if (!cmd) return;

    if (cmd === 'formatBlock') {
      document.execCommand('formatBlock', false, button.dataset.value || 'p');
    } else {
      document.execCommand(cmd, false, button.dataset.value || null);
    }

    this.#updateDirtyState();
    this.#scheduleLiveSync();
  }

  async #ensureCodeMirror() {
    if (this.__codeMirror) return this.__codeMirror;
    const CodeMirror = await ensureCodeMirror();
    const { codeMount } = this.#els();
    this.__codeMirror = CodeMirror(codeMount, {
      mode: 'htmlmixed',
      theme: isDarkThemeActive() ? 'material' : 'default',
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
    });
    this.__codeMirror.on('change', () => {
      if (this.__syncing) return;
      this.#scheduleSourceSync();
      this.#scheduleHistorySnapshot();
      this.#updateDirtyState();
    });
    return this.__codeMirror;
  }

  #scheduleLiveSync() {
    if (this.__liveSyncTimer) clearTimeout(this.__liveSyncTimer);
    this.__liveSyncTimer = setTimeout(() => {
      this.__liveSyncTimer = null;
      this.#syncLiveToSource();
      this.#updateCounts();
    }, 200);
  }

  #scheduleSourceSync() {
    if (this.__sourceSyncTimer) clearTimeout(this.__sourceSyncTimer);
    this.__sourceSyncTimer = setTimeout(() => {
      this.__sourceSyncTimer = null;
      this.#syncSourceToLive();
    }, 200);
  }

  #syncLiveToSource() {
    if (this.__syncing || !this.__codeMirror) return;
    const html = this.#getLiveHtml();
    if (this.__codeMirror.getValue() === html) return;

    this.__syncing = true;
    try {
      const cursor = this.__codeMirror.getCursor();
      const scroll = this.__codeMirror.getScrollInfo();
      this.__codeMirror.setValue(html);
      this.__codeMirror.setCursor(cursor);
      this.__codeMirror.scrollTo(scroll.left, scroll.top);
    } finally {
      this.__syncing = false;
    }
  }

  #syncSourceToLive() {
    if (this.__syncing || !this.__codeMirror) return;
    const html = this.__codeMirror.getValue() || '<p></p>';
    if (this.#getLiveHtml() === html.trim()) return;

    this.__syncing = true;
    try {
      this.#populateLiveEditor(html);
    } finally {
      this.__syncing = false;
    }
  }

  #flushEditorSync() {
    if (this.__liveSyncTimer) {
      clearTimeout(this.__liveSyncTimer);
      this.__liveSyncTimer = null;
    }
    if (this.__sourceSyncTimer) {
      clearTimeout(this.__sourceSyncTimer);
      this.__sourceSyncTimer = null;
    }
    if (this.__activeMode === 'source') {
      this.#syncSourceToLive();
    } else if (this.__activeMode === 'page') {
      this.#syncLiveToSource();
    }
  }

  #getPageTitle() {
    const value = this.#els().titleInput?.value?.trim();
    return value || this.__pageTitle || 'Page';
  }

  #getLiveHtml() {
    const { pageContent, blocksRoot } = this.#els();
    const root = blocksRoot();
    if (root) return serializeBlockCanvas(root);
    return pageContent?.innerHTML.trim() || '';
  }

  #getSourceHtml() {
    this.#flushEditorSync();
    if (this.__activeMode === 'source' && this.__codeMirror) {
      return this.__codeMirror.getValue().trim();
    }
    return this.#getLiveHtml();
  }

  #buildFullPageHtml() {
    if (!this.__originalHtml) {
      throw new Error('The original page has not finished loading yet.');
    }
    const titleChanged = this.#getPageTitle() !== this.__savedPageTitle;
    return replacePageContent(
      this.__originalHtml,
      this.__contentSelector,
      this.#getSourceHtml(),
      titleChanged ? this.#getPageTitle() : null,
    );
  }

  // Builds the list of files to publish. Inline-edited includes are split
  // back into their own files and the <include> elements are restored in the
  // main document, so one save can carry e.g. profile.html + profile-table.html.
  #buildPublishFiles() {
    if (!this.__originalHtml) {
      throw new Error('The original page has not finished loading yet.');
    }

    const titleChanged = this.#getPageTitle() !== this.__savedPageTitle;
    const contentHtml = this.#getSourceHtml();
    const files = [];
    let mainContent = contentHtml;

    if (contentHtml.includes('data-editor-include')) {
      const doc = new DOMParser().parseFromString(`<div data-root>${contentHtml}</div>`, 'text/html');
      const root = doc.querySelector('[data-root]');
      const sourceDir = this.__sourcePath.split('/').slice(0, -1).join('/');

      root?.querySelectorAll('[data-editor-include]').forEach((wrapper) => {
        const src = (wrapper.getAttribute('data-editor-include') || '').trim();
        if (!src) {
          wrapper.remove();
          return;
        }

        let meta = this.__includeSources.get(src);
        if (!meta) {
          meta = { path: `${sourceDir}/${src.replace(/^\.\//, '')}`, original: '' };
          this.__includeSources.set(src, meta);
        }

        const merged = mergeContentPreservingUnchanged(meta.original, wrapper.innerHTML.trim());
        if (merged.trim() && merged !== meta.original) {
          files.push({ path: meta.path, content: merged });
        }

        const includeEl = doc.createElement('include');
        includeEl.setAttribute('src', src);
        wrapper.replaceWith(includeEl);
      });

      if (root) {
        mainContent = root.innerHTML;
      }
    }

    const fullHtml = replacePageContent(
      this.__originalHtml,
      this.__contentSelector,
      mainContent,
      titleChanged ? this.#getPageTitle() : null,
    );

    files.unshift({ path: this.__sourcePath, content: fullHtml });
    return files;
  }

  async #setMode(mode) {
    const nextMode = mode === 'source' ? 'source' : 'page';
    const { pagePanel, sourcePanel, modeTabs } = this.#els();

    this.#flushEditorSync();

    if (nextMode === 'source') {
      await ensureHtmlBeautify();
      const editor = await this.#ensureCodeMirror();
      this.__syncing = true;
      try {
        editor.setValue(formatHtmlSource(this.#getLiveHtml()));
      } finally {
        this.__syncing = false;
      }
      editor.refresh();
    } else if (nextMode === 'page' && this.__activeMode === 'source' && this.__codeMirror) {
      this.#syncSourceToLive();
    }

    this.__activeMode = nextMode;
    modeTabs.forEach((tab) => {
      const isActive = tab.dataset.mode === nextMode;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    pagePanel?.classList.toggle('is-active', nextMode === 'page');
    sourcePanel?.classList.toggle('is-active', nextMode === 'source');
    if (pagePanel) pagePanel.hidden = nextMode !== 'page';
    if (sourcePanel) sourcePanel.hidden = nextMode !== 'source';

    if (nextMode === 'source') {
      this.#closeSlashMenu();
      this.#renderBlockSidebar(null);
      const inlineToolbar = this.querySelector('.page-editor__inline-toolbar');
      if (inlineToolbar) inlineToolbar.hidden = true;
      requestAnimationFrame(() => this.__codeMirror?.refresh());
    } else if (nextMode === 'page') {
      if (this.__selectedBlock) this.#renderBlockSidebar(this.__selectedBlock);
      this.#getActiveBlockBody()?.focus();
    }
  }

  async #formatSource() {
    if (this.__activeMode !== 'source') {
      await this.#setMode('source');
    }
    await ensureHtmlBeautify();
    const editor = await this.#ensureCodeMirror();
    editor.setValue(formatHtmlSource(editor.getValue()));
    this.#setStatus('HTML formatted.');
  }

  async #openPublishDialog() {
    const session = await this.#fetchSession();
    this.#storeSession(session);
    if (!session?.authenticated) {
      this.#setStatus('Sign in with GitHub from the site header before saving changes.', 'error');
      return;
    }

    const { publishDialog, publishForm } = this.#els();
    if (!publishDialog || !publishForm) return;

    const defaultMessage = `Update ${this.#getPageTitle()}`;
    const commitInput = publishForm.elements.namedItem('commit_message');
    const titleInput = publishForm.elements.namedItem('pr_title');
    const bodyInput = publishForm.elements.namedItem('pr_body');
    if (commitInput) commitInput.value = defaultMessage;
    if (titleInput) titleInput.value = defaultMessage;
    if (bodyInput) {
      bodyInput.value = [
        `This update changes \`${this.__sourcePath}\` using the site page editor.`,
        '',
        `Edited by ${session.user?.displayName || session.user?.login || 'a contributor'}.`,
      ].join('\n');
    }

    if (typeof publishDialog.showModal === 'function') publishDialog.showModal();
    else publishDialog.setAttribute('open', 'open');
  }

  #closePublishDialog() {
    const { publishDialog } = this.#els();
    if (publishDialog?.open) publishDialog.close();
    else publishDialog?.removeAttribute('open');
  }

  async #submitPublish() {
    const submitUrl = resolveGitHubApiUrl('github-submit-page-edit.php');
    if (!submitUrl) {
      this.#setStatus('GitHub API base is not configured.', 'error');
      return;
    }

    const { publishForm } = this.#els();
    if (!publishForm) return;

    const submitButton = publishForm.querySelector('[data-action="submit-publish"]');
    if (submitButton) submitButton.disabled = true;
    this.#setStatus('Saving changes…');

    try {
      const publishFiles = this.#buildPublishFiles();
      const fullHtml = publishFiles[0].content;
      const commitMessage = String(publishForm.elements.namedItem('commit_message')?.value || '').trim();
      const prTitle = String(publishForm.elements.namedItem('pr_title')?.value || '').trim();
      const prBody = String(publishForm.elements.namedItem('pr_body')?.value || '').trim();

      const requestBody = {
        path: this.__sourcePath,
        content: fullHtml,
        commit_message: commitMessage,
        pr_title: prTitle,
        pr_body: prBody,
      };
      if (publishFiles.length > 1) {
        requestBody.files = publishFiles;
      }

      // Collect extra publish files from external providers (e.g. infobox
      // editors). Providers should be functions pushed into
      // `window.__extraPublishFileProviders` and return an array of
      // { path, content } objects or [] when nothing to publish.
      if (Array.isArray(window.__extraPublishFileProviders) && window.__extraPublishFileProviders.length) {
        try {
          const extrasArrays = await Promise.all(window.__extraPublishFileProviders.map((fn) => {
            try { return fn(); } catch (e) { console.warn('extra publish provider threw', e); return []; }
          }));
          const extras = extrasArrays.flat().filter(Boolean).map((f) => ({ path: String(f.path || ''), content: String(f.content || '') })).filter((f) => f.path && f.content);
          if (extras.length) {
            requestBody.files = (requestBody.files || []).concat(extras);
          }
        } catch (err) {
          console.warn('Error collecting extra publish files', err);
        }
      }

      const response = await fetch(submitUrl, window.App?.getGitHubFetchInit?.({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }) || {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (!response.ok || !payload?.ok) {
        const message = payload?.message || `Publish failed (${response.status}).`;
        if (payload?.error === 'authentication_required') {
          this.#setStatus('GitHub login is required. Sign in from the site header, then try again.', 'error');
        } else {
          this.#setStatus(message, 'error');
        }
        return;
      }

      this.__originalHtml = fullHtml;
      publishFiles.slice(1).forEach((file) => {
        for (const meta of this.__includeSources.values()) {
          if (meta.path === file.path) {
            meta.original = file.content;
          }
        }
      });

      if (publishFiles.length > 1) {
        // Inline-include mode: the editor baseline is the inlined content.
        this.__originalContentHtml = this.#getSourceHtml();
      } else {
        const publishedRegion = findContentRegion(fullHtml, this.__contentSelector);
        if (publishedRegion) {
          this.__originalContentHtml = publishedRegion.inner;
        }
      }
      this.#setSavedBaseline();
      this.#closePublishDialog();
      const prUrl = payload.pull_request?.url || '';
      const prNumber = payload.pull_request?.number;
      if (prUrl) {
        this.#setStatus(`Pull request #${prNumber} created successfully.`);
        const { status } = this.#els();
        if (status) {
          const returnUrl = this.#els().back?.href || '';
          const pageUrl = window.App?.resolveSiteUrl?.(this.__sourcePath)
            || returnUrl
            || new URL(this.__sourcePath, window.location.href).href;
          const changesUrl = `${String(pageUrl).split('#')[0]}#changes`;
          status.innerHTML = `Pull request <a href="${escapeHtml(prUrl)}" target="_blank" rel="noopener noreferrer">#${escapeHtml(String(prNumber || ''))}</a> created successfully. <a href="${escapeHtml(changesUrl)}">View pending edit</a>`;
          status.hidden = false;
          status.dataset.type = 'success';
        }
      } else {
        this.#setStatus('Changes were committed successfully.');
      }
    } catch (error) {
      console.error(error);
      this.#setStatus(error.message || 'Could not publish changes.', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }
}

if (!customElements.get('page-editor')) {
  customElements.define('page-editor', PageEditor);
}

function resolveEditorPageUrl(sourcePath, returnPath, options = {}) {
  if (window.App?.resolvePageEditUrl) {
    return window.App.resolvePageEditUrl(sourcePath, returnPath, options);
  }

  const cleanSource = normalizeSitePath(sourcePath);
  const cleanReturn = normalizeSitePath(returnPath || cleanSource);
  const editPath = normalizeSitePath('pages/edit.html');
  const url = new URL(editPath, window.location.href);
  url.searchParams.set('source', cleanSource);
  if (cleanReturn) {
    url.searchParams.set('return', cleanReturn);
  }
  const contentSelector = String(options?.contentSelector || '').trim();
  if (contentSelector) {
    url.searchParams.set('content-selector', contentSelector);
  }
  return url.href;
}

window.AppPageEditor = {
  PageEditorElement: PageEditor,
  registerBlockLibrary: (...args) => window.EditorBlocks?.registerLibrary?.(...args),
  resolveSourcePageUrl,
  resolveEditorPageUrl,
  resolvePageEditUrl: resolveEditorPageUrl,
  getEditSourcePath: () => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('source')?.trim();
    if (fromQuery) {
      return fromQuery.replace(/^\/+/, '');
    }
    const editor = document.querySelector('page-editor');
    const fromAttr = editor?.getAttribute('source')?.trim();
    return fromAttr ? fromAttr.replace(/^\/+/, '') : '';
  },
  getCurrentSitePath: () => {
    const path = window.location.pathname.replace(/\\/g, '/');
    const markers = ['pages/', 'people/'];
    for (const marker of markers) {
      const index = path.indexOf(marker);
      if (index !== -1) return path.slice(index);
    }
    return path.replace(/^\//, '');
  },
  isAllowedEditorSource,
};
