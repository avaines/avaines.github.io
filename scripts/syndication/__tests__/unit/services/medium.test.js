const nock = require('nock');
const { publish } = require('../../../services/medium');

describe('Medium service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech', 'JavaScript', 'Testing'],
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
    process.env.MEDIUM_TOKEN = 'test-token';
    delete process.env.SYNDICATION_DRY_RUN;
  });

  afterEach(() => {
    nock.cleanAll();
    delete process.env.MEDIUM_TOKEN;
  });

  it('should throw error if token is missing', async () => {
    delete process.env.MEDIUM_TOKEN;

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('MEDIUM_TOKEN');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('medium.com');
    expect(result.url).toContain('preview');
  });

  it('should get user ID and publish article', async () => {
    nock('https://api.medium.com')
      .get('/v1/me')
      .reply(200, {
        data: {
          id: 'user123',
          username: 'testuser'
        }
      });

    nock('https://api.medium.com')
      .post('/v1/users/user123/posts')
      .reply(201, {
        data: {
          url: 'https://medium.com/@testuser/test-post',
          id: 'post123'
        }
      });

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toBe('https://medium.com/@testuser/test-post');
  });

  it('should handle API errors', async () => {
    nock('https://api.medium.com')
      .get('/v1/me')
      .reply(401, { errors: [{ message: 'Unauthorized' }] });

    await expect(publish(mockPost, mockConfig)).rejects.toThrow();
  });

  it('should include canonical URL in post', async () => {
    nock('https://api.medium.com')
      .get('/v1/me')
      .reply(200, { data: { id: 'user123' } });

    nock('https://api.medium.com')
      .post('/v1/users/user123/posts', (body) => {
        expect(body.canonicalUrl).toBe('https://www.vaines.org/posts/test-post/');
        return true;
      })
      .reply(201, { data: { url: 'https://medium.com/test' } });

    await publish(mockPost, mockConfig);
  });
});
