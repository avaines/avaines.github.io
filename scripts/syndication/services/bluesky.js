const { BskyAgent } = require('@atproto/api');
const { convertContent } = require('../lib/converter');

/**
 * Publish post to Bluesky
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_PASSWORD;

  if (!handle || !password) {
    throw new Error('BLUESKY_HANDLE and BLUESKY_PASSWORD environment variables are required');
  }

  const converted = convertContent(post, 'bluesky', config);
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
    console.log('[DRY RUN] Would publish to Bluesky:', {
      title: converted.metadata.title,
      post: text
    });
    return { url: `https://bsky.app/profile/${handle}/post/preview` };
  }

  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: handle, password });

  const postData = { text };

  // Add link card embed
  if (canonicalUrl) {
    postData.embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: canonicalUrl,
        title: converted.metadata.title,
        description: converted.metadata.title
      }
    };
  }

  const response = await agent.post(postData);
  const postId = response.uri.split('/').pop();
  return { url: `https://bsky.app/profile/${handle}/post/${postId}` };
}

module.exports = { publish };
