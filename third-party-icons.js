(function () {
    "use strict";

    if (typeof window === "undefined") {
        return;
    }

    const REGISTRY_GLOBAL_NAME = "AppThirdPartyIconRegistryData";
    const REGISTRY_URL = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json";
    const ICONS_CDN_ROOT = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/";
    const PACKAGE_URL = "https://www.jsdelivr.com/package/gh/glincker/thesvg";
    const DEFAULT_VARIANT_FALLBACKS = [
        "default", "color", "mono", "light", "dark", "wordmark", "wordmarkLight", "wordmarkDark",
    ];
    const SLUG_ALIASES = Object.freeze({
        twitter: "x",
        xtwitter: "x",
        devto: "devdotto",
    });
    const KNOWN_TLDS = new Set([
        "ai", "app", "as", "at", "bg", "chat", "co", "com", "css", "cv", "de", "dev",
        "fm", "fyi", "gg", "io", "it", "js", "lv", "me", "ms", "net", "org", "page",
        "rs", "sc", "sh", "ts", "tv", "ws",
    ]);

    let registryLoadPromise = null;
    let cachedRegistrySource = null;
    let cachedRegistry = null;
    let cachedEntryMap = null;
    let cachedLookupMap = null;

    function stripDiacritics(value) {
        return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function normalizedPhrase(value) {
        const raw = stripDiacritics(String(value || "").trim().toLowerCase());
        if (!raw) return "";
        const aliased = SLUG_ALIASES[raw] || raw;
        return aliased
            .replace(/&/g, " and ")
            .replace(/\+/g, " plus ")
            .replace(/\./g, " dot ")
            .replace(/[’']/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function hyphenatedSlug(value) {
        return normalizedPhrase(value).replace(/\s+/g, "-");
    }

    function compactSlugKey(value) {
        return normalizedPhrase(value).replace(/\s+/g, "");
    }

    function normalizeHexColor(hex) {
        if (typeof hex !== "string") {
            return "";
        }

        let normalized = hex.trim().replace(/^#/, "");
        if (!normalized) {
            return "";
        }

        if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
            normalized = normalized.split("").map((char) => `${char}${char}`).join("");
        }

        return /^[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toUpperCase() : "";
    }

    function normalizeScheme(value) {
        const normalized = String(value || "").trim().toLowerCase();
        return normalized === "dark" || normalized === "light" ? normalized : "";
    }

    function inferDocumentScheme() {
        const explicit = normalizeScheme(
            document.documentElement?.dataset?.iconScheme
            || document.body?.dataset?.iconScheme
            || ""
        );
        if (explicit) {
            return explicit;
        }
        if (document.documentElement?.classList?.contains("theme-dark") || document.body?.classList?.contains("theme-dark")) {
            return "dark";
        }
        if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    }

    function isLightHexColor(hex, threshold = 160) {
        const normalized = normalizeHexColor(hex);
        if (!normalized) {
            return true;
        }

        const red = parseInt(normalized.slice(0, 2), 16);
        const green = parseInt(normalized.slice(2, 4), 16);
        const blue = parseInt(normalized.slice(4, 6), 16);
        const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
        return brightness >= threshold;
    }

    function uniqueStrings(values) {
        const seen = new Set();
        return (Array.isArray(values) ? values : [])
            .map((value) => String(value || "").trim())
            .filter(Boolean)
            .filter((value) => {
                const key = value.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    }

    function formatToken(token) {
        if (!token) return "";

        if (token.includes(".")) {
            return token
                .split(".")
                .map((segment, index) => {
                    if (!segment) return "";
                    if (index > 0 && KNOWN_TLDS.has(segment.toLowerCase())) {
                        return segment.toLowerCase();
                    }
                    if (segment.length <= 3) {
                        return segment.toUpperCase();
                    }
                    return segment.charAt(0).toUpperCase() + segment.slice(1);
                })
                .join(".");
        }

        if (/^[0-9.+&-]+$/.test(token)) {
            return token;
        }

        if (token.length <= 3 && /^[a-z0-9.+&-]+$/i.test(token)) {
            return token.toUpperCase();
        }

        return token.charAt(0).toUpperCase() + token.slice(1);
    }

    function deriveIconNameFromSlug(slug) {
        const normalized = String(slug || "").trim();
        if (!normalized) return "";

        const label = normalized
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .replace(/dotjs/g, ".js")
            .replace(/dotio/g, ".io")
            .replace(/dotcom/g, ".com")
            .replace(/dotorg/g, ".org")
            .replace(/dotnet/g, ".net")
            .replace(/dotrs/g, ".rs")
            .replace(/dotgg/g, ".gg")
            .replace(/dotcv/g, ".cv")
            .replace(/dotde/g, ".de")
            .replace(/dotas/g, ".as")
            .replace(/dotat/g, ".at")
            .replace(/dotco/g, ".co")
            .replace(/dotsh/g, ".sh")
            .replace(/dotlv/g, ".lv")
            .replace(/dotai/g, ".ai")
            .replace(/dotfm/g, ".fm")
            .replace(/dottv/g, ".tv")
            .replace(/dotme/g, ".me")
            .replace(/([0-9])([a-z])/gi, "$1 $2")
            .replace(/([a-z])([0-9])/gi, "$1 $2")
            .replace(/\s+/g, " ")
            .trim();

        return label
            .split(" ")
            .filter(Boolean)
            .map(formatToken)
            .join(" ");
    }

    function normalizeVariantMap(variants, slug) {
        if (!variants) {
            return slug ? { default: `/icons/${slug}/default.svg` } : {};
        }

        if (Array.isArray(variants)) {
            const map = {};
            variants.forEach((variant) => {
                const key = String(variant || "").trim();
                if (!key || !slug) return;
                map[key] = `/icons/${slug}/${key}.svg`;
            });
            return map;
        }

        if (typeof variants !== "object") {
            return slug ? { default: `/icons/${slug}/default.svg` } : {};
        }

        return Object.fromEntries(
            Object.entries(variants)
                .map(([key, value]) => [String(key || "").trim(), String(value || "").trim()])
                .filter(([key, value]) => key && value)
        );
    }

    function normalizeRegistryEntry(entry) {
        if (!entry || typeof entry !== "object") {
            return null;
        }

        const slug = String(entry.slug || entry.id || entry.name || "").trim().toLowerCase();
        if (!slug) {
            return null;
        }

        return {
            slug,
            title: String(entry.title || entry.name || deriveIconNameFromSlug(slug)).trim() || deriveIconNameFromSlug(slug),
            aliases: uniqueStrings(entry.aliases),
            categories: uniqueStrings(entry.categories),
            hex: normalizeHexColor(entry.hex || entry.color || ""),
            url: String(entry.url || "").trim(),
            license: String(entry.license || "").trim(),
            dateAdded: String(entry.dateAdded || "").trim(),
            collection: String(entry.collection || "").trim(),
            variants: normalizeVariantMap(entry.variants, slug),
        };
    }

    function cloneRegistryEntries(entries) {
        return entries.map((entry) => ({
            ...entry,
            aliases: [...(entry.aliases || [])],
            categories: [...(entry.categories || [])],
            variants: { ...(entry.variants || {}) },
        }));
    }

    function readRegistryEntries() {
        if (Array.isArray(window[REGISTRY_GLOBAL_NAME])) {
            return window[REGISTRY_GLOBAL_NAME];
        }
        return [];
    }

    function storeRegistryEntries(entries) {
        const normalized = cloneRegistryEntries((Array.isArray(entries) ? entries : [])
            .map((entry) => normalizeRegistryEntry(entry))
            .filter(Boolean));
        window[REGISTRY_GLOBAL_NAME] = normalized;
    }

    function invalidateRegistryCache() {
        cachedRegistrySource = null;
        cachedRegistry = null;
        cachedEntryMap = null;
        cachedLookupMap = null;
    }

    function getRegistry() {
        const source = readRegistryEntries();
        if (source === cachedRegistrySource && cachedRegistry) {
            return cachedRegistry;
        }

        const entries = cloneRegistryEntries(source.map((entry) => normalizeRegistryEntry(entry)).filter(Boolean));
        cachedRegistrySource = source;
        cachedRegistry = entries;
        cachedEntryMap = null;
        cachedLookupMap = null;
        return entries;
    }

    async function ensureColorData() {
        const existing = getRegistry();
        if (existing.length) {
            return existing;
        }

        if (registryLoadPromise) {
            return registryLoadPromise;
        }

        if (typeof fetch !== "function") {
            return existing;
        }

        registryLoadPromise = fetch(REGISTRY_URL, { cache: "force-cache", mode: "cors" })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Could not load third-party icon registry (${response.status})`);
                }
                const payload = await response.json().catch(() => []);
                const entries = (Array.isArray(payload) ? payload : [])
                    .map((entry) => normalizeRegistryEntry(entry))
                    .filter(Boolean);
                storeRegistryEntries(entries);
                invalidateRegistryCache();
                return getRegistry();
            })
            .catch((error) => {
                registryLoadPromise = null;
                throw error;
            });

        return registryLoadPromise;
    }

    function getEntryMap() {
        if (cachedEntryMap) {
            return cachedEntryMap;
        }
        cachedEntryMap = new Map(getRegistry().map((entry) => [entry.slug, entry]));
        return cachedEntryMap;
    }

    function addLookupKey(map, value, slug) {
        const raw = stripDiacritics(String(value || "").trim().toLowerCase());
        if (!raw) {
            return;
        }
        if (!map.has(raw)) {
            map.set(raw, slug);
        }
        const hyphenated = hyphenatedSlug(raw);
        if (hyphenated && !map.has(hyphenated)) {
            map.set(hyphenated, slug);
        }
        const compact = compactSlugKey(raw);
        if (compact && !map.has(compact)) {
            map.set(compact, slug);
        }
    }

    function getLookupMap() {
        if (cachedLookupMap) {
            return cachedLookupMap;
        }

        const map = new Map();
        getRegistry().forEach((entry) => {
            addLookupKey(map, entry.slug, entry.slug);
            addLookupKey(map, entry.title, entry.slug);
            entry.aliases.forEach((alias) => addLookupKey(map, alias, entry.slug));
        });
        cachedLookupMap = map;
        return cachedLookupMap;
    }

    function resolveRegisteredSlug(value) {
        const raw = stripDiacritics(String(value || "").trim().toLowerCase());
        if (!raw) {
            return "";
        }
        const entryMap = getEntryMap();
        if (entryMap.has(raw)) {
            return raw;
        }

        const lookupMap = getLookupMap();
        return lookupMap.get(raw) || lookupMap.get(hyphenatedSlug(raw)) || lookupMap.get(compactSlugKey(raw)) || "";
    }

    function normalizeSlug(value) {
        const raw = stripDiacritics(String(value || "").trim().toLowerCase());
        if (!raw) return "";
        return resolveRegisteredSlug(raw) || hyphenatedSlug(raw);
    }

    function getIconEntry(slug) {
        const resolved = normalizeSlug(slug);
        if (!resolved) return null;
        return getEntryMap().get(resolved) || null;
    }

    function resolveRemoteIconUrl(path) {
        const cleanPath = String(path || "").trim();
        if (!cleanPath) {
            return "";
        }
        if (/^[a-z]+:/i.test(cleanPath)) {
            return cleanPath;
        }
        return new URL(cleanPath.replace(/^\/+/, ""), ICONS_CDN_ROOT).href;
    }

    function isLikelyLightOnlyDefault(entry) {
        const hex = normalizeHexColor(entry?.hex || "");
        const defaultPath = String(entry?.variants?.default || "");
        return hex === "FFFFFF" && /\/default\.svg(?:$|[?#])/.test(defaultPath);
    }

    function previewVariantCandidates(entry, options = {}) {
        const scheme = normalizeScheme(options.scheme || options.colorScheme || options.surfaceScheme || "") || inferDocumentScheme();
        const defaultPath = String(entry?.variants?.default || "");
        const candidates = [];

        if (scheme === "dark") {
            if (entry?.variants?.dark) {
                candidates.push("dark");
            }
            if (/\/mono\.svg(?:$|[?#])/.test(defaultPath) && entry?.variants?.light) {
                candidates.push("light");
            }
            candidates.push("default", "color", "mono", "light");
            return candidates;
        }

        if (entry?.variants?.light) {
            candidates.push("light");
        }
        if (isLikelyLightOnlyDefault(entry) && entry?.variants?.mono) {
            candidates.push("mono");
        }
        candidates.push("default", "color", "mono", "dark");
        return candidates;
    }

    function resolveVariant(entry, requestedVariant = "", options = {}) {
        const variants = entry && typeof entry.variants === "object" ? entry.variants : {};
        const requested = String(requestedVariant || "").trim();
        if (requested && variants[requested]) {
            return { name: requested, path: variants[requested] };
        }

        const candidateNames = entry
            ? previewVariantCandidates(entry, options)
            : DEFAULT_VARIANT_FALLBACKS;

        for (const variantName of candidateNames) {
            if (variants[variantName]) {
                return { name: variantName, path: variants[variantName] };
            }
        }

        for (const variantName of DEFAULT_VARIANT_FALLBACKS) {
            if (variants[variantName]) {
                return { name: variantName, path: variants[variantName] };
            }
        }

        const first = Object.entries(variants)[0];
        return first ? { name: first[0], path: first[1] } : { name: requested || "default", path: "" };
    }

    function getIconUrl(slug, options = {}) {
        const resolved = normalizeSlug(slug);
        if (!resolved) return "";

        const entry = getIconEntry(resolved);
        if (!entry) {
            return resolveRemoteIconUrl(`icons/${resolved}/${String(options.variant || "default")}.svg`);
        }

        return resolveRemoteIconUrl(resolveVariant(entry, options.variant, options).path);
    }

    function getIconHex(slug) {
        return getIconEntry(slug)?.hex || "";
    }

    function getIconName(slug) {
        const entry = getIconEntry(slug);
        return entry?.title || deriveIconNameFromSlug(normalizeSlug(slug));
    }

    function getIconMeta(slug, options = {}) {
        const normalized = normalizeSlug(slug);
        const entry = getIconEntry(normalized);
        const variant = resolveVariant(entry, options.variant, options);
        const hex = entry?.hex || "";
        const url = entry ? resolveRemoteIconUrl(variant.path) : getIconUrl(normalized, options);

        return {
            id: normalized,
            slug: normalized,
            name: entry?.title || deriveIconNameFromSlug(normalized),
            title: entry?.title || deriveIconNameFromSlug(normalized),
            hex,
            url,
            src: url,
            variant: variant.name,
            variants: Object.keys(entry?.variants || {}),
            aliases: [...(entry?.aliases || [])],
            categories: [...(entry?.categories || [])],
            homepageUrl: entry?.url || "",
            license: entry?.license || "",
            dateAdded: entry?.dateAdded || "",
            collection: entry?.collection || "",
            backgroundColor: hex ? `#${hex}` : "",
            invertOnBrandBackground: Boolean(hex) && !isLightHexColor(hex),
        };
    }

    function listIcons() {
        return getRegistry().map((entry) => getIconMeta(entry.slug));
    }

    function findIcons(query, { limit = 40 } = {}) {
        const text = String(query || "").trim().toLowerCase();
        if (!text) {
            return listIcons().slice(0, limit);
        }
        const compact = compactSlugKey(text);
        return listIcons()
            .filter((icon) => {
                const haystack = [
                    icon.slug,
                    icon.name,
                    ...(icon.aliases || []),
                    ...(icon.categories || []),
                ].join(" ").toLowerCase();
                return haystack.includes(text) || compactSlugKey(haystack).includes(compact);
            })
            .slice(0, limit);
    }

    async function fetchIconSvg(slug, options = {}) {
        const meta = getIconMeta(slug, options);
        if (!meta.url) {
            return "";
        }
        const response = await fetch(meta.url, { cache: "force-cache", mode: "cors", credentials: "omit" });
        if (!response.ok) {
            throw new Error(`Could not fetch icon ${meta.slug}`);
        }
        return response.text();
    }

    function joinClasses(...values) {
        return values
            .flatMap((value) => String(value || "").split(/\s+/))
            .map((value) => value.trim())
            .filter(Boolean)
            .join(" ");
    }

    function normalizeCssSize(value) {
        if (value === null || value === undefined || value === "") {
            return "";
        }
        if (typeof value === "number" && Number.isFinite(value)) {
            return `${value}px`;
        }
        return String(value).trim();
    }

    function resolveBadgeHex(meta, options = {}) {
        return normalizeHexColor(options.backgroundColor || (options.useBrandBackground ? meta.hex : ""));
    }

    function applyImageAttributes(image, slug, options = {}) {
        if (!(image instanceof HTMLImageElement)) {
            return image;
        }

        const meta = getIconMeta(slug, options);
        const size = normalizeCssSize(options.size || options.width || options.height);
        const badgeHex = resolveBadgeHex(meta, options);
        const shouldInvert = options.forceInvert === true
            || (options.forceInvert !== false && badgeHex && !isLightHexColor(badgeHex));

        image.src = options.src || meta.src;
        image.alt = options.decorative === false
            ? String(options.alt || `${meta.name || meta.slug} icon`)
            : "";
        image.decoding = options.decoding || "async";
        image.loading = options.loading || "lazy";
        image.dataset.iconSlug = meta.slug;
        if (meta.hex) {
            image.dataset.iconHex = meta.hex;
        }
        if (options.decorative === false) {
            image.removeAttribute("aria-hidden");
        } else {
            image.setAttribute("aria-hidden", "true");
        }
        if (options.title || (options.decorative === false && meta.name)) {
            image.title = String(options.title || meta.name);
        }
        if (size) {
            image.style.width = size;
            image.style.height = size;
            if (/^\d+(?:\.\d+)?px$/.test(size)) {
                image.width = Number(size.replace(/px$/, ""));
                image.height = Number(size.replace(/px$/, ""));
            }
        }
        image.style.objectFit = "contain";
        image.style.filter = shouldInvert ? "invert(1)" : "";
        image.className = joinClasses("app-third-party-icon__image", options.className || options.imgClassName);
        return image;
    }

    function createIconImage(slug, options = {}) {
        if (typeof document === "undefined") {
            return null;
        }
        return applyImageAttributes(document.createElement("img"), slug, options);
    }

    function createIconBadge(slug, options = {}) {
        if (typeof document === "undefined") {
            return null;
        }

        const meta = getIconMeta(slug, options);
        const badgeHex = resolveBadgeHex(meta, options);
        const wrapper = document.createElement("span");
        wrapper.dataset.iconSlug = meta.slug;
        wrapper.className = joinClasses(
            "app-third-party-icon",
            badgeHex ? "app-third-party-icon--badged" : "",
            options.wrapperClassName || options.className
        );
        wrapper.style.display = "inline-flex";
        wrapper.style.alignItems = "center";
        wrapper.style.justifyContent = "center";
        wrapper.style.lineHeight = "1";
        if (badgeHex) {
            wrapper.style.backgroundColor = `#${badgeHex}`;
            wrapper.style.padding = String(options.padding ?? "0.35em");
            wrapper.style.borderRadius = String(options.borderRadius ?? "0.35em");
        }

        const image = createIconImage(slug, {
            ...options,
            className: options.imgClassName,
            useBrandBackground: Boolean(badgeHex),
            backgroundColor: badgeHex,
        });
        if (image) {
            wrapper.append(image);
        }
        return wrapper;
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }[char]));
    }

    function renderIconHtml(slug, options = {}) {
        const meta = getIconMeta(slug, options);
        const size = normalizeCssSize(options.size || 24);
        const badgeHex = resolveBadgeHex(meta, options);
        const shouldInvert = options.forceInvert === true
            || (options.forceInvert !== false && badgeHex && !isLightHexColor(badgeHex));
        const wrapperClasses = joinClasses(
            "app-third-party-icon",
            badgeHex ? "app-third-party-icon--badged" : "",
            options.wrapperClassName || options.className
        );
        const imageClasses = joinClasses(
            "app-third-party-icon__image",
            shouldInvert ? "is-invert" : "",
            options.imgClassName
        );
        const wrapperStyle = [
            "display:inline-flex",
            "align-items:center",
            "justify-content:center",
            "line-height:1",
            badgeHex ? `background-color:#${escapeHtml(badgeHex)}` : "",
            badgeHex ? `padding:${escapeHtml(String(options.padding ?? "0.35em"))}` : "",
            badgeHex ? `border-radius:${escapeHtml(String(options.borderRadius ?? "0.35em"))}` : "",
        ].filter(Boolean).join(";");
        const imageStyle = [
            size ? `width:${escapeHtml(size)}` : "",
            size ? `height:${escapeHtml(size)}` : "",
            shouldInvert ? "filter:invert(1)" : "",
            "object-fit:contain",
        ].filter(Boolean).join(";");
        const alt = options.decorative === false
            ? escapeHtml(options.alt || `${meta.name || meta.slug} icon`)
            : "";
        const titleAttr = options.title || (options.decorative === false && meta.name)
            ? ` title="${escapeHtml(options.title || meta.name)}"`
            : "";
        const ariaHiddenAttr = options.decorative === false ? "" : ' aria-hidden="true"';

        return `<span class="${escapeHtml(wrapperClasses)}" data-icon-slug="${escapeHtml(meta.slug)}" style="${wrapperStyle}"><img src="${escapeHtml(options.src || meta.src)}" alt="${alt}" class="${escapeHtml(imageClasses)}" style="${imageStyle}"${titleAttr}${ariaHiddenAttr}></span>`;
    }

    function registerColorData(entries, { merge = true } = {}) {
        const bySlug = new Map(
            (merge ? getRegistry() : []).map((entry) => [entry.slug, {
                ...entry,
                aliases: [...entry.aliases],
                categories: [...entry.categories],
                variants: { ...entry.variants },
            }])
        );

        if (Array.isArray(entries)) {
            entries.forEach((entry) => {
                if (Array.isArray(entry)) {
                    const slug = normalizeSlug(entry[0]);
                    if (!slug) return;
                    const current = bySlug.get(slug) || normalizeRegistryEntry({
                        slug,
                        hex: entry[1],
                        variants: { default: `/icons/${slug}/default.svg` },
                    });
                    current.hex = normalizeHexColor(entry[1] || "");
                    bySlug.set(slug, current);
                    return;
                }

                if (entry && typeof entry === "object") {
                    const slug = normalizeSlug(entry.slug || entry.id || entry.name || "");
                    if (!slug) return;
                    const current = bySlug.get(slug) || normalizeRegistryEntry({
                        slug,
                        title: entry.title || entry.name || slug,
                        variants: entry.variants || { default: `/icons/${slug}/default.svg` },
                    });
                    bySlug.set(slug, normalizeRegistryEntry({
                        ...current,
                        ...entry,
                        slug,
                        aliases: uniqueStrings([...(current?.aliases || []), ...(Array.isArray(entry.aliases) ? entry.aliases : [])]),
                        categories: uniqueStrings([...(current?.categories || []), ...(Array.isArray(entry.categories) ? entry.categories : [])]),
                        variants: {
                            ...(current?.variants || {}),
                            ...normalizeVariantMap(entry.variants, slug),
                        },
                    }));
                }
            });
        }

        const next = Array.from(bySlug.values()).map((entry) => normalizeRegistryEntry(entry)).filter(Boolean);
        storeRegistryEntries(next);
        invalidateRegistryCache();
        return getRegistry();
    }

    const api = {
        DATA_GLOBAL_NAME: REGISTRY_GLOBAL_NAME,
        REGISTRY_GLOBAL_NAME,
        DATA_FILE_URL: REGISTRY_URL,
        REGISTRY_URL,
        PACKAGE_URL,
        ICONS_BASE_URL: resolveRemoteIconUrl("icons/"),
        inferDocumentScheme,
        whenReady: () => ensureColorData().then(() => api),
        ensureColorData,
        normalizeSlug,
        resolveSlug: normalizeSlug,
        normalizeHexColor,
        isLightHexColor,
        registerColorData,
        getIconUrl,
        getIconHex,
        getIconName,
        getIconMeta,
        getIconMetaAsync: async (slug, options) => {
            await ensureColorData();
            return getIconMeta(slug, options);
        },
        listIcons,
        listIconsAsync: async () => {
            await ensureColorData();
            return listIcons();
        },
        findIcons,
        findIconsAsync: async (query, options) => {
            await ensureColorData();
            return findIcons(query, options);
        },
        fetchIconSvg,
        applyImageAttributes,
        createIconImage,
        createIconBadge,
        renderIconHtml,
    };

    window.AppThirdPartyIcons = api;
    window.App = (window.App && typeof window.App === "object") ? window.App : {};
    window.App.ThirdPartyIcons = api;
    void ensureColorData();
})();
