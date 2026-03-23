const { TwitterApi } = require('twitter-api-v2');
const { convertContent } = require('../lib/converter');

/**
 * Publish post to Twitter/X
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const appKey = process.env.TWITTER_APP_KEY;
  const appSecret = process.env.TWITTER_APP_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    throw new Error('Twitter API credentials are required (TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET)');
  }

  const converted = convertContent(post, 'twitter', config);
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Twitter:', {
      title: converted.metadata.title,
      thread: converted.content
    });
    return { url: `https://twitter.com/preview/${Date.now()}` };
  }

  const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret
  });

  // Post as a thread
  let previousTweetId;
  let firstTweetId;

  for (const text of converted.content) {
    const tweet = await client.v2.tweet({
      text,
      reply: previousTweetId ? { in_reply_to_tweet_id: previousTweetId } : undefined
    });

    if (!firstTweetId) {
      firstTweetId = tweet.data.id;
    }
    previousTweetId = tweet.data.id;
  }

  // Get username from API
  const me = await client.v2.me();
  return { url: `https://twitter.com/${me.data.username}/status/${firstTweetId}` };
}

module.exports = { publish };
