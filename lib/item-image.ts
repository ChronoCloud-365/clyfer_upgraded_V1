export function itemImage(src: string | undefined, width: 160 | 480 | 960 = 480) {
  return src?.startsWith("/api/item-images/") ? `${src}?w=${width}` : src || "/product-placeholder.svg";
}
