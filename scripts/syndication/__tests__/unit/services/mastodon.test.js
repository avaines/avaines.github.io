const axios = require('axios');
const { publish } = require('../../../services/mastodon');

jest.mock('axios');

describe('Mastodon service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech'],
      draft: false
    },
    content: '# Test Content\n\nThis is a test post.',
    permalink: '/posts/test-post/'
  };

  const mockConfig = {
    baseUrl: 'https://www.vaines.org',
    defaults: {
      canonicalNote: 'Originally published at {{url}}'
    }
  };

  beforeEach(() => {
    process.env.MASTODON_ACCESS_TOKEN = 'test-token';
    process.env.MASTODON_INSTANCE = 'mastodon.social';
    delete process.env.SYNDICATION_DRY_RUN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.MASTODON_ACCESS_TOKEN;
    delete process.env.MASTODON_INSTANCE;
  });

  it('should throw error if access token is missing', async () => {
    delete process.env.MASTODON_ACCESS_TOKEN;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('MASTODON_ACCESS_TOKEN');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('mastodon.social');
    expect(result.url).toContain('preview');
  });

  it('should use default instance if not specified', async () => {
    delete process.env.MASTODON_INSTANCE;
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('mastodon.social');
  });

  it('should create thread posts', async () => {
    axios.post
      .mockResolvedValueOnce({
        data: { id: 'toot1', url: 'https://mastodon.social/@user/toot1' }
      })
      .mockResolvedValueOnce({
        data: { id: 'toot2', url: 'https://mastodon.social/@user/toot2' }
      });

    const result = await publish(mockPost, mockConfig);

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      'https://mastodon.social/api/v1/statuses',
      { status: expect.any(String) },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
      })
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      'https://mastodon.social/api/v1/statuses',
      expect.objectContaining({
        status: expect.any(String),
        in_reply_to_id: 'toot1'
      }),
      expect.any(Object)
    );
    expect(result.url).toBe('https://mastodon.social/@user/toot1');
  });

  it('should handle API errors', async () => {
    axios.post.mockRejectedValue(new Error('Rate limited'));

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('Rate limited');
  });
});
