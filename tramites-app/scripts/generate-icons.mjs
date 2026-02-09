import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function generateIcons() {
  const sourceIcon = join(rootDir, 'app', 'icon.png');
  const publicDir = join(rootDir, 'public');

  // Create public directory if it doesn't exist
  await mkdir(publicDir, { recursive: true });

  const sizes = [
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name));
    console.log(`Generated ${name}`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
