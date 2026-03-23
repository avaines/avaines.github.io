const fs = require('fs').promises;
const path = require('path');

const STATE_FILE = path.join(__dirname, '../../../.github/syndication-state.json');

/**
 * Load syndication state from file
 * @returns {Promise<object>}
 */
async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty state
      return {};
    }
    throw error;
  }
}

/**
 * Save syndication state to file
 * @param {object} state
 */
async function saveState(state) {
  // Ensure directory exists
  const dir = path.dirname(STATE_FILE);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(
    STATE_FILE,
    JSON.stringify(state, null, 2),
    'utf-8'
  );
}

/**
 * Check if a post has been syndicated to a target
 * @param {object} state
 * @param {string} postPath
 * @param {string} target
 * @returns {boolean}
 */
function isSyndicated(state, postPath, target) {
  return !!(state[postPath]?.[target]);
}

/**
 * Record successful syndication
 * @param {object} state
 * @param {string} postPath
 * @param {string} target
 * @param {string} url
 * @returns {object} Updated state
 */
function recordSyndication(state, postPath, target, url) {
  if (!state[postPath]) {
    state[postPath] = {};
  }

  state[postPath][target] = {
    url,
    syndicatedAt: new Date().toISOString()
  };

  return state;
}

/**
 * Clear syndication record (useful for re-syndicating)
 * @param {object} state
 * @param {string} postPath
 * @param {string} target
 * @returns {object} Updated state
 */
function clearSyndication(state, postPath, target) {
  if (state[postPath]?.[target]) {
    delete state[postPath][target];
  }

  return state;
}

module.exports = {
  loadState,
  saveState,
  isSyndicated,
  recordSyndication,
  clearSyndication,
  STATE_FILE
};
