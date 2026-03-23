const Mastodon = require('mastodon-api');
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

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Mastodon:', {
      instance,
      title: converted.metadata.title,
      thread: converted.content
    });
    return { url: `https://${instance}/@preview/${Date.now()}` };
  }

  const M = new Mastodon({
    access_token: accessToken,
    api_url: `https://${instance}/api/v1/`
  });

  // Post as a thread
  let previousTootId;
  let firstTootUrl;

  for (const text of converted.content) {
    const params = {
      status: text
    };

    if (previousTootId) {
      params.in_reply_to_id = previousTootId;
    }

    const response = await new Promise((resolve, reject) => {
      M.post('statuses', params, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    if (!firstTootUrl) {
      firstTootUrl = response.url;
    }
    previousTootId = response.id;
  }

  return { url: firstTootUrl };
}

module.exports = { publish };
