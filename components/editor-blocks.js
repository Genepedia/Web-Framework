/**
 * Shared block catalog for page-editor and profile-page-editor.
 */
(function () {
	"use strict";

	const BLOCK_CATEGORIES = [
		{ id: "text", label: "Text" },
		{ id: "media", label: "Media" },
		{ id: "design", label: "Design" },
		{ id: "layout", label: "Layout" },
	];

	const BLOCK_DEFINITIONS = [
		{ id: "paragraph", category: "text", label: "Paragraph", icon: "bi-text-paragraph", description: "Plain text for body copy.", html: "<p>Start writing…</p>", transforms: ["heading", "quote", "list"] },
		{ id: "heading", category: "text", label: "Heading", icon: "bi-type-h2", description: "Section heading (H2).", html: '<h2 class="home-page__section-title">Heading</h2>', transforms: ["paragraph"] },
		{ id: "list", category: "text", label: "List", icon: "bi-list-ul", description: "Bulleted or numbered list.", html: "<ul><li>First item</li><li>Second item</li></ul>", transforms: ["paragraph"] },
		{ id: "quote", category: "text", label: "Quote", icon: "bi-quote", description: "Highlighted quotation.", html: "<blockquote><p>A memorable quote.</p></blockquote>", transforms: ["paragraph"] },
		{ id: "image", category: "media", label: "Image", icon: "bi-image", description: "Image with alt text.", html: '<p><img src="assets/Logo.png" alt="Describe this image"></p>', transforms: [] },
		{ id: "button", category: "design", label: "Button", icon: "bi-square", description: "Single call-to-action button.", html: '<p><a class="pure-button" href="#">Button label</a></p>', transforms: ["buttons"] },
		{ id: "buttons", category: "design", label: "Buttons", icon: "bi-ui-checks-grid", description: "Row of action buttons.", html: '<div class="home-page__actions"><a class="pure-button" href="#">Primary action</a><a class="pure-button" href="#">Secondary action</a></div>', transforms: ["button"] },
		{ id: "chip", category: "design", label: "Chips", icon: "bi-tags", description: "Compact topic links.", html: '<div class="home-page__chips"><a class="site-chip" href="#">Topic</a><a class="site-chip" href="#">Another topic</a></div>', transforms: [] },
		{ id: "divider", category: "design", label: "Divider", icon: "bi-hr", description: "Horizontal rule between sections.", html: "<hr>", transforms: [] },
		{ id: "hero", category: "layout", label: "Hero", icon: "bi-window", description: "Large intro banner with title and CTA.", html: '<section class="card home-page__hero"><div class="home-page__hero-inner"><h1 class="home-page__hero-title">Welcome</h1><p class="home-page__hero-text">Introductory text for this page.</p><div class="home-page__actions"><a class="pure-button" href="#">Call to action</a></div></div></section>', transforms: ["section"] },
		{ id: "section", category: "layout", label: "Section", icon: "bi-bounding-box", description: "Card section with title and text.", html: '<section class="card home-page__section"><h2 class="home-page__section-title">Section title</h2><p class="home-page__section-text">Section content goes here.</p></section>', transforms: ["hero", "tiles"] },
		{ id: "tiles", category: "layout", label: "Card grid", icon: "bi-grid-3x3-gap", description: "Grid of feature cards.", html: '<section class="card home-page__section"><h2 class="home-page__section-title">Featured</h2><div class="home-page__grid"><article class="card home-page__tile"><h3 class="home-page__tile-title">Card title</h3><p class="home-page__tile-text">Card text.</p></article><article class="card home-page__tile"><h3 class="home-page__tile-title">Card title</h3><p class="home-page__tile-text">Card text.</p></article></div></section>', transforms: ["section", "columns"] },
		{ id: "columns", category: "layout", label: "Columns", icon: "bi-layout-three-columns", description: "Two-column layout.", html: '<div class="home-page__grid"><article class="card home-page__tile"><p>Column 1</p></article><article class="card home-page__tile"><p>Column 2</p></article></div>', transforms: ["tiles"] },
		{ id: "updates", category: "layout", label: "Updates list", icon: "bi-clock-history", description: "List of recent updates with links.", html: '<section class="card home-page__section"><h2 class="home-page__section-title">Latest Updates</h2><ul class="home-page__updates"><li><a href="#">First update</a></li><li><a href="#">Second update</a></li></ul></section>', transforms: ["section", "list"] },
		{ id: "newsletter", category: "layout", label: "Newsletter", icon: "bi-envelope", description: "Email signup section.", html: '<section class="card home-page__section"><h2 class="home-page__section-title">Newsletter</h2><p class="home-page__section-text">Get occasional updates.</p><form class="home-page__newsletter-form" onsubmit="event.preventDefault();"><input class="home-page__newsletter-input" type="email" name="email" placeholder="you@example.com" required><button class="pure-button" type="submit">Subscribe</button></form></section>', transforms: ["section"] },
		{ id: "table", category: "layout", label: "Table", icon: "bi-table", description: "Data table with headers.", html: '<table class="site-table"><thead><tr><th scope="col">Header</th><th scope="col">Header</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table>', transforms: [] },
		{ id: "spacer", category: "layout", label: "Spacer", icon: "bi-distribute-vertical", description: "Vertical whitespace.", html: '<div style="height:1.5rem" aria-hidden="true"></div>', transforms: [] },
		{ id: "include-fragment", category: "layout", label: "Included fragment", icon: "bi-box-arrow-in-down", description: "Content from an included fragment file. Edits are saved back to that file.", html: '<div data-editor-include=""></div>', transforms: [], hidden: true },
		{ id: "include-locked", category: "layout", label: "Included fragment", icon: "bi-file-earmark-code", description: "A fragment included from another file. Edit that file to change it.", html: '<include src=""></include>', transforms: [], hidden: true, locked: true },
	];

	/** Blocks covered by the profile prose toolbar — omit from profile inserter. */
	const PROFILE_OMIT_BLOCK_IDS = new Set(["paragraph", "heading", "list", "quote", "image", "table"]);

	const PROFILE_DISABLED_RULES = {
		chip: {
			enabled: false,
			reason: "Topic chips are designed for site pages, not profile articles.",
		},
		hero: {
			enabled: false,
			reason: "Hero banners are for full site pages. Profiles already have a title.",
		},
		section: {
			enabled: false,
			reason: "Card sections are layout blocks for site pages.",
		},
		tiles: {
			enabled: false,
			reason: "Feature grids are for site pages, not biography text.",
		},
		updates: {
			enabled: false,
			reason: "Update lists belong on site pages, not individual profiles.",
		},
		newsletter: {
			enabled: false,
			reason: "Newsletter signup blocks are for site pages.",
		},
	};

	const BLOCK_LIBRARIES = new Map();
	const definitionById = Object.fromEntries(BLOCK_DEFINITIONS.map((block) => [block.id, block]));

	function registerLibrary(name, library) {
		const key = String(name || "").trim();
		if (!key || !library || typeof library !== "object") return;

		const blocks = Array.isArray(library.blocks) ? library.blocks.filter((block) => block?.id) : [];
		const categories = Array.isArray(library.categories) ? library.categories.filter((category) => category?.id) : [];
		const detect = typeof library.detect === "function" ? library.detect : null;

		BLOCK_LIBRARIES.set(key, { blocks, categories, detect });
		blocks.forEach((block) => {
			definitionById[block.id] = block;
		});
	}

	function getById(blockId) {
		return definitionById[String(blockId || "").trim()] || null;
	}

	function getLibrary(name) {
		return BLOCK_LIBRARIES.get(String(name || "").trim()) || null;
	}

	function getCatalog(context, { libraryNames = [] } = {}) {
		let definitions = [...BLOCK_DEFINITIONS];
		let categories = [...BLOCK_CATEGORIES];

		if (context === "page") {
			for (const name of libraryNames) {
				const library = getLibrary(name);
				if (!library) continue;
				library.categories.forEach((category) => {
					if (!categories.some((existing) => existing.id === category.id)) {
						categories.push(category);
					}
				});
				library.blocks.forEach((block) => {
					if (!definitions.some((existing) => existing.id === block.id)) {
						definitions.push(block);
					}
				});
			}
		}

		if (context === "profile") {
			definitions = definitions.filter((block) => !PROFILE_OMIT_BLOCK_IDS.has(block.id));
		}

		return { definitions, categories };
	}

	function getBlockUiState(context, block) {
		if (!block) return { visible: false, enabled: false };

		if (block.hidden) {
			return { visible: false, enabled: false };
		}

		if (context === "profile") {
			if (PROFILE_OMIT_BLOCK_IDS.has(block.id)) {
				return { visible: false, enabled: false };
			}
			const rule = PROFILE_DISABLED_RULES[block.id];
			if (rule && !rule.enabled) {
				return { visible: true, enabled: false, reason: rule.reason || "" };
			}
		}

		return { visible: true, enabled: true, reason: "" };
	}

	function getLibraries() {
		return [...BLOCK_LIBRARIES.values()];
	}

	const EditorBlocks = {
		BLOCK_CATEGORIES,
		BLOCK_DEFINITIONS,
		registerLibrary,
		getById,
		getLibrary,
		getLibraries,
		getCatalog,
		getBlockUiState,
		get definitionById() {
			return definitionById;
		},
	};

	window.EditorBlocks = EditorBlocks;

	const queued = Array.isArray(window.PageEditorBlocks?.__queue) ? window.PageEditorBlocks.__queue : [];
	window.PageEditorBlocks = { registerLibrary };
	queued.forEach((entry) => {
		if (Array.isArray(entry)) registerLibrary(entry[0], entry[1]);
	});
})();
