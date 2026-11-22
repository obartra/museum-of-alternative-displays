import type { Source } from './schema';

/**
 * Sources found when the label lines about people were audited on 22 November 2026: what each line now rests on.
 * They are added to the sources of the piece's People section. docs/people/CURATOR.md has the record of the audit.
 */
export const auditSources: Record<string, Source[]> = {
  "flip-disc": [
    { kind: "patent", label: "Taylor and Winrow, US patent 3,303,494, Magnetically operated signs, Ferranti-Packard", url: "https://patents.google.com/patent/US3303494" },
    { kind: "paper", label: "Vardalas, From DATAR to the FP-6000 Computer, IEEE Annals of the History of Computing, volume 16, number 2 (1994)", url: "https://ewh.ieee.org/reg/7/millennium/fp6000/fp6000_datar.html" },
  ],
  "kinetic-mirror": [
    { kind: "lab", label: "Daniel Rozin, Adjacent, ITP, New York University", url: "https://itp.nyu.edu/adjacent/?p=104" },
    { kind: "archive", label: "Daniel Rozin, artist page, bitforms gallery", url: "https://bitforms.art/artist/daniel-rozin/" },
  ],
  "braille-display": [
    { kind: "patent", label: "Oleg Tretiakoff and Andree Tretiakoff, US patent 4,305,067 (granted 1981)", url: "https://patents.google.com/patent/US4305067" },
    { kind: "press", label: "Spezialtastatur mit Braille-Zeichen, Computerwoche (1977)", url: "https://www.computerwoche.de/article/2853120/spezialtastatur-mit-braille-zeichen.html" },
    { kind: "press", label: "Bildschirm-Textsystem für Blinde, Computerwoche (1981)", url: "https://www.computerwoche.de/article/2879306/bildschirm-textsystem-fuer-blinde.html" },
    { kind: "archive", label: "James Wares Bryce, IT History Society", url: "https://ithistory.org/honoree/james-wares-bryce" },
    { kind: "maker", label: "A legacy of invention, IBM History", url: "https://ibm.com/history/early-inventors" },
  ],
  "cathode-ray-tube": [
    { kind: "archive", label: "Milestones: Development of Electronic Television, 1924 to 1941, IEEE, Engineering and Technology History Wiki (2009)", url: "https://ethw.org/Milestones%3ADevelopment_of_Electronic_Television%2C_1924-1941" },
    { kind: "lab", label: "Kenjiro Takayanagi, Tokyo Institute of Technology", url: "https://www.titech.ac.jp/english/public-relations/about/stories/kenjiro-takayanagi" },
    { kind: "archive", label: "Philo Farnsworth, Linda Hall Library", url: "https://www.lindahall.org/philo-farnsworth" },
    { kind: "archive", label: "Farnsworth's Green Street Lab, California Historical Landmark 941, California Office of Historic Preservation", url: "https://ohp.parks.ca.gov/ListedResources/Detail/941" },
    { kind: "press", label: "Woman who helped invent TV dies at 98, Associated Press via NBC News (2006)", url: "https://www.nbcnews.com/news/amp/wbna12596707" },
    { kind: "archive", label: "Elma Farnsworth passes at 98, Television Academy (2006)", url: "https://www.televisionacademy.com/news/elma-farnsworth-passes-98" },
  ],
  "colour-wheel-television": [
    { kind: "archive", label: "1900 to 1909, Histoire de la télévision (histv.net)", url: "https://www.histv.net/1900-1909" },
    { kind: "archive", label: "Fernsehen und Bildübertragung, chronicle, VDE", url: "https://www.vde.com/de/geschichte/chronik/fernsehen-und-bilduebertragung" },
    { kind: "patent", label: "German patent 172 376, Google Patents record DE172376C", url: "https://patents.google.com/patent/DE172376C/en" },
  ],
  "vacuum-fluorescent": [
    { kind: "archive", label: "Milestones: Vacuum Fluorescent Displays, 1967, IEEE, Engineering and Technology History Wiki (2025)", url: "https://ethw.org/Milestones%3AVacuum_Fluorescent_Displays%2C_1967" },
    { kind: "maker", label: "History of Noritake, Noritake Itron", url: "https://www.noritake-elec.com/about/history" },
    { kind: "archive", label: "Tadashi Sasaki, Japanese Pioneers, Semiconductor History Museum of Japan", url: "https://shmj.or.jp/english/pioneers/pnr16.html" },
  ],
  "plasma-panel": [
    { kind: "lab", label: "ECE alumni inducted into the National Inventors Hall of Fame, University of Illinois", url: "https://ece.illinois.edu/news/3099" },
    { kind: "lab", label: "ECE alumni win Emmy for inventing the flat-panel plasma display, University of Illinois (2002)", url: "https://ece.illinois.edu/news/2541" },
  ],
  "field-emission": [
    { kind: "patent", label: "Spindt, Shoulders and Heynick, US patent 3,789,471, Field emission cathode structures, devices utilizing such structures, and methods of producing such structures (filed 1972, granted 1974)", url: "https://patents.google.com/patent/US3789471A" },
    { kind: "lab", label: "Spindt cold cathode for displays, SRI International", url: "https://www.sri.com/hoi/spindt-cold-cathode-for-displays/" },
    { kind: "lab", label: "Akintunde Ibitayo Akinwande, MIT Microsystems Technology Laboratories", url: "https://mtlsites.mit.edu/users/akinwand/" },
    { kind: "patent", label: "Akinwande and Velásquez-García, US patent 8,198,106, Dense array of field emitters using vertical ballasting structures (priority 2007)", url: "https://patents.google.com/patent/US8198106" },
    { kind: "lab", label: "High-Current Field Emission Cold Cathodes, Multiplexed Field Electron Devices, MIT", url: "https://multiplexed.mit.edu/research/multiplexed-field-electron-devices/high-current-field-emission-cold-cathodes" },
  ],
  "oled": [
    { kind: "archive", label: "Ching Wan Tang, National Inventors Hall of Fame", url: "https://invent.org/inductees/ching-wan-tang" },
    { kind: "archive", label: "Steven Van Slyke, National Inventors Hall of Fame", url: "https://invent.org/inductees/steven-van-slyke" },
    { kind: "lab", label: "Kyoto Prize for Ching Tang, University of Rochester News Center (2019)", url: "https://www.rochester.edu/newscenter/kyoto-prize-ching-tang-oled-technology-387032/" },
  ],
  "microled": [
    { kind: "lab", label: "Hongxing Jiang, curriculum vitae, Texas Tech University (2023)", url: "https://www.depts.ttu.edu/ece/faculty/hongxing_jiang/hongxing_jiang_2023.pdf" },
  ],
  "quantum-dot": [
    { kind: "archive", label: "Aleksey Ekimov, biography, Optica", url: "https://optica.org/History/Biographies/bios/Aleksey_Ekimov" },
    { kind: "press", label: "Nobel Prize in Chemistry shows Russia's merits in science, TASS (2023)", url: "https://tass.com/science/1684603" },
    { kind: "lab", label: "MIT chemist Moungi Bawendi shares Nobel Prize in Chemistry, MIT News (2023)", url: "https://news.mit.edu/index%2Ephp/2023/mit-chemist-moungi-bawendi-shares-nobel-prize-chemistry-1004" },
  ],
  "thin-film-el": [
    { kind: "press", label: "Finnish physicist Tuomo Suntola wins Millennium Technology Prize, thisisFINLAND (2018)", url: "https://finland.fi/business-innovation/finnish-physicist-tuomo-suntola-wins-millennium-technology-prize/" },
    { kind: "archive", label: "How ALD technology made the world lighter, Millennium Technology Prize", url: "https://millenniumprize.org/news-articles/news/how-ald-technology-made-the-world-lighter/" },
    { kind: "lab", label: "Developer of atomic layer deposition Tuomo Suntola receives Millennium Technology Prize, University of Helsinki (2018)", url: "https://www.helsinki.fi/en/news/science/developer-of-atomic-layer-deposition-tuomo-suntola-receives-millennium-technology-prize" },
  ],
  "flexible-display": [
    { kind: "press", label: "Electronic Paper Turns the Page, MIT Technology Review (2001)", url: "https://www.technologyreview.com/s/400901/electronic-paper-turns-the-page/" },
  ],
  "camera-obscura": [
    { kind: "paper", label: "Matthias Schemmel and William G. Boltz, Theoretical Knowledge in the Mohist Canon, Springer (2022)", url: "https://link.springer.com/content/pdf/10.1007/978-3-031-08797-4.pdf" },
    { kind: "lab", label: "J. J. O'Connor and E. F. Robertson, Abu Ali al-Hasan ibn al-Haytham, MacTutor History of Mathematics, University of St Andrews", url: "https://mathshistory.st-andrews.ac.uk/Biographies/Al-Haytham/" },
    { kind: "archive", label: "New Optical Technologies, The Sun in Early Modernity, Linda Hall Library", url: "https://www.lindahall.org/experience/digital-exhibitions/sun-in-early-modernity/03-optics-telescopes-and-technological-change/new-optical-technologies/" },
    { kind: "lab", label: "J. J. O'Connor and E. F. Robertson, Regnier Gemma Frisius, MacTutor History of Mathematics, University of St Andrews", url: "https://mathshistory.st-andrews.ac.uk/Biographies/Gemma_Frisius/" },
  ],
  "shadow-play": [
    { kind: "paper", label: "George, The Illustrations of the Maqamat and the shadow play, Muqarnas 28 (2011), Edinburgh Research Explorer", url: "https://www.pure.ed.ac.uk/ws/files/13458099/Gearoge_2011_The_illustrations_of_the_Maqamat_and_the_shadow_play.pdf" },
    { kind: "paper", label: "Ahmed Shafik, Ibn Daniyal's shadow plays in Egypt: the character of Tayf al-Khayal, Al-Andalus Magreb 21 (2014)", url: "https://revistas.uca.es/index.php/aam/article/view/7428" },
    { kind: "reference", label: "François Dominique Séraphin (Wikipedia)", url: "https://en.wikipedia.org/wiki/Fran%C3%A7ois_Dominique_S%C3%A9raphin" },
  ],
  "liquid-crystal": [
    { kind: "archive", label: "Peter J. Wild, First-Hand: Liquid Crystal Display Evolution, Swiss Contributions, Engineering and Technology History Wiki, IEEE", url: "https://ethw.org/First-Hand:Liquid_Crystal_Display_Evolution_-_Swiss_Contributions" },
    { kind: "paper", label: "Sparavigna, James Fergason, a Pioneer in Advancing of Liquid Crystal Technology, arXiv (2013)", url: "https://arxiv.org/pdf/1310.7569" },
    { kind: "archive", label: "James Fergason, Lemelson-MIT Program", url: "https://lemelson.mit.edu/resources/james-fergason" },
    { kind: "archive", label: "George Heilmeier, Lemelson-MIT Program", url: "https://lemelson.mit.edu/resources/george-heilmeier" },
    { kind: "archive", label: "George H. Heilmeier, 2005 Kyoto Prize Laureate, Inamori Foundation", url: "https://www.kyotoprize.org/en/laureates/george_h_heilmeier/" },
  ],
  "micromirror": [
    { kind: "archive", label: "Larry Hornbeck, National Inventors Hall of Fame", url: "https://www.invent.org/inductees/larry-hornbeck" },
  ],
  "eidophor": [
    { kind: "paper", label: "Baumann, The Fischer Large-Screen Projection System, Journal of the SMPTE (1953)", url: "https://lantern.mediahist.org/catalog/journalofsociety60socirich_0353" },
    { kind: "reference", label: "Fischer, Fritz, Historical Dictionary of Switzerland", url: "https://hls-dhs-dss.ch/it/articles/031341/" },
  ],
  "gyricon": [
    { kind: "press", label: "Startups Struggle in the e-Paper Chase, MIT Technology Review (2001)", url: "https://www.technologyreview.com/2001/03/06/235986/startups-struggle-in-the-e-paper-chase/" },
  ],
  "electrophoretic-ink": [
    { kind: "archive", label: "Jonathan D. Albert, National Inventors Hall of Fame (2016)", url: "https://www.invent.org/inductees/jonathan-d-albert" },
  ],
  "electrowetting": [
    { kind: "patent", label: "Beni and Hackwood, Devices based on surface tension changes, US patent 4,417,786 (1983)", url: "https://uspto.report/patent/grant/4417786" },
    { kind: "lab", label: "Professor Susan Hackwood, Centre for Science and Policy, University of Cambridge", url: "https://www.csap.cam.ac.uk/network/susan-hackwood" },
  ],
  "interferometric-modulator": [
    { kind: "press", label: "Qualcomm to acquire display technology innovator Iridigm, Qualcomm (2004)", url: "https://www.qualcomm.com/news/releases/2004/09/qualcomm-acquire-display-technology-innovator-iridigm" },
  ],
  "electrochromic": [
    { kind: "lab", label: "Satyen K. Deb, Center Director Emeritus, National Renewable Energy Laboratory", url: "https://corpora.tika.apache.org/base/docs/govdocs1/210/210482.html" },
    { kind: "paper", label: "Reminiscences on the discovery of electrochromic phenomena in transition metal oxides, Solar Energy Materials and Solar Cells (1995)", url: "https://research-hub.nrel.gov/en/publications/reminiscences-on-the-discovery-of-electrochromic-phenomena-in-tra/" },
    { kind: "paper", label: "Zhang, Benson, Tracy, Deb, Czanderna and Bechinger, Chromic mechanism in amorphous WO3 films, NREL (1996)", url: "https://digital.library.unt.edu/ark:/67531/metadc689774/m2/1/high_res_d/515587.pdf" },
    { kind: "paper", label: "Benson, Tracy and Ruth, Solid state electrochromic switchable window glazings, SERI (1984)", url: "https://nrel.gov/docs/legosti/old/2455.pdf" },
  ],
  "fog-screen": [
    { kind: "lab", label: "Ismo Rakkolainen, Lemelson-MIT Program, Massachusetts Institute of Technology", url: "https://lemelson.mit.edu/resources/ismo-rakkolainen" },
    { kind: "archive", label: "Rakkolainen, Landkammer, Piiro and Palovuori, The Walk-thru Fog Screen Experience, ACM SIGGRAPH History Archives", url: "https://history.siggraph.org/experience/the-walk-thru-fog-screen-experience-by-rakkolainen-landkammer-piiro-and-palovuori/" },
  ],
  "swept-volume": [
    { kind: "press", label: "Students Get Sneak Preview of 3-D TV, The Harvard Crimson (1998)", url: "https://www.thecrimson.com/article/1998/4/23/students-get-sneak-preview-of-3-d/" },
    { kind: "press", label: "Gregg Favalora, Innovators Under 35, MIT Technology Review (1999)", url: "https://innovatorsunder35.com/the-list/gregg-favalora" },
    { kind: "press", label: "Perspecta 3D display, optics.org (2002)", url: "https://optics.org/article/9126" },
    { kind: "press", label: "NASA Buys Perspecta 3-D System, Photonics.com (2003)", url: "https://photonics.com/Articles/NASA_Buys_Perspecta_3-D_System/a14915" },
  ],
  "static-volume": [
    { kind: "paper", label: "Downing, Hesselink, Ralston and Macfarlane, A three-color, solid-state, three-dimensional display, Science (1996)", url: "https://research.ibm.com/publications/a-three-color-solid-state-three-dimensional-display" },
    { kind: "press", label: "Inside 3-D, Los Angeles Times in The Roanoke Times (1996)", url: "https://scholar.lib.vt.edu/VA-news/ROA-Times/issues/1996/rt9608/960830/08300057.htm" },
  ],
  "acoustic-levitation": [
    { kind: "lab", label: "Research news, University of Sussex (2019)", url: "https://www.sussex.ac.uk/news/research?id=50264" },
    { kind: "archive", label: "Special purpose computer system for digital holography technology using FPGA, KAKEN grant record (2018 to 2021)", url: "https://kaken.nii.ac.jp/en/grant/KAKENHI-PROJECT-18K11328" },
  ],
  "parallax-barrier": [
    { kind: "paper", label: "Sam H. Kaplan, Theory of Parallax Barriers, Journal of the Society of Motion Picture Engineers, vol. 59 (1952)", url: "https://lantern.mediahist.org/catalog/journalofsociety59socirich_0020" },
    { kind: "patent", label: "Frederic E. Ives, Parallax stereogram and process of making same, US patent 725,567 (1903)", url: "https://patents.google.com/patent/US725567" },
    { kind: "reference", label: "Frederic Eugene Ives (Wikipedia)", url: "https://en.wikipedia.org/wiki/Frederic_Eugene_Ives" },
  ],
  "holography": [
    { kind: "paper", label: "Dennis Gabor, Holography, 1948 to 1971, Nobel Lecture (1971)", url: "https://nobelprize.org/uploads/2018/06/gabor-lecture-1.pdf" },
    { kind: "archive", label: "Dennis Gabor, Facts, The Nobel Prize", url: "https://www.nobelprize.org/prizes/physics/1971/gabor/facts" },
    { kind: "paper", label: "Jepsen, Holographic Video: Design and Implementation of a Display System, MIT (1989)", url: "https://dspace.mit.edu/entities/publication/e4d4f9f7-4453-46a3-83c4-7ba31526e0af" },
    { kind: "lab", label: "Physics professor emeritus Ali Javan dies at 89, MIT News (2016)", url: "https://news.mit.edu/2016/physics-professor-emeritus-ali-javan-dies-0929" },
  ],
  "head-mounted": [
    { kind: "archive", label: "Ivan Sutherland, A.M. Turing Award, Association for Computing Machinery", url: "https://amturing.acm.org/award_recipient/sutherland_3467412" },
    { kind: "archive", label: "The Sword of Damocles, early head-mounted display, Computer History Museum", url: "https://www.computerhistory.org/revolution/input-output/14/356/1888" },
  ],
  "head-up": [
    { kind: "paper", label: "J. M. Naish, A Review of Some Head-Up Display Formats, NASA Technical Paper 1499 (1979)", url: "https://ntrs.nasa.gov/api/citations/19790025030/downloads/19790025030.pdf" },
    { kind: "paper", label: "J. M. Naish, Display research and its application to civil aircraft, Aeronautical Journal (1965)", url: "https://www.cambridge.org/core/journals/aeronautical-journal/article/display-research-and-its-application-to-civil-aircraft/C0CB347B8C409A420A8F2D4BBEFC463D" },
  ],
  "scanned-laser": [
    { kind: "press", label: "Elsa Garmire: pioneering laser physicist helped launch laser light shows, SPIE Photonics Focus (2021)", url: "https://lux.spie.org/news/photonics-focus/novdec-2021/elsa-garmire-pioneering-laser-physicist-helped-launch-laser-light-shows" },
    { kind: "archive", label: "Ivan Dryer (1939 to 2017), IMERSA", url: "https://www.imersa.org/speakers/item/ivan-dryer" },
  ],
  "retinal-display": [
    { kind: "patent", label: "Kazuo Yoshinaka, Display device, Japanese patent application JPS61198892A, NEC (filed 1985, published 1986)", url: "https://patents.google.com/patent/JPS61198892A/en" },
    { kind: "paper", label: "Lin, Cheng, Yao and Wang, Retinal projection head-mounted display, Frontiers of Optoelectronics (2017)", url: "https://journal.hep.com.cn/foe/EN/10.1007/s12200-016-0662-8" },
  ],
};
