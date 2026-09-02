export function collectProductImages(
  product?: { imagePaths?: string[] | null; imagePath?: string | null } | null,
  fallback?: string | null,
): string[] {
  const unique = new Set<string>()
  for (const path of product?.imagePaths ?? []) {
    if (path) unique.add(path)
  }
  if (unique.size === 0 && product?.imagePath) unique.add(product.imagePath)
  if (unique.size === 0 && fallback) unique.add(fallback)
  return [...unique]
}
