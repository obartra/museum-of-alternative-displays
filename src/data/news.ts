/**
 * What is new in the museum, newest first, for the feed at `feed.xml`. One entry for each change a visitor would
 * want to hear of: a new piece, a new tour, a new way to visit. Fixes and small corrections stay in the history.
 * `link` is a place in the museum, written from its folder.
 */
export interface News { date: string; title: string; says: string; link: string }

export const news: News[] = [
  { date: '2026-11-23', title: 'Put a piece in your own page', says: 'Every piece now has an Embed button. It gives the code that shows the 3D model in another web page, with a link back to the museum.', link: 'piece/nixie-tube/' },
  { date: '2026-11-22', title: 'Where each name is written', says: 'The two guided tours now say, at every stop, how a person\'s part is on record: on a patent, first on a paper, in a news report, in their own account, or in sources that disagree.', link: 'tour/women/' },
  { date: '2026-11-22', title: 'A second act in memory of Lotte Reiniger', says: 'Each minute, the shadow play closes its iris, shows a title card in memory of Lotte Reiniger, and plays a second act in black card under blue light, cut in her manner.', link: 'piece/shadow-play/' },
];
