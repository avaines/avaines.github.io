// The SDK is ESM-only. Dynamic import also works on early Node 22 releases.
async function createAgent(options) {
  const { BskyAgent } = await import('@atproto/api');
  return new BskyAgent(options);
}

module.exports = { createAgent };
