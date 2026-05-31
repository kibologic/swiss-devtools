import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, fileURLToPath } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');

mkdirSync(join(distDir, 'syntaxes'), { recursive: true });
mkdirSync(join(distDir, 'snippets'), { recursive: true });

// Copy grammar from syntaxes/
copyFileSync(
  join(root, 'syntaxes', 'swissjs.tmLanguage.json'),
  join(distDir, 'syntaxes', 'swissjs.tmLanguage.json')
);

// Copy snippets
copyFileSync(
  join(root, 'snippets', 'swissjs.json'),
  join(distDir, 'snippets', 'swissjs.json')
);

// Copy language configuration
copyFileSync(
  join(root, 'language-configuration.json'),
  join(distDir, 'language-configuration.json')
);

// Copy assets if they exist
const assetsSrc = join(root, 'assets');
if (existsSync(assetsSrc)) {
  mkdirSync(join(distDir, 'assets'), { recursive: true });
  for (const file of ['icon-light.svg', 'icon-dark.svg']) {
    const src = join(assetsSrc, file);
    if (existsSync(src)) {
      copyFileSync(src, join(distDir, 'assets', file));
    }
  }
}

console.log('Grammar and assets copied to dist/');
