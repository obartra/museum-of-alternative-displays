import type { Fact } from './facts';

/** Worth knowing: one fact per piece for halls 4, 5, 6 and 7. Each comes from the source beside it, which was opened and read. */
export const factsB: Record<string, Fact> = {
  // Hall 4
  'camera-obscura': {
    text: 'A gap between the leaves of a tree works as the hole of a camera obscura. During a partial eclipse of the sun, the patches of light on the ground under the tree turn into crescents, each one a picture of the sun.',
    source: { label: 'Eclipse in the Shade, Astronomy Picture of the Day, NASA (1999)', url: 'https://science.nasa.gov/image-article/apod-1999-august-13-eclipse-in-the-shade/', kind: 'archive' },
  },
  'shadow-play': {
    text: 'In Java the lamp has a name of its own, the blencong, and a keeper of its own: a stage assistant tends the flame so that the shadows on the screen stay clear. In many performances today electric light has taken its place.',
    source: { label: 'Blencong: The Traditional Lamp That Brings Shadow Puppets to Life, Museum Sonobudoyo, Yogyakarta', url: 'https://sonobudoyo.jogjaprov.go.id/en/tulisan/read/blencong-cahaya-yang-menghidupkan-bayangan-wayang', kind: 'archive' },
  },
  'liquid-crystal': {
    text: 'The twist comes from rubbing. Traditionally, a thin plastic film on each glass plate is rubbed in one direction, at right angles to the other plate, and the molecules line up along the strokes. Why this works was debated for most of a century.',
    source: { label: 'Stöhr, Samant and Lüning, From NEXAFS Spectroscopy to New Flat Panel Displays, Stanford Synchrotron Radiation Laboratory', url: 'https://www-ssrl.slac.stanford.edu/stohr/liquidcrystal.htm', kind: 'lab' },
  },
  'micromirror': {
    text: 'The first product built around the chip was not a projector. It was a high-speed printer for airline tickets, which used a single row of 840 mirrors.',
    source: { label: 'The Digital Micromirror Device: A Historic Mechanical Engineering Landmark, American Society of Mechanical Engineers (2008)', url: 'https://www.asme.org/wwwasmeorg/media/ResourceFiles/AboutASME/Who%20We%20Are/Engineering%20History/Landmarks/DMD_Brochure.pdf', kind: 'archive' },
  },
  'lcos': {
    text: 'Its ancestor, the Hughes light valve, was from the late 1970s the preferred projector for industry and for military command and control rooms. In 1999 it shared with the micromirror chip the first showings of digital cinema to paying audiences.',
    source: { label: '47 Years of SID Symposia: Nurturing Progress in Projection Technology, Society for Information Display', url: 'https://www.sid.org/Portals/sid/Files/pdf/PROJ%20chart%20FINAL%205-20.pdf', kind: 'archive' },
  },
  'eidophor': {
    text: 'Three Eidophors worked behind the big screens of the Apollo Mission Control room in Houston. NASA describes them as the main means of putting video on the large screen in front of the flight controllers.',
    source: { label: 'Apollo Mission Control Center Restoration, NASA Johnson Space Center', url: 'https://www.nasa.gov/johnson/history/apollo-mcc-restoration/', kind: 'archive' },
  },
  'scanned-laser': {
    text: 'In the United States, laser shows are regulated by the Food and Drug Administration. Its rules hold a show projector to 5 milliwatts of visible light, and anything stronger needs the agency\'s written approval before a show may be given.',
    source: { label: 'Laser Light Shows, US Food and Drug Administration', url: 'https://www.fda.gov/radiation-emitting-products/home-business-and-entertainment-products/laser-light-shows', kind: 'archive' },
  },
  'projection-mapping': {
    text: 'Before playing the film back, Naimark spray-painted the room and everything in it white, to make a screen of exactly the right shape. The two people in the film were not there to be painted, so they looked like ghosts.',
    source: { label: 'Displacements, Michael Naimark', url: 'http://www.naimark.net/projects/displacements.html', kind: 'maker' },
  },

  // Hall 5
  'gyricon': {
    text: 'A 1993 Xerox patent describes a way to make the beads. Molten white wax runs over one face of a spinning disc and black wax over the other. At the rim they meet without mixing and fly off as droplets, half white, half black.',
    source: { label: 'Crowley, Richley and Sheridon, US patent 5,262,098', url: 'https://patents.google.com/patent/US5262098', kind: 'patent' },
  },
  'electrophoretic-ink': {
    text: 'In 2008 the magazine Esquire put a battery-powered electronic ink panel on the cover of 100,000 copies of one issue. Each panel was to be fitted by hand, and the copies were to travel in refrigerated trucks to preserve the batteries.',
    source: { label: 'A flashy first for Esquire magazine, The Christian Science Monitor (2008)', url: 'https://www.csmonitor.com/Technology/Horizons/2008/0722/a-flashy-first-for-esquire-magazine', kind: 'press' },
  },
  'cholesteric-lcd': {
    text: 'Some beetles get their colour in the same way. A 2009 study linked the metallic green of the jewel beetle Chrysina gloriosa to a shell built like a cholesteric liquid crystal, reflecting light of one circular polarisation only.',
    source: { label: 'The chirality of beetles, Physics Today (2009)', url: 'https://physicstoday.aip.org/backscatter/the-chirality-of-beetles', kind: 'press' },
  },
  'electrowetting': {
    text: 'The same effect can focus a camera. In 2004 Philips researchers described a lens formed where salty water meets oil in a glass tube 3 millimetres wide. A voltage changed its curve, and it refocused in 10 milliseconds with no moving parts.',
    source: { label: 'Hendriks and Kuiper, Through a Lens Sharply, IEEE Spectrum (2004)', url: 'https://spectrum.ieee.org/through-a-lens-sharply', kind: 'press' },
  },
  'interferometric-modulator': {
    text: 'A cell switched to black has not stopped reflecting. With its mirror pulled in, the cavity reinforces ultraviolet light, which the eye cannot see, so the cell looks black.',
    source: { label: 'Iridescent Displays, MIT Department of Mechanical Engineering (2012)', url: 'https://meche.mit.edu/news-media/iridescent-displays', kind: 'press' },
  },
  'electrochromic': {
    text: 'Prussian blue, a pigment first made in Berlin in the early 1700s and still used in paints and printing inks, is electrochromic. The electrochemistry of thin films of it was first reported only in 1978.',
    source: { label: 'Monk, Mortimer and Rosseinsky, Electrochromism and Electrochromic Devices, chapter 8, Cambridge University Press (2007)', url: 'https://doi.org/10.1017/CBO9780511550959.010', kind: 'paper' },
  },

  // Hall 6
  'peppers-ghost': {
    text: 'Pepper wrote that even Michael Faraday, taken behind the scenes, said he did not understand how the ghost was made. Pepper put Faraday\'s hand on one of the huge glass plates, and only then did Faraday say he understood.',
    source: { label: 'J. H. Pepper, The True History of the Ghost', url: 'https://archive.org/details/truehistoryofgho00pepp', kind: 'archive' },
  },
  'illusion-transmitter': {
    text: 'When she invented it, Thomas was managing the image-processing systems for Landsat, the first satellite to send multi-spectral pictures of the Earth\'s resources from space. She had joined NASA as a data analyst.',
    source: { label: 'Valerie Thomas, Lemelson-MIT', url: 'https://lemelson.mit.edu/resources/valerie-thomas', kind: 'archive' },
  },
  'fog-screen': {
    text: 'Its developers report that the first thing most people do on seeing one is put their hands into it. The fog feels like slightly cool air, and the picture forms again behind anyone who walks through.',
    source: { label: 'DiVerdi, Olwal, Rakkolainen and Höllerer, An Immaterial Pseudo-3D Display with 3D Interaction (2008)', url: 'https://www.olwal.com/projects/research/immaterial/diverdi_immaterial_3dtv_book_chapter_2008.pdf', kind: 'paper' },
  },
  'persistence-of-vision': {
    text: 'Isaac Newton described the effect with a burning coal. Moved quickly round in a circle, he wrote in his Opticks, it makes the whole circle look like fire, because the sensation of the coal lasts until it comes round again.',
    source: { label: 'I. Newton, Opticks, fourth edition (1730)', url: 'https://archive.org/details/opticksortreatis1730newt', kind: 'archive' },
  },
  'swept-volume': {
    text: 'Hirsch called his machine a generescope and had air traffic control in mind. His patent says it would let a group of observers see the positions and movements of aircraft in three dimensions.',
    source: { label: 'Hirsch, US patent 2,967,905', url: 'https://patents.google.com/patent/US2967905', kind: 'patent' },
  },
  'static-volume': {
    text: 'Three industries were interested in the stacked-sheet display, and each wanted something else. Doctors wanted a picture free of all artefacts and the oil industry a much larger one. Slot machine makers needed a price near 50 dollars. It cost more than 10,000.',
    source: { label: 'Smalley and others, Volumetric Displays: Turning 3-D Inside-Out, Optics and Photonics News (2018)', url: 'https://www.optica-opn.org/home/articles/volume_29/june_2018/features/volumetric_displays_turning_3-d_inside-out/', kind: 'press' },
  },
  'optical-trap': {
    text: 'Its makers called it the Princess Leia project, after the floating message in Star Wars. Among the first things they drew were rings of light around a person\'s arm and a figure in a lab coat crouched in Leia\'s pose.',
    source: { label: 'BYU study produces 3D images, Brigham Young University', url: 'https://physics.byu.edu/department/news/2018-12-byu-study-produces-3d-images', kind: 'lab' },
  },
  'acoustic-levitation': {
    text: 'One demonstration was a countdown timer hanging in the air. A user could see it, hear it, start and stop it with a finger gesture, and feel a touch in reply each time.',
    source: { label: 'Hirayama and others, A volumetric display for visual, tactile and audio presentation using acoustic trapping, Nature (2019)', url: 'https://doi.org/10.1038/s41586-019-1739-5', kind: 'paper' },
  },
  'laser-plasma': {
    text: 'The picture can be heard. Each point of plasma gives off sound as well as light, and the brighter it glows the louder it is. A sound meter 2 centimetres from the 2015 display read up to 77 decibels.',
    source: { label: 'Ochiai and others, Fairy Lights in Femtoseconds (2015)', url: 'https://arxiv.org/pdf/1506.06668.pdf', kind: 'paper' },
  },

  // Hall 7
  'stereoscope': {
    text: 'Wheatstone published the stereoscope in 1838, months before photography was announced. So the first pictures seen in it were drawings: pairs of outlines of solid shapes such as a cube and a cone.',
    source: { label: 'D. Brewster, The Stereoscope: Its History, Theory, and Construction (1856)', url: 'https://archive.org/details/stereoscopeitshi00brew', kind: 'archive' },
  },
  'parallax-barrier': {
    text: 'Ives\'s first one was a glass transparency. Held 12 inches from the eyes, it looked like the front of a box with a statuette and two glass vases inside. He traced the idea to his work on the line screens used to print photographs.',
    source: { label: 'Ives, A Novel Stereogram, Journal of the Franklin Institute (1902)', url: 'https://zenodo.org/record/2075045', kind: 'paper' },
  },
  'lenticular': {
    text: 'Ribbed lenses once made colour home movies. Kodacolor film, sold by Kodak from 1928, had tiny lenses embossed on it. With red, green and blue filter bands over the camera lens, they recorded each colour in its own strip of the picture.',
    source: { label: 'Kodacolor / Keller-Dorian Color, Timeline of Historical Colors in Photography and Film, Barbara Flueckiger', url: 'https://filmcolors.org/timeline-entry/1240/', kind: 'archive' },
  },
  'integral-imaging': {
    text: 'Its descendants include a camera. In 2005 a Stanford team put a sheet of 296 by 296 tiny lenses in front of a camera sensor, recorded the direction of the light as well as its position, and refocused the photographs afterwards.',
    source: { label: 'Ng and others, Light Field Photography with a Hand-held Plenoptic Camera, Stanford Tech Report CTSR 2005-02', url: 'https://graphics.stanford.edu/papers/lfcamera/lfcamera-150dpi.pdf', kind: 'paper' },
  },
  'holography': {
    text: 'Gabor named the hologram from the Greek holos, the whole, because it held the whole information. The name fits in another way: any small piece of a hologram of a diffusely lit scene can rebuild the entire picture, only with more noise.',
    source: { label: 'Gabor, Holography, 1948-1971, Nobel Lecture (1971)', url: 'https://www.nobelprize.org/uploads/2018/06/gabor-lecture.pdf', kind: 'paper' },
  },
  'head-mounted': {
    text: 'One scene shown in the 1968 headset was a room drawn in lines around the wearer: walls marked N, S, E and W, a ceiling marked C and a floor marked F. Sutherland reported that people quickly accepted being inside it.',
    source: { label: 'Sutherland, A head-mounted three dimensional display, AFIPS Fall Joint Computer Conference (1968)', url: 'https://www.cise.ufl.edu/research/lok/teaching/ve-s07/papers/sutherland-headmount.pdf', kind: 'paper' },
  },
  'cave': {
    text: 'Green phosphor in the projection tubes of the time glowed too long for shutter glasses, so each eye saw both pictures. Until special tubes came, the 1991 experiments were done in blue, red and shades of magenta.',
    source: { label: 'Cruz-Neira, Sandin and DeFanti, Surround-Screen Projection-Based Virtual Reality: The Design and Implementation of the CAVE, Proceedings of SIGGRAPH 93', url: 'https://www.evl.uic.edu/documents/siggraph93-cave-cruz-neira.pdf', kind: 'paper' },
  },
  'retinal-display': {
    text: 'All the light that enters an eye from an ordinary desktop screen amounts to less than a millionth of a watt. That is small beside what one light-emitting diode can supply.',
    source: { label: 'In the Eye of the Beholder, IEEE Spectrum (2004)', url: 'https://spectrum.ieee.org/in-the-eye-of-the-beholder', kind: 'press' },
  },
  'head-up': {
    text: 'The system first called a head-up display answered a question put to J. M. Naish at Farnborough in 1956: how to fly fast and low in poor visibility without looking down. A television picture in the instrument panel was considered and rejected.',
    source: { label: 'Naish, A Review of Some Head-Up Display Formats, NASA Technical Paper 1499 (1979)', url: 'https://ntrs.nasa.gov/citations/19790025030', kind: 'paper' },
  },
};
