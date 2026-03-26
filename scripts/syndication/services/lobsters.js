const lob = require('lob-story');

/**
 * Publish post to Lobste.rs
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const username = process.env.LOBSTERS_USERNAME;
  const password = process.env.LOBSTERS_PASSWORD;

  if (!username || !password) {
    throw new Error('LOBSTERS_USERNAME and LOBSTERS_PASSWORD environment variables are required');
  }

  const { frontmatter, permalink } = post;
  const canonicalUrl = `${config.baseUrl}${permalink}`;
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';

  const tags = (frontmatter.categories || [])
    .map(t => t.toLowerCase().replace(/\s+/g, '-'))
    .slice(0, 5);

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Lobste.rs:', {
      title: frontmatter.title,
      url: canonicalUrl,
      tags
    });
    return { url: `https://lobste.rs/s/preview` };
  }

  return new Promise((resolve, reject) => {
    lob({
      username,
      password,
      title: frontmatter.title,
      url: canonicalUrl,
      tags,
      author: true
    }, (err, res, body, storyUrl) => {
      if (err) {
        return reject(err);
      }
      resolve({ url: storyUrl });
    });
  });
}

module.exports = { publish };
