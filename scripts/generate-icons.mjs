// Builds the raster icons from the Cardfile mark: favicon.ico, the Apple touch
// icon and the two web-app-manifest icons. Run with: node scripts/generate-icons.mjs
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const INK = "#0f1b3d";
const BLUE = "#0b62d6";

/** The mark on a 32-unit grid. `pad` adds a margin, `bg` a solid background. */
function mark({ pad = 0, bg = null } = {}) {
  const size = 32 + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${size} ${size}">
  ${bg ? `<rect x="${-pad}" y="${-pad}" width="${size}" height="${size}" fill="${bg}"/>` : ""}
  <rect x="10" y="2.5" width="17" height="15" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.75"/>
  <rect x="5.5" y="6.5" width="17" height="15" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.75"/>
  <line x1="8.5" y1="11.5" x2="19.5" y2="11.5" stroke="${BLUE}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M2.5 17h27v8.5a3.5 3.5 0 0 1-3.5 3.5H6a3.5 3.5 0 0 1-3.5-3.5z" fill="${INK}"/>
  <rect x="12.5" y="21.25" width="7" height="2.75" rx="1.375" fill="#fff"/>
</svg>`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** An .ico file is a small directory followed by PNG images. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0);
    e.writeUInt8(size === 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const transparent = mark();
const solid = mark({ pad: 5, bg: "#ffffff" });

await writeFile(
  "app/favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(transparent, size) }))))
);
await writeFile("app/apple-icon.png", await png(solid, 180));
await writeFile("public/icon-192.png", await png(solid, 192));
await writeFile("public/icon-512.png", await png(solid, 512));

// The old landing-page screenshots: WebP at the size they are shown.
for (const name of ["hero1", "hero2", "hero3"]) {
  await sharp(`public/hero-images/${name}.png`)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`public/hero-images/${name}.webp`);
}
console.log("Icons and images written.");
