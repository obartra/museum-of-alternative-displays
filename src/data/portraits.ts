/**
 * Portraits of the people named on the labels. This list is filled in by hand: put the picture in public/people,
 * then add one line here under the person's name exactly as the label spells it. PORTRAITS.md has the names
 * and the file name each one expects. Nothing in the build fetches a picture.
 *
 * `by` is the photographer or the archive that holds the picture, `licence` its licence as the source page
 * states it, and `source` the address of that page. All three are shown beside the picture.
 */
export interface Portrait { file: string; by: string; licence: string; source: string }

export const portraits: Record<string, Portrait> = {
  "Paul Nipkow": { file: "paul-nipkow.webp", by: "", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Paul-nipkow.jpg" },
  "John Logie Baird": { file: "john-logie-baird.webp", by: "", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:John_Logie_Baird_in_1917.jpg" },
  "Hiroshi Ishii": { file: "hiroshi-ishii.webp", by: "Joi", licence: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Hiroshi_Ishii_cropped_2_Hiroshi_Ishii_20130406_1.jpg" },
  "Ferdinand Braun": { file: "ferdinand-braun.webp", by: "", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Ferdinand_Braun.jpg" },
  "Kenjiro Takayanagi": { file: "kenjiro-takayanagi.webp", by: "朝日新聞社", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Takayanagi_Kenjiro_1953.jpg" },
  "Philo Farnsworth": { file: "philo-farnsworth.webp", by: "Harris & Ewing", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Philo_T_Farnsworth.jpg" },
  "Isamu Akasaki": { file: "isamu-akasaki.webp", by: "大臣官房人事課", licence: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Isamu_Akasaki_201111.jpg" },
  "Hiroshi Amano": { file: "hiroshi-amano.webp", by: "研究振興局振興企画課", licence: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Hiroshi_Amano_20141211.jpg" },
  "Shuji Nakamura": { file: "shuji-nakamura.webp", by: "文部科学省", licence: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Shuji_Nakamura_Nobel.jpg" },
  "Steven Van Slyke": { file: "steven-van-slyke.webp", by: "SylviaL", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Steven_Van_Slyke.jpg" },
  "Hongxing Jiang": { file: "hongxing-jiang.webp", by: "Santasgift", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Hongxing_Jiang.jpg" },
  "Tuomo Suntola": { file: "tuomo-suntola.webp", by: "Riikka Puurunen", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Tuomo_Suntola%2C_2014_%28cropped%29.JPG" },
  "Martin Schadt": { file: "martin-schadt.webp", by: "Martin Schadt", licence: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Martin_Schadt.jpg" },
  "Wolfgang Helfrich": { file: "wolfgang-helfrich.webp", by: "Girweiki", licence: "CC0", source: "https://commons.wikimedia.org/wiki/File:Wolfgang_Helfrich_%282012%29.jpg" },
  "George Heilmeier": { file: "george-heilmeier.webp", by: "IEEE Global History Network", licence: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:George_H._Heilmeier.jpg" },
  "Fritz Fischer": { file: "fritz-fischer.webp", by: "Angela Blattner", licence: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Portrait_Fritz_Fischer.jpg" },
  "Michael Naimark": { file: "michael-naimark.webp", by: "Marie Sester", licence: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Naimark_2010.jpg" },
  "Ramesh Raskar": { file: "ramesh-raskar.webp", by: "Joi Ito", licence: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Ramesh_Raskar_%2811539797465%29.jpg" },
  "Henry Dircks": { file: "henry-dircks.webp", by: "", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Henry_Dircks_portrait.png" },
  "John Henry Pepper": { file: "john-henry-pepper.webp", by: "Henry Maull", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Prod_24630.jpg" },
  "Joseph Plateau": { file: "joseph-plateau.webp", by: "Albert Callisto", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Joseph_Plateau_-_clean.jpg" },
  "Sriram Subramanian": { file: "sriram-subramanian.webp", by: "Danny Hope", licence: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Sriram_Subramanian_-_UX_Brighton_2012_%288366699397%29.jpg" },
  "Yoichi Ochiai": { file: "yoichi-ochiai.webp", by: "Craft x Tech", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Yoichi_Ochiai_%28Craft_x_Tech_Tohoku_Project_2024%29_%28cropped%29.jpg" },
  "Charles Wheatstone": { file: "charles-wheatstone.webp", by: "Samuel Laurence", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Wheatstone_Charles_drawing_1868.jpg" },
  "Frederic Ives": { file: "frederic-ives.webp", by: "", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Frederic_E._Ives.jpg" },
  "Walter Hess": { file: "walter-hess.webp", by: "Nobel Foundation", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Walter_Hess.jpg" },
  "Gabriel Lippmann": { file: "gabriel-lippmann.webp", by: "Nobel Foundation", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Gabriel_Lippmann2.jpg" },
  "Dennis Gabor": { file: "dennis-gabor.webp", by: "Keystone", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Dennis_Gabor_1971b.jpg" },
  "Emmett Leith": { file: "emmett-leith.webp", by: "University of Michigan News and Information Services", licence: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Professor_Emmett_Leith_1963.jpg" },
  "Juris Upatnieks": { file: "juris-upatnieks.webp", by: "University of Michigan News and Information Services", licence: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Professor_Juris_Upatnieks_1963.jpg" },
  "Ivan Sutherland": { file: "ivan-sutherland.webp", by: "Dick Lyon", licence: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Ivan_Sutherland_at_CHM.jpg" },
  "Bob Sproull": { file: "bob-sproull.webp", by: "Marcin Wichary", licence: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Bob_Sproull_in_2008.jpg" },
  "Jingyu Lin": { file: "jingyu-lin.webp", by: "Santasgift", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Jingyu_Lin_%28MOCVD%29.jpg" },
  "Valerie Thomas": { file: "valerie-thomas.webp", by: "NASA", licence: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Valerie_L._Thomas_standing_with_a_stack_of_early_Landsat_Computer_Compatible_Tapes_-_Original.png" },
  "Mary Lou Jepsen": { file: "mary-lou-jepsen.webp", by: "Maryloujepsen", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Mary_Lou_Jepsen_Headshot_April_2022.png" },
  "Paul Alivisatos": { file: "paul-alivisatos.webp", by: "The University of Chicago Office of Communications", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Paul_Alivisatos_University_of_Chicago_President_September_2021.png" },
  "Aleksey Yekimov": { file: "aleksey-yekimov.webp", by: "US Embassy Sweden", licence: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:US_Embassy_Sweden_2023_Nobel_Reception_%2853390424929%29_%28cropped%29.jpg" },
  "Moungi Bawendi": { file: "moungi-bawendi.webp", by: "US Embassy Sweden", licence: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:US_Embassy_Sweden_2023_Nobel_Reception_%2853390424864%29_%28cropped%29.jpg" },
};

/** The file name a portrait is expected under: the name in plain lower-case letters, joined by hyphens. */
export const portraitFile = (name: string): string => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.jpg';
