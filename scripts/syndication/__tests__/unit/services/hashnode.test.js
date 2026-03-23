const nock = require('nock');
const { publish } = require('../../../services/hashnode');

describe('Hashnode service', () => {
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
    process.env.HASHNODE_TOKEN = 'test-token';
    process.env.HASHNODE_PUBLICATION_ID = 'pub123';
    delete process.env.SYNDICATION_DRY_RUN;
  });

  afterEach(() => {
    nock.cleanAll();
    delete process.env.HASHNODE_TOKEN;
    delete process.env.HASHNODE_PUBLICATION_ID;
  });

  it('should throw error if credentials are missing', async () => {
    delete process.env.HASHNODE_TOKEN;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('HASHNODE_TOKEN');

    process.env.HASHNODE_TOKEN = 'test-token';
    delete process.env.HASHNODE_PUBLICATION_ID;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('HASHNODE_PUBLICATION_ID');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('hashnode.com');
    expect(result.url).toContain('preview');
  });

  it('should publish via GraphQL API', async () => {
    nock('https://api.hashnode.com')
      .post('/', (body) => {
        expect(body.query).toContain('mutation CreatePost');
        expect(body.variables.input.title).toBe('Test Post');
        expect(body.variables.input.canonicalUrl).toBe('https://www.vaines.org/posts/test-post/');
        return true;
      })
      .reply(200, {
        data: {
          createPublicationStory: {
            post: {
              slug: 'test-post',
              url: 'https://blog.hashnode.dev/test-post'
            }
          }
        }
      });

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toBe('https://blog.hashnode.dev/test-post');
  });

  it('should handle GraphQL errors', async () => {
    nock('https://api.hashnode.com')
      .post('/')
      .reply(200, {
        errors: [
          { message: 'Publication not found' }
        ]
      });

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('Hashnode API error');
  });

  it('should convert categories to tag format', async () => {
    nock('https://api.hashnode.com')
      .post('/', (body) => {
        const tags = body.variables.input.tags;
        expect(Array.isArray(tags)).toBe(true);
        expect(tags[0]).toHaveProperty('name');
        expect(tags[0]).toHaveProperty('slug');
        return true;
      })
      .reply(200, {
        data: {
          createPublicationStory: {
            post: { url: 'https://blog.hashnode.dev/test' }
          }
        }
      });

    await publish(mockPost, mockConfig);
  });
});
