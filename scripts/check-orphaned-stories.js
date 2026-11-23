#!/usr/bin/env node
/**
 * check-orphaned-stories.js
 *
 * Detects Storybook story files whose component no longer exists.
 *
 * Usage:
 *   node scripts/check-orphaned-stories.js
 *   node scripts/check-orphaned-stories.js --fix   # remove orphans automatically
 *
 * A story is considered orphaned when every component import it contains
 * (i.e. every `import { X } from './Y'` or `import X from './Y'` that is
 * NOT a type-only import and NOT from a package path) resolves to a file
 * that does not exist on disk.
 */

const fs = require('fs');
const path = require('path');

const log = (...msgs) => process.stdout.write(msgs.join(' ') + '\n');
const error = (...msgs) => process.stderr.write(msgs.join(' ') + '\n');

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────
const STORIES_GLOB_DIRS = [path.resolve(__dirname, '../src')];

// Shared components that must each have a corresponding story file.
const SHARED_COMPONENTS_DIR = path.resolve(__dirname, '../src/components');

const STORY_EXTENSIONS = ['.stories.ts', '.stories.tsx', '.stories.js', '.stories.jsx'];
const COMPONENT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

const FIX_MODE = process.argv.includes('--fix');

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Recursively collect all files in a directory tree. */
function walkDir(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else {
      results.push(full);
    }
  }
  return results;
}

/** Return true if the file path ends with a story extension. */
function isStoryFile(filePath) {
  return STORY_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

/**
 * Extract relative (non-package) import paths from a story file's source.
 * Returns only relative imports (start with '.').
 */
function extractRelativeImports(source) {
  const importRe = /^import\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/gm;
  const paths = [];
  let match;
  while ((match = importRe.exec(source)) !== null) {
    const specifier = match[1];
    if (specifier.startsWith('.')) {
      paths.push(specifier);
    }
  }
  return paths;
}

/**
 * Given a story file path and one of its relative import specifiers, check
 * whether the referenced module actually exists on disk.
 */
function importExists(storyFile, specifier) {
  const dir = path.dirname(storyFile);
  const candidate = path.resolve(dir, specifier);

  // Exact path
  if (fs.existsSync(candidate)) return true;

  // Try appending each component extension
  for (const ext of COMPONENT_EXTENSIONS) {
    if (fs.existsSync(candidate + ext)) return true;
    // Also try /index.<ext>
    if (fs.existsSync(path.join(candidate, 'index' + ext))) return true;
  }
  return false;
}

/** Return true if the file path is a shared component source file (not a story/test). */
function isSharedComponentFile(filePath) {
  if (!COMPONENT_EXTENSIONS.some((ext) => filePath.endsWith(ext))) return false;
  if (isStoryFile(filePath)) return false;
  if (/\.(test|spec)\.[jt]sx?$/.test(filePath)) return false;
  if (filePath.endsWith('.d.ts')) return false;
  return true;
}

/** Return the expected story file path for a given component file. */
function expectedStoryPath(componentFile) {
  const ext = path.extname(componentFile);
  return componentFile.slice(0, -ext.length) + '.stories.tsx';
}

/** Return true if a story file exists for the given component file. */
function hasStory(componentFile) {
  const base = componentFile.slice(0, -path.extname(componentFile).length);
  return STORY_EXTENSIONS.some((ext) => fs.existsSync(base + ext));
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

let orphans = [];
let missingStories = [];

for (const rootDir of STORIES_GLOB_DIRS) {
  const allFiles = walkDir(rootDir);

  for (const file of allFiles) {
    if (!isStoryFile(file)) continue;

    const source = fs.readFileSync(file, 'utf8');
    const relativeImports = extractRelativeImports(source);

    // Filter down to only non-type imports that resolve to missing files
    const missingImports = relativeImports.filter((specifier) => !importExists(file, specifier));

    if (missingImports.length > 0) {
      orphans.push({ file, missingImports });
    }
  }
}

// Detect shared components that are missing a story file.
if (fs.existsSync(SHARED_COMPONENTS_DIR)) {
  for (const file of walkDir(SHARED_COMPONENTS_DIR)) {
    if (!isSharedComponentFile(file)) continue;
    if (!hasStory(file)) {
      missingStories.push({ file, expected: expectedStoryPath(file) });
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Report
// ──────────────────────────────────────────────────────────────────────────────

if (orphans.length === 0 && missingStories.length === 0) {
  log('✅  No orphaned Storybook stories found.');
  log('✅  All shared components have Storybook stories.');
  process.exit(0);
}

if (orphans.length > 0) {
  error(`\n⚠️  Found ${orphans.length} orphaned story file(s):\n`);

  for (const { file, missingImports } of orphans) {
    const rel = path.relative(process.cwd(), file);
    error(`  ${rel}`);
    for (const imp of missingImports) {
      error(`    └─ missing import: ${imp}`);
    }
  }
}

if (missingStories.length > 0) {
  error(`\n⚠️  Found ${missingStories.length} shared component(s) without a story:\n`);

  for (const { file, expected } of missingStories) {
    const rel = path.relative(process.cwd(), file);
    const relExpected = path.relative(process.cwd(), expected);
    error(`  ${rel}`);
    error(`    └─ expected story: ${relExpected}`);
  }
}

if (FIX_MODE) {
  if (orphans.length > 0) {
    log('\n🗑  Removing orphaned story files...');
    for (const { file } of orphans) {
      fs.unlinkSync(file);
      const rel = path.relative(process.cwd(), file);
      log(`  removed: ${rel}`);
    }
  }
  if (missingStories.length > 0) {
    error('\n❌  Missing stories cannot be auto-generated; please add them manually.');
  }
  log('\n✅  Done.');
  process.exit(missingStories.length > 0 ? 1 : 0);
} else {
  error(
    '\nRun with --fix to remove orphaned stories automatically:',
    '\n  node scripts/check-orphaned-stories.js --fix\n',
  );
  process.exit(1);
}
