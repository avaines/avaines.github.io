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

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Mastodon:', {
      instance,
      title: converted.metadata.title,
      thread: converted.content
    });
    return { url: `https://${instance}/@preview/${Date.now()}` };
  }

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

    const response = await axios.post(
      `https://${instance}/api/v1/statuses`,
      params,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    if (!firstTootUrl) {
      firstTootUrl = data.url;
    }
    previousTootId = data.id;
  }

  return { url: firstTootUrl };
}

module.exports = { publish };
