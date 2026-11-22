/**
 * Portraits of the people named on the labels. This list is filled in by hand: put the picture in public/people,
 * then add one line here under the person's name exactly as the label spells it. PORTRAITS.md has the names
 * and the file name each one expects. Nothing in the build fetches a picture.
 *
 * There are two kinds, and both are pen drawings made with an AI image model.
 *
 * A drawing after one picture follows it. The picture is in the public domain or under an open licence. `by` is
 * its photographer or the archive that holds it, `licence` its licence as the source page states it, and `source`
 * the address of that page. All three are shown beside the drawing.
 *
 * A study shows the person and follows no picture: the pose and the clothing are the drawing's own. It is for a
 * person whose photographs all belong to somebody. `study` lists the pages of the photographs the face was drawn
 * from, each with who published it, and they are named beside the drawing. The photographs themselves are not
 * shown anywhere on the site.
 *
 * `small` marks a drawing whose photographs are too small or too soft to bear more than the size of a label. It
 * is not hung on the wall of the walk, and its file is no larger than a label needs.
 */
export type Portrait = { file: string; small?: boolean } & ({ by: string; licence: string; source: string } | { study: { by: string; source: string }[] });

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
  "Vicki Colvin": { file: "vicki-colvin.webp", study: [{ by: "Brown University", source: "https://archive2.news.brown.edu/2007-2015/articles/2014/05/colvin.html" }, { by: "Brown University", source: "https://ibeam.brown.edu/news/2019-02-01/spotlight-vicki-colvin" }] },
  "Elsa Garmire": { file: "elsa-garmire.webp", study: [{ by: "Optica", source: "https://www.optica.org/history/biographies/bios/elsa-garmire/" }, { by: "Dartmouth Engineering", source: "https://engineering.dartmouth.edu/community/faculty/elsa-garmire" }] },
  "Leota Toombs": { file: "leota-toombs.webp", small: true, study: [{ by: "D23", source: "https://d23.com/walt-disney-legend/leota-toombs/" }] },
  "Susan Hackwood": { file: "susan-hackwood.webp", study: [{ by: "California Council on Science and Technology", source: "https://ccst.us/womens-history-month-a-conversation-with-dr-susan-hackwood/" }, { by: "University of California, Riverside", source: "https://insideucr.ucr.edu/media/image/susan-hackwood" }] },
  "Margaret Benyon": { file: "margaret-benyon.webp", study: [{ by: "hologram.se", source: "https://hologram.se/wp-content/uploads/2018/06/Margaret_Benyon_Obituary_2016.pdf" }] },
  "Gino Valle": { file: "gino-valle.webp", small: true, study: [{ by: "Associazione per il Disegno Industriale", source: "https://www.adi-design.org/upl/CdO_STORICO/CdO%20storico%20MOTIVAZIONI/Motivazioni_1994.pdf" }, { by: "US-Italy Fulbright Commission", source: "https://www.fulbright.it/wp-content/uploads/2025/05/2024n_FULBRIGHT-compresso.pdf" }] },
  "Daniel Rozin": { file: "daniel-rozin.webp", small: true, study: [{ by: "Fondation Guy & Myriam Ullens", source: "https://ullens-foundation.com/artists/daniel-rozin" }] },
  "Daniel Leithinger": { file: "daniel-leithinger.webp", study: [{ by: "University of Colorado Boulder", source: "https://www.colorado.edu/atlas/daniel-leithinger" }] },
  "Sean Follmer": { file: "sean-follmer.webp", study: [{ by: "Stanford University", source: "https://www.cs.stanford.edu/people/sean-follmer" }] },
  "Peter Goldmark": { file: "peter-goldmark.webp", small: true, study: [{ by: "National Academy of Sciences", source: "https://static1.squarespace.com/static/5c65dd81af46834afd07e40a/t/605a6c095e85b77df0f0910e/1616538638242/lives%2Bretold%2Bgoldmark%2Bpeter%2Bpt1.pdf" }] },
  "Andrew Haeff": { file: "andrew-haeff.webp", study: [{ by: "Engineering and Technology History Wiki", source: "https://ethw.org/Andrew_V._Haeff" }] },
  "Tadashi Sasaki": { file: "tadashi-sasaki.webp", small: true, study: [{ by: "Semiconductor History Museum of Japan", source: "https://www.shmj.or.jp/english/pioneers/pnr16.html" }] },
  "Donald Bitzer": { file: "donald-bitzer.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/donald-l-bitzer" }, { by: "University of Illinois Alumni Association", source: "https://uiaa.org/2023/12/14/2023-alumni-awards/" }] },
  "Gene Slottow": { file: "gene-slottow.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/h-gene-slottow" }] },
  "Robert Willson": { file: "robert-willson.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/robert-h-willson" }] },
  "Tsutae Shinoda": { file: "tsutae-shinoda.webp", small: true, study: [{ by: "Engineering and Technology History Wiki", source: "https://ethw.org/Tsutae_Shinoda" }] },
  "Charles Spindt": { file: "charles-spindt.webp", study: [{ by: "Sons in Retirement, Branch 35", source: "https://www.sirinc2.org/branch35/wp-content/uploads/2016/02/Member-Profile-Jun-2015.pages.pdf" }, { by: "SRI International", source: "https://www.sri.com/hoi/spindt-cold-cathode-for-displays/" }] },
  "Howard Borden": { file: "howard-borden.webp", study: [{ by: "Hewlett-Packard Journal", source: "https://hparchive.com/Journals/HPJ-1969-02.pdf" }] },
  "Ching Wan Tang": { file: "ching-wan-tang.webp", by: "Xiakunlun", licence: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Ching_W_Tang.jpg", small: true },
  "Louis Brus": { file: "louis-brus.webp", study: [{ by: "Nobel Prize Outreach", source: "https://www.nobelprize.org/prizes/chemistry/2023/brus/facts/" }, { by: "Columbia Magazine", source: "https://magazine.columbia.edu/article/professor-louis-brus-wins-nobel-prize-chemistry" }] },
  "James Fergason": { file: "james-fergason.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/james-l-fergason" }] },
  "Larry Hornbeck": { file: "larry-hornbeck.webp", small: true, study: [{ by: "University of Texas at Dallas", source: "https://mse.utdallas.edu/ourteam/faculty/hornbeck-l/" }, { by: "Case Western Reserve University", source: "https://case.edu/news/triple-alum-larry-j-hornbeck-presented-2014-academy-award-merit" }] },
  "Joseph Ostoja-Kotkowski": { file: "joseph-ostoja-kotkowski.webp", small: true, study: [{ by: "Arts (MDPI), from the State Library of South Australia", source: "https://mdpi-res.com/d_attachment/arts/arts-08-00023/article_deploy/arts-08-00023.pdf" }, { by: "Australian Dictionary of Biography", source: "https://adb.anu.edu.au/biography/ostojakotkowski-joseph-stanislaw--stan-21621" }] },
  "Ivan Dryer": { file: "ivan-dryer.webp", small: true, study: [{ by: "International Laser Display Association", source: "https://www.ilda.com/ivandryer.html" }] },
  "Greg Welch": { file: "greg-welch.webp", study: [{ by: "University of Central Florida", source: "https://nursing.ucf.edu/people/gregory-welch/" }, { by: "University of Central Florida", source: "https://www.ucf.edu/news/ucf-professor-greg-welch-named-to-the-national-academy-of-inventors/" }] },
  "Kok-Lim Low": { file: "kok-lim-low.webp", small: true, study: [{ by: "National University of Singapore", source: "https://www.comp.nus.edu.sg/cs/people/lowkl/" }] },
  "Deng-Ke Yang": { file: "deng-ke-yang.webp", study: [{ by: "Kent State University", source: "https://www.kent.edu/materials-science/profile/deng-ke-yang" }] },
  "J. William Doane": { file: "j-william-doane.webp", study: [{ by: "Kent State University", source: "https://www.kent.edu/physics/j-william-doane" }] },
  "Johan Feenstra": { file: "johan-feenstra.webp", study: [{ by: "TNO", source: "https://fasttrack.tno.nl/en/@8454/johan-feenstra/" }] },
  "Mark Miles": { file: "mark-miles.webp", study: [{ by: "Green City Force", source: "https://greencityforce.org/person/mark-miles/" }, { by: "OakTREE", source: "https://www.oaktree.eco/about/who-we-are/" }] },
  "Karri Palovuori": { file: "karri-palovuori.webp", study: [{ by: "SoC Hub", source: "https://sochub.fi/people/" }] },
  "Ismo Rakkolainen": { file: "ismo-rakkolainen.webp", study: [{ by: "Tampere University", source: "https://www.tuni.fi/en/people/ismo-rakkolainen" }] },
  "Lambertus Hesselink": { file: "lambertus-hesselink.webp", study: [{ by: "Stanford University", source: "https://profiles.stanford.edu/lambertus-hesselink" }] },
  "Daniel Smalley": { file: "daniel-smalley.webp", study: [{ by: "Future Display Group", source: "https://www.smalleyholography.org/contact-us" }] },
  "Ryuji Hirayama": { file: "ryuji-hirayama.webp", small: true, study: [{ by: "Ryuji Hirayama", source: "https://ryujihirayama.github.io/web/" }] },
  "Diego Martinez Plasencia": { file: "diego-martinez-plasencia.webp", study: [{ by: "ACM VRST 2021", source: "https://vrst.acm.org/vrst2021/keynotes/" }] },
  "Mark Dean": { file: "mark-dean.webp", study: [{ by: "IBM", source: "https://www.ibm.com/history/mark-dean" }, { by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/mark-dean" }] },
  "Akintunde Akinwande": { file: "akintunde-akinwande.webp", small: true, study: [{ by: "MIT Center for International Studies", source: "https://cis.mit.edu/our-people/akintunde-akinwande" }, { by: "MIT Technology Licensing Office", source: "https://tlo.mit.edu/industry-entrepreneurs/researchers/akintunde-ibitayo-akinwande" }] },
  "Dawon Kahng": { file: "dawon-kahng.webp", small: true, study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/dawon-kahng" }] },
  "Lanny Smoot": { file: "lanny-smoot.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/lanny-smoot" }, { by: "The Walt Disney Company", source: "https://thewaltdisneycompany.com/lanny-smoot-to-be-the-first-disney-imagineer-inducted-into-the-national-inventors-hall-of-fame/" }] },
  "Horst Hörtner": { file: "horst-hortner.webp", study: [{ by: "Ars Electronica", source: "https://ars.electronica.art/futurelab/de/hoertner-horst/" }, { by: "Ars Electronica", source: "https://ars.electronica.art/fl25/storyline/virtual-worlds/" }] },
  "Elma Farnsworth": { file: "elma-farnsworth.webp", small: true, study: [{ by: "Television Academy Foundation, interview of 1996", source: "https://interviews.televisionacademy.com/interviews/elma-farnsworth" }] },
  "Tadashi Nakamura": { file: "tadashi-nakamura.webp", study: [{ by: "Electronic Design, 15 March 1976, at World Radio History", source: "https://www.worldradiohistory.com/Archive-Electronic-Design/1976/Electronic-Design-V24-N06-1976-0315.pdf" }, { by: "Noritake Itron", source: "https://www.noritake-itron.jp/eng/profile/nakamura/" }] },
  "Gerald Pighini": { file: "gerald-pighini.webp", small: true, study: [{ by: "Hewlett-Packard Journal, February 1969, at HP Archive", source: "https://hparchive.com/Journals/HPJ-1969-02.pdf" }] },
  "Barrett Comiskey": { file: "barrett-comiskey.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/barrett-o-comiskey" }] },
  "J. D. Albert": { file: "j-d-albert.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/jonathan-d-albert" }] },
  "Joseph Jacobson": { file: "joseph-jacobson.webp", study: [{ by: "National Inventors Hall of Fame", source: "https://www.invent.org/inductees/joseph-m-jacobson" }] },
  "Gerardo Beni": { file: "gerardo-beni.webp", study: [{ by: "University of California, Riverside", source: "https://cris.ucr.edu/people/gerardo-beni" }] },
};

/** The file name a portrait is expected under: the name in plain lower-case letters, joined by hyphens. */
export const portraitFile = (name: string): string => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.jpg';
