const { publish } = require('../../../services/lobsters');

jest.mock('lob-story');
const lob = require('lob-story');

describe('Lobste.rs service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech', 'JavaScript'],
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
    process.env.LOBSTERS_USERNAME = 'testuser';
    process.env.LOBSTERS_PASSWORD = 'testpass';
    delete process.env.SYNDICATION_DRY_RUN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.LOBSTERS_USERNAME;
    delete process.env.LOBSTERS_PASSWORD;
  });

  it('should throw error if credentials are missing', async () => {
    delete process.env.LOBSTERS_USERNAME;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('LOBSTERS_USERNAME');

    process.env.LOBSTERS_USERNAME = 'testuser';
    delete process.env.LOBSTERS_PASSWORD;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('LOBSTERS_PASSWORD');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('lobste.rs');
    expect(lob).not.toHaveBeenCalled();
  });

  it('should publish story successfully', async () => {
    lob.mockImplementation((options, done) => {
      done(null, {}, '', 'https://lobste.rs/s/abc123/test-post');
    });

    const result = await publish(mockPost, mockConfig);

    expect(lob).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        password: 'testpass',
        title: 'Test Post',
        url: 'https://www.vaines.org/posts/test-post/',
        author: true
      }),
      expect.any(Function)
    );
    expect(result.url).toBe('https://lobste.rs/s/abc123/test-post');
  });

  it('should limit tags to 5 and lowercase them', async () => {
    lob.mockImplementation((options, done) => {
      done(null, {}, '', 'https://lobste.rs/s/abc123/test-post');
    });

    const manyTagPost = {
      ...mockPost,
      frontmatter: {
        ...mockPost.frontmatter,
        categories: ['Tag One', 'Tag Two', 'Tag Three', 'Tag Four', 'Tag Five', 'Tag Six']
      }
    };

    await publish(manyTagPost, mockConfig);

    expect(lob).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.arrayContaining(['tag-one', 'tag-two'])
      }),
      expect.any(Function)
    );
    expect(lob.mock.calls[0][0].tags).toHaveLength(5);
  });

  it('should handle API errors', async () => {
    lob.mockImplementation((options, done) => {
      done(new Error('Authentication failed'), null, null, null);
    });

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('Authentication failed');
  });
});
