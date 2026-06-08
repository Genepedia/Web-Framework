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

const QUILL_VERSION = '2.0.3';
const QUILL_CSS_URL = `https://cdn.jsdelivr.net/npm/quill@${QUILL_VERSION}/dist/quill.snow.css`;
const QUILL_JS_URL = `https://cdn.jsdelivr.net/npm/quill@${QUILL_VERSION}/dist/quill.js`;
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
        <p class="page-editor__unsaved-notice" hidden>Unsaved changes</p>
        <button type="button" class="page-editor__button page-editor__button--save" data-action="publish">
          <i class="bi bi-check2-circle" aria-hidden="true"></i>
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  </header>

  <div class="page-editor__status" role="status" aria-live="polite"></div>

  <div class="page-editor__toolbar-row">
    <div class="page-editor__mode-tabs" role="tablist" aria-label="Editor mode">
      <button type="button" class="page-editor__mode-tab is-active" data-mode="preview" role="tab" aria-selected="true">
        Preview
      </button>
      <button type="button" class="page-editor__mode-tab" data-mode="visual" role="tab" aria-selected="false">
        Visual
      </button>
      <button type="button" class="page-editor__mode-tab" data-mode="source" role="tab" aria-selected="false">
        HTML
      </button>
    </div>
  </div>

  <div class="page-editor__workspace">
    <div class="page-editor__panel page-editor__panel--preview is-active" data-panel="preview">
      <div class="page-editor__preview main-content" aria-label="Page preview"></div>
    </div>
    <div class="page-editor__panel page-editor__panel--visual" data-panel="visual" hidden>
      <div class="page-editor__quill"></div>
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

  <dialog class="page-editor__publish-dialog">
    <form method="dialog" class="page-editor__publish-form">
      <header class="page-editor__publish-header">
        <h2 class="page-editor__publish-title">Save Changes</h2>
        <button type="button" class="page-editor__icon-button" data-action="close-publish" aria-label="Close">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>
      <p class="page-editor__publish-intro">
        Your edits will be committed to a new branch and opened as a GitHub pull request for review.
      </p>
      <label class="page-editor__field">
        <span class="page-editor__field-label">Commit message</span>
        <input type="text" class="page-editor__field-input" name="commit_message" required>
      </label>
      <label class="page-editor__field">
        <span class="page-editor__field-label">Pull request title</span>
        <input type="text" class="page-editor__field-input" name="pr_title" required>
      </label>
      <label class="page-editor__field">
        <span class="page-editor__field-label">Pull request description</span>
        <textarea class="page-editor__field-textarea" name="pr_body" rows="5"></textarea>
      </label>
      <footer class="page-editor__publish-footer">
        <button type="button" class="page-editor__button" data-action="close-publish">Cancel</button>
        <button type="submit" class="page-editor__button page-editor__button--save" data-action="submit-publish">
          Submit changes
        </button>
      </footer>
    </form>
  </dialog>
</div>
`;

let quillLoaderPromise = null;
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
  return /^pages\/[a-zA-Z0-9_./-]+\.html$/.test(normalized);
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

const QUILL_FONT_OPTIONS = [
  'sans-serif',
  'serif',
  'monospace',
  'linux-libertine',
  'arial',
  'georgia',
  'verdana',
];

const QUILL_SIZE_OPTIONS = ['small', false, 'large', 'huge'];

function configureQuillFormats(Quill) {
  if (Quill.__pageEditorConfigured) {
    return;
  }
  Quill.__pageEditorConfigured = true;

  const FontClass = Quill.import('attributors/class/font');
  FontClass.whitelist = QUILL_FONT_OPTIONS;
  Quill.register(FontClass, true);

  const SizeClass = Quill.import('attributors/class/size');
  SizeClass.whitelist = QUILL_SIZE_OPTIONS.filter(Boolean);
  Quill.register(SizeClass, true);
}

function createQuillToolbarConfig() {
  return {
    container: [
      [{ header: [2, 3, false] }],
      [{ font: QUILL_FONT_OPTIONS }],
      [{ size: QUILL_SIZE_OPTIONS }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'blockquote'],
      ['clean'],
    ],
    handlers: {
      image() {
        const url = window.prompt('Enter the image URL');
        if (!url?.trim()) {
          return;
        }

        const trimmed = url.trim();
        try {
          new URL(trimmed, window.location.href);
        } catch (error) {
          window.alert('Please enter a valid image URL.');
          return;
        }

        const range = this.quill.getSelection(true);
        this.quill.insertEmbed(range.index, 'image', trimmed, 'user');
        this.quill.setSelection(range.index + 1);
      },
    },
  };
}

function ensureQuill() {
  if (window.Quill) {
    configureQuillFormats(window.Quill);
    return Promise.resolve(window.Quill);
  }
  if (!quillLoaderPromise) {
    quillLoaderPromise = loadStylesheet(QUILL_CSS_URL, 'page-editor-quill-theme')
      .then(() => loadScript(QUILL_JS_URL))
      .then(() => {
        configureQuillFormats(window.Quill);
        return window.Quill;
      });
  }
  return quillLoaderPromise;
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

function extractPageContent(html, contentSelector) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const region = findContentRegion(html, contentSelector);
  const container = doc.querySelector(contentSelector) || doc.querySelector('main');
  return {
    title: extractPageTitle(doc),
    content: region?.inner ?? container?.innerHTML ?? '',
    document: doc,
  };
}

function findContentRegion(html, contentSelector) {
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

function blockFingerprint(element) {
  const tag = element.tagName.toLowerCase();
  const text = (element.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${tag}:${text}`;
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

function findSimpleElementEnd(source, openIdx, tag) {
  const closeTag = `</${tag}>`;
  const closeIdx = source.indexOf(closeTag, openIdx);
  if (closeIdx === -1) {
    return -1;
  }
  return closeIdx + closeTag.length;
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

    const endIdx = findSimpleElementEnd(source, openIdx, tag);
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
    return ['source', 'return', 'content-selector', 'title'];
  }

  connectedCallback() {
    if (this.__rendered) return;
    this.__rendered = true;
    this.innerHTML = PAGE_EDITOR_TEMPLATE;
    this.__quill = null;
    this.__codeMirror = null;
    this.__originalHtml = '';
    this.__originalContentHtml = '';
    this.__sourcePath = '';
    this.__pageTitle = 'Page';
    this.__savedPageTitle = '';
    this.__savedContentHtml = '';
    this.__session = null;
    this.__activeMode = 'preview';
    this.__dirty = false;
    this.__syncing = false;
    this.__visualSyncTimer = null;
    this.__sourceSyncTimer = null;
    this.__contentSelector = this.getAttribute('content-selector')?.trim() || '.main-content';
    this.__beforeUnloadHandler = null;
    this.__navigationClickHandler = null;
    this.#bindUi();
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
  }

  attributeChangedCallback() {
    if (this.__rendered) void this.#init();
  }

  #bindUi() {
    const root = this.querySelector('.page-editor');
    if (!root) return;

    root.addEventListener('click', (event) => {
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
    });

    const publishForm = this.querySelector('.page-editor__publish-form');
    publishForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.#submitPublish();
    });

    this.#els().titleInput?.addEventListener('input', () => {
      this.__pageTitle = this.#getPageTitle();
      document.title = `Edit ${this.__pageTitle}`;
      this.#updateDirtyState();
      if (this.__activeMode === 'preview') {
        this.#updatePreviewPanel();
      }
    });
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
    if (this.__visualSyncTimer) {
      clearTimeout(this.__visualSyncTimer);
      this.__visualSyncTimer = null;
      this.#syncVisualToSource();
    }
    if (this.__sourceSyncTimer) {
      clearTimeout(this.__sourceSyncTimer);
      this.__sourceSyncTimer = null;
      this.#syncSourceToVisual();
    }
  }

  #setSavedBaseline() {
    this.#flushPendingSync();
    this.__savedPageTitle = this.#getPageTitle();
    this.__savedContentHtml = this.__originalContentHtml || this.#getVisualHtml();
    this.#setDirty(false);
  }

  #updateDirtyState() {
    if (!this.__quill) {
      this.#setDirty(false);
      return;
    }

    if (this.__visualSyncTimer) {
      clearTimeout(this.__visualSyncTimer);
      this.__visualSyncTimer = null;
      this.#syncVisualToSource();
    }
    if (this.__sourceSyncTimer) {
      clearTimeout(this.__sourceSyncTimer);
      this.__sourceSyncTimer = null;
    }
    if (this.__activeMode === 'source' && this.__codeMirror) {
      this.#syncSourceToVisual();
    }

    const titleChanged = this.#getPageTitle() !== this.__savedPageTitle;
    const mergedContent = mergeContentPreservingUnchanged(
      this.__originalContentHtml || this.__savedContentHtml,
      this.#getSourceHtml(),
    );
    const contentChanged = mergedContent !== (this.__originalContentHtml || this.__savedContentHtml);
    this.#setDirty(titleChanged || contentChanged);
  }

  #confirmLeaveWithoutSaving() {
    return window.confirm(
      'You have unsaved changes on this page. Leave without saving?',
    );
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

      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:')) return;

      if (link.closest('.page-editor__publish-dialog')) return;

      try {
        const nextUrl = new URL(link.href, window.location.href);
        const currentUrl = new URL(window.location.href);
        if (nextUrl.origin === currentUrl.origin
          && nextUrl.pathname === currentUrl.pathname
          && nextUrl.search === currentUrl.search) {
          return;
        }
      } catch (error) {
        return;
      }

      if (!this.#confirmLeaveWithoutSaving()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', this.__navigationClickHandler, true);
  }

  #els() {
    return {
      back: this.querySelector('.page-editor__back'),
      titleInput: this.querySelector('.page-editor__title-input'),
      source: this.querySelector('.page-editor__source code'),
      status: this.querySelector('.page-editor__status'),
      quillMount: this.querySelector('.page-editor__quill'),
      codeMount: this.querySelector('.page-editor__codemirror'),
      unsavedNotice: this.querySelector('.page-editor__unsaved-notice'),
      visualPanel: this.querySelector('[data-panel="visual"]'),
      sourcePanel: this.querySelector('[data-panel="source"]'),
      previewPanel: this.querySelector('[data-panel="preview"]'),
      previewBody: this.querySelector('.page-editor__preview'),
      modeTabs: [...this.querySelectorAll('.page-editor__mode-tab')],
      publishDialog: this.querySelector('.page-editor__publish-dialog'),
      publishForm: this.querySelector('.page-editor__publish-form'),
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
      const response = await fetch(sessionUrl, { credentials: 'include' });
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
    const { back, titleInput, source, quillMount } = this.#els();

    if (!sourcePath || !isAllowedEditorSource(sourcePath)) {
      if (quillMount) {
        quillMount.innerHTML = '<p class="page-editor__error">A valid <code>source</code> page path is required, for example <code>pages/privacy_policy.html</code>.</p>';
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
      this.__originalContentHtml = extracted.content;
      this.__pageTitle = titleOverride || formatPageTitle(sourcePath, extracted.title);
      if (titleInput) titleInput.value = this.__pageTitle;
      document.title = `Edit ${this.__pageTitle}`;

      const Quill = await ensureQuill();
      if (!this.__quill) {
        this.__quill = new Quill(quillMount, {
          theme: 'snow',
          modules: {
            toolbar: createQuillToolbarConfig(),
          },
        });
        this.__quill.on('text-change', () => {
          if (this.__syncing) return;
          this.#updateDirtyState();
          this.#scheduleVisualSync();
        });
      }

      this.__quill.root.classList.add('page-editor__document');
      this.__quill.clipboard.dangerouslyPasteHTML(extracted.content || '<p></p>');
      this.#setSavedBaseline();
      this.#updatePreviewPanel();
      this.#setStatus('Edit the page title, preview your changes, or switch to Visual or HTML. Save Changes submits them for review on GitHub.');
    } catch (error) {
      console.error(error);
      if (quillMount) {
        quillMount.innerHTML = `<p class="page-editor__error">${escapeHtml(error.message || 'Could not load this page.')}</p>`;
      }
      this.#setStatus(error.message || 'Could not load this page.', 'error');
    }
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
      this.#updateDirtyState();
    });
    return this.__codeMirror;
  }

  #scheduleVisualSync() {
    if (this.__visualSyncTimer) clearTimeout(this.__visualSyncTimer);
    this.__visualSyncTimer = setTimeout(() => {
      this.__visualSyncTimer = null;
      this.#syncVisualToSource();
    }, 200);
  }

  #scheduleSourceSync() {
    if (this.__sourceSyncTimer) clearTimeout(this.__sourceSyncTimer);
    this.__sourceSyncTimer = setTimeout(() => {
      this.__sourceSyncTimer = null;
      this.#syncSourceToVisual();
    }, 200);
  }

  #syncVisualToSource() {
    if (this.__syncing || !this.__quill || !this.__codeMirror) return;
    const html = this.#getVisualHtml();
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

  #syncSourceToVisual() {
    if (this.__syncing || !this.__quill || !this.__codeMirror) return;
    const html = this.__codeMirror.getValue() || '<p></p>';
    if (this.#getVisualHtml() === html.trim()) return;

    this.__syncing = true;
    try {
      this.__quill.clipboard.dangerouslyPasteHTML(html);
    } finally {
      this.__syncing = false;
    }
  }

  #flushEditorSync() {
    if (this.__visualSyncTimer) {
      clearTimeout(this.__visualSyncTimer);
      this.__visualSyncTimer = null;
    }
    if (this.__sourceSyncTimer) {
      clearTimeout(this.__sourceSyncTimer);
      this.__sourceSyncTimer = null;
    }
    if (this.__activeMode === 'source') {
      this.#syncSourceToVisual();
    } else if (this.__activeMode === 'visual') {
      this.#syncVisualToSource();
    }
  }

  #getPageTitle() {
    const value = this.#els().titleInput?.value?.trim();
    return value || this.__pageTitle || 'Page';
  }

  #getVisualHtml() {
    return this.__quill ? this.__quill.root.innerHTML.trim() : '';
  }

  #getSourceHtml() {
    if (this.__activeMode !== 'preview') {
      this.#flushEditorSync();
    }
    if (this.__activeMode === 'source' && this.__codeMirror) {
      return this.__codeMirror.getValue().trim();
    }
    return this.#getVisualHtml();
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

  async #setMode(mode) {
    const nextMode = mode === 'source' ? 'source' : mode === 'preview' ? 'preview' : 'visual';
    const { visualPanel, sourcePanel, previewPanel, modeTabs } = this.#els();

    this.#flushEditorSync();

    if (nextMode === 'source') {
      await ensureHtmlBeautify();
      const editor = await this.#ensureCodeMirror();
      this.__syncing = true;
      try {
        editor.setValue(formatHtmlSource(this.#getVisualHtml()));
      } finally {
        this.__syncing = false;
      }
      editor.refresh();
    } else if (nextMode === 'visual' && this.__activeMode === 'source' && this.__codeMirror) {
      this.#syncSourceToVisual();
    }

    this.__activeMode = nextMode;
    modeTabs.forEach((tab) => {
      const isActive = tab.dataset.mode === nextMode;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    visualPanel?.classList.toggle('is-active', nextMode === 'visual');
    sourcePanel?.classList.toggle('is-active', nextMode === 'source');
    previewPanel?.classList.toggle('is-active', nextMode === 'preview');
    if (visualPanel) visualPanel.hidden = nextMode !== 'visual';
    if (sourcePanel) sourcePanel.hidden = nextMode !== 'source';
    if (previewPanel) previewPanel.hidden = nextMode !== 'preview';

    if (nextMode === 'source') {
      requestAnimationFrame(() => this.__codeMirror?.refresh());
    } else if (nextMode === 'preview') {
      this.#updatePreviewPanel();
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

  #updatePreviewPanel() {
    const { previewBody } = this.#els();
    if (!previewBody) return;
    const pageTitle = escapeHtml(this.#getPageTitle());
    previewBody.innerHTML = `<h1 class="page-editor__preview-heading">${pageTitle}</h1>${this.#getSourceHtml()}`;
    try {
      window.App?.applyBranding?.(previewBody);
    } catch (error) {
      // ignore
    }
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
        `This pull request updates \`${this.__sourcePath}\` using the site page editor.`,
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
    this.#setStatus('Creating branch, commit, and pull request…');

    try {
      const fullHtml = this.#buildFullPageHtml();
      const commitMessage = String(publishForm.elements.namedItem('commit_message')?.value || '').trim();
      const prTitle = String(publishForm.elements.namedItem('pr_title')?.value || '').trim();
      const prBody = String(publishForm.elements.namedItem('pr_body')?.value || '').trim();

      const response = await fetch(submitUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: this.__sourcePath,
          content: fullHtml,
          commit_message: commitMessage,
          pr_title: prTitle,
          pr_body: prBody,
        }),
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
      const publishedRegion = findContentRegion(fullHtml, this.__contentSelector);
      if (publishedRegion) {
        this.__originalContentHtml = publishedRegion.inner;
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
        this.#setStatus('Changes were published successfully.');
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

window.AppPageEditor = {
  resolveSourcePageUrl,
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
