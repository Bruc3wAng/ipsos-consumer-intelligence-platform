export const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const IS_STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";

export function publicAssetPath(path: string) {
  if (!path.startsWith("/")) return path;
  return `${PUBLIC_BASE_PATH}${path}`;
}
