const { TwitterApi } = require('twitter-api-v2');
const { publish } = require('../../../services/twitter');

// Mock the TwitterApi
jest.mock('twitter-api-v2', () => ({
  TwitterApi: jest.fn()
}));

describe('Twitter service', () => {
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
    process.env.TWITTER_APP_KEY = 'app-key';
    process.env.TWITTER_APP_SECRET = 'app-secret';
    process.env.TWITTER_ACCESS_TOKEN = 'access-token';
    process.env.TWITTER_ACCESS_SECRET = 'access-secret';
    delete process.env.SYNDICATION_DRY_RUN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.TWITTER_APP_KEY;
    delete process.env.TWITTER_APP_SECRET;
    delete process.env.TWITTER_ACCESS_TOKEN;
    delete process.env.TWITTER_ACCESS_SECRET;
  });

  it('should throw error if credentials are missing', async () => {
    delete process.env.TWITTER_APP_KEY;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('Twitter API credentials');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('twitter.com');
    expect(result.url).toContain('preview');
  });

  it('should create thread posts', async () => {
    const mockTweet = jest.fn()
      .mockResolvedValueOnce({ data: { id: 'tweet1' } })
      .mockResolvedValueOnce({ data: { id: 'tweet2' } });

    const mockMe = jest.fn().mockResolvedValue({
      data: { username: 'testuser' }
    });

    TwitterApi.mockImplementation(() => ({
      v2: {
        tweet: mockTweet,
        me: mockMe
      }
    }));

    const result = await publish(mockPost, mockConfig);

    expect(mockTweet).toHaveBeenCalledTimes(2);
    expect(result.url).toBe('https://twitter.com/testuser/status/tweet1');
  });

  it('should create threaded replies', async () => {
    const mockTweet = jest.fn()
      .mockResolvedValueOnce({ data: { id: 'tweet1' } })
      .mockResolvedValueOnce({ data: { id: 'tweet2' } });

    const mockMe = jest.fn().mockResolvedValue({
      data: { username: 'testuser' }
    });

    TwitterApi.mockImplementation(() => ({
      v2: {
        tweet: mockTweet,
        me: mockMe
      }
    }));

    await publish(mockPost, mockConfig);

    // First tweet should not have reply
    expect(mockTweet).toHaveBeenNthCalledWith(1, expect.objectContaining({
      text: expect.any(String),
      reply: undefined
    }));

    // Second tweet should reply to first
    expect(mockTweet).toHaveBeenNthCalledWith(2, expect.objectContaining({
      text: expect.any(String),
      reply: { in_reply_to_tweet_id: 'tweet1' }
    }));
  });
});
