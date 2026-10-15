# avaines.github.io

[![Pull Request](https://github.com/avaines/avaines.github.io/actions/workflows/cicd-1-pull-request.yml/badge.svg)](https://github.com/avaines/avaines.github.io/actions/workflows/cicd-1-pull-request.yml)

My blog and portfolio built with Hugo and deployed via GitHub Pages.

## Development

Use Node 22 from `.nvmrc`, Hugo **extended** at the version in
`.hugo-version`, and Python 3 (for the test-only static server). CI reads the same
version files for PR checks and deployment.

```bash
nvm install
nvm use
npm ci
npx playwright install chromium
npm start
```

`npm run build` checks the toolchain and builds the minified production site.
Install the matching Hugo extended binary from [Hugo releases](https://github.com/gohugoio/hugo/releases).

## Testing

```bash
npm run test:all           # unit tests, real SDK smoke tests, production build + Chromium
npm run test:unit:coverage # syndication logic, with coverage
npm run test:sdk           # load real publishing SDKs; no credentials or publishing
npm run test:e2e           # build production output and test it
npm run test:report        # open the last browser report
```

Browser tests build a fresh `.test-site/` with the production environment and
minification, then serve it with Python on `127.0.0.1:4173`. They never reuse a
running development server. They cover published post content, static pages,
local images and links, browser errors, search, and mobile navigation. Images
and links to third-party sites are checked separately. Third-party scripts used
by the site still load; analytics requests are suppressed during browser tests.

PRs run **Unit Tests** (including real SDK loading) and **Production Build and
Browser Tests**. Configure both as required status checks in the repository's
branch protection/ruleset. The browser job uploads its report and failure traces.
These checks need no publishing credentials and do not publish content.

```bash
npm run test:external-links
```

The **External Link Report** job in **CICD 1 - Pull Request** runs weekly or when
that workflow is dispatched manually. PR and push events run the unit and browser
checks; scheduled and manual runs execute only the external-link report.
It checks unique external links and images in the generated site, records failures
(including timeouts and non-success HTTP statuses), and uploads an HTML report
with a JSON attachment listing affected pages. It is deliberately separate from
PR checks: review 403/429 responses for bot protection before treating them as
broken links. Reports are saved locally in `external-link-report/`.

## Content Syndication

Add syndication targets to post frontmatter:

```yaml
syndicate:
  - bluesky
  - devto
  - mastodon
  - substack
```

Test syndication without publishing:

```bash
npm run syndicate:dry-run
```

Syndicate changed posts:

```bash
npm run syndicate
```

Syndicate all posts (respects state to avoid duplicates):

```bash
npm run syndicate -- --all
```

Configure platforms and API keys in environment variables. See [scripts/syndication/.env.example](scripts/syndication/.env.example) for required credentials.
