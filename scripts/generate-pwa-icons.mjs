// Script pour générer les icônes PWA (192x192, 512x512)
// Utilisation: node scripts/generate-pwa-icons.mjs
// Nécessite: npm install sharp

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const sizes = [192, 512];
const svgBuffer = readFileSync(join(publicDir, 'pwa-icon.svg'));

async function generate() {
  mkdirSync(publicDir, { recursive: true });
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `icon-${size}x${size}.png`));
    console.log(`✅ icon-${size}x${size}.png créé`);
  }
  // Create maskable icon (with padding)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512x512-maskable.png'));
  console.log('✅ icon-512x512-maskable.png créé');
}

generate().catch(console.error);
