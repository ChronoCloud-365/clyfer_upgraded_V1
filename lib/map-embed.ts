/**
 * Extracts lat/lng from a Google Maps URL (@lat,lng pattern) and returns
 * a proper iframe embed URL. Falls back to address/name text search.
 */
export function getMapEmbedUrl(mapUrl: string, address: string, name: string): string {
  const m = (mapUrl ?? "").match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) {
    return `https://maps.google.com/maps?q=${m[1]},${m[2]}&z=17&output=embed`;
  }
  const q = address || name || "Bangladesh";
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}
