const path = require('path');

/**
 * Convert Hugo markdown content to platform-specific format
 * @param {object} post - Post object with frontmatter and content
 * @param {string} platform - Target platform (devto, medium, etc.)
 * @param {object} config - Syndication config from package.json
 * @returns {object} - Converted content and metadata
 */
function convertContent(post, platform, config) {
  const { content, frontmatter, permalink } = post;
  const canonicalUrl = `${config.baseUrl}${permalink}`;

  // Add canonical note at the top
  const canonicalNote = config.defaults.canonicalNote.replace('{{url}}', canonicalUrl);
  const contentWithNote = `> ${canonicalNote}\n\n${content}`;

  // Convert relative image paths to absolute URLs
  const contentWithAbsoluteImages = contentWithNote.replace(
    /!\[(.*?)\]\(((?!http)[^)]+)\)/g,
    (match, alt, imagePath) => {
      // Handle both ./image.png and image.png
      const cleanPath = imagePath.startsWith('./') ? imagePath.slice(2) : imagePath;
      const absoluteUrl = `${config.baseUrl}${permalink}${cleanPath}`;
      return `![${alt}](${absoluteUrl})`;
    }
  );

  // Platform-specific conversions
  switch (platform) {
    case 'devto':
      return convertToDevTo(contentWithAbsoluteImages, frontmatter, canonicalUrl);

    case 'medium':
      return convertToMedium(contentWithAbsoluteImages, frontmatter, canonicalUrl);

    case 'hashnode':
      return convertToHashnode(contentWithAbsoluteImages, frontmatter, canonicalUrl);

    case 'twitter':
    case 'mastodon':
    case 'bluesky':
      return convertToMicroblog(contentWithAbsoluteImages, frontmatter, canonicalUrl);

    default:
      return {
        content: contentWithAbsoluteImages,
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
 * Convert to Medium format
 */
function convertToMedium(content, frontmatter, canonicalUrl) {
  // Medium uses HTML-like format
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
  // Extract first paragraph or create summary
  const firstPara = content.split('\n\n')[0].replace(/^>\s.*\n\n/, '').trim();
  const summary = firstPara.length > 200
    ? firstPara.substring(0, 200) + '...'
    : firstPara;

  // Create thread-style post
  const thread = [
    `${frontmatter.title}\n\n${summary}`,
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
