const axios = require('axios');
const { convertContent } = require('../lib/converter');

/**
 * Publish post to Hashnode via GraphQL API
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const token = process.env.HASHNODE_TOKEN;
  const publicationId = process.env.HASHNODE_PUBLICATION_ID;

  if (!token) {
    throw new Error('HASHNODE_TOKEN environment variable is required');
  }
  if (!publicationId) {
    throw new Error('HASHNODE_PUBLICATION_ID environment variable is required');
  }

  const converted = convertContent(post, 'hashnode', config);
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Hashnode:', {
      title: converted.metadata.title,
      tags: converted.metadata.tags
    });
    return { url: `https://hashnode.com/preview/${Date.now()}` };
  }

  const mutation = `
    mutation CreatePost($input: CreateStoryInput!) {
      createPublicationStory(input: $input, publicationId: "${publicationId}") {
        post {
          slug
          url
        }
      }
    }
  `;

  const response = await axios.post(
    'https://api.hashnode.com/',
    {
      query: mutation,
      variables: {
        input: {
          title: converted.metadata.title,
          contentMarkdown: converted.content,
          tags: converted.metadata.tags,
          canonicalUrl: converted.metadata.canonicalUrl,
          coverImageUrl: converted.metadata.coverImageUrl
        }
      }
    },
    {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data.errors) {
    throw new Error(`Hashnode API error: ${JSON.stringify(response.data.errors)}`);
  }

  return { url: response.data.data.createPublicationStory.post.url };
}

module.exports = { publish };
