import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a84ff"/>
      <stop offset="1" stop-color="#0060df"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <g transform="translate(256,266)">
    <rect x="-120" y="-90" width="72" height="180" rx="10" fill="white" opacity="0.95" transform="rotate(-8)"/>
    <rect x="-40" y="-100" width="72" height="190" rx="10" fill="white"/>
    <rect x="44" y="-95" width="72" height="185" rx="10" fill="white" opacity="0.95" transform="rotate(6)"/>
  </g>
</svg>`;

const sizes = [192, 512];
for (const size of sizes) {
  await sharp(Buffer.from(svg(size)))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
}

await sharp(Buffer.from(svg(180)))
  .resize(180, 180)
  .png()
  .toFile("public/icons/apple-touch-icon.png");

console.log("Icons generated.");
