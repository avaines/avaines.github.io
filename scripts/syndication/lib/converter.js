/**
 * Convert Hugo markdown content to platform-specific format
 * @param {object} post - Post object with frontmatter and content
 * @param {string} platform - Target platform (devto, substack, etc.)
 * @param {object} config - Syndication config from package.json
 * @returns {object} - Converted content and metadata
 */
function convertContent(post, platform, config) {
  const { content, frontmatter, permalink } = post;
  const canonicalUrl = `${config.baseUrl}${permalink}`;

  // Convert relative image paths to absolute URLs on original content
  const contentWithAbsoluteImages = content.replace(
    /!\[(.*?)\]\(((?!http)[^)]+)\)/g,
    (match, alt, imagePath) => {
      // Handle both ./image.png and image.png
      const cleanPath = imagePath.startsWith('./') ? imagePath.slice(2) : imagePath;
      const absoluteUrl = `${config.baseUrl}${permalink}${cleanPath}`;
      return `![${alt}](${absoluteUrl})`;
    }
  );

  // Add canonical note at the top
  const canonicalNote = config.defaults.canonicalNote.replace('{{url}}', canonicalUrl);
  const contentWithCanonicalNote = `> ${canonicalNote}\n\n${contentWithAbsoluteImages}`;

  // Platform-specific conversions
  switch (platform) {
    case 'devto':
      return convertToDevTo(contentWithCanonicalNote, frontmatter, canonicalUrl);

    case 'substack':
      return convertToLongform(contentWithCanonicalNote, frontmatter, canonicalUrl);

    case 'hashnode':
      return convertToHashnode(contentWithCanonicalNote, frontmatter, canonicalUrl);

    case 'twitter':
    case 'mastodon':
    case 'bluesky':
      return convertToMicroblog(contentWithAbsoluteImages, frontmatter, canonicalUrl);

    default:
      return {
        content: contentWithCanonicalNote,
        metadata: { canonicalUrl }
      };
  }
}

/**
 * Convert to dev.to format
 */
function convertToDevTo(content, frontmatter, canonicalUrl) {
  // dev.to uses frontmatter
  const tags = (frontmatter.categories || [])
    .slice(0, 4) // dev.to allows max 4 tags
    .map(tag => tag.toLowerCase().replace(/\s+/g, ''));

  return {
    content,
    metadata: {
      title: frontmatter.title,
      tags,
      published: !frontmatter.draft,
      canonical_url: canonicalUrl,
      main_image: frontmatter.image ? `${canonicalUrl}${frontmatter.image}` : undefined
    }
  };
}

/**
 * Convert to longform article format
 */
function convertToLongform(content, frontmatter, canonicalUrl) {
  return {
    content,
    metadata: {
      title: frontmatter.title,
      contentFormat: 'markdown',
      canonicalUrl,
      tags: (frontmatter.categories || []).slice(0, 5),
      publishStatus: frontmatter.draft ? 'draft' : 'public'
    }
  };
}

/**
 * Convert to Hashnode format
 */
function convertToHashnode(content, frontmatter, canonicalUrl) {
  return {
    content,
    metadata: {
      title: frontmatter.title,
      tags: (frontmatter.categories || []).map(tag => ({
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, '-')
      })),
      canonicalUrl,
      coverImageUrl: frontmatter.image ? `${canonicalUrl}${frontmatter.image}` : undefined
    }
  };
}

/**
 * Convert to microblog format (Twitter, Mastodon, Bluesky)
 */
function convertToMicroblog(content, frontmatter, canonicalUrl) {
  // Extract first non-empty paragraph and sanitize common markdown prefix
  const firstPara = content
    .split('\n\n')
    .map(p => p.trim())
    .find(Boolean) || '';

  const normalizedFirstPara = firstPara
    .replace(/^#{1,6}\s+/, '')
    .trim();

  const summary = normalizedFirstPara.length > 200
    ? normalizedFirstPara.substring(0, 200) + '...'
    : normalizedFirstPara;

  const firstPost = summary
    ? `${frontmatter.title}\n\n${summary}`
    : frontmatter.title;

  // Create thread-style post
  const thread = [
    firstPost,
    `Read more: ${canonicalUrl}`
  ];

  return {
    content: thread,
    metadata: {
      title: frontmatter.title,
      url: canonicalUrl
    }
  };
}

/**
 * Strip Hugo shortcodes from content
 */
function stripShortcodes(content) {
  return content.replace(/\{\{<.*?>\}\}/g, '');
}

module.exports = {
  convertContent,
  stripShortcodes
};
