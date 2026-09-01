#!/usr/bin/env node
/**
 * Publish @jrumandal/user to the configured registry (GitHub Packages by default).
 * Bumps the patch version (or sets 0.0.1) and publishes with public access.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const registry = 'https://npm.pkg.github.com/';

function run(cmd) {
  return execSync(cmd, { cwd: root, stdio: 'inherit' });
}

// Determine the next version: bump patch, or 0.0.1 if none published yet.
let nextVersion;
try {
  const out = run(`npm view ${pkg.name} versions --registry=${registry}`);
  const versions = out
    .trim()
    .split('\n')
    .map((l) => l.replace(/['"]/g, '').trim())
    .filter((v) => /^\d+\.\d+\.\d+/.test(v));
  if (versions.length > 0) {
    const latest = versions.sort((a, b) =>
      a.split('.').map(Number).reduce((s, n, i) => s + n * 1000 ** (2 - i), 0) -
      b.split('.').map(Number).reduce((s, n, i) => s + n * 1000 ** (2 - i), 0),
    ).pop();
    const [maj, min, pat] = latest.split('.').map(Number);
    nextVersion = `${maj}.${min}.${pat + 1}`;
  } else {
    nextVersion = '0.0.1';
  }
} catch {
  nextVersion = '0.0.1';
}

pkg.version = nextVersion;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`Publishing ${pkg.name}@${nextVersion} to ${registry}`);
run(`npm publish --access public --registry=${registry}`);
