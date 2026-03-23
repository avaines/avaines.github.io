#!/usr/bin/env node

const path = require('path');
const packageJson = require('../../package.json');
const { getChangedPosts, getAllPosts } = require('./lib/parser');
const { loadState, saveState, isSyndicated, recordSyndication } = require('./lib/state');

// Import all services
const services = {
  bluesky: require('./services/bluesky'),
  devto: require('./services/devto'),
  hashnode: require('./services/hashnode'),
  mastodon: require('./services/mastodon'),
  medium: require('./services/medium'),
  substack: require('./services/substack'),
  twitter: require('./services/twitter')
};

/**
 * Sleep for specified seconds
 */
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Main syndication orchestrator
 */
async function main() {
  console.log('Starting syndication process...\n');

  // Check if syndication is globally enabled
  if (!packageJson.syndication?.enabled) {
    console.log('Syndication is globally disabled in package.json');
    console.log('   Enable it with: npm run syndicate:enable');
    return;
  }

  // Check for environment override
  if (process.env.SYNDICATION_ENABLED === 'false') {
    console.log('Syndication disabled via SYNDICATION_ENABLED env variable');
    return;
  }

  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';
  if (isDryRun) {
    console.log('DRY RUN MODE - No actual posts will be published\n');
  }

  // Determine which posts to syndicate
  const useAllPosts = process.argv.includes('--all');
  const posts = useAllPosts ? await getAllPosts() : await getChangedPosts();

  if (posts.length === 0) {
    console.log('No posts to syndicate');
    if (!useAllPosts) {
      console.log('   Tip: Use --all flag to syndicate all posts');
    }
    return;
  }

  console.log(`Found ${posts.length} post(s) to process\n`);

  // Load syndication state
  const state = await loadState();

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each post
  for (const post of posts) {
    const { frontmatter, path: postPath, permalink } = post;

    console.log(`\nProcessing: ${frontmatter.title}`);
    console.log(`   Path: ${permalink}`);

    // Skip drafts
    if (frontmatter.draft) {
      console.log('   ⏭ Skipped (draft)');
      skipCount++;
      continue;
    }

    // Get syndication targets from frontmatter
    const requestedTargets = frontmatter.syndicate || [];

    if (requestedTargets.length === 0) {
      console.log('   ⏭  Skipped (no syndication targets specified)');
      skipCount++;
      continue;
    }

    // Filter by globally enabled targets
    const enabledTargets = requestedTargets.filter(target => {
      const config = packageJson.syndication.targets[target];
      if (!config) {
        console.warn(`   !  Unknown target: ${target}`);
        return false;
      }
      if (config.enabled === false) {
        console.log(`   ⏭  ${target} (globally disabled)`);
        return false;
      }
      return true;
    });

    if (enabledTargets.length === 0) {
      console.log('   ⏭  No enabled targets for this post');
      skipCount++;
      continue;
    }

    // Syndicate to each target
    for (const target of enabledTargets) {
      // Check if already syndicated
      if (isSyndicated(state, postPath, target)) {
        const existing = state[postPath][target];
        console.log(`   ✓ ${target} (already syndicated: ${existing.url})`);
        skipCount++;
        continue;
      }

      // Get target configuration
      const targetConfig = packageJson.syndication.targets[target];
      const delay = targetConfig.delay ?? packageJson.syndication.defaults.delay ?? 0;

      // Wait if delay is specified
      if (delay > 0) {
        console.log(`   Waiting ${delay}s before syndicating to ${target}...`);
        await sleep(delay);
      }

      // Attempt to syndicate
      try {
        console.log(`   Syndicating to ${target}...`);

        const result = await services[target].publish(post, packageJson.syndication);

        // Record successful syndication
        recordSyndication(state, postPath, target, result.url);

        console.log(`   ✅ ${target}: ${result.url}`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ ${target} failed: ${error.message}`);
        errorCount++;

        // Optionally retry with exponential backoff
        const maxRetries = packageJson.syndication.defaults.maxRetries || 0;
        const retryDelay = packageJson.syndication.defaults.retryDelay || 5000;

        if (maxRetries > 0) {
          console.log(`   Will retry ${maxRetries} times...`);
        }
      }
    }
  }

  // Save state
  if (!isDryRun) {
    await saveState(state);
    console.log('\nSyndication state saved');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Syndication Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log('='.repeat(50) + '\n');

  // Exit with error code if there were failures
  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
