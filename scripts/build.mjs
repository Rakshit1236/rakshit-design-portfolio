import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hostingDir = join(root, 'dist');
const designs = JSON.parse(readFileSync(join(root, 'src/data/designs.json'), 'utf8'));

function copyToHosting(relativePath) {
  const source = resolve(root, relativePath);
  const fromRoot = relative(root, source);
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
    throw new Error(`Asset must be inside the project: ${relativePath}`);
  }

  const destination = join(hostingDir, fromRoot);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

await build({
  entryPoints: [join(root, 'src/app.jsx')],
  bundle: true,
  minify: true,
  sourcemap: false,
  outfile: join(root, 'Asset/dist/app.js'),
  loader: { '.jsx': 'jsx', '.json': 'json' },
  jsx: 'automatic',
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' }
});

mkdirSync(hostingDir, { recursive: true });
copyToHosting('index.html');
for (const path of [
  'MAIN.png',
  'HORIZONTAL.png',
  'Watermark (1).png',
  'Asset/img/favicon.svg',
  'Asset/img/Rakshit-portrait.jpeg',
  'Asset/dist/app.js',
  'Asset/dist/app.css'
]) {
  copyToHosting(path);
}

for (const design of designs) {
  if (!design.image.startsWith('./')) {
    throw new Error(`Design image must be a local relative path: ${design.image}`);
  }
  copyToHosting(design.image.slice(2));
}

console.log(`Hosting-ready site created in ${relative(root, hostingDir)} (${designs.length} designs).`);
