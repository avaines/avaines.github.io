const { publish } = require('../../../services/substack');
const nock = require('nock');

describe('Substack service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech'],
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
    process.env.SUBSTACK_API_KEY = 'test-key';
    process.env.SUBSTACK_PUBLICATION_ID = 'pub123';
    delete process.env.SYNDICATION_DRY_RUN;
  });

  afterEach(() => {
    nock.cleanAll();
    delete process.env.SUBSTACK_API_KEY;
    delete process.env.SUBSTACK_PUBLICATION_ID;
  });

  it('should throw error if credentials are missing', async () => {
    delete process.env.SUBSTACK_API_KEY;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('SUBSTACK_API_KEY');

    process.env.SUBSTACK_API_KEY = 'test-key';
    delete process.env.SUBSTACK_PUBLICATION_ID;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('SUBSTACK_PUBLICATION_ID');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('substack.com');
    expect(result.url).toContain('preview');
  });

  it('should publish article successfully', async () => {
    nock('https://api.substack.com')
      .post('/v1/posts', (body) => {
        expect(body.publication_id).toBe('pub123');
        expect(body.title).toBe('Test Post');
        expect(body.canonical_url).toBe('https://www.vaines.org/posts/test-post/');
        return true;
      })
      .reply(201, {
        web_url: 'https://testpub.substack.com/p/test-post'
      });

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toBe('https://testpub.substack.com/p/test-post');
  });

  it('should handle API errors', async () => {
    nock('https://api.substack.com')
      .post('/v1/posts')
      .reply(403, { error: 'Forbidden' });

    await expect(publish(mockPost, mockConfig)).rejects.toThrow();
  });
});
