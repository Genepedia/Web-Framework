/**
 * Shared Add block inserter UI for page-editor and profile-page-editor.
 */
(function () {
	"use strict";

	const DIALOG_MARKUP = `
		<dialog class="page-editor__inserter editor-block-inserter" aria-label="Add block">
			<form method="dialog" class="page-editor__inserter-form">
				<header class="page-editor__inserter-header">
					<h2 class="page-editor__inserter-title">Add block</h2>
					<input type="search" class="page-editor__inserter-search" placeholder="Search blocks…" autocomplete="off">
					<button type="button" class="page-editor__icon-button" data-inserter-close aria-label="Close">
						<i class="bi bi-x-lg" aria-hidden="true"></i>
					</button>
				</header>
				<div class="page-editor__inserter-body" role="listbox" aria-label="Available blocks"></div>
			</form>
		</dialog>
	`;

	function escapeHtml(value) {
		return String(value).replace(/[&<>"']/g, (char) => ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		}[char]));
	}

	function renderPanel(bodyEl, { context, definitions, categories, query = "", compact = false }) {
		if (!bodyEl || !window.EditorBlocks) return;

		const needle = String(query || "").trim().toLowerCase();
		const matches = definitions.filter((block) => {
			const ui = window.EditorBlocks.getBlockUiState(context, block);
			if (!ui.visible) return false;
			if (!needle) return true;
			return block.label.toLowerCase().includes(needle)
				|| block.id.toLowerCase().includes(needle)
				|| block.category.toLowerCase().includes(needle);
		});

		const grouped = categories.map((category) => ({
			...category,
			blocks: matches.filter((block) => block.category === category.id),
		})).filter((category) => category.blocks.length > 0);

		bodyEl.innerHTML = grouped.map((category) => `
			<section class="page-editor__inserter-section">
				<h3 class="page-editor__inserter-section-title">${escapeHtml(category.label)}</h3>
				<div class="page-editor__inserter-grid${compact ? " page-editor__inserter-grid--compact" : ""}">
					${category.blocks.map((block) => {
						const ui = window.EditorBlocks.getBlockUiState(context, block);
						const disabled = !ui.enabled;
						const reason = ui.reason || "";
						const itemClass = [
							"page-editor__inserter-item",
							compact ? "page-editor__inserter-item--compact" : "",
							disabled ? "is-disabled" : "",
						].filter(Boolean).join(" ");
						return `
							<button type="button"
								class="${itemClass}"
								data-block-id="${escapeHtml(block.id)}"
								role="option"
								${disabled ? `disabled title="${escapeHtml(reason)}"` : `title="${escapeHtml(block.label)}"`}>
								<i class="bi ${escapeHtml(block.icon)}" aria-hidden="true"></i>
								<span class="page-editor__inserter-item-label">${escapeHtml(block.label)}</span>
								${compact ? "" : `${block.description ? `<span class="page-editor__inserter-item-desc">${escapeHtml(block.description)}</span>` : ""}${disabled && reason ? `<span class="page-editor__inserter-item-reason">${escapeHtml(reason)}</span>` : ""}`}
							</button>
						`;
					}).join("")}
				</div>
			</section>
		`).join("") || '<p class="page-editor__inserter-empty">No blocks match your search.</p>';
	}

	class Controller {
		constructor(options = {}) {
			this.context = options.context || "page";
			this.host = options.host || null;
			this.dialog = options.dialog || null;
			this.getCatalog = options.getCatalog || (() => window.EditorBlocks.getCatalog(this.context));
			this.onSelect = options.onSelect || (() => {});
			this.extraClass = options.extraClass || "";
			this.__mounted = false;
		}

		mount() {
			if (this.__mounted) return this;
			this.__mounted = true;

			if (!this.dialog) {
				if (!this.host) return this;
				this.host.insertAdjacentHTML("beforeend", DIALOG_MARKUP);
				this.dialog = this.host.querySelector(".editor-block-inserter:last-of-type");
			}

			if (this.extraClass) {
				this.dialog?.classList.add(...this.extraClass.split(/\s+/).filter(Boolean));
			}

			this.body = this.dialog?.querySelector(".page-editor__inserter-body");
			this.search = this.dialog?.querySelector(".page-editor__inserter-search");

			this.dialog?.querySelector("[data-inserter-close]")?.addEventListener("click", () => this.close());
			this.search?.addEventListener("input", () => this.render(this.search.value));
			this.body?.addEventListener("click", (event) => {
				const choice = event.target.closest("[data-block-id]");
				if (!choice || choice.disabled) return;
				event.preventDefault();
				const block = window.EditorBlocks.getById(choice.dataset.blockId);
				const ui = window.EditorBlocks.getBlockUiState(this.context, block);
				if (!block || !ui.enabled) return;
				this.onSelect(block.id, block);
				this.close();
			});

			this.render("");
			return this;
		}

		bindExisting(dialogEl) {
			this.dialog = dialogEl;
			return this.mount();
		}

		open() {
			if (!this.dialog) return;
			if (this.search) this.search.value = "";
			this.render("");
			if (typeof this.dialog.showModal === "function") this.dialog.showModal();
			else this.dialog.setAttribute("open", "open");
			requestAnimationFrame(() => this.search?.focus());
		}

		close() {
			if (!this.dialog) return;
			if (this.dialog.open) this.dialog.close();
			else this.dialog.removeAttribute("open");
		}

		render(query = "") {
			if (!this.body) return;
			const { definitions, categories } = this.getCatalog();
			renderPanel(this.body, {
				context: this.context,
				definitions,
				categories,
				query,
			});
		}
	}

	window.EditorBlockInserter = {
		renderPanel,
		Controller,
	};
})();
