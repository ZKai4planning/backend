import sharp from "sharp";

const allowedRatios = [
  1 / 1,      // 1:1  → Square images (Profile pictures, product thumbnails, Instagram posts)

  4 / 3,      // 4:3  → Standard photos, older camera format, blog images

  3 / 2,      // 3:2  → DSLR photography, landscape photography

  16 / 9,     // 16:9 → Widescreen format (YouTube videos, banners, website hero sections)

  19 / 16,    // 19:16 → Slightly taller widescreen (used in some mobile UI banners)

  9 / 16,     // 9:16 → Vertical video format (TikTok, Instagram Reels, YouTube Shorts)

  1 / 2,      // 1:2  → Tall vertical images (mobile UI sections, ads)

  1 / 3,      // 1:3  → Very tall vertical (mobile story-style banners)

  1 / 4,      // 1:4  → Ultra tall vertical graphics (infographics, scrolling content)

  21 / 9,     // 21:9 → Ultra-wide cinematic format (movie banners, cinematic videos)

  3 / 1,      // 3:1  → Website hero banners or wide promotional headers

  5 / 4       // 5:4  → Print photography, portrait photography
];

export const validateImageRatio = async (filePath: string) => {
  const metadata = await sharp(filePath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image");
  }

  const ratio = metadata.width / metadata.height;

  const valid = allowedRatios.some(
    (allowed) => Math.abs(ratio - allowed) < 0.05
  );

  if (!valid) {
    throw new Error(
      "Invalid image ratio. Allowed ratios: 1:1, 4:3, 3:2, 16:9, 19:16, 9:16, 1:2, 1:3, 1:4, 21:9, 3:1, 5:4"
    );
  }
};