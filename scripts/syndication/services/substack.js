const axios = require('axios');
const { convertContent } = require('../lib/converter');

/**
 * Publish post to Substack
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const apiKey = process.env.SUBSTACK_API_KEY;
  const publicationId = process.env.SUBSTACK_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    throw new Error('SUBSTACK_API_KEY and SUBSTACK_PUBLICATION_ID environment variables are required');
  }

  const converted = convertContent(post, 'substack', config);
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Substack:', {
      title: converted.metadata.title
    });
    return { url: `https://substack.com/preview/${Date.now()}` };
  }

  // Substack API endpoint (may vary based on your publication)
  const response = await axios.post(
    `https://api.substack.com/v1/posts`,
    {
      publication_id: publicationId,
      title: converted.metadata.title,
      subtitle: '',
      body: converted.content,
      canonical_url: converted.metadata.canonicalUrl,
      type: 'newsletter',
      post_date: new Date().toISOString()
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return { url: response.data.web_url };
}

module.exports = { publish };
