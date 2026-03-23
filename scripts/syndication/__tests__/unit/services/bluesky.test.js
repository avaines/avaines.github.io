const { BskyAgent } = require('@atproto/api');
const { publish } = require('../../../services/bluesky');

// Mock the BskyAgent
jest.mock('@atproto/api', () => ({
  BskyAgent: jest.fn()
}));

describe('Bluesky service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech'],
      draft: false
    },
    content: '# Test Content\n\nThis is a test post with some content.',
    permalink: '/posts/test-post/'
  };

  const mockConfig = {
    baseUrl: 'https://www.vaines.org',
    defaults: {
      canonicalNote: 'Originally published at {{url}}'
    }
  };

  beforeEach(() => {
    process.env.BLUESKY_HANDLE = 'test.bsky.social';
    process.env.BLUESKY_PASSWORD = 'test-password';
    delete process.env.SYNDICATION_DRY_RUN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.BLUESKY_HANDLE;
    delete process.env.BLUESKY_PASSWORD;
  });

  it('should throw error if credentials are missing', async () => {
    delete process.env.BLUESKY_HANDLE;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('BLUESKY_HANDLE');

    process.env.BLUESKY_HANDLE = 'test.bsky.social';
    delete process.env.BLUESKY_PASSWORD;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('BLUESKY_PASSWORD');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('bsky.app');
    expect(result.url).toContain('test.bsky.social');
  });

  it('should create thread posts', async () => {
    const mockLogin = jest.fn().mockResolvedValue({});
    const mockPostMethod = jest.fn()
      .mockResolvedValueOnce({ uri: 'at://did/post1', cid: 'cid1' })
      .mockResolvedValueOnce({ uri: 'at://did/post2', cid: 'cid2' });

    BskyAgent.mockImplementation(() => ({
      login: mockLogin,
      post: mockPostMethod
    }));

    const result = await publish(mockPost, mockConfig);

    expect(mockLogin).toHaveBeenCalledWith({
      identifier: 'test.bsky.social',
      password: 'test-password'
    });
    expect(mockPostMethod).toHaveBeenCalledTimes(2); // Thread with 2 posts
    expect(result.url).toContain('bsky.app/profile/test.bsky.social/post/');
  });

  it('should create thread with reply structure', async () => {
    const mockLogin = jest.fn().mockResolvedValue({});
    const mockPostFn = jest.fn()
      .mockResolvedValueOnce({ uri: 'at://did/post1', cid: 'cid1' })
      .mockResolvedValueOnce({ uri: 'at://did/post2', cid: 'cid2' });

    BskyAgent.mockImplementation(() => ({
      login: mockLogin,
      post: mockPostFn
    }));

    await publish(mockPost, mockConfig);

    // First post should not have reply
    expect(mockPostFn).toHaveBeenNthCalledWith(1, expect.objectContaining({
      text: expect.any(String),
      reply: undefined
    }));

    // Second post should reply to first
    expect(mockPostFn).toHaveBeenNthCalledWith(2, expect.objectContaining({
      text: expect.any(String),
      reply: expect.objectContaining({
        root: expect.objectContaining({ uri: 'at://did/post1' }),
        parent: expect.objectContaining({ uri: 'at://did/post1' })
      })
    }));
  });
});
