function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function createProductIndex(products) {
  const list = Array.isArray(products) ? products : [];
  const bySlug = new Map();
  for (const product of list) {
    const slug = normalizeSlug(product?.slug);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, product);
  }
  return { list, bySlug };
}

function candidateSlugsForHotspot(hotspot) {
  const hs = hotspot || {};
  const base = unique([normalizeSlug(hs.slug), normalizeSlug(hs.subject), normalizeSlug(hs.tooltip)]);
  const withPrint = base.map((value) => `${value}-print`);
  return unique([...base, ...withPrint]);
}

export function findProductForHotspot(hotspot, index) {
  const safeIndex = index && Array.isArray(index.list) ? index : createProductIndex([]);
  const candidates = candidateSlugsForHotspot(hotspot);

  for (const slug of candidates) {
    const exact = safeIndex.bySlug.get(slug);
    if (exact) {
      return {
        product: exact,
        matchedBy: "exact",
        matchedSlug: slug,
        variants: Array.isArray(exact.variants) ? exact.variants : [],
        primaryVariant: Array.isArray(exact.variants) ? exact.variants.find((v) => v?.active) || exact.variants[0] : null,
      };
    }
  }

  for (const slug of candidates) {
    const prefix = safeIndex.list.find((product) => normalizeSlug(product?.slug).startsWith(slug));
    if (prefix) {
      return {
        product: prefix,
        matchedBy: "prefix",
        matchedSlug: slug,
        variants: Array.isArray(prefix.variants) ? prefix.variants : [],
        primaryVariant: Array.isArray(prefix.variants) ? prefix.variants.find((v) => v?.active) || prefix.variants[0] : null,
      };
    }
  }

  return null;
}
