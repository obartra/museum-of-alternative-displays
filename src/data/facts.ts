import type { Source } from './schema';

/** One thing about a piece that is worth repeating to someone. Shown on its page under "Did you know?". */
export interface Fact {
  /** One or two sentences, at most 45 words. Not something the label already says. */
  text: string;
  /** Where it comes from: a source that was opened and read, like every other source in the collection. */
  source: Source;
}

/** By piece id. */
export const facts: Record<string, Fact> = {};
