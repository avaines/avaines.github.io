const nock = require('nock');
const { publish } = require('../../../services/devto');

describe('dev.to service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech', 'JavaScript'],
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
    process.env.DEVTO_API_KEY = 'test-api-key';
    delete process.env.SYNDICATION_DRY_RUN;
  });

  afterEach(() => {
    nock.cleanAll();
    delete process.env.DEVTO_API_KEY;
  });

  it('should publish article successfully', async () => {
    nock('https://dev.to')
      .post('/api/articles')
      .reply(201, {
        url: 'https://dev.to/test/test-post',
        id: 123
      });

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toBe('https://dev.to/test/test-post');
  });

  it('should throw error if API key is missing', async () => {
    delete process.env.DEVTO_API_KEY;

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('DEVTO_API_KEY');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('dev.to');
    expect(result.url).toContain('preview');
  });

  it('should handle API errors gracefully', async () => {
    nock('https://dev.to')
      .post('/api/articles')
      .reply(429, { error: 'Rate limited' });

    await expect(publish(mockPost, mockConfig)).rejects.toThrow();
  });
});
