const axios = require('axios');
const { publish } = require('../../../services/devto');

jest.mock('axios');

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
    jest.resetAllMocks();
    process.env.DEVTO_API_KEY = 'test-api-key';
    delete process.env.SYNDICATION_DRY_RUN;
  });

  afterEach(() => {
    delete process.env.DEVTO_API_KEY;
    delete process.env.SYNDICATION_DRY_RUN;
  });

  it('should publish article successfully', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        url: 'https://dev.to/test/test-post',
        id: 123
      }
    });

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toBe('https://dev.to/test/test-post');
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      'https://dev.to/api/articles',
      {
        article: {
          title: 'Test Post',
          body_markdown: '> Originally published at https://www.vaines.org/posts/test-post/\n\n# Test Content\n\nThis is a test.',
          published: true,
          canonical_url: 'https://www.vaines.org/posts/test-post/',
          tags: ['tech', 'javascript'],
          main_image: undefined
        }
      },
      { headers: { 'api-key': 'test-api-key', 'Content-Type': 'application/json' } }
    );
  });

  it('should throw error if API key is missing', async () => {
    delete process.env.DEVTO_API_KEY;

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('DEVTO_API_KEY');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('dev.to');
    expect(result.url).toContain('preview');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const error = Object.assign(new Error('Rate limited'), { response: { status: 429 } });
    axios.post.mockRejectedValueOnce(error);

    await expect(publish(mockPost, mockConfig)).rejects.toBe(error);
  });
});
