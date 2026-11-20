import type { Source, SourceKind } from '../schema';

/** A Wikipedia article, cited as a cross-check and a way in to its own references. */
export const wiki = (slug: string, label = slug.replace(/_/g, ' ').replace(/%27/g, "'")): Source => ({ label: `${label} (Wikipedia)`, url: `https://en.wikipedia.org/wiki/${slug}`, kind: 'reference' });
export const src = (kind: SourceKind, label: string, url: string): Source => ({ kind, label, url });
