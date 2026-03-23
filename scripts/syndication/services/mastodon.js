const axios = require('axios');
const { convertContent } = require('../lib/converter');

/**
 * Publish post to Mastodon
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const accessToken = process.env.MASTODON_ACCESS_TOKEN;
  const instance = process.env.MASTODON_INSTANCE || 'mastodon.social';

  if (!accessToken) {
    throw new Error('MASTODON_ACCESS_TOKEN environment variable is required');
  }

  const converted = convertContent(post, 'mastodon', config);
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';
  const canonicalUrl = converted.metadata.url;
  const text = [
    converted.metadata.title,
    canonicalUrl ? `Read more: ${canonicalUrl}` : undefined
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Mastodon:', {
      instance,
      title: converted.metadata.title,
      post: text
    });
    return { url: `https://${instance}/@preview/${Date.now()}` };
  }

  const response = await axios.post(
    `https://${instance}/api/v1/statuses`,
    { status: text },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return { url: response.data.url };
}

module.exports = { publish };
