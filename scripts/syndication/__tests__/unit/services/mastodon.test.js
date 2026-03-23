const Mastodon = require('mastodon-api');
const { publish } = require('../../../services/mastodon');

// Mock the Mastodon API
jest.mock('mastodon-api', () => {
  return jest.fn();
});

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
    const mockPostFn = jest.fn((endpoint, params, callback) => {
      if (!params.in_reply_to_id) {
        callback(null, { id: 'toot1', url: 'https://mastodon.social/@user/toot1' });
      } else {
        callback(null, { id: 'toot2', url: 'https://mastodon.social/@user/toot2' });
      }
    });

    Mastodon.mockImplementation(() => ({
      post: mockPostFn
    }));

    const result = await publish(mockPost, mockConfig);

    expect(mockPostFn).toHaveBeenCalledTimes(2);
    expect(result.url).toBe('https://mastodon.social/@user/toot1');
  });

  it('should handle API errors', async () => {
    const mockPostFn = jest.fn((endpoint, params, callback) => {
      callback(new Error('Rate limited'));
    });

    Mastodon.mockImplementation(() => ({
      post: mockPostFn
    }));

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('Rate limited');
  });
});
