const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

/**
 * Parse frontmatter and content from a markdown file
 * @param {string} filePath - Path to the markdown file
 * @returns {Promise<{frontmatter: object, content: string, path: string, permalink: string}>}
 */
async function parsePost(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);

  // Extract permalink from path (e.g., content/posts/2026-03-02-terraform-six-years-on/index.md)
  // becomes /posts/2026-03-02-terraform-six-years-on/
  const relativePath = path.relative(path.join(__dirname, '../../../content'), filePath);
  const permalink = '/' + path.dirname(relativePath).replace(/\\/g, '/') + '/';

  return {
    frontmatter,
    content,
    path: filePath,
    permalink
  };
}

/**
 * Get posts that have been changed in the latest commit or are currently modified
 * @returns {Promise<Array>}
 */
async function getChangedPosts() {
  try {
    // Get list of changed markdown files in content/posts/
    // Includes: last commit changes + staged changes + unstaged changes
    const committedFiles = execSync(
      'git diff --name-only HEAD~1 HEAD -- "content/posts/**/*.md"',
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    const stagedFiles = execSync(
      'git diff --name-only --cached -- "content/posts/**/*.md"',
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    const unstagedFiles = execSync(
      'git diff --name-only -- "content/posts/**/*.md"',
      { encoding: 'utf-8' }
    ).split('\n').filter(Boolean);

    // Combine and deduplicate
    const allChangedFiles = [...new Set([...committedFiles, ...stagedFiles, ...unstagedFiles])];

    const changedFiles = allChangedFiles
      .filter(Boolean)
      .map(file => path.join(__dirname, '../../../', file));

    const posts = [];
    for (const file of changedFiles) {
      try {
        const post = await parsePost(file);
        posts.push(post);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn(`Skipping ${file}: file no longer exists (likely renamed or deleted)`);
        } else {
          console.warn(`Failed to parse ${file}:`, error.message);
        }
      }
    }

    return posts;
  } catch (error) {
    console.warn('No git history or changed files found, checking all posts');
    return [];
  }
}

/**
 * Get all posts (useful for initial runs or manual syndication)
 * @returns {Promise<Array>}
 */
async function getAllPosts() {
  const postsDir = path.join(__dirname, '../../../content/posts');
  const posts = [];

  async function walkDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const post = await parsePost(fullPath);
          posts.push(post);
        } catch (error) {
          console.warn(`Failed to parse ${fullPath}:`, error.message);
        }
      }
    }
  }

  await walkDir(postsDir);
  return posts;
}

module.exports = {
  parsePost,
  getChangedPosts,
  getAllPosts
};
