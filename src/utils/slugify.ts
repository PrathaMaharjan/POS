export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove special characters
    .replace(/\s+/g, "-")           // spaces -> hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");       // trim leading/trailing hyphens
}