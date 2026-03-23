const axios = require('axios');
const { convertContent } = require('../lib/converter');

/**
 * Publish post to Medium
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) {
    throw new Error('MEDIUM_TOKEN environment variable is required');
  }

  const converted = convertContent(post, 'medium', config);
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Medium:', {
      title: converted.metadata.title,
      tags: converted.metadata.tags
    });
    return { url: `https://medium.com/@preview/${Date.now()}` };
  }

  // Get user ID first
  const userResponse = await axios.get('https://api.medium.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const userId = userResponse.data.data.id;

  // Create post
  const response = await axios.post(
    `https://api.medium.com/v1/users/${userId}/posts`,
    {
      title: converted.metadata.title,
      contentFormat: converted.metadata.contentFormat,
      content: converted.content,
      canonicalUrl: converted.metadata.canonicalUrl,
      tags: converted.metadata.tags,
      publishStatus: converted.metadata.publishStatus
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return { url: response.data.data.url };
}

module.exports = { publish };
