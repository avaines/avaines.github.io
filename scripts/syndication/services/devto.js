const axios = require('axios');
const { convertContent } = require('../lib/converter');

/**
 * Publish post to dev.to
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) {
    throw new Error('DEVTO_API_KEY environment variable is required');
  }

  const converted = convertContent(post, 'devto', config);
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to dev.to:', {
      title: converted.metadata.title,
      tags: converted.metadata.tags
    });
    return { url: `https://dev.to/preview/${Date.now()}` };
  }

  const response = await axios.post(
    'https://dev.to/api/articles',
    {
      article: {
        title: converted.metadata.title,
        body_markdown: converted.content,
        published: converted.metadata.published,
        canonical_url: converted.metadata.canonical_url,
        tags: converted.metadata.tags,
        main_image: converted.metadata.main_image
      }
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    }
  );

  return { url: response.data.url };
}

module.exports = { publish };
