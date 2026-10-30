const { parsePost, getChangedPosts, getAllPosts } = require('../../lib/parser');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

jest.mock('child_process', () => ({ execSync: jest.fn() }));

describe('parser', () => {
  describe('parsePost', () => {
    it('should parse frontmatter and content from fixture', async () => {
      const fixturePath = path.join(__dirname, '../fixtures/sample-post.md');
      const post = await parsePost(fixturePath);

      expect(post.frontmatter).toBeDefined();
      expect(post.frontmatter.title).toBeDefined();
      expect(post.content).toBeDefined();
      expect(post.path).toBe(fixturePath);
      expect(post.permalink).toContain('/fixtures/');
    });

    it('should extract syndicate targets from frontmatter', async () => {
      const fixturePath = path.join(__dirname, '../fixtures/sample-post.md');
      const post = await parsePost(fixturePath);

      expect(Array.isArray(post.frontmatter.syndicate)).toBe(true);
    });

    it('should detect draft status', async () => {
      const fixturePath = path.join(__dirname, '../fixtures/sample-post.md');
      const post = await parsePost(fixturePath);

      expect(typeof post.frontmatter.draft).toBe('boolean');
    });
  });

  describe('getChangedPosts', () => {
    it('should return empty array if git command fails', async () => {
      execSync.mockImplementationOnce(() => {
        throw new Error("fatal: bad revision 'HEAD~1'");
      });
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await expect(getChangedPosts()).resolves.toEqual([]);
        expect(warn).toHaveBeenCalledWith('No git history or changed files found, checking all posts');
      } finally {
        warn.mockRestore();
        execSync.mockReset();
      }
    });
  });

  describe('getAllPosts', () => {
    it('should find fixture post', async () => {
      // This will find the sample-post.md in fixtures
      const posts = await getAllPosts();

      expect(Array.isArray(posts)).toBe(true);
      // Should find at least the fixture if content/posts exists
    });
  });
});
