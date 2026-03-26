const { SubstackClient } = require('substack-api');
const { convertContent } = require('../lib/converter');

function resolveHeroImageUrl(post, config) {
  const image = post?.frontmatter?.image
    || post?.frontmatter?.featured_image
    || post?.frontmatter?.featuredImage;

  if (!image) {
    return null;
  }

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  if (image.startsWith('/')) {
    return `${config.baseUrl}${image}`;
  }

  const cleanPath = image.startsWith('./') ? image.slice(2) : image;
  return `${config.baseUrl}${post.permalink}${cleanPath}`;
}

function buildNoteBody(post, converted, config) {
  // Keep full longform content, including canonical note from converter
  const content = (converted.content || '').trim();
  const baseBody = content.length > 0 ? content : converted.metadata.title;

  const heroImageUrl = resolveHeroImageUrl(post, config);
  if (!heroImageUrl) {
    return baseBody;
  }

  const imageAlt = post?.frontmatter?.title || converted.metadata.title;
  const heroImageMarkdown = `![${imageAlt}](${heroImageUrl})`;

  if (baseBody.startsWith(heroImageMarkdown)) {
    return baseBody;
  }

  return `${heroImageMarkdown}\n\n${baseBody}`;
}

async function createViaDraftEndpoints(client, title, body, isDraft) {
  const createdDraft = await client.publicationClient.post('/drafts', {
    type: 'newsletter',
    audience: 'everyone',
    draft_bylines: [],
    draft_title: title,
    draft_subtitle: '',
    draft_body: body,
    should_send_email: false
  });

  if (isDraft) {
    return createdDraft;
  }

  return client.publicationClient.post(`/drafts/${createdDraft.id}/publish`, {
    should_send_email: false
  });
}

/**
 * Publish post to Substack
 * @param {object} post - Post object
 * @param {object} config - Syndication config
 * @returns {Promise<{url: string}>}
 */
async function publish(post, config) {
  const token = process.env.SUBSTACK_TOKEN || process.env.SUBSTACK_API_KEY;
  const publicationUrl = process.env.SUBSTACK_PUBLICATION_URL || process.env.SUBSTACK_PUBLICATION_ID;

  if (!token || !publicationUrl) {
    throw new Error('SUBSTACK_TOKEN and SUBSTACK_PUBLICATION_URL environment variables are required');
  }

  const converted = convertContent(post, 'substack', config);
  const isDryRun = process.env.SYNDICATION_DRY_RUN === 'true';

  if (isDryRun) {
    console.log('[DRY RUN] Would publish to Substack:', {
      title: converted.metadata.title,
      publicationUrl
    });
    return { url: `https://substack.com/preview/${Date.now()}` };
  }

  const client = new SubstackClient({
    token,
    publicationUrl
  });

  const fullBody = buildNoteBody(post, converted, config);
  const isDraft = !!post.frontmatter.draft;

  let createdPost;

  try {
    const profile = await client.ownProfile();
    if (typeof profile?.createPost === 'function') {
      createdPost = await profile.createPost({
        title: converted.metadata.title,
        body: fullBody,
        isDraft
      });
    }
  } catch (error) {
    const message = String(error?.message || error);
    if (!/Invalid Full profile response|photo_url|own profile/i.test(message)) {
      throw error;
    }
  }

  // Fallback for clients that don't expose createPost on OwnProfile
  if (!createdPost) {
    createdPost = await createViaDraftEndpoints(client, converted.metadata.title, fullBody, isDraft);
  }

  const normalizedPublicationUrl = publicationUrl.startsWith('http')
    ? publicationUrl
    : `https://${publicationUrl}`;

  const postUrl = createdPost?.canonicalUrl || createdPost?.canonical_url || createdPost?.url;
  if (postUrl) {
    return { url: postUrl };
  }

  if (createdPost?.slug) {
    return { url: `${normalizedPublicationUrl}/p/${createdPost.slug}` };
  }

  return { url: `${normalizedPublicationUrl}/p/${createdPost?.id || ''}` };
}

module.exports = { publish };
