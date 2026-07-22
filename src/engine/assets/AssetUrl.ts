export function assetUrl(relativePath: string): string {
  const cleanPath = relativePath.replace(/^\/+/, "");
  return new URL(`${import.meta.env.BASE_URL}${cleanPath}`, document.baseURI).toString();
}
