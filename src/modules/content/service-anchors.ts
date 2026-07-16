/** DOM id for a service card. Slug `uslugi` collides with section `#uslugi`. */
export function serviceAnchorId(slug: string): string {
  return slug === "uslugi" ? "prochee" : slug;
}

export function serviceAnchorHref(slug: string): `#${string}` {
  return `#${serviceAnchorId(slug)}`;
}
