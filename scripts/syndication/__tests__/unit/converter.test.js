const { convertContent, stripShortcodes } = require('../../lib/converter');

describe('converter', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech', 'JavaScript', 'Node.js'],
      image: 'featured.png',
      draft: false
    },
    content: '# Test Content\n\nThis is a test post.\n\n![Test Image](./image.png)',
    permalink: '/posts/test-post/'
  };

  const mockConfig = {
    baseUrl: 'https://www.vaines.org',
    defaults: {
      canonicalNote: 'Originally published at {{url}}'
    }
  };

  describe('convertToDevTo', () => {
    it('should convert post to dev.to format', () => {
      const result = convertContent(mockPost, 'devto', mockConfig);

      expect(result.metadata.title).toBe('Test Post');
      expect(result.metadata.tags).toHaveLength(3);
      expect(result.metadata.canonical_url).toContain('/posts/test-post/');
      expect(result.metadata.published).toBe(true);
      expect(result.content).toContain('Originally published at');
    });

    it('should limit tags to 4 for dev.to', () => {
      const postWithManyTags = {
        ...mockPost,
        frontmatter: {
          ...mockPost.frontmatter,
          categories: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5', 'Tag6']
        }
      };

      const result = convertContent(postWithManyTags, 'devto', mockConfig);
      expect(result.metadata.tags.length).toBeLessThanOrEqual(4);
    });

    it('should handle posts without categories', () => {
      const postWithoutCategories = {
        ...mockPost,
        frontmatter: {
          ...mockPost.frontmatter,
          categories: undefined
        }
      };

      const result = convertContent(postWithoutCategories, 'devto', mockConfig);
      expect(result.metadata.tags).toEqual([]);
    });
  });

  describe('image conversion', () => {
    it('should convert relative image paths to absolute URLs', () => {
      const result = convertContent(mockPost, 'devto', mockConfig);

      expect(result.content).toContain('https://www.vaines.org/posts/test-post/image.png');
      expect(result.content).not.toContain('./image.png');
    });

    it('should handle image paths without ./ prefix', () => {
      const postWithoutPrefix = {
        ...mockPost,
        content: '# Test\n\n![Image](image.png)'
      };

      const result = convertContent(postWithoutPrefix, 'devto', mockConfig);
      expect(result.content).toContain('https://www.vaines.org/posts/test-post/image.png');
    });
  });

  describe('convertToMedium', () => {
    it('should set draft status correctly', () => {
      const draftPost = {
        ...mockPost,
        frontmatter: { ...mockPost.frontmatter, draft: true }
      };

      const result = convertContent(draftPost, 'medium', mockConfig);
      expect(result.metadata.publishStatus).toBe('draft');
    });

    it('should set public status for non-draft posts', () => {
      const result = convertContent(mockPost, 'medium', mockConfig);
      expect(result.metadata.publishStatus).toBe('public');
    });
  });

  describe('convertToHashnode', () => {
    it('should include cover image if present', () => {
      const result = convertContent(mockPost, 'hashnode', mockConfig);
      expect(result.metadata.coverImageUrl).toContain('featured.png');
    });

    it('should handle posts without cover image', () => {
      const postWithoutImage = {
        ...mockPost,
        frontmatter: { ...mockPost.frontmatter, image: undefined }
      };

      const result = convertContent(postWithoutImage, 'hashnode', mockConfig);
      expect(result.metadata.coverImageUrl).toBeUndefined();
    });
  });

  describe('convertToMicroblog', () => {
    it('should create thread-style posts for Twitter/Mastodon/Bluesky', () => {
      const result = convertContent(mockPost, 'twitter', mockConfig);

      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0]).toContain('Test Post');
      expect(result.content[result.content.length - 1]).toContain('https://www.vaines.org');
    });
  });

  describe('default platform', () => {
    it('should return content with canonical URL for unknown platforms', () => {
      const result = convertContent(mockPost, 'unknown-platform', mockConfig);

      expect(result.content).toBeDefined();
      expect(result.metadata.canonicalUrl).toBe('https://www.vaines.org/posts/test-post/');
    });
  });

  describe('stripShortcodes', () => {
    it('should remove Hugo shortcodes from content', () => {
      const content = 'Some text {{< figure src="image.png" >}} more text {{< youtube abc123 >}}';
      const result = stripShortcodes(content);

      expect(result).toBe('Some text  more text ');
      expect(result).not.toContain('{{<');
      expect(result).not.toContain('>}}');
    });

    it('should leave regular content unchanged', () => {
      const content = 'Normal markdown content with no shortcodes';
      const result = stripShortcodes(content);

      expect(result).toBe(content);
    });
  });
});
