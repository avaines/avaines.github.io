const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');

const root = resolve(__dirname, '../..');
const major = readFileSync(resolve(root, '.nvmrc'), 'utf8').trim();
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor !== Number(major)) {
  throw new Error('Use Node 22: run nvm install && nvm use.');
}
const expected = readFileSync(resolve(root, '.hugo-version'), 'utf8').trim();
const actual = execFileSync('hugo', ['version'], { encoding: 'utf8' });
// Official release binaries can include a Git revision before +extended.
const version = actual.match(/^hugo v(\d+\.\d+\.\d+)/)?.[1];
if (version !== expected || !actual.includes('+extended')) {
  throw new Error(`Install Hugo extended ${expected} from .hugo-version. Found: ${actual.trim()}`);
}
