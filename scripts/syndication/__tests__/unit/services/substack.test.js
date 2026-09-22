const { publish } = require('../../../services/substack');

jest.mock('substack-api', () => ({
  SubstackClient: jest.fn()
}));

const { SubstackClient } = require('substack-api');

describe('Substack service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech'],
      image: 'featured.png',
      draft: false
    },
    content: '# Test Content\n\nThis is a test.',
    permalink: '/posts/test-post/'
  };

  const mockConfig = {
    baseUrl: 'https://www.vaines.org',
    defaults: {
      canonicalNote: 'Originally published at {{url}}'
    }
  };

  beforeEach(() => {
    process.env.SUBSTACK_TOKEN = 'test-token';
    process.env.SUBSTACK_PUBLICATION_URL = 'testpub.substack.com';
    delete process.env.SYNDICATION_DRY_RUN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SUBSTACK_TOKEN;
    delete process.env.SUBSTACK_PUBLICATION_URL;
  });

  it('should throw error if credentials are missing', async () => {
    delete process.env.SUBSTACK_TOKEN;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('SUBSTACK_TOKEN');

    process.env.SUBSTACK_TOKEN = 'test-token';
    delete process.env.SUBSTACK_PUBLICATION_URL;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('SUBSTACK_PUBLICATION_URL');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('substack.com');
    expect(result.url).toContain('preview');
  });

  it('publishes through drafts without requiring a global profile lookup', async () => {
    const ownProfile = jest.fn().mockRejectedValue(new Error('HTTP 401'));
    const post = jest.fn()
      .mockResolvedValueOnce({ id: 123456 })
      .mockResolvedValueOnce({ canonical_url: 'https://testpub.substack.com/p/test-post' });
    SubstackClient.mockImplementation(() => ({
      ownProfile,
      publicationClient: { post }
    }));
    const result = await publish(mockPost, mockConfig);
    expect(ownProfile).not.toHaveBeenCalled();
    expect(post).toHaveBeenNthCalledWith(1, '/drafts', expect.objectContaining({
      draft_title: 'Test Post',
      draft_body: expect.stringContaining('![Test Post](https://www.vaines.org/posts/test-post/featured.png)'),
      should_send_email: false
    }));
    expect(post).toHaveBeenNthCalledWith(2, '/drafts/123456/publish', { should_send_email: false });
    expect(result.url).toBe('https://testpub.substack.com/p/test-post');
  });

  it('does not publish posts marked as drafts', async () => {
    const post = jest.fn().mockResolvedValue({ id: 123, slug: 'test-post' });
    SubstackClient.mockImplementation(() => ({ publicationClient: { post } }));
    await publish({ ...mockPost, frontmatter: { ...mockPost.frontmatter, draft: true } }, mockConfig);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe('/drafts');
  });

  it('identifies draft rejection without leaking response or request secrets', async () => {
    const error = Object.assign(new Error('Request failed with status code 403'), {
      response: { status: 403, headers: {}, data: 'secret-response' },
      config: { headers: { Cookie: 'secret-cookie' } }
    });
    SubstackClient.mockImplementation(() => ({
      ownProfile: jest.fn().mockResolvedValue({}),
      publicationClient: { post: jest.fn().mockRejectedValue(error) }
    }));
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('create draft failed (HTTP 403)');
    await expect(publish(mockPost, mockConfig)).rejects.not.toThrow('secret');
  });

  it('uses the returned publication slug for the post URL', async () => {
    const postMock = jest.fn()
      .mockResolvedValueOnce({
        id: 987654,
        draft_title: 'Test Post'
      })
      .mockResolvedValueOnce({
        id: 987654,
        slug: 'fallback-post'
      });

    SubstackClient.mockImplementation(() => ({
      ownProfile: jest.fn().mockRejectedValue(
        new Error('Failed to get own profile: Invalid Full profile response: photo_url null')
      ),
      publicationClient: {
        post: postMock
      }
    }));

    const result = await publish(mockPost, mockConfig);

    expect(postMock).toHaveBeenNthCalledWith(1, '/drafts', expect.objectContaining({
      draft_title: 'Test Post',
      draft_body: expect.stringContaining('![Test Post](https://www.vaines.org/posts/test-post/featured.png)'),
      should_send_email: false
    }));
    expect(postMock).toHaveBeenNthCalledWith(2, '/drafts/987654/publish', expect.objectContaining({
      should_send_email: false
    }));
    expect(result.url).toBe('https://testpub.substack.com/p/fallback-post');
  });
});
