module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/scripts/syndication/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'scripts/syndication/**/*.js',
    '!scripts/syndication/__tests__/**',
    '!scripts/syndication/node_modules/**',
    '!scripts/syndication/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
