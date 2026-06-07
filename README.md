# Web-Framework

Shared UI components used across Genepedia websites. Add this repository as a git submodule (typically at `lib/Web-Framework`) and include the scripts on any page that should use the shared chrome.

## Quick start

1. Add the submodule:

```bash
git submodule add https://github.com/Genepedia/Web-Framework.git lib/Web-Framework
```

2. Configure your site (usually in `site-info.js` at the repository root):

```javascript
window.App = {
  Name: 'Your Site',
  Slogan: 'Your tagline',
  FullSlogan: 'The full tagline',
  LogoPath: 'assets/Logo.png',
  GitHubApiBase: 'https://api.example.com/your-site',
};
```

3. Include the header on a page:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@latest/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="lib/Web-Framework/styles/common.css">

<body>
  <full-header></full-header>
  <!-- page content -->
</body>

<script src="site-info.js"></script>
<script src="lib/Web-Framework/site-info.js"></script>
<script src="lib/Web-Framework/components/mini-header.js"></script>
<script src="lib/Web-Framework/components/full-header.js"></script>
<script src="lib/Web-Framework/site-runtime.js"></script>
```

Adjust script paths for pages in subfolders (for example `../lib/Web-Framework/...` from `pages/`).

## Components

| Component | File | Description |
|-----------|------|-------------|
| `<full-header>` | `components/full-header.js` | Fixed site header with sidebar, search, notifications, auth, and theme toggle |
| `<mini-header>` | `components/mini-header.js` | Brand wordmark and logo used inside `<full-header>` |
| `<action-button>` | `components/action-button.js` | Icon button with optional badge (loaded automatically by `<full-header>`) |
| `<mini-footer>` | `components/mini-footer.js` | Compact legal links and theme toggle footer |
| `<full-footer>` | `components/full-footer.js` | Full page footer for article-style pages |
| `<full-page-toolbar>` | `components/full-page-toolbar.js` | Page title, tabs, and download/action toolbar |
| `<sister-projects>` | `components/sister-projects.js` | Shared related-project link grid with framework-hosted logos |

## Shared Files

| File | Description |
|------|-------------|
| `site-info.js` | Shared app bootstrapper for branding tokens, API base normalization, URL resolving, and optional random-profile navigation |
| `site-runtime.js` | Shared theme toggle and app-store coming-soon modal behavior |
| `styles/common.css` | Shared base styles and design tokens |
| `styles/portal-index.css` | Shared portal homepage stylesheet |

## Site configuration

`<full-header>` reads site-specific values from `window.App`:

| Property | Purpose |
|----------|---------|
| `Name` / `getName()` | App name shown in the wordmark and search placeholder |
| `Slogan` / `getSlogan()` | Tagline under the logo |
| `FullSlogan` / `getFullSlogan()` | Full tagline when there is room in the portal wordmark |
| `LogoPath` / `getLogoPath()` | Site-relative path to the site logo |
| `GitHubApiBase` / `getGitHubApiBase()` | Base URL for GitHub login/session/logout endpoints |
| `resolveSiteUrl(path)` | Resolve a path relative to the site root (e.g. `pages/home.html`, `assets/Logo.png`) |
| `navigateToRandomProfile()` | Optional handler for the sidebar “Random” link |
| `HeaderSearchEnabled` | Set to `false` to skip loading a site search helper on new sites |

Search is site-specific: if `components/app-search.js` exists in the main repo, the header loads it automatically from the site root via `resolveSiteUrl('components/app-search.js')`.

## Dependencies

- [Bootstrap Icons](https://icons.getbootstrap.com/) (CDN stylesheet)
- `site-info.js` (or equivalent) defining `window.App` before the framework scripts run
