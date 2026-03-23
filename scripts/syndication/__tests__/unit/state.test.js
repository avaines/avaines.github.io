const fs = require('fs').promises;
const path = require('path');
const {
  loadState,
  saveState,
  isSyndicated,
  recordSyndication,
  clearSyndication,
  STATE_FILE
} = require('../../lib/state');

// Mock state file path for testing
const TEST_STATE_FILE = path.join(__dirname, '../fixtures/test-state.json');

describe('state management', () => {
  beforeEach(async () => {
    // Clean up test state file before each test
    try {
      await fs.unlink(TEST_STATE_FILE);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test state file after each test
    try {
      await fs.unlink(TEST_STATE_FILE);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('loadState', () => {
    it('should return empty object if state file does not exist', async () => {
      const state = await loadState();
      expect(state).toEqual({});
    });

    it('should load existing state from file', async () => {
      const testState = {
        'post1.md': {
          devto: { url: 'https://dev.to/test', syndicatedAt: '2026-03-23T00:00:00.000Z' }
        }
      };

      // Write test state
      await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
      await fs.writeFile(STATE_FILE, JSON.stringify(testState), 'utf-8');

      const state = await loadState();
      expect(state).toEqual(testState);

      // Cleanup
      await fs.unlink(STATE_FILE);
    });

    it('should throw error for invalid JSON', async () => {
      await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
      await fs.writeFile(STATE_FILE, 'invalid json{', 'utf-8');

      await expect(loadState()).rejects.toThrow();

      // Cleanup
      await fs.unlink(STATE_FILE);
    });
  });

  describe('saveState', () => {
    it('should save state to file', async () => {
      const testState = {
        'post1.md': {
          medium: { url: 'https://medium.com/test', syndicatedAt: '2026-03-23T00:00:00.000Z' }
        }
      };

      await saveState(testState);

      const saved = await fs.readFile(STATE_FILE, 'utf-8');
      expect(JSON.parse(saved)).toEqual(testState);

      // Cleanup
      await fs.unlink(STATE_FILE);
    });

    it('should create directory if it does not exist', async () => {
      const testState = { test: 'data' };
      await saveState(testState);

      const exists = await fs.access(STATE_FILE).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Cleanup
      await fs.unlink(STATE_FILE);
    });
  });

  describe('isSyndicated', () => {
    it('should return false if post has not been syndicated', () => {
      const state = {};
      expect(isSyndicated(state, 'post1.md', 'devto')).toBe(false);
    });

    it('should return false if post exists but target does not', () => {
      const state = {
        'post1.md': {
          medium: { url: 'https://medium.com/test' }
        }
      };
      expect(isSyndicated(state, 'post1.md', 'devto')).toBe(false);
    });

    it('should return true if post has been syndicated to target', () => {
      const state = {
        'post1.md': {
          devto: { url: 'https://dev.to/test', syndicatedAt: '2026-03-23T00:00:00.000Z' }
        }
      };
      expect(isSyndicated(state, 'post1.md', 'devto')).toBe(true);
    });
  });

  describe('recordSyndication', () => {
    it('should record syndication for new post', () => {
      const state = {};
      const updated = recordSyndication(state, 'post1.md', 'devto', 'https://dev.to/test');

      expect(updated['post1.md']).toBeDefined();
      expect(updated['post1.md'].devto).toBeDefined();
      expect(updated['post1.md'].devto.url).toBe('https://dev.to/test');
      expect(updated['post1.md'].devto.syndicatedAt).toBeDefined();
    });

    it('should record additional syndication target for existing post', () => {
      const state = {
        'post1.md': {
          devto: { url: 'https://dev.to/test', syndicatedAt: '2026-03-23T00:00:00.000Z' }
        }
      };

      const updated = recordSyndication(state, 'post1.md', 'medium', 'https://medium.com/test');

      expect(updated['post1.md'].devto).toBeDefined();
      expect(updated['post1.md'].medium).toBeDefined();
      expect(updated['post1.md'].medium.url).toBe('https://medium.com/test');
    });

    it('should include timestamp in ISO format', () => {
      const state = {};
      const updated = recordSyndication(state, 'post1.md', 'devto', 'https://dev.to/test');

      const timestamp = updated['post1.md'].devto.syndicatedAt;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('clearSyndication', () => {
    it('should remove syndication record for specific target', () => {
      const state = {
        'post1.md': {
          devto: { url: 'https://dev.to/test', syndicatedAt: '2026-03-23T00:00:00.000Z' },
          medium: { url: 'https://medium.com/test', syndicatedAt: '2026-03-23T00:00:00.000Z' }
        }
      };

      const updated = clearSyndication(state, 'post1.md', 'devto');

      expect(updated['post1.md'].devto).toBeUndefined();
      expect(updated['post1.md'].medium).toBeDefined();
    });

    it('should do nothing if post or target does not exist', () => {
      const state = {
        'post1.md': {
          medium: { url: 'https://medium.com/test' }
        }
      };

      const updated = clearSyndication(state, 'post1.md', 'devto');
      expect(updated).toEqual(state);

      const updated2 = clearSyndication(state, 'post2.md', 'devto');
      expect(updated2).toEqual(state);
    });
  });
});
