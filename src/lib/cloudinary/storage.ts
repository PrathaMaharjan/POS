const PROVIDER = process.env.NEXT_PUBLIC_STORAGE_PROVIDER ?? "cloudinary";

// Cloudinary config
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload`;

// AWS config (ready for future, unused now)
// const AWS_CF_DOMAIN = process.env.NEXT_PUBLIC_AWS_CF_DOMAIN;

export const getImageUrl = (
  key: string | null | undefined,
  options: { width?: number; height?: number } = {},
): string | null => {
  if (!key) return null;

  const { width = 400, height } = options;

  if (PROVIDER === "cloudinary") {
    const transforms = [
      width && `w_${width}`,
      height && `h_${height}`,
      "c_fill",
      "f_auto", // auto format (WebP for modern browsers)
      "q_auto", // auto quality
    ]
      .filter(Boolean)
      .join(",");

    return `${CLOUDINARY_BASE}/${transforms}/${key}`;
  }
  // aws
  //   if (PROVIDER === "aws") {

  //     return `https://${AWS_CF_DOMAIN}/${key}`;
  //   }

  //   return null;
  // }
  return null
};

// ── Preset sizes — use these in components, not raw getImageUrl ──
export const imagePresets = {
  thumbnail: (key: string | null) =>
    getImageUrl(key, { width: 100, height: 100 }),
  card: (key: string | null) => getImageUrl(key, { width: 400, height: 300 }),
  full: (key: string | null) => getImageUrl(key, { width: 800 }),
};

// ── Upload config exposed to frontend ──
export const uploadConfig = {
  cloudinary: {
    cloudName: CLOUDINARY_CLOUD,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    folder: "pos/products",
    maxSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};
