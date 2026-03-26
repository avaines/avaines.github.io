const { publish } = require('../../../services/substack');

jest.mock('substack-api', () => ({
  SubstackClient: jest.fn()
}));

const { SubstackClient } = require('substack-api');

describe('Substack service', () => {
  const mockPost = {
    frontmatter: {
      title: 'Test Post',
      categories: ['Tech'],
      image: 'featured.png',
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
    process.env.SUBSTACK_TOKEN = 'test-token';
    process.env.SUBSTACK_PUBLICATION_URL = 'testpub.substack.com';
    delete process.env.SYNDICATION_DRY_RUN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SUBSTACK_TOKEN;
    delete process.env.SUBSTACK_PUBLICATION_URL;
  });

  it('should throw error if credentials are missing', async () => {
    delete process.env.SUBSTACK_TOKEN;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('SUBSTACK_TOKEN');

    process.env.SUBSTACK_TOKEN = 'test-token';
    delete process.env.SUBSTACK_PUBLICATION_URL;
    await expect(publish(mockPost, mockConfig)).rejects.toThrow('SUBSTACK_PUBLICATION_URL');
  });

  it('should handle dry run mode', async () => {
    process.env.SYNDICATION_DRY_RUN = 'true';

    const result = await publish(mockPost, mockConfig);
    expect(result.url).toContain('substack.com');
    expect(result.url).toContain('preview');
  });

  it('should publish article successfully', async () => {
    const createPostMock = jest.fn().mockResolvedValue({
      id: 123456,
      canonicalUrl: 'https://testpub.substack.com/p/test-post'
    });

    SubstackClient.mockImplementation(() => ({
      ownProfile: jest.fn().mockResolvedValue({
        createPost: createPostMock
      })
    }));

    const result = await publish(mockPost, mockConfig);

    expect(SubstackClient).toHaveBeenCalledWith({
      token: 'test-token',
      publicationUrl: 'testpub.substack.com'
    });
    expect(createPostMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Post',
      isDraft: false,
      body: expect.stringContaining('![Test Post](https://www.vaines.org/posts/test-post/featured.png)')
    }));
    expect(result.url).toBe('https://testpub.substack.com/p/test-post');
  });

  it('should handle API errors', async () => {
    const ownProfileMock = jest.fn().mockRejectedValue(new Error('Authentication failed'));

    SubstackClient.mockImplementation(() => ({
      ownProfile: ownProfileMock
    }));

    await expect(publish(mockPost, mockConfig)).rejects.toThrow('Authentication failed');
  });

  it('should fallback to publication client when own profile decoding fails', async () => {
    const postMock = jest.fn()
      .mockResolvedValueOnce({
        id: 987654,
        draft_title: 'Test Post'
      })
      .mockResolvedValueOnce({
        id: 987654,
        slug: 'fallback-post'
      });

    SubstackClient.mockImplementation(() => ({
      ownProfile: jest.fn().mockRejectedValue(
        new Error('Failed to get own profile: Invalid Full profile response: photo_url null')
      ),
      publicationClient: {
        post: postMock
      }
    }));

    const result = await publish(mockPost, mockConfig);

    expect(postMock).toHaveBeenNthCalledWith(1, '/drafts', expect.objectContaining({
      draft_title: 'Test Post',
      draft_body: expect.stringContaining('![Test Post](https://www.vaines.org/posts/test-post/featured.png)'),
      should_send_email: false
    }));
    expect(postMock).toHaveBeenNthCalledWith(2, '/drafts/987654/publish', expect.objectContaining({
      should_send_email: false
    }));
    expect(result.url).toBe('https://testpub.substack.com/p/fallback-post');
  });
});
