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

function describeRequestError(error, operation) {
  const status = error?.response?.status
    || Number(String(error?.message).match(/status code (\d{3})/)?.[1]);
  if (!status) return error;

  const headers = error?.response?.headers || {};
  const challenge = headers['cf-mitigated'] === 'challenge';
  const detail = challenge
    ? 'Substack returned a Cloudflare challenge; this does not establish whether the session is valid.'
    : status === 401 || status === 403
      ? 'Substack rejected the session or publication access. Verify the session in the browser and that its account can manage the configured publication.'
      : 'Substack rejected the request.';

  // Never include Axios request config, cookies, or response bodies in CLI errors.
  return new Error(`Substack ${operation} failed (HTTP ${status}). ${detail}`);
}

async function requestWithContext(operation, request) {
  try {
    return await request();
  } catch (error) {
    throw describeRequestError(error, operation);
  }
}

async function createViaDraftEndpoints(client, title, body, isDraft) {
  const createdDraft = await requestWithContext('create draft', () => client.publicationClient.post('/drafts', {
    type: 'newsletter',
    audience: 'everyone',
    draft_bylines: [],
    draft_title: title,
    draft_subtitle: '',
    draft_body: body,
    should_send_email: false
  }));

  if (isDraft) {
    return createdDraft;
  }

  return requestWithContext('publish draft', () => client.publicationClient.post(`/drafts/${createdDraft.id}/publish`, {
    should_send_email: false
  }));
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

  // substack-api v4 OwnProfile supports Notes, not longform createPost.
  // Publication drafts do not require a global profile lookup.
  const createdPost = await createViaDraftEndpoints(
    client, converted.metadata.title, fullBody, isDraft
  );

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
