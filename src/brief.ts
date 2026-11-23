/** What a search result or a link card shows of a page: whole sentences from the start, as many as fit in about
 * 160 characters, and at least one. A person is described by their line on the label, which says what they did. */
export const brief = (text: string, most = 160): string => {
  const parts = text.match(/[^.!?。！？]+[.!?。！？]+["”»」]?\s*|[^.!?。！？]+$/gu) ?? [text];
  let out = '';
  for (const part of parts) { if (out && (out + part).trim().length > most) break; out += part; }
  return out.trim();
};
