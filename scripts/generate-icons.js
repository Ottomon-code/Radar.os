import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const svgPath = path.join(publicDir, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating PWA & Google Play Store assets...');

  // 1. PWA 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 2. PWA 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 3. PWA Maskable 512x512 (with 15% safe-zone margin / padding)
  const innerSize = Math.round(512 * 0.76); // 389px inner
  const padding = Math.round((512 - innerSize) / 2);
  const innerBuffer = await sharp(svgBuffer).resize(innerSize, innerSize).png().toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 32, alpha: 1 }, // #0f1720 brand dark slate
    },
  })
    .composite([{ input: innerBuffer, top: padding, left: padding }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png (with safe-zone padding)');

  // 4. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 5. Google Play Store Hi-Res App Icon 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'playstore-icon-512x512.png'));
  console.log('Created playstore-icon-512x512.png');

  // 6. Google Play Store Feature Graphic 1024x500
  const bannerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <defs>
      <radialGradient id="banner-bg" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#152330" />
        <stop offset="60%" stop-color="#0f1720" />
        <stop offset="100%" stop-color="#070b0e" />
      </radialGradient>
      <linearGradient id="text-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#22d3a5" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>
    </defs>
    <rect width="1024" height="500" fill="url(#banner-bg)" />
    
    <!-- Grid pattern -->
    <path d="M 0 100 H 1024 M 0 200 H 1024 M 0 300 H 1024 M 0 400 H 1024" stroke="#1e2b36" stroke-width="1.5" stroke-dasharray="8 8" opacity="0.6" />
    <path d="M 200 0 V 500 M 400 0 V 500 M 600 0 V 500 M 800 0 V 500" stroke="#1e2b36" stroke-width="1.5" stroke-dasharray="8 8" opacity="0.6" />
    
    <!-- Radar concentric rings in background -->
    <circle cx="780" cy="250" r="190" fill="none" stroke="#22d3a5" stroke-width="2" stroke-opacity="0.2" stroke-dasharray="10 10" />
    <circle cx="780" cy="250" r="120" fill="none" stroke="#22d3a5" stroke-width="2" stroke-opacity="0.3" />
    <circle cx="780" cy="250" r="50" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.5" />
    <circle cx="780" cy="250" r="10" fill="#22d3a5" />

    <!-- Branding Text -->
    <text x="80" y="170" font-family="monospace, sans-serif" font-weight="900" font-size="48" fill="#dce7f0" letter-spacing="2">
      TALENT_RADAR<tspan fill="#22d3a5">.OS</tspan>
    </text>
    <text x="80" y="215" font-family="sans-serif" font-weight="700" font-size="20" fill="#38bdf8" letter-spacing="3">
      GOOGLE PLAY OFFICIAL RELEASE // ANDROID TWA
    </text>
    <text x="80" y="275" font-family="sans-serif" font-weight="400" font-size="18" fill="#94a3b8">
      • 3D Geospatial Tech Career Radar &amp; Requisitions
    </text>
    <text x="80" y="315" font-family="sans-serif" font-weight="400" font-size="18" fill="#94a3b8">
      • Market Analytics, Salary Trajectories &amp; Total Comp
    </text>
    <text x="80" y="355" font-family="sans-serif" font-weight="400" font-size="18" fill="#94a3b8">
      • StealthNet Zero-Knowledge Candidate Network
    </text>

    <!-- Badge -->
    <rect x="80" y="395" width="220" height="42" rx="8" fill="#22d3a5" fill-opacity="0.15" stroke="#22d3a5" stroke-width="1.5" />
    <text x="190" y="422" font-family="monospace, sans-serif" font-weight="700" font-size="14" fill="#22d3a5" text-anchor="middle">
      ✓ VERIFIED TWA INGRESS
    </text>
  </svg>
  `;

  await sharp(Buffer.from(bannerSvg))
    .resize(1024, 500)
    .png()
    .toFile(path.join(publicDir, 'playstore-feature-graphic-1024x500.png'));
  console.log('Created playstore-feature-graphic-1024x500.png');

  // Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
