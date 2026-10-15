const { test } = require('node:test');
const assert = require('node:assert/strict');

// Run in real Node, outside Jest: module mocks can hide ESM/export changes.
// Constructors and module loading only; no credentials or network calls.
test('publishing services load with the installed dependencies', () => {
  for (const name of ['bluesky', 'devto', 'mastodon', 'substack']) {
    assert.equal(typeof require(`../syndication/services/${name}`).publish, 'function');
  }
});

test('Bluesky SDK exposes the client methods used by the publisher', async () => {
  const { createAgent } = require('../syndication/lib/bluesky-client');
  const agent = await createAgent({ service: 'https://bsky.social' });
  assert.equal(typeof agent.login, 'function');
  assert.equal(typeof agent.post, 'function');
});

test('Substack SDK exposes the publication client used by the publisher', () => {
  const { SubstackClient } = require('substack-api');
  const client = new SubstackClient({ token: 'test-token', publicationUrl: 'https://example.substack.com' });
  assert.equal(typeof client.publicationClient.post, 'function');
});
