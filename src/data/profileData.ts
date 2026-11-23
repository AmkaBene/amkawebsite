export interface WorkItem {
  id: string;
  title: string;
  category: 'illustrations' | 'posters' | 'code';
  medium: string;
  year: string;
  summary: string;
  details: string;
  image?: string;
  imageAlt?: string;
  codeSnippet?: string;
  codePreviewType?: 'caustics' | 'pathfinder';
  externalUrl?: string;
  externalLabel?: string;
}

export interface FriendOc {
  id: string;
  name: string;
  setting: string;
  auraType: string;
  checks: string;
  summary: string;
  image: string;
}

export interface OutingPhoto {
  id: string;
  speaker: string;
  quote: string;
  scene: string;
  image: string;
  alt: string;
}

export interface HanbokPhoto {
  id: string;
  title: string;
  caption: string;
  image: string;
  alt: string;
}

export interface VaultPhoto {
  id: string;
  title: string;
  date: string;
  caption: string;
  image: string;
}

export const VAULT_PHOTOS: VaultPhoto[] = [
  {
    id: 'mamuna-arcade-digicam',
    title: 'Arcade Mirror Digicam',
    date: 'Feb 9, 2026',
    caption: 'Late-night arcade lights, matching glasses, and catching ourselves in the Sony digicam lens.',
    image: '/assets/aistudio/IMG_20260209_232035_327_a86d6967.jpg',
  },
  {
    id: 'mamuna-pizza-date',
    title: 'Pizza Slice & Blue Straw',
    date: 'Jan 31, 2026',
    caption: 'Peace sign, pepper pizza slice, and sharing every casual food run together.',
    image: '/assets/aistudio/20260131_172131_740208c5.jpg',
  },
  {
    id: 'mamuna-pine-forest',
    title: 'Sunlight Through the Pines',
    date: 'Aug 27, 2026',
    caption: 'Golden afternoon sunlight under the pine trees holding each other tight.',
    image: '/assets/aistudio/20260827_171640_07a7deda.jpg',
  },
  {
    id: 'mamuna-doorway-mirror',
    title: 'Doorway Mirror Check',
    date: 'Jun 30, 2026',
    caption: 'Full-length mirror snap with her waving over my shoulder before heading out.',
    image: '/assets/aistudio/20260630_153942_b05a54cb.jpg',
  },
  {
    id: 'mamuna-thermos-peek',
    title: 'Quiet Lunch Table',
    date: 'Feb 9, 2026',
    caption: 'Peeking behind the matte tumbler with her pretty dark nails and warmest eyes.',
    image: '/assets/aistudio/20260209_170508_ad7bba45.jpg',
  },
  {
    id: 'mamuna-instaframe-6cut',
    title: 'Instaframe L6 Strip',
    date: 'Feb 2026',
    caption: 'Six silver studio cuts—finger hearts, big overhead heart, and matching knits.',
    image: '/assets/aistudio/Screenshot_20260719_214530_Gallery_057323bc.jpg',
  },
  {
    id: 'mamuna-room-hug',
    title: 'Room Mirror Hug',
    date: 'Feb 13, 2026',
    caption: 'Wrapping both arms around her by the pink shelf full of framed memories.',
    image: '/assets/aistudio/20260213_201450_d2e3c8d8.jpg',
  },
];

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  revealNote: string;
}

export const AMKA_QUIZ: QuizQuestion[] = [
  {
    id: 'birthday',
    prompt: 'When is my birthday?',
    options: ['Feb 5th, 2007', 'Oct 28th, 2006', 'Aug 17th, 2007', 'May 12th, 2006'],
    correctAnswer: 'Feb 5th, 2007',
    revealNote: 'February 5th, 2007 — Aquarius season.',
  },
  {
    id: 'animal',
    prompt: 'What is my favourite animal?',
    options: ['Bunny or Bat', 'Dolphin or Koi', 'Orange Tabby or Fox', 'Owl or Snow Leopard'],
    correctAnswer: 'Bunny or Bat',
    revealNote: 'Always tied between soft bunnies and nocturnal bats.',
  },
  {
    id: 'season',
    prompt: 'What is my favourite season?',
    options: ['Winter and Fall', 'Summer and Spring', 'Spring only', 'Late Summer'],
    correctAnswer: 'Winter and Fall',
    revealNote: 'Crisp autumn leaves at SKKU Suwon and cold snowy winter nights.',
  },
  {
    id: 'cartoon',
    prompt: 'What is my favourite cartoon?',
    options: [
      'Cartoon Network — mostly Steven Universe or Adventure Time',
      'Classic 90s Looney Tunes shorts',
      'Morning anime reruns only',
      'Nickelodeon live-action shows',
    ],
    correctAnswer: 'Cartoon Network — mostly Steven Universe or Adventure Time',
    revealNote: 'Basically all of Cartoon Network, especially Steven Universe and Adventure Time.',
  },
  {
    id: 'allergies',
    prompt: 'Am I allergic to anything?',
    options: ['Nothing', 'Peanuts and tree nuts', 'Spring cedar pollen', 'Shellfish and dairy'],
    correctAnswer: 'Nothing',
    revealNote: 'Nothing at all — zero allergies.',
  },
  {
    id: 'nicknames',
    prompt: 'What are my nicknames?',
    options: [
      'Amka, Amkey Young, Amintsag Erentgeen, Amina',
      'Ammy, Amin-chan, Mka99',
      'Kiki, Sunny, Ami',
      'Only Amka — no other nicknames',
    ],
    correctAnswer: 'Amka, Amkey Young, Amintsag Erentgeen, Amina',
    revealNote: 'Goes by Amka, Amkey Young, Amintsag Erentgeen, and Amina.',
  },
  {
    id: 'add-value',
    prompt: 'Do I add value to your life?',
    options: ['Yes', 'Only during group projects', 'Ask again after midterms', 'Still buffering'],
    correctAnswer: 'Yes',
    revealNote: 'Correct answer is always yes.',
  },
  {
    id: 'fruit',
    prompt: 'What is my favourite fruit?',
    options: ['Banana', 'Green Apple', 'Strawberry', 'Watermelon'],
    correctAnswer: 'Banana',
    revealNote: 'Simple, reliable, elite pick: banana.',
  },
  {
    id: 'color',
    prompt: 'What is my favourite color?',
    options: [
      'Silver / Chrome and Black',
      'Pastel Pink and Mint',
      'Cobalt Blue and Yellow',
      'Crimson and Cream',
    ],
    correctAnswer: 'Silver / Chrome and Black',
    revealNote: 'Sleek Y2K silver / chrome paired with deep black.',
  },
];

export interface SongChoice {
  title: string;
  album: string;
  year: string;
  bpm: number;
  musicalKey: string;
  durationLabel: string;
  melodyNotes: number[];
  bassNotes: number[];
}

export interface ArtistTrack {
  id: string;
  artist: string;
  mood: string;
  swatchHex: string;
  note: string;
  songs: SongChoice[];
}

export const PROFILE = {
  name: 'Amka',
  fullName: 'Amka',
  age: 19,
  nationality: 'Mongolian',
  originCity: 'Ulaanbaatar',
  studyCity: 'Suwon',
  university: 'Sungkyunkwan University',
  campus: 'Suwon Campus',
  major: 'Computer Science',
  githubHandle: 'AmkaBene',
  githubUrl: 'https://github.com/AmkaBene',
  instagramHandle: 'amintsag_erentgeen',
  instagramUrl: 'https://www.instagram.com/amintsag_erentgeen/',
  logoImage: '/assets/aistudio/18816_2ebdcefb.png',
  heroArtwork: '/assets/aistudio/Screenshot_20261123_020345_Instagram_7913cd9e.jpg',
};

export const WORKS: WorkItem[] = [
  {
    id: 'celestial-steppe-aero',
    title: 'Silver Horses & Celestial Flora',
    category: 'illustrations',
    medium: 'Original Digital Painting · Frutiger Aero',
    year: '2026',
    summary:
      'Iridescent butterflies, orbital pearl spheres, and silver horses racing beneath a flower-crowned figure.',
    details:
      'Combines glossy 2000s sky gradients, water-sphere geometry, and Mongolian equine imagery into one luminous Frutiger Aero composition.',
    image: '/assets/aistudio/14378_74630ed1.jpg',
    imageAlt:
      'Original Frutiger Aero digital painting by Amka featuring a flower-crowned figure, iridescent butterflies, orbital spheres, and silver horses over emerald hills.',
  },
  {
    id: 'emerald-steed-sun-moon',
    title: 'Emerald Steed & Sun-Moon Crown',
    category: 'illustrations',
    medium: 'Original Digital Illustration',
    year: '2026',
    summary:
      'An emerald guardian horse crowned with the Soyombo sun, moon, and flame while a prismatic herd ascends golden arcs.',
    details:
      'Celebrates Mongolian symbolism and mythic color contrast—pairing saturated warm ochre spirals with jade contours and drifting cloud motifs.',
    image: '/assets/aistudio/14379_3a6ba2d6.jpg',
    imageAlt:
      'Original digital illustration by Amka depicting a green Mongolian horse with sun, moon, and flame emblem alongside a rising herd of colorful horses.',
  },
  {
    id: 'cyan-orb-character',
    title: 'Bioluminescent Orb Study',
    category: 'illustrations',
    medium: 'Character Design & Palette Sheet',
    year: '2026',
    summary:
      'Monochrome cyan character study featuring silver metallic wings, glowing staff sphere, and five-step swatch bar.',
    details:
      'Explores cool nocturnal teal lighting, intricate leg linework, and sculptural metallic wings anchored by a custom color palette key.',
    image: '/assets/aistudio/14384_81445c11.png',
    imageAlt:
      'Original character design sheet by Amka in monochrome cyan tones with silver wings, glowing orb staff, palette swatches, and artist signature.',
  },
  {
    id: 'kernel-arachnid-code',
    title: 'Kernel Web Arachnid',
    category: 'posters',
    medium: 'Experimental Cyber Art & C Memory Code',
    year: '2026',
    summary:
      'A metallic green mask-faced spider suspended across a glowing web of virtual memory struct C code.',
    details:
      'Born directly from low-level systems programming—merging struct layouts, page-table pointers, and surreal Y2K 3D airbrushed shading.',
    image: '/assets/aistudio/18819_6d2f792e.jpg',
    imageAlt:
      'Original cyber-surreal artwork by Amka showing a green metallic spider with a red-rimmed mask over glowing green C struct memory code.',
  },
  {
    id: 'smiley-grin-skull',
    title: 'Smiley Grin Abstraction',
    category: 'illustrations',
    medium: 'Graphic Ink & Gradient Study',
    year: '2025',
    summary:
      'Bold sweeping black ink contours and tiny smiling teeth framed by hypnotic geometric shapes over pastel sky.',
    details:
      'Balances playful character abstraction with crisp high-contrast ink brushwork against a soft periwinkle-to-peach ambient wash.',
    image: '/assets/aistudio/14381_897e6677.jpg',
    imageAlt:
      'Original graphic illustration by Amka showing a stylized skull with tiny smiley faces on its teeth surrounded by bold black ink shapes.',
  },
  {
    id: 'spiral-vision-collage',
    title: 'Spiral Vision Tapestry',
    category: 'posters',
    medium: 'Mixed-Media Digital Collage',
    year: '2025',
    summary:
      'Cobalt, gold, and magenta spiral textures layered with cosmic stars, embroidered patterns, and surreal eyes.',
    details:
      'A maximalist collage piece blending tactile crayon grain, glowing spiral motifs, and intricate ornamental border work.',
    image: '/assets/aistudio/14382_d91e3e23.jpg',
    imageAlt:
      'Original mixed-media digital collage by Amka with vibrant cobalt blue, pink, and gold spirals, starry cosmos, and surreal eye motifs.',
  },
  {
    id: 'colorless-poster-one',
    title: 'ColorLess — See the World You Deserve',
    category: 'posters',
    medium: 'Concept Poster & Visual Design · Team 10',
    year: '2026',
    summary:
      'Satirical Y2K product poster asking: what if seeing nature’s true colors required a premium subscription?',
    details:
      'Created for a Team 10 concept showcase featuring thermal aura icons, handwritten calculus notes, warning dialogs, and brushed chrome framing.',
    image: '/assets/aistudio/10670_86e3a3eb.png',
    imageAlt:
      'Original concept poster titled ColorLess: see the world you deserve, featuring a glowing aura eye, math notes, and rainbow typography.',
  },
  {
    id: 'oook-tabby-gamepad',
    title: 'ooOk… — Tabby & Gamepad Collage',
    category: 'illustrations',
    medium: 'Digital Painting & Y2K Mixed-Media Collage',
    year: '2026',
    summary:
      'An expressive orange tabby crowned by a deadpan mouse, surrounded by a chrome gamepad, glowing yellow Y2K stars, and tiny Aero tiles.',
    details:
      'Blends soft airbrushed digital painting with translucent sky-blue blocks, a metallic silver controller dangling a spider thread, lightning doodles, and playful late-2000s visual humor.',
    image: '/assets/aistudio/18817_6ca69b1a.jpg',
    imageAlt:
      'Original Y2K digital collage painting by Amka featuring an orange tabby cat with a grey mouse on its head, chrome game controller, yellow stars, and ooOk text.',
  },
  {
    id: 'colorless-poster-two',
    title: 'ColorLess — See the True World',
    category: 'posters',
    medium: 'Concept Poster Series II · Mixed Media',
    year: '2026',
    summary:
      'Companion poster contrasting monochrome ink halftone texture on the left with prism watercolor pigment on the right.',
    details:
      'Pairs gritty charcoal-style eye brushwork with iridescent starbursts and hand-lettered collage typography.',
    image: '/assets/aistudio/10669_d9dc3b3b.png',
    imageAlt:
      'Original ColorLess companion poster by Amka contrasting a black-and-white halftone eye against a vivid prism-colored eye.',
  },
  {
    id: 'caustic-wave-study',
    title: 'Aqua Caustic Field',
    category: 'code',
    medium: 'TypeScript · HTML5 Canvas',
    year: '2026',
    summary:
      'Real-time interference wave generator mimicking Frutiger Aero glass refraction at 60 frames per second.',
    details:
      'Combines dual sine-wave phase offsets with brushed-silver luminance curves to simulate liquid light on desktop interfaces.',
    codePreviewType: 'caustics',
    codeSnippet: `function sampleCaustic(x: number, y: number, t: number): number {
  const waveA = Math.sin(x * 0.045 + t * 1.4) * Math.cos(y * 0.04 - t * 0.9);
  const waveB = Math.sin((x + y) * 0.03 - t * 1.15);
  return Math.pow(Math.max(0, (waveA + waveB) * 0.5 + 0.35), 2.2);
}`,
    externalUrl: 'https://github.com/AmkaBene',
    externalLabel: 'View on GitHub',
  },
  {
    id: 'skku-pathfinder',
    title: 'Silver Grid Pathfinder',
    category: 'code',
    medium: 'Algorithms · TypeScript & Python',
    year: '2026',
    summary:
      'Interactive breadth-first shortest-path visualizer built during Computer Science coursework at SKKU.',
    details:
      'Visualizes frontier expansion waves across lattice cells using deterministic step playback and clean state transitions.',
    codePreviewType: 'pathfinder',
    codeSnippet: `export function stepBfs(queue: Point[], visited: Set<string>, grid: number[][]) {
  const next = queue.shift();
  if (!next) return { done: true, current: null };
  for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
    const key = \`\${next.x + dx},\${next.y + dy}\`;
    if (!visited.has(key) && grid[next.y + dy]?.[next.x + dx] === 0) {
      visited.add(key);
      queue.push({ x: next.x + dx, y: next.y + dy });
    }
  }
  return { done: false, current: next };
}`,
    externalUrl: 'https://github.com/AmkaBene',
    externalLabel: 'View on GitHub',
  },
];

export const FRIEND_OCS: FriendOc[] = [
  {
    id: 'oc-amka',
    name: 'Amka',
    setting: 'Emerald Night Corridor',
    auraType: 'Winged Spotted Silhouette',
    checks: 'Red-Tint Iris · Gritted Teeth · Clawed Hands',
    summary:
      'Self-portrait OC in dark turtleneck and round glasses paired with ghostly winged aura and arachnid companion.',
    image: '/assets/aistudio/oc_amka.jpg',
  },
  {
    id: 'oc-maaraa',
    name: 'Maaraa',
    setting: 'Cyan Bedroom',
    auraType: 'Lavender Seated Silhouette',
    checks: 'Crimson Eye · Ear · Hand Signs · Teeth',
    summary:
      'Holding a folding fan on a cyan bed—framed by crimson eye check, dual hand sign panels, and violet aura.',
    image: '/assets/aistudio/oc_maaraa.jpg',
  },
  {
    id: 'oc-enhmaa',
    name: 'Enhmaa',
    setting: 'Teal Bathroom Mirror',
    auraType: 'Rainbow Thermal Silhouette',
    checks: 'Golden Iris · Pierced Ear · Fingers · Smile',
    summary:
      'Set in a cool teal-lit bathroom with golden eye focus, silver earring check, and iridescent thermal silhouette.',
    image: '/assets/aistudio/oc_enhmaa.jpg',
  },
  {
    id: 'oc-narkai',
    name: 'Narkai',
    setting: 'Evening Living Room',
    auraType: 'Dotted Ghost Silhouette',
    checks: 'Blue Iris · Wired Earbud · Open Palm · Teeth',
    summary:
      'Wearing a raglan ringer tee and goggles—paired with wired earbud inspection, cool blue eye, and spotted silhouette.',
    image: '/assets/aistudio/oc_narkai.jpg',
  },
  {
    id: 'oc-tenuun',
    name: 'Tenuun',
    setting: 'Amber Parlor',
    auraType: 'Green Thermal Silhouette',
    checks: 'Brown Iris · Ear · Red-Lit Hands',
    summary:
      'Framed in warm golden-hour CRT tones with green thermal glow silhouette and dramatic crimson-lit hand check.',
    image: '/assets/aistudio/oc_tenuun.jpg',
  },
  {
    id: 'oc-zaya',
    name: 'Zaya',
    setting: 'Midnight Kitchen',
    auraType: 'Crimson Spotted Silhouette',
    checks: 'Red-Glint Iris · Clawed Hands',
    summary:
      'Standing beside the kitchen fridge with red-glint iris detail, gold-amber clawed hand panel, and crimson aura.',
    image: '/assets/aistudio/oc_zaya.jpg',
  },
];

export const TUNKHEL_OUTING: OutingPhoto[] = [
  {
    id: 'tunkhel-amka',
    speaker: 'Amka',
    quote: 'guys huutsuldj toglii',
    scene: 'Sunlit Pine Riverside',
    image: '/assets/aistudio/13641_6ca05212.jpg',
    alt: 'Amka and friend laughing under sunlit pine trees beside the river in Tunkhel Tosgon, Mongolia',
  },
  {
    id: 'tunkhel-anujin',
    speaker: 'Anujin',
    quote: 'hairgaar nuuriig chine ugaana shuu',
    scene: 'Riverbank & Gers',
    image: '/assets/aistudio/13643_a38eba5e.jpg',
    alt: 'Friends sitting and splashing by the clear riverbank with white Mongolian gers across the meadow',
  },
  {
    id: 'tunkhel-mamuna',
    speaker: 'Mamuna',
    quote: 'ydraadeenaa nmg uureed yv',
    scene: 'Larch Woods & River Bend',
    image: '/assets/aistudio/13645_ffabd69c.jpg',
    alt: 'Two friends walking side by side along the grassy river bend beneath tall pine and larch trees',
  },
  {
    id: 'tunkhel-altan',
    speaker: 'Altan',
    quote: 'minii sharsan mah gor bga bzdee',
    scene: 'Cooking Inside the Ger',
    image: '/assets/aistudio/13642__1__5bc99915.jpg',
    alt: 'Friends gathered inside a traditional Mongolian ger grilling meat together at the table',
  },
  {
    id: 'tunkhel-enhbat',
    speaker: 'Enhbat',
    quote: 'hdule scammduulaagui laah bje',
    scene: 'Ger Dinner Table',
    image: '/assets/aistudio/13644_c0bc84b7.jpg',
    alt: 'Friends sharing dinner inside the ger around the cooking pan with Amka smiling and waving',
  },
];

export const HANBOK_OUTING: HanbokPhoto[] = [
  {
    id: 'hanbok-jegichagi',
    title: 'Jegichagi on the Lawn',
    caption: 'Kicking jegi shuttlecocks in traditional robes under the autumn trees at SKKU Suwon.',
    image: '/assets/aistudio/17946_7b5321ef.jpg',
    alt: 'Amka and two friends in traditional Korean hanbok kicking jegichagi shuttlecocks on the sunlit SKKU Suwon campus lawn',
  },
  {
    id: 'hanbok-tuho',
    title: 'Tuho by ESKARA',
    caption: 'Playing tuho arrow-toss with friends on the sunlit grass in front of Student Hall.',
    image: '/assets/aistudio/17950_f7e45203.jpg',
    alt: 'Four friends dressed in hanbok playing traditional tuho arrow toss on the SKKU Suwon campus lawn',
  },
  {
    id: 'hanbok-trio',
    title: 'Hanbok Trio Portrait',
    caption: 'Dressed in royal, scholar, and warrior hanbok before heading out onto campus.',
    image: '/assets/aistudio/17949_888c5ec2.jpg',
    alt: 'Amka and two friends posing indoors wearing traditional Korean hanbok and hats',
  },
];

export const ARTIST_ROTATION: ArtistTrack[] = [
  {
    id: 'melanie-martinez',
    artist: 'Melanie Martinez',
    mood: 'Surreal Pastel & Botanical Synth',
    swatchHex: '#0EA5E9',
    note: 'Inspires surreal character concepts, vivid pastel-goth palettes, and late-night sketching.',
    songs: [
      {
        title: 'VOID',
        album: 'PORTALS',
        year: '2023',
        bpm: 100,
        musicalKey: 'E Minor',
        durationLabel: '04:07',
        melodyNotes: [329.63, 392.0, 493.88, 440.0, 392.0, 329.63, 293.66, 329.63],
        bassNotes: [164.81, 130.81, 146.83, 123.47],
      },
      {
        title: 'Play Date',
        album: 'Cry Baby (Deluxe)',
        year: '2015',
        bpm: 124,
        musicalKey: 'C Major',
        durationLabel: '02:59',
        melodyNotes: [523.25, 493.88, 440.0, 392.0, 440.0, 523.25, 587.33, 523.25],
        bassNotes: [130.81, 174.61, 196.0, 164.81],
      },
      {
        title: 'Cry Baby',
        album: 'Cry Baby',
        year: '2015',
        bpm: 108,
        musicalKey: 'F Minor',
        durationLabel: '03:59',
        melodyNotes: [349.23, 415.3, 523.25, 466.16, 415.3, 392.0, 349.23, 311.13],
        bassNotes: [174.61, 155.56, 138.59, 130.81],
      },
    ],
  },
  {
    id: 'lana-del-rey',
    artist: 'Lana Del Rey',
    mood: 'Cinematic Nostalgia & Silver Coast',
    swatchHex: '#0369A1',
    note: 'Essential soundtrack for long digital painting sessions and rainy campus walks.',
    songs: [
      {
        title: 'Mariners Apartment Complex',
        album: 'Norman Fucking Rockwell!',
        year: '2019',
        bpm: 78,
        musicalKey: 'G Major',
        durationLabel: '04:07',
        melodyNotes: [392.0, 369.99, 329.63, 293.66, 246.94, 293.66, 329.63, 293.66],
        bassNotes: [196.0, 164.81, 130.81, 146.83],
      },
      {
        title: 'West Coast',
        album: 'Ultraviolence',
        year: '2014',
        bpm: 118,
        musicalKey: 'F# Minor',
        durationLabel: '04:16',
        melodyNotes: [369.99, 440.0, 493.88, 440.0, 369.99, 329.63, 293.66, 329.63],
        bassNotes: [185.0, 146.83, 164.81, 138.59],
      },
      {
        title: 'Cinnamon Girl',
        album: 'Norman Fucking Rockwell!',
        year: '2019',
        bpm: 84,
        musicalKey: 'D Minor',
        durationLabel: '05:00',
        melodyNotes: [293.66, 349.23, 440.0, 392.0, 349.23, 329.63, 293.66, 261.63],
        bassNotes: [146.83, 116.54, 130.81, 110.0],
      },
    ],
  },
  {
    id: 'mitski',
    artist: 'Mitski',
    mood: 'Poetic Indie & Quiet Tension',
    swatchHex: '#334155',
    note: 'Sharp lyrical clarity for ink-pen linework and late-night debugging.',
    songs: [
      {
        title: 'First Love / Late Spring',
        album: 'Bury Me at Makeout Creek',
        year: '2014',
        bpm: 96,
        musicalKey: 'C Major',
        durationLabel: '04:38',
        melodyNotes: [329.63, 392.0, 440.0, 523.25, 493.88, 440.0, 392.0, 329.63],
        bassNotes: [130.81, 174.61, 164.81, 196.0],
      },
      {
        title: 'My Love Mine All Mine',
        album: 'The Land Is Inhospitable and So Are We',
        year: '2023',
        bpm: 114,
        musicalKey: 'A Major',
        durationLabel: '02:17',
        melodyNotes: [440.0, 493.88, 554.37, 440.0, 369.99, 440.0, 493.88, 440.0],
        bassNotes: [220.0, 185.0, 146.83, 164.81],
      },
      {
        title: 'Washing Machine Heart',
        album: 'Be the Cowboy',
        year: '2018',
        bpm: 116,
        musicalKey: 'F# Minor',
        durationLabel: '02:08',
        melodyNotes: [369.99, 440.0, 554.37, 493.88, 440.0, 369.99, 329.63, 369.99],
        bassNotes: [185.0, 146.83, 164.81, 138.59],
      },
    ],
  },
  {
    id: 'illit',
    artist: 'ILLIT',
    mood: 'Y2K Sparkling PluggnB & Bright Chrome',
    swatchHex: '#0284C7',
    note: 'Pure Y2K silver energy—instant focus boost before morning CS lectures.',
    songs: [
      {
        title: 'Magnetic',
        album: 'SUPER REAL ME',
        year: '2024',
        bpm: 131,
        musicalKey: 'F# Major',
        durationLabel: '02:40',
        melodyNotes: [554.37, 466.16, 369.99, 466.16, 554.37, 622.25, 554.37, 466.16],
        bassNotes: [185.0, 123.47, 138.59, 155.56],
      },
      {
        title: 'Cherish (My Love)',
        album: "I'LL LIKE YOU",
        year: '2024',
        bpm: 122,
        musicalKey: 'D Major',
        durationLabel: '02:57',
        melodyNotes: [587.33, 554.37, 493.88, 440.0, 493.88, 554.37, 587.33, 440.0],
        bassNotes: [146.83, 196.0, 220.0, 164.81],
      },
      {
        title: 'Lucky Girl Syndrome',
        album: 'SUPER REAL ME',
        year: '2024',
        bpm: 126,
        musicalKey: 'G Major',
        durationLabel: '02:20',
        melodyNotes: [392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0],
        bassNotes: [196.0, 164.81, 130.81, 146.83],
      },
    ],
  },
  {
    id: 'aurora',
    artist: 'AURORA',
    mood: 'Glacial Air & Meadow Glass',
    swatchHex: '#047857',
    note: 'Feels like sunlit clouds over open hills—matches Frutiger Aero daylight.',
    songs: [
      {
        title: 'Runaway',
        album: 'All My Demons Greeting Me as a Friend',
        year: '2016',
        bpm: 114,
        musicalKey: 'E Minor',
        durationLabel: '04:08',
        melodyNotes: [329.63, 493.88, 440.0, 392.0, 329.63, 293.66, 329.63, 392.0],
        bassNotes: [164.81, 130.81, 196.0, 146.83],
      },
      {
        title: 'Cure for Me',
        album: 'The Gods We Can Touch',
        year: '2022',
        bpm: 116,
        musicalKey: 'A Minor',
        durationLabel: '03:21',
        melodyNotes: [440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 329.63, 440.0],
        bassNotes: [220.0, 174.61, 196.0, 164.81],
      },
      {
        title: 'The Seed',
        album: 'A Different Kind of Human (Step 2)',
        year: '2019',
        bpm: 105,
        musicalKey: 'D Minor',
        durationLabel: '04:26',
        melodyNotes: [293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 293.66],
        bassNotes: [146.83, 116.54, 130.81, 146.83],
      },
    ],
  },
  {
    id: 'tv-girl',
    artist: 'TV Girl',
    mood: 'Lo-Fi Dream Pop & Tape Loops',
    swatchHex: '#0369A1',
    note: 'Warm analog loops while writing TypeScript shaders and drawing.',
    songs: [
      {
        title: 'Lovers Rock',
        album: 'French Exit',
        year: '2014',
        bpm: 105,
        musicalKey: 'A Major',
        durationLabel: '03:33',
        melodyNotes: [440.0, 415.3, 369.99, 329.63, 369.99, 440.0, 554.37, 440.0],
        bassNotes: [220.0, 185.0, 146.83, 164.81],
      },
      {
        title: 'Cigarettes out the Window',
        album: 'Who Really Cares',
        year: '2016',
        bpm: 119,
        musicalKey: 'D Major',
        durationLabel: '03:18',
        melodyNotes: [369.99, 440.0, 493.88, 587.33, 493.88, 440.0, 369.99, 329.63],
        bassNotes: [146.83, 246.94, 196.0, 220.0],
      },
      {
        title: 'Not Allowed',
        album: 'Who Really Cares',
        year: '2016',
        bpm: 102,
        musicalKey: 'F Major',
        durationLabel: '02:47',
        melodyNotes: [349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 329.63, 349.23],
        bassNotes: [174.61, 146.83, 116.54, 130.81],
      },
    ],
  },
  {
    id: 'bjork',
    artist: 'Björk',
    mood: 'Glacial Electronics & Strings',
    swatchHex: '#0EA5E9',
    note: 'Fearless vocal texture, icy microbeats, and orchestral strings that spark experimental collage ideas.',
    songs: [
      {
        title: 'Venus as a Boy',
        album: 'Debut',
        year: '1993',
        bpm: 94,
        musicalKey: 'F Major',
        durationLabel: '04:42',
        melodyNotes: [349.23, 440.0, 523.25, 466.16, 440.0, 392.0, 349.23, 440.0],
        bassNotes: [174.61, 130.81, 116.54, 130.81],
      },
      {
        title: 'Hyperballad',
        album: 'Post',
        year: '1995',
        bpm: 134,
        musicalKey: 'C Major',
        durationLabel: '05:21',
        melodyNotes: [392.0, 440.0, 523.25, 493.88, 440.0, 392.0, 329.63, 392.0],
        bassNotes: [130.81, 164.81, 174.61, 196.0],
      },
      {
        title: 'Jóga',
        album: 'Homogenic',
        year: '1997',
        bpm: 84,
        musicalKey: 'E Minor',
        durationLabel: '05:05',
        melodyNotes: [329.63, 392.0, 493.88, 523.25, 493.88, 440.0, 392.0, 329.63],
        bassNotes: [164.81, 196.0, 130.81, 146.83],
      },
    ],
  },
  {
    id: 'hatsune-miku',
    artist: 'Hatsune Miku',
    mood: 'Vocaloid Cyan & Digital Pop',
    swatchHex: '#06B6D4',
    note: 'Iconic 2007–2012 Vocaloid synths, soaring choruses, and electric aqua spirit right at home on the desktop.',
    songs: [
      {
        title: 'World Is Mine',
        album: 'supercell',
        year: '2008',
        bpm: 158,
        musicalKey: 'F# Major',
        durationLabel: '04:13',
        melodyNotes: [554.37, 622.25, 739.99, 622.25, 554.37, 493.88, 554.37, 622.25],
        bassNotes: [185.0, 138.59, 164.81, 123.47],
      },
      {
        title: 'Tell Your World',
        album: 'Tell Your World EP (livetune)',
        year: '2012',
        bpm: 150,
        musicalKey: 'C Major',
        durationLabel: '04:13',
        melodyNotes: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25],
        bassNotes: [130.81, 174.61, 196.0, 164.81],
      },
      {
        title: 'Melt',
        album: 'supercell',
        year: '2007',
        bpm: 170,
        musicalKey: 'F# Major',
        durationLabel: '04:17',
        melodyNotes: [369.99, 466.16, 554.37, 622.25, 554.37, 466.16, 415.3, 466.16],
        bassNotes: [185.0, 123.47, 138.59, 155.56],
      },
    ],
  },
];
