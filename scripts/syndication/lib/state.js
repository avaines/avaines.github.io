const fs = require('fs').promises;
const path = require('path');

const DEFAULT_STATE_FILE = path.join(__dirname, '../../../.github/syndication-state.json');
const REPO_ROOT = path.resolve(__dirname, '../../..');

function toPosix(p) {
  return String(p).replace(/\\/g, '/');
}

/**
 * Normalize a post path to a repository-relative key, e.g. /content/posts/.../index.md
 * @param {string} postPath
 * @returns {string}
 */
function normalizePostPath(postPath) {
  if (typeof postPath !== 'string' || postPath.length === 0) {
    return postPath;
  }

  const normalizedInput = toPosix(postPath);
  const normalizedRepoRoot = toPosix(REPO_ROOT);

  if (normalizedInput.startsWith(`${normalizedRepoRoot}/`)) {
    const repoRelative = normalizedInput.slice(normalizedRepoRoot.length);
    return repoRelative.startsWith('/') ? repoRelative : `/${repoRelative}`;
  }

  const contentSegmentIndex = normalizedInput.lastIndexOf('/content/');
  if (contentSegmentIndex !== -1) {
    return normalizedInput.slice(contentSegmentIndex);
  }

  if (normalizedInput.startsWith('./content/')) {
    return `/${normalizedInput.slice(2)}`;
  }

  if (normalizedInput.startsWith('content/')) {
    return `/${normalizedInput}`;
  }

  return normalizedInput;
}

function normalizeState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return {};
  }

  const normalizedState = {};

  for (const [postPath, targets] of Object.entries(state)) {
    const key = normalizePostPath(postPath);

    if (!normalizedState[key]) {
      normalizedState[key] = {};
    }

    Object.assign(normalizedState[key], targets || {});
  }

  return normalizedState;
}

function getStateFile() {
  return process.env.SYNDICATION_STATE_FILE || DEFAULT_STATE_FILE;
}

/**
 * Get syndication record for a post/target
 * @param {object} state
 * @param {string} postPath
 * @param {string} target
 * @returns {object|undefined}
 */
function getSyndication(state, postPath, target) {
  const key = normalizePostPath(postPath);
  return state[key]?.[target];
}

/**
 * Load syndication state from file
 * @returns {Promise<object>}
 */
async function loadState() {
  const stateFile = getStateFile();

  try {
    const data = await fs.readFile(stateFile, 'utf-8');
    return normalizeState(JSON.parse(data));
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
  const stateFile = getStateFile();

  // Ensure directory exists
  const dir = path.dirname(stateFile);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(
    stateFile,
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
  return !!getSyndication(state, postPath, target);
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
  const key = normalizePostPath(postPath);

  if (!state[key]) {
    state[key] = {};
  }

  state[key][target] = {
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
  const key = normalizePostPath(postPath);

  if (state[key]?.[target]) {
    delete state[key][target];
  }

  return state;
}

module.exports = {
  loadState,
  saveState,
  isSyndicated,
  getSyndication,
  recordSyndication,
  clearSyndication,
  normalizePostPath,
  STATE_FILE: DEFAULT_STATE_FILE
};
