/** Manually checked biographies and profiles. A record identifies a contributor whose full biography is not established. Nothing is fetched at build time. */
export interface PersonLink { url: string; label: string; kind: 'biography' | 'profile' | 'record' }

export const personLinks: Record<string, PersonLink> = {
  "Georges Claude": {
    "url": "https://en.wikipedia.org/wiki/Georges_Claude",
    "label": "Georges Claude, Wikipedia",
    "kind": "biography"
  },
  "Jacques Fonsèque": {
    "url": "https://www.americanheritage.com/content/neon",
    "label": "Neon, American Heritage",
    "kind": "record"
  },
  "Daniel McFarlan Moore": {
    "url": "https://en.wikipedia.org/wiki/Daniel_McFarlan_Moore",
    "label": "Daniel McFarlan Moore, Wikipedia",
    "kind": "biography"
  },
  "Earle C. Anthony": {
    "url": "https://en.wikipedia.org/wiki/Earle_C._Anthony",
    "label": "Earle C. Anthony, Wikipedia",
    "kind": "biography"
  },
  "Francis E. J. Wilde": {
    "url": "https://scholarsarchive.byu.edu/facpub/2074",
    "label": "Dale L. Cressman on the zipper, Journalism History, 2018",
    "kind": "record"
  },
  "Frank C. Reilly": {
    "url": "https://www.nytimes.com/1928/11/08/archives/huge-times-sign-will-flash-news-electric-bulletin-board-used-for.html",
    "label": "Huge Times sign will flash news, The New York Times, 1928",
    "kind": "record"
  },
  "Everett Bickley": {
    "url": "https://sirismm.si.edu/EADpdfs/NMAH.AC.0683.pdf",
    "label": "Everett Bickley papers, biographical note, Smithsonian National Museum of American History",
    "kind": "biography"
  },
  "Christiaan Huygens": {
    "url": "https://en.wikipedia.org/wiki/Christiaan_Huygens",
    "label": "Christiaan Huygens, Wikipedia",
    "kind": "biography"
  },
  "Thomas Rasmussen Walgensten": {
    "url": "https://lucerna.exeter.ac.uk/person/index.php?id=6003671&language=EN",
    "label": "Thomas Rasmussen Walgensten, Lucerna, University of Exeter",
    "kind": "record"
  },
  "Athanasius Kircher": {
    "url": "https://en.wikipedia.org/wiki/Athanasius_Kircher",
    "label": "Athanasius Kircher, Wikipedia",
    "kind": "biography"
  },
  "Eric J. Seibel": {
    "url": "https://www.engr.washington.edu/facultyfinder/eric-seibel",
    "label": "Eric Seibel, College of Engineering, University of Washington",
    "kind": "profile"
  },
  "Thomas A. Furness III": {
    "url": "https://en.wikipedia.org/wiki/Thomas_A._Furness_III",
    "label": "Thomas A. Furness III, Wikipedia",
    "kind": "biography"
  },
  "Brian T. Schowengerdt": {
    "url": "https://www.hitl.washington.edu/people/brian",
    "label": "Brian T. Schowengerdt, Human Interface Technology Laboratory",
    "kind": "profile"
  },
  "C. T. Brock": {
    "url": "https://collections.vam.ac.uk/item/O1243844/drawing-sydney-higham",
    "label": "Brock's Benefit at the Crystal Palace, drawing, Victoria and Albert Museum",
    "kind": "record"
  },
  "Alan St. H. Brock": {
    "url": "https://www.gutenberg.org/ebooks/64922",
    "label": "Pyrotechnics: The History and Art of Firework Making, Project Gutenberg",
    "kind": "record"
  },
  "Gino Valle": {
    "url": "https://en.wikipedia.org/wiki/Gino_Valle",
    "label": "Gino Valle, Wikipedia",
    "kind": "biography"
  },
  "Kenyon Taylor": {
    "url": "https://en.wikipedia.org/wiki/Kenyon_Taylor",
    "label": "Kenyon Taylor, Wikipedia",
    "kind": "biography"
  },
  "Paul Nipkow": {
    "url": "https://en.wikipedia.org/wiki/Paul_Nipkow",
    "label": "Paul Gottlieb Nipkow, Wikipedia",
    "kind": "biography"
  },
  "John Logie Baird": {
    "url": "https://en.wikipedia.org/wiki/John_Logie_Baird",
    "label": "John Logie Baird, Wikipedia",
    "kind": "biography"
  },
  "Daniel Rozin": {
    "url": "https://en.wikipedia.org/wiki/Daniel_Rozin",
    "label": "Danny Rozin, Wikipedia",
    "kind": "biography"
  },
  "Hiroshi Ishii": {
    "url": "https://en.wikipedia.org/wiki/Hiroshi_Ishii_%28computer_scientist%29",
    "label": "Hiroshi Ishii (computer scientist), Wikipedia",
    "kind": "biography"
  },
  "James Bryce": {
    "url": "https://en.wikipedia.org/wiki/James_Wares_Bryce",
    "label": "James W. Bryce, Wikipedia",
    "kind": "biography"
  },
  "Ferdinand Braun": {
    "url": "https://en.wikipedia.org/wiki/Karl_Ferdinand_Braun",
    "label": "K. Ferdinand Braun, Wikipedia",
    "kind": "biography"
  },
  "Kenjiro Takayanagi": {
    "url": "https://en.wikipedia.org/wiki/Kenjiro_Takayanagi",
    "label": "Kenjiro Takayanagi, Wikipedia",
    "kind": "biography"
  },
  "Philo Farnsworth": {
    "url": "https://en.wikipedia.org/wiki/Philo_Farnsworth",
    "label": "Philo Farnsworth, Wikipedia",
    "kind": "biography"
  },
  "Marie Van Brittan Brown": {
    "url": "https://en.wikipedia.org/wiki/Marie_Van_Brittan_Brown",
    "label": "Marie Van Brittan Brown and Albert L. Brown, Wikipedia",
    "kind": "biography"
  },
  "Mark Dean": {
    "url": "https://en.wikipedia.org/wiki/Mark_Dean_%28computer_scientist%29",
    "label": "Mark Dean (computer scientist), Wikipedia",
    "kind": "biography"
  },
  "Guillermo González Camarena": {
    "url": "https://en.wikipedia.org/wiki/Guillermo_Gonz%C3%A1lez_Camarena",
    "label": "Guillermo González Camarena, Wikipedia",
    "kind": "biography"
  },
  "Andrew Haeff": {
    "url": "https://en.wikipedia.org/wiki/Andrew_V._Haeff",
    "label": "Andrew V. Haeff, Wikipedia",
    "kind": "biography"
  },
  "Lewis Latimer": {
    "url": "https://en.wikipedia.org/wiki/Lewis_Latimer",
    "label": "Lewis Howard Latimer, Wikipedia",
    "kind": "biography"
  },
  "Donald Bitzer": {
    "url": "https://en.wikipedia.org/wiki/Donald_Bitzer",
    "label": "Donald Bitzer, Wikipedia",
    "kind": "biography"
  },
  "Gene Slottow": {
    "url": "https://en.wikipedia.org/wiki/H._Gene_Slottow",
    "label": "H. Gene Slottow, Wikipedia",
    "kind": "biography"
  },
  "Kenneth Shoulders": {
    "url": "https://en.wikipedia.org/wiki/Kenneth_R._Shoulders",
    "label": "Kenneth R. Shoulders, Wikipedia",
    "kind": "biography"
  },
  "Akintunde Akinwande": {
    "url": "https://en.wikipedia.org/wiki/Akintunde_Akinwande",
    "label": "Akintunde Akinwande, Wikipedia",
    "kind": "biography"
  },
  "Isamu Akasaki": {
    "url": "https://en.wikipedia.org/wiki/Isamu_Akasaki",
    "label": "Isamu Akasaki, Wikipedia",
    "kind": "biography"
  },
  "Hiroshi Amano": {
    "url": "https://en.wikipedia.org/wiki/Hiroshi_Amano",
    "label": "Hiroshi Amano, Wikipedia",
    "kind": "biography"
  },
  "Shuji Nakamura": {
    "url": "https://en.wikipedia.org/wiki/Shuji_Nakamura",
    "label": "Shuji Nakamura, Wikipedia",
    "kind": "biography"
  },
  "Ching Wan Tang": {
    "url": "https://en.wikipedia.org/wiki/Ching_W._Tang",
    "label": "Ching Wan Tang, Wikipedia",
    "kind": "biography"
  },
  "Steven Van Slyke": {
    "url": "https://en.wikipedia.org/wiki/Steven_Van_Slyke",
    "label": "Steven Van Slyke, Wikipedia",
    "kind": "biography"
  },
  "Hongxing Jiang": {
    "url": "https://en.wikipedia.org/wiki/Hongxing_Jiang",
    "label": "Hongxing Jiang, Wikipedia",
    "kind": "biography"
  },
  "Jingyu Lin": {
    "url": "https://en.wikipedia.org/wiki/Jingyu_Lin",
    "label": "Jingyu Lin, Wikipedia",
    "kind": "biography"
  },
  "Vicki Colvin": {
    "url": "https://en.wikipedia.org/wiki/Vicki_Colvin",
    "label": "Vicki Colvin, Wikipedia",
    "kind": "biography"
  },
  "Paul Alivisatos": {
    "url": "https://en.wikipedia.org/wiki/Paul_Alivisatos",
    "label": "Paul Alivisatos, Wikipedia",
    "kind": "biography"
  },
  "Aleksey Yekimov": {
    "url": "https://en.wikipedia.org/wiki/Alexey_Ekimov",
    "label": "Alexey Ekimov, Wikipedia",
    "kind": "biography"
  },
  "Louis Brus": {
    "url": "https://en.wikipedia.org/wiki/Louis_Brus",
    "label": "Louis E. Brus, Wikipedia",
    "kind": "biography"
  },
  "Moungi Bawendi": {
    "url": "https://en.wikipedia.org/wiki/Moungi_Bawendi",
    "label": "Moungi Bawendi, Wikipedia",
    "kind": "biography"
  },
  "Tuomo Suntola": {
    "url": "https://en.wikipedia.org/wiki/Tuomo_Suntola",
    "label": "Tuomo Suntola, Wikipedia",
    "kind": "biography"
  },
  "Dawon Kahng": {
    "url": "https://en.wikipedia.org/wiki/Dawon_Kahng",
    "label": "Dawon Kahng, Wikipedia",
    "kind": "biography"
  },
  "Mozi": {
    "url": "https://plato.stanford.edu/entries/mohism/",
    "label": "Mohism, Stanford Encyclopedia of Philosophy",
    "kind": "biography"
  },
  "Ibn al-Haytham": {
    "url": "https://en.wikipedia.org/wiki/Ibn_al-Haytham",
    "label": "Ibn al-Haytham, Wikipedia",
    "kind": "biography"
  },
  "Gemma Frisius": {
    "url": "https://en.wikipedia.org/wiki/Gemma_Frisius",
    "label": "Gemma Frisius, Wikipedia",
    "kind": "biography"
  },
  "Daniele Barbaro": {
    "url": "https://en.wikipedia.org/wiki/Daniele_Barbaro",
    "label": "Daniele Barbaro, Wikipedia",
    "kind": "biography"
  },
  "Johannes Kepler": {
    "url": "https://en.wikipedia.org/wiki/Johannes_Kepler",
    "label": "Johannes Kepler, Wikipedia",
    "kind": "biography"
  },
  "François Dominique Séraphin": {
    "url": "https://en.wikipedia.org/wiki/Dominique_S%C3%A9raphin",
    "label": "François Dominique Séraphin, Wikipedia",
    "kind": "biography"
  },
  "Henri Rivière": {
    "url": "https://en.wikipedia.org/wiki/Henri_Rivi%C3%A8re_%28painter%29",
    "label": "Henri Rivière (painter), Wikipedia",
    "kind": "biography"
  },
  "Lotte Reiniger": {
    "url": "https://en.wikipedia.org/wiki/Lotte_Reiniger",
    "label": "Lotte Reiniger, Wikipedia",
    "kind": "biography"
  },
  "Wilhelm Rollmann": {
    "url": "https://stereoscopictures.com/anaglyph/anaglyphs/",
    "label": "Wilhelm Rollmann and the anaglyph, Stereoscopic Pictures",
    "kind": "profile"
  },
  "Louis Ducos du Hauron": {
    "url": "https://en.wikipedia.org/wiki/Louis_Arthur_Ducos_du_Hauron",
    "label": "Louis Arthur Ducos du Hauron, Wikipedia",
    "kind": "biography"
  },
  "Laurens Hammond": {
    "url": "https://en.wikipedia.org/wiki/Laurens_Hammond",
    "label": "Laurens Hammond, Wikipedia",
    "kind": "biography"
  },
  "Edwin H. Land": {
    "url": "https://www.library.hbs.edu/hc/polaroid/a-research-and-manufacturing-company/commercialization-of-the-polarizer",
    "label": "Edwin Land and the polarizer, Polaroid Corporation collection, Harvard Business School",
    "kind": "record"
  },
  "Julius Popp": {
    "url": "https://hausmedienkunst.de/en/exhibitions/julius-popp-selected-words/",
    "label": "Julius Popp, selected words, HMKV Hartware MedienKunstVerein",
    "kind": "profile"
  },
  "John West": {
    "url": "https://www.kent.edu/magazine/news/window-future",
    "label": "Window on the future, Kent State Magazine, 2015",
    "kind": "record"
  },
  "Kara Walker": {
    "url": "https://en.wikipedia.org/wiki/Kara_Walker",
    "label": "Kara Walker, Wikipedia",
    "kind": "biography"
  },
  "Martin Schadt": {
    "url": "https://en.wikipedia.org/wiki/Martin_Schadt",
    "label": "Martin Schadt, Wikipedia",
    "kind": "biography"
  },
  "Wolfgang Helfrich": {
    "url": "https://en.wikipedia.org/wiki/Wolfgang_Helfrich",
    "label": "Wolfgang Helfrich, Wikipedia",
    "kind": "biography"
  },
  "James Fergason": {
    "url": "https://en.wikipedia.org/wiki/James_Fergason",
    "label": "James Fergason, Wikipedia",
    "kind": "biography"
  },
  "George Heilmeier": {
    "url": "https://en.wikipedia.org/wiki/George_H._Heilmeier",
    "label": "George H. Heilmeier, Wikipedia",
    "kind": "biography"
  },
  "Sivaramakrishna Chandrasekhar": {
    "url": "https://en.wikipedia.org/wiki/Sivaramakrishna_Chandrasekhar",
    "label": "Sivaramakrishna Chandrasekhar, Wikipedia",
    "kind": "biography"
  },
  "Mohamed Atalla": {
    "url": "https://en.wikipedia.org/wiki/Mohamed_M._Atalla",
    "label": "Mohamed M. Atalla, Wikipedia",
    "kind": "biography"
  },
  "Larry Hornbeck": {
    "url": "https://en.wikipedia.org/wiki/Larry_Hornbeck",
    "label": "Larry Hornbeck, Wikipedia",
    "kind": "biography"
  },
  "Fritz Fischer": {
    "url": "https://en.wikipedia.org/wiki/Fritz_Fischer_%28physicist%29",
    "label": "Fritz Fischer (physicist), Wikipedia",
    "kind": "biography"
  },
  "Elsa Garmire": {
    "url": "https://en.wikipedia.org/wiki/Elsa_Garmire",
    "label": "Elsa M. Garmire, Wikipedia",
    "kind": "biography"
  },
  "Ivan Dryer": {
    "url": "https://en.wikipedia.org/wiki/Ivan_Dryer",
    "label": "Ivan Dryer, Wikipedia",
    "kind": "biography"
  },
  "Leota Toombs": {
    "url": "https://en.wikipedia.org/wiki/Leota_Toombs",
    "label": "Leota Toombs, Wikipedia",
    "kind": "biography"
  },
  "Michael Naimark": {
    "url": "https://en.wikipedia.org/wiki/Michael_Naimark",
    "label": "Michael Naimark, Wikipedia",
    "kind": "biography"
  },
  "Ramesh Raskar": {
    "url": "https://en.wikipedia.org/wiki/Ramesh_Raskar",
    "label": "Ramesh Raskar, Wikipedia",
    "kind": "biography"
  },
  "Lanny Smoot": {
    "url": "https://en.wikipedia.org/wiki/Lanny_Smoot",
    "label": "Lanny Smoot, Wikipedia",
    "kind": "biography"
  },
  "Barrett Comiskey": {
    "url": "https://en.wikipedia.org/wiki/Barrett_Comiskey",
    "label": "Barrett Comiskey, Wikipedia",
    "kind": "biography"
  },
  "Joseph Jacobson": {
    "url": "https://en.wikipedia.org/wiki/Joseph_Jacobson",
    "label": "Joseph Jacobson, Wikipedia",
    "kind": "biography"
  },
  "John Rogers": {
    "url": "https://en.wikipedia.org/wiki/John_A._Rogers",
    "label": "John A. Rogers, Wikipedia",
    "kind": "biography"
  },
  "Zhenan Bao": {
    "url": "https://en.wikipedia.org/wiki/Zhenan_Bao",
    "label": "Zhenan Bao, Wikipedia",
    "kind": "biography"
  },
  "Gerardo Beni": {
    "url": "https://en.wikipedia.org/wiki/Gerardo_Beni",
    "label": "Gerardo Beni, Wikipedia",
    "kind": "biography"
  },
  "Susan Hackwood": {
    "url": "https://en.wikipedia.org/wiki/Susan_Hackwood",
    "label": "Susan Hackwood, Wikipedia",
    "kind": "biography"
  },
  "Henry Dircks": {
    "url": "https://en.wikipedia.org/wiki/Henry_Dircks",
    "label": "Henry Dircks, Wikipedia",
    "kind": "biography"
  },
  "John Henry Pepper": {
    "url": "https://en.wikipedia.org/wiki/John_Henry_Pepper",
    "label": "John Henry Pepper, Wikipedia",
    "kind": "biography"
  },
  "Valerie Thomas": {
    "url": "https://en.wikipedia.org/wiki/Valerie_Thomas",
    "label": "Valerie Thomas, Wikipedia",
    "kind": "biography"
  },
  "Joseph Plateau": {
    "url": "https://en.wikipedia.org/wiki/Joseph_Plateau",
    "label": "Joseph Plateau, Wikipedia",
    "kind": "biography"
  },
  "Lambertus Hesselink": {
    "url": "https://en.wikipedia.org/wiki/Lambertus_Hesselink",
    "label": "Lambertus Hesselink, Wikipedia",
    "kind": "biography"
  },
  "Yoichi Ochiai": {
    "url": "https://en.wikipedia.org/wiki/Yoichi_Ochiai",
    "label": "Yoichi Ochiai, Wikipedia",
    "kind": "biography"
  },
  "Charles Wheatstone": {
    "url": "https://en.wikipedia.org/wiki/Charles_Wheatstone",
    "label": "Charles Wheatstone, Wikipedia",
    "kind": "biography"
  },
  "Kenneth Dunkley": {
    "url": "https://en.wikipedia.org/wiki/Kenneth_Dunkley",
    "label": "Kenneth J. Dunkley, Wikipedia",
    "kind": "biography"
  },
  "Frederic Ives": {
    "url": "https://en.wikipedia.org/wiki/Frederic_Ives",
    "label": "Frederic Eugene Ives, Wikipedia",
    "kind": "biography"
  },
  "Walter Hess": {
    "url": "https://en.wikipedia.org/wiki/Walter_Rudolf_Hess",
    "label": "Walter Rudolf Hess, Wikipedia",
    "kind": "biography"
  },
  "Hank Willis Thomas": {
    "url": "https://en.wikipedia.org/wiki/Hank_Willis_Thomas",
    "label": "Hank Willis Thomas, Wikipedia",
    "kind": "biography"
  },
  "Gabriel Lippmann": {
    "url": "https://en.wikipedia.org/wiki/Gabriel_Lippmann",
    "label": "Gabriel Lippmann, Wikipedia",
    "kind": "biography"
  },
  "Dennis Gabor": {
    "url": "https://en.wikipedia.org/wiki/Dennis_Gabor",
    "label": "Dennis Gabor, Wikipedia",
    "kind": "biography"
  },
  "Juris Upatnieks": {
    "url": "https://en.wikipedia.org/wiki/Juris_Upatnieks",
    "label": "Juris Upatnieks, Wikipedia",
    "kind": "biography"
  },
  "Margaret Benyon": {
    "url": "https://en.wikipedia.org/wiki/Margaret_Benyon",
    "label": "Margaret Benyon, Wikipedia",
    "kind": "biography"
  },
  "Stephen Benton": {
    "url": "https://en.wikipedia.org/wiki/Stephen_Benton",
    "label": "Stephen Benton, Wikipedia",
    "kind": "biography"
  },
  "Mary Lou Jepsen": {
    "url": "https://en.wikipedia.org/wiki/Mary_Lou_Jepsen",
    "label": "Mary Lou Jepsen, Wikipedia",
    "kind": "biography"
  },
  "Ali Javan": {
    "url": "https://en.wikipedia.org/wiki/Ali_Javan",
    "label": "Ali Javan, Wikipedia",
    "kind": "biography"
  },
  "Ivan Sutherland": {
    "url": "https://en.wikipedia.org/wiki/Ivan_Sutherland",
    "label": "Ivan Sutherland, Wikipedia",
    "kind": "biography"
  },
  "Bob Sproull": {
    "url": "https://en.wikipedia.org/wiki/Bob_Sproull",
    "label": "Bob Sproull, Wikipedia",
    "kind": "biography"
  },
  "Carolina Cruz-Neira": {
    "url": "https://history.siggraph.org/?p=47669",
    "label": "Carolina Cruz-Neira, ACM SIGGRAPH History Archives",
    "kind": "profile"
  },
  "Daniel Sandin": {
    "url": "https://www.evl.uic.edu/dan/bio.html",
    "label": "Daniel J. Sandin, Electronic Visualization Laboratory",
    "kind": "biography"
  },
  "Thomas DeFanti": {
    "url": "https://legacy.evl.uic.edu/tom/",
    "label": "Tom DeFanti, Electronic Visualization Laboratory",
    "kind": "biography"
  },
  "Greg Dawe": {
    "url": "https://chei.ucsd.edu/suncave/",
    "label": "Greg Dawe and SunCAVE, Cultural Heritage Engineering Initiative, UC San Diego",
    "kind": "record"
  },
  "Samuel Achilefu": {
    "url": "https://en.wikipedia.org/wiki/Samuel_Achilefu",
    "label": "Samuel Achilefu, Wikipedia",
    "kind": "biography"
  },
  "Daniel Leithinger": {
    "url": "https://www.aap.cornell.edu/people/daniel-leithinger",
    "label": "Daniel Leithinger, Cornell University",
    "kind": "profile"
  },
  "Sean Follmer": {
    "url": "https://www.cs.stanford.edu/people/sean-follmer",
    "label": "Sean Follmer, Stanford University",
    "kind": "profile"
  },
  "Klaus Peter Schönherr": {
    "url": "https://www.helptech.de/firmengeschichte",
    "label": "Klaus Peter Schönherr, Help Tech, company history",
    "kind": "profile"
  },
  "Horst Hörtner": {
    "url": "https://ars.electronica.art/futurelab/de/hoertner-horst/",
    "label": "Horst Hörtner, Ars Electronica / vog.photo",
    "kind": "profile"
  },
  "Elma Farnsworth": {
    "url": "https://interviews.televisionacademy.com/interviews/elma-farnsworth",
    "label": "Elma Farnsworth, Television Academy Foundation, interview 1996",
    "kind": "profile"
  },
  "Albert Brown": {
    "url": "https://patents.google.com/patent/US3482037A/en",
    "label": "Marie and Albert Brown, home security system patent",
    "kind": "record"
  },
  "Peter Goldmark": {
    "url": "https://en.wikipedia.org/wiki/Peter_Carl_Goldmark",
    "label": "Peter Carl Goldmark, Wikipedia",
    "kind": "biography"
  },
  "David Hagelbarger": {
    "url": "https://quello.msu.edu/divi/wp-content/uploads/2015/08/Memories-Noll.pdf#page=77",
    "label": "David Hagelbarger in A. Michael Noll’s Memories, printed p67",
    "kind": "record"
  },
  "Tadashi Nakamura": {
    "url": "https://www.noritake-itron.jp/eng/profile/nakamura/",
    "label": "Tadashi Nakamura biography, Noritake Itron",
    "kind": "biography"
  },
  "Tadashi Sasaki": {
    "url": "https://www.shmj.or.jp/english/pioneers/pnr16.html",
    "label": "Tadashi Sasaki, Semiconductor History Museum of Japan",
    "kind": "biography"
  },
  "Robert Willson": {
    "url": "https://www.invent.org/inductees/robert-h-willson",
    "label": "Robert H. Willson, National Inventors Hall of Fame",
    "kind": "biography"
  },
  "Tsutae Shinoda": {
    "url": "https://ethw.org/Tsutae_Shinoda",
    "label": "Tsutae Shinoda, Engineering and Technology History Wiki",
    "kind": "profile"
  },
  "Charles Spindt": {
    "url": "https://www.sirinc2.org/branch35/wp-content/uploads/2016/02/Member-Profile-Jun-2015.pages.pdf",
    "label": "Charles Spindt, Sons in Retirement, Branch 35",
    "kind": "profile"
  },
  "Louis Heynick": {
    "url": "https://maisonsaine.ca/uploads/2014/06/news183.pdf",
    "label": "Louis N. Heynick obituary, Bioelectromagnetics Society newsletter183",
    "kind": "biography"
  },
  "Howard Borden": {
    "url": "https://hparchive.com/Journals/HPJ-1969-02.pdf",
    "label": "Howard C. Borden contributed-author biography, HP Journal February 1969",
    "kind": "biography"
  },
  "Gerald Pighini": {
    "url": "https://hparchive.com/Journals/HPJ-1969-02.pdf",
    "label": "Gerald P. Pighini contributed-author biography, HP Journal February 1969",
    "kind": "biography"
  },
  "Xiaogang Peng": {
    "url": "https://www.chemie.uni-hamburg.de/institute/pc/kolloquium/abstracts/sose2021/abstract-peng.pdf",
    "label": "Xiaogang Peng, University of Hamburg, lecture programme 2021",
    "kind": "profile"
  },
  "Yizheng Jin": {
    "url": "https://hgi.njust.edu.cn/_upload/article/files/11/d2/893c676e465bb805d3bdd2d00a99/b8f65d36-7d8f-4375-98c3-d8dded728026.pdf",
    "label": "Yizheng Jin, Nanjing University of Science and Technology, conference programme 2016",
    "kind": "profile"
  },
  "Nicholas Sheridon": {
    "url": "https://thefutureofthings.com/3081-the-future-of-electronic-paper/",
    "label": "Nicholas Sheridon, TFOT, Nicholas K. Sheridon interview; photograph Deanna Horvath / Xerox",
    "kind": "profile"
  },
  "B. K. Sadashiva": {
    "url": "https://wwws.rri.res.in/htmls/library/imprints_collection/bios/sadashiva.html",
    "label": "B. K.Sadashiva biography, Raman Research Institute",
    "kind": "biography"
  },
  "K. A. Suresh": {
    "url": "https://wwws.rri.res.in/htmls/library/imprints_collection/bios/ka_suresh.html",
    "label": "K. A.Suresh, Raman Research Institute",
    "kind": "biography"
  },
  "Joseph Ostoja-Kotkowski": {
    "url": "https://en.wikipedia.org/wiki/Joseph_Stanislaus_Ostoja-Kotkowski",
    "label": "Joseph Stanislaus Ostoja-Kotkowski, Wikipedia",
    "kind": "biography"
  },
  "Greg Welch": {
    "url": "https://nursing.ucf.edu/people/gregory-welch/",
    "label": "Gregory Welch, University of Central Florida",
    "kind": "profile"
  },
  "Kok-Lim Low": {
    "url": "https://www.comp.nus.edu.sg/cs/people/lowkl/",
    "label": "Kok-Lim Low, National University of Singapore",
    "kind": "profile"
  },
  "Deepak Bandyopadhyay": {
    "url": "https://domino.ai/resources/videos/one-stop-for-data-drive-quality-and-compliance",
    "label": "Deepak Bandyopadhyay, Domino Data Lab / Johnson & Johnson, named speaker portrait",
    "kind": "profile"
  },
  "J. D. Albert": {
    "url": "https://www.invent.org/inductees/jonathan-d-albert",
    "label": "J. D. Albert, National Inventors Hall of Fame",
    "kind": "profile"
  },
  "Deng-Ke Yang": {
    "url": "https://www.kent.edu/materials-science/profile/deng-ke-yang",
    "label": "Deng-Ke Yang, Kent State University",
    "kind": "profile"
  },
  "J. William Doane": {
    "url": "https://www.kent.edu/physics/j-william-doane",
    "label": "J. William Doane, Kent State University",
    "kind": "profile"
  },
  "Robert Hayes": {
    "url": "https://aoe.scnu.edu.cn/a/20130314/133.html",
    "label": "Robert Andrew Hayes, South China Normal University faculty biography",
    "kind": "biography"
  },
  "Johan Feenstra": {
    "url": "https://fasttrack.tno.nl/en/@8454/johan-feenstra/",
    "label": "Johan Feenstra, TNO",
    "kind": "profile"
  },
  "Mark Miles": {
    "url": "https://greencityforce.org/person/mark-miles/",
    "label": "Mark Miles, Green City Force",
    "kind": "profile"
  },
  "S. K. Deb": {
    "url": "https://ime-15.sci-meet.net/plenary-speakers",
    "label": "S. K. Deb, IME-15 conference, Satyendra (Satyen) K. Deb biography",
    "kind": "profile"
  },
  "Karri Palovuori": {
    "url": "https://sochub.fi/people/",
    "label": "Karri Palovuori, SoC Hub",
    "kind": "profile"
  },
  "Ismo Rakkolainen": {
    "url": "https://www.tuni.fi/en/people/ismo-rakkolainen",
    "label": "Ismo Rakkolainen, Tampere University",
    "kind": "profile"
  },
  "Gregg Favalora": {
    "url": "https://www.boston.com/news/jobs/2011/01/18/optics_inventor_has_eye_for_ne/",
    "label": "Gregg Favalora, Josh Reynolds / The Boston Globe",
    "kind": "profile"
  },
  "Elizabeth Downing": {
    "url": "https://web.archive.org/web/20090615052750/http://www.3dtl.com:80/page9.php",
    "label": "Elizabeth Downing, 3DTL, archived Our CEO & Founder biography",
    "kind": "profile"
  },
  "Roger Macfarlane": {
    "url": "https://geoffreyburr.org/papers/IBMR%26D_y2kpaper.pdf#page=27",
    "label": "Roger M. Macfarlane contributed-author biography, IBM Journal 2000 p367",
    "kind": "biography"
  },
  "Daniel Smalley": {
    "url": "https://www.smalleyholography.org/contact-us",
    "label": "Daniel Smalley, Future Display Group",
    "kind": "profile"
  },
  "Ryuji Hirayama": {
    "url": "https://ryujihirayama.github.io/web/",
    "label": "Ryuji Hirayama, Ryuji Hirayama",
    "kind": "profile"
  },
  "Diego Martinez Plasencia": {
    "url": "https://vrst.acm.org/vrst2021/keynotes/",
    "label": "Diego Martinez Plasencia, ACM VRST 2021",
    "kind": "profile"
  },
  "Nobuyuki Masuda": {
    "url": "https://www.rs.tus.ac.jp/ae/lab_computer.html",
    "label": "Nobuyuki Masuda, Tokyo University of Science, computer engineering laboratory",
    "kind": "profile"
  },
  "Charles Harrison": {
    "url": "https://www.cooperhewitt.org/2018/12/11/remembering-charles-harrison-1931-2018/",
    "label": "Charles Harrison, Cooper Hewitt remembrance",
    "kind": "biography"
  },
  "Nasser Peyghambarian": {
    "url": "https://optics.arizona.edu/person/nasser-peyghambarian",
    "label": "Nasser Peyghambarian, University of Arizona",
    "kind": "profile"
  },
  "Pierre-Alexandre Blanche": {
    "url": "https://optics.arizona.edu/news-events/news/quicknews/pierre-alexandre-blanche-selected-2021-optimax-research-grant-winner",
    "label": "Pierre-Alexandre Blanche, University of Arizona",
    "kind": "profile"
  },
  "John Myer": {
    "url": "https://www.adidesignmuseum.org/en/collection/cifra-5-electro-mechanical-clock/",
    "label": "Cifra 5 design credits, ADI Design Museum",
    "kind": "record"
  },
  "John Ralston": {
    "url": "https://research.ibm.com/publications/a-three-color-solid-state-three-dimensional-display",
    "label": "A three-color, solid-state, three-dimensional display, Science (1996), listed by IBM Research",
    "kind": "record"
  },
  "Oleg Tretiakoff": {
    "url": "https://patents.google.com/patent/US4044350A/en",
    "label": "Tretiakoff and Tretiakoff, US patent 4,044,350",
    "kind": "record"
  },
  "Andrée Tretiakoff": {
    "url": "https://patents.google.com/patent/US4044350A/en",
    "label": "Tretiakoff and Tretiakoff, US patent 4,044,350",
    "kind": "record"
  },
  "A. Frankenstein": {
    "url": "https://www.histv.net/1900-1909",
    "label": "1900–1909 colour-television history, Histoire de la télévision",
    "kind": "record"
  },
  "W. von Jaworski": {
    "url": "https://www.histv.net/1900-1909",
    "label": "1900–1909 colour-television history, Histoire de la télévision",
    "kind": "record"
  },
  "Robert H. Anderson": {
    "url": "https://vintagetek.org/bob-anderson/",
    "label": "Bob Anderson biography, vintageTEK Museum",
    "kind": "biography"
  },
  "M. C. Schlamp": {
    "url": "https://www.aquestconsulting.com/team/",
    "label": "Michael Schlamp, chemistry PhD, UC Berkeley; Aquest Consulting",
    "kind": "profile"
  },
  "Ibn Daniyal": {
    "url": "https://wepa.unima.org/en/?p=773",
    "label": "Ibn Daniel, World Encyclopedia of Puppetry Arts, UNIMA",
    "kind": "biography"
  },
  "Paula Hammond": {
    "url": "https://www.sciencehistory.org/education/scientific-biographies/paula-hammond/",
    "label": "Paula Hammond, Science History Institute",
    "kind": "biography"
  },
  "Max Hirsch": {
    "url": "https://patents.google.com/patent/US2967905A/en",
    "label": "Max Hirsch, generescope patent",
    "kind": "record"
  },
  "Auguste Berthier": {
    "url": "https://commons.wikimedia.org/wiki/File:1896-05_A._Berthier_-_(le_cosmos_p._229).jpg",
    "label": "A.Berthier’s 1896 Le Cosmos parallax-barrier article diagram",
    "kind": "record"
  },
  "Kazuo Yoshinaka": {
    "url": "https://patents.google.com/patent/JPS61198892A/en",
    "label": "Kazuo Yoshinaka, NEC retinal display patent 1986",
    "kind": "record"
  },
  "J. M. Naish": {
    "url": "https://pubmed.ncbi.nlm.nih.gov/14190022/",
    "label": "J. M.Naish, Combination of information in superimposed visual fields, Nature 1964",
    "kind": "record"
  },
  "Emmett Leith": {
    "url": "https://en.wikipedia.org/wiki/Emmett_Leith",
    "label": "Emmett Leith, Wikipedia",
    "kind": "biography"
  },
  "Sriram Subramanian": {
    "url": "https://www.ucl.ac.uk/engineering/news/2025/sep/professor-sriram-subramanian-elected-fellow-royal-academy-engineering",
    "label": "Sriram Subramanian, University College London",
    "kind": "profile"
  },
  "Dean DeLongchamp": {
    "url": "https://www.nist.gov/people/dean-delongchamp",
    "label": "Dean DeLongchamp, National Institute of Standards and Technology",
    "kind": "profile"
  }
};
