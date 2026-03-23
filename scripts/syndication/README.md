# POSSE Syndication System

Automated content syndication system for publishing blog posts to multiple platforms (POSSE - Publish on your Own Site, Syndicate Everywhere).

## Overview

This system automatically syndicates your Hugo blog posts to various platforms while maintaining your site as the canonical source.

## Supported Platforms

- ✅ **dev.to** - Full API support
- ✅ **Hashnode** - GraphQL API support
- ✅ **Twitter/X** - Thread generation
- ✅ **Mastodon** - Thread generation
- ✅ **Bluesky** - AT Protocol support
- ⚠️ **Substack** - API access required

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Platforms

Enable/disable platforms in `package.json`:

```json
{
  "syndication": {
    "enabled": true,
    "targets": {
      "devto": { "enabled": true },
    }
  }
}
```

### 3. Set Up API Keys

Copy the example environment file:

```bash
cp scripts/syndication/.env.example .env
```

Edit `.env` and add your API keys.

### 4. Add Syndication to Posts

Add to your post's frontmatter:

```yaml
---
title: "My Post"
syndicate:
  - devto
  - twitter
---
```

### 5. Test Locally

Run in dry-run mode to test without posting:

```bash
npm run syndicate:dry-run
```

Or test with all posts:

```bash
SYNDICATION_DRY_RUN=true node scripts/syndication/index.js --all
```

### 6. GitHub Actions Setup

Add secrets to your GitHub repository:

- Settings > Secrets and variables > Actions > New repository secret

Required secrets:

- `DEVTO_API_KEY`
- `HASHNODE_TOKEN`
- `HASHNODE_PUBLICATION_ID`
- etc. (see `.env.example` for full list)

## Usage

### Automatic Syndication

The GitHub Action runs automatically after your site deploys successfully.

### Manual Syndication

Trigger manually from GitHub Actions tab or locally:

```bash
npm run syndicate
```

### Commands

```bash
# Syndicate changed posts
npm run syndicate

# Dry run (no actual posting)
npm run syndicate:dry-run

# Syndicate all posts
node scripts/syndication/index.js --all

# Disable syndication globally
npm run syndicate:disable

# Enable syndication globally
npm run syndicate:enable

# Run tests
npm run test:unit:coverage
```

## Configuration

### Delays

Add delays (in seconds) to stagger posting:

```json
{
  "syndication": {
    "targets": {
      "hashnode": {
        "enabled": true,
        "delay": 300
      }
    }
  }
}
```

### Canonical URLs

All syndicated posts include:

- Canonical URL pointing to your site
- "Originally published at..." note at the top

### State Management

Syndication state is tracked in `.github/syndication-state.json` to prevent duplicate posts.

## Platform Setup Guides

### dev.to

1. Go to https://dev.to/settings/extensions
2. Generate an API key
3. Add to secrets as `DEVTO_API_KEY`

### Hashnode

1. Go to https://hashnode.com/settings/developer
2. Generate a personal access token
3. Get your publication ID from `https://gql.hashnode.com/` using: `query Me { me { publications(first: 10) { edges { node { id title url } } } } }`
4. Add `HASHNODE_TOKEN` and `HASHNODE_PUBLICATION_ID`

### Twitter/X

1. Create app at https://developer.twitter.com/en/portal/dashboard
2. Generate API keys and access tokens
3. Add all four credentials to secrets

### Bluesky

1. Use your Bluesky handle (e.g., `username.bsky.social`)
2. Use your account password
3. Add `BLUESKY_HANDLE` and `BLUESKY_PASSWORD`

### Mastodon

1. Go to Settings > Development on your instance
2. Create new application
3. Copy access token
4. Add `MASTODON_ACCESS_TOKEN` and `MASTODON_INSTANCE`

## Testing

Run the test suite:

```bash
npm run test:unit
```

With coverage:

```bash
npm run test:unit:coverage
```

## Troubleshooting

### Posts Not Syndicating

1. Check `syndication.enabled` in `package.json`
2. Verify post has `syndicate:` in frontmatter
3. Check post is not marked `draft: true`
4. Review logs in GitHub Actions

### API Errors

1. Verify API keys are correct
2. Check rate limits
3. Review platform-specific error messages
4. Try dry-run mode first

### State File Conflicts

If you get state file conflicts, you can:

1. Manually resolve the conflict
2. Or reset state (posts will be skipped if already syndicated)

## Architecture

```text
scripts/syndication/
├── index.js              # Main orchestrator
├── lib/
│   ├── parser.js         # Parse markdown & frontmatter
│   ├── converter.js      # Convert to platform formats
│   └── state.js          # Track syndication state
├── services/
│   ├── devto.js          # dev.to API
│   ├── hashnode.js       # Hashnode GraphQL
│   ├── twitter.js        # Twitter API
│   ├── mastodon.js       # Mastodon API
│   ├── bluesky.js        # Bluesky AT Protocol
│   └── ...               # Other platforms
└── __tests__/            # Test suite
```

## Contributing

To add a new platform:

1. Create `scripts/syndication/services/platform.js`
2. Implement `publish(post, config)` function
3. Add to `services` in `index.js`
4. Add configuration to `package.json`
5. Document in README
6. Add tests

## License

MIT
