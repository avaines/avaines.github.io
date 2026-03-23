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

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Bluesky:', {
      title: converted.metadata.title,
      thread: converted.content
    });
    return { url: `https://bsky.app/profile/${handle}/post/preview` };
  }

  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: handle, password });

  // Post as a thread
  const posts = [];
  for (const text of converted.content) {
    const response = await agent.post({
      text,
      reply: posts.length > 0 ? {
        root: posts[0],
        parent: posts[posts.length - 1]
      } : undefined
    });
    posts.push({
      uri: response.uri,
      cid: response.cid
    });
  }

  // Return URL to the first post in the thread
  const firstPostUri = posts[0].uri;
  const postId = firstPostUri.split('/').pop();
  return { url: `https://bsky.app/profile/${handle}/post/${postId}` };
}

module.exports = { publish };
