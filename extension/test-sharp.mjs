import sharp from './node_modules/.pnpm/sharp@0.34.4/node_modules/sharp/lib/index.js';
console.log('input file:', 'assets/icon.svg');
await sharp('assets/icon.svg', { density: 300 }).resize(128).png().toFile('test-icon-out.png');
console.log('done');
