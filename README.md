# avaines.github.io

[![Pull Request](https://github.com/avaines/avaines.github.io/actions/workflows/pull-request.yml/badge.svg)](https://github.com/avaines/avaines.github.io/actions/workflows/pull-request.yml)

My blog and portfolio built with Hugo and deployed via GitHub Pages.

## Development

Start the local development server:

```bash
npm run start
```

## Testing

Run Playwright tests to validate pages and links:

```bash
npm test
```

Run syndication unit tests:

```bash
npm run test:syndication
```

## Content Syndication

Add syndication targets to post frontmatter:

```yaml
syndicate:
  - bluesky
  - devto
  - hashnode
  - mastodon
  - medium
  - substack
  - twitter
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
