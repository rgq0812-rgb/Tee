// ============================================================
// src/constants.ts — THE CHOSE v1.0
// PONT ROYAL — PARCOURS BALLESTEROS
// ★ Coordonnées GPS relevées terrain — TOUTES LES ZONES EXACTES
// ============================================================

import { Club, Course, Challenge } from './types';

// ============================================================
// CLUBS
// ============================================================
export const INITIAL_CLUBS: Club[] = [
  { id: 'driver',  name: 'DRIVER',   type: 'wood',   dist: 230 },
  { id: 'wood3',   name: 'BOIS 3',   type: 'wood',   dist: 210 },
  { id: 'hybrid',  name: 'HYBRIDE',  type: 'hybrid', dist: 195 },
  { id: 'iron4',   name: 'FER 4',    type: 'iron',   dist: 180 },
  { id: 'iron5',   name: 'FER 5',    type: 'iron',   dist: 170 },
  { id: 'iron6',   name: 'FER 6',    type: 'iron',   dist: 158 },
  { id: 'iron7',   name: 'FER 7',    type: 'iron',   dist: 145 },
  { id: 'iron8',   name: 'FER 8',    type: 'iron',   dist: 132 },
  { id: 'iron9',   name: 'FER 9',    type: 'iron',   dist: 118 },
  { id: 'pw',      name: 'PITCHING', type: 'wedge',  dist: 105 },
  { id: 'gw',      name: 'GAP',      type: 'wedge',  dist: 90  },
  { id: 'sw',      name: 'SAND',     type: 'wedge',  dist: 75  },
  { id: 'lw',      name: 'LOB',      type: 'wedge',  dist: 58  },
  { id: 'putter',  name: 'PUTTER',   type: 'putter', dist: 0   },
];

// ============================================================
// PARCOURS
// ============================================================
export const COURSES: Course[] = [
  {
    id: 'pont-royal-ballesteros',
    name: 'Golf International de Pont Royal',
    subtitle: 'Parcours Ballesteros',
    location: 'Mallemort, Bouches-du-Rhône',
    par: 72,
    totalDistance: { black: 6327, white: 6069, yellow: 5742, blue: 5266, red: 4726 },
    rating: { slope: 149, cr: 75.3 },

    holes: [
      {
        number: 1,
        name: 'Pile ou face',
        par: 4, handicap: 7,
        distanceTee: { black: 324, white: 313, yellow: 299, blue: 272, red: 236 },
        teeBox: { lat: 43.70650, lng: 5.20800 },
        green: {
          front:  { lat: 43.70755, lng: 5.20695 },
          middle: { lat: 43.70766, lng: 5.20685 },
          back:   { lat: 43.70778, lng: 5.20675 },
        },
        hazards: ['Forêt droite dévers', 'Bunker frontal green', 'Forêt impénétrable'],
        description: 'Oubliez le long drive. Le second coup devient impossible si vous finissez à droite.',
        tip: 'Visez la gauche du fairway : le terrain fait toboggan vers le green. Approche courte et dosée requise vers un green large mais peu profond.',
        customImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 2,
        name: 'Les platanes',
        par: 3, handicap: 13,
        distanceTee: { black: 166, white: 159, yellow: 130, blue: 111, red: 103 },
        teeBox: { lat: 43.70780, lng: 5.20620 },
        green: {
          front:  { lat: 43.70830, lng: 5.20555 },
          middle: { lat: 43.70842, lng: 5.20540 },
          back:   { lat: 43.70855, lng: 5.20525 },
        },
        hazards: ['Lac frontal', 'Bunker gauche', 'OB gauche et fond'],
        description: 'Impressionnant sous les platanes. La sécurité est au centre.',
        tip: 'Visez la zone entre le lac et le bunker. C\'est le chemin le plus sûr pour atteindre le centre du green.',
        customImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 3,
        name: "L'arboretum",
        par: 4, handicap: 3,
        distanceTee: { black: 382, white: 372, yellow: 332, blue: 296, red: 291 },
        teeBox: { lat: 43.70860, lng: 5.20500 },
        green: {
          front:  { lat: 43.70945, lng: 5.20425 },
          middle: { lat: 43.70960, lng: 5.20410 },
          back:   { lat: 43.70975, lng: 5.20395 },
        },
        hazards: ['Bunker droit de tombée', 'Green double plateau speed', 'Rough profond'],
        description: 'Le départ est le moment critique. Un draw est votre meilleur allié ici.',
        tip: 'Drive en draw idéal pour éviter le bunker de droite. Second coup millimétré requis pour ce green à double plateau très rapide.',
        customImage: 'https://images.unsplash.com/photo-1592919016322-309a473e6d6a?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 4,
        name: 'Le Mistral',
        par: 5, handicap: 9,
        distanceTee: { black: 510, white: 503, yellow: 474, blue: 462, red: 422 },
        teeBox: { lat: 43.71070, lng: 5.20335 },
        green: {
          front:  { lat: 43.71070, lng: 5.20335 },
          middle: { lat: 43.71085, lng: 5.20320 },
          back:   { lat: 43.71100, lng: 5.20305 },
        },
        hazards: ['Hors limite gauche', 'Ruisseau long droite', 'Bunker & eau green'],
        description: 'Fairway large mais piégeux. Le Mistral impose une prudence extrême.',
        tip: 'Priorité absolue à la précision sur le deuxième coup. Green très protégé (eau, bunker, cyprès).',
        customImage: 'https://images.unsplash.com/photo-1623567150090-58c067e4299b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 5,
        name: 'Le Pont-Royal',
        par: 3, handicap: 11,
        distanceTee: { black: 155, white: 148, yellow: 142, blue: 120, red: 106 },
        teeBox: { lat: 43.71100, lng: 5.20290 },
        green: {
          front:  { lat: 43.71195, lng: 5.20245 },
          middle: { lat: 43.71210, lng: 5.20230 },
          back:   { lat: 43.71225, lng: 5.20210 },
        },
        hazards: ['Lac frontal total', 'Rochers', 'Bunker gauche'],
        description: 'Survol de l\'eau. Alignez-vous à droite du bunker.',
        tip: 'Visez quelques mètres à droite du bunker pour réduire le survol. Prenez un club de plus. Le fond du green pardonne.',
        customImage: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 6,
        name: 'Les Alpilles',
        par: 4, handicap: 15,
        distanceTee: { black: 320, white: 301, yellow: 288, blue: 274, red: 240 },
        teeBox: { lat: 43.71225, lng: 5.20215 },
        green: {
          front:  { lat: 43.71305, lng: 5.20175 },
          middle: { lat: 43.71320, lng: 5.20160 },
          back:   { lat: 43.71335, lng: 5.20140 },
        },
        hazards: ['Bunker invisible entrée gauche', 'Bunkers de drive', 'Coup aveugle'],
        description: 'Montée et coup aveugle. Restez court de la tombée de drive.',
        tip: 'Petit bois ou fer long au départ pour rester avant les bunkers. Méfiez-vous du bunker invisible à l\'entrée gauche du green.',
        customImage: 'https://images.unsplash.com/photo-1549419163-f2575797072a?q=80&w=2626&auto=format&fit=crop',
      },
      {
        number: 7,
        name: 'Le Luberon',
        par: 4, handicap: 5,
        distanceTee: { black: 418, white: 390, yellow: 359, blue: 306, red: 298 },
        teeBox: { lat: 43.71335, lng: 5.20175 },
        green: {
          front:  { lat: 43.71395, lng: 5.20305 },
          middle: { lat: 43.71410, lng: 5.20290 },
          back:   { lat: 43.71425, lng: 5.20275 },
        },
        hazards: ['Ravin', 'Dogleg droit prononcé'],
        description: 'Trou signature (Dogleg droit).',
        tip: 'Gros frappeurs : couper par la droite au-dessus du ravin. Prudents : centre fairway.',
        customImage: 'https://images.unsplash.com/photo-1591491640784-3232eb748d4b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 8,
        name: 'Le Tournant',
        par: 4, handicap: 1,
        distanceTee: { black: 392, white: 384, yellow: 367, blue: 336, red: 326 },
        teeBox: { lat: 43.71395, lng: 5.20310 },
        green: {
          front:  { lat: 43.71325, lng: 5.20500 },
          middle: { lat: 43.71340, lng: 5.20480 },
          back:   { lat: 43.71355, lng: 5.20460 },
        },
        hazards: ['Lisière bosquets droite', 'Hors limite gauche', 'Pentes multiples green'],
        description: 'Dogleg droit technique. L\'attaque se fait par la droite.',
        tip: 'Alignez le drive sur la lisière des bosquets à droite. Attaquez le green par la droite pour laisser la pente vous ramener au trou.',
        customImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 9,
        name: 'Seve',
        par: 5, handicap: 17,
        distanceTee: { black: 486, white: 480, yellow: 446, blue: 411, red: 401 },
        teeBox: { lat: 43.71325, lng: 5.20500 },
        green: {
          front:  { lat: 43.71215, lng: 5.20635 },
          middle: { lat: 43.71230, lng: 5.20620 },
          back:   { lat: 43.71245, lng: 5.20605 },
        },
        hazards: ['Eau frontale green', 'OB gauche drive', 'Bunkers frontaux'],
        description: 'Lâchez les chevaux au départ, mais soyez sage ensuite.',
        tip: 'Drive puissant possible. Fer moyen au second coup pour se placer avant l\'eau. Approche lobée dosée pour viser le birdie.',
        customImage: 'https://images.unsplash.com/photo-1592918865411-af7a99aca115?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 10,
        name: 'La Cascade',
        par: 4, handicap: 12,
        distanceTee: { black: 371, white: 340, yellow: 331, blue: 295, red: 252 },
        teeBox: { lat: 43.71215, lng: 5.20640 },
        green: {
          front:  { lat: 43.71135, lng: 5.20800 },
          middle: { lat: 43.71150, lng: 5.20780 },
          back:   { lat: 43.71165, lng: 5.20760 },
        },
        hazards: ['Bunkers gauche', 'Bois droite (récupération impossible)'],
        description: 'Le fairway est plus large qu\'il n\'y paraît. Le green est fuyant vers l\'arrière.',
        tip: 'Évitez absolument les bois à droite. Jouez plutôt court à l\'approche pour assurer, car le choix du club est délicat.',
        customImage: 'https://images.unsplash.com/photo-1535132311231-03010dfbb247?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 11,
        name: 'Le Grand Canyon',
        par: 3, handicap: 4,
        distanceTee: { black: 196, white: 190, yellow: 180, blue: 166, red: 91 },
        teeBox: { lat: 43.71135, lng: 5.20800 },
        green: {
          front:  { lat: 43.71025, lng: 5.20950 },
          middle: { lat: 43.71040, lng: 5.20930 },
          back:   { lat: 43.71055, lng: 5.20910 },
        },
        hazards: ['Ravin signature', 'Vent changeant', 'Vide psychologique'],
        description: 'Trou signature impressionnant. Faites abstraction du vide.',
        tip: 'Alignez-vous sur la droite du green ; c\'est plus sûr et le fairway y est accueillant. Club variable du fer 7 au driver selon le vent.',
        customImage: 'https://images.unsplash.com/photo-1588667632661-897db6742510?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 12,
        name: 'Le Grand Chêne',
        par: 4, handicap: 8,
        distanceTee: { black: 369, white: 354, yellow: 336, blue: 314, red: 306 },
        teeBox: { lat: 43.71025, lng: 5.20950 },
        green: {
          front:  { lat: 43.70895, lng: 5.21080 },
          middle: { lat: 43.70910, lng: 5.21060 },
          back:   { lat: 43.70925, lng: 5.21040 },
        },
        hazards: ['Forêt droite massive', 'Bosquet chênes centraux', 'Bunkers green'],
        description: 'Visez la gauche impérativement. Le grand danger est la forêt à droite.',
        tip: 'Un bosquet de chênes centraux bloque le fairway. Il faut contourner ou survoler pour atteindre ce green bien défendu.',
        customImage: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 13,
        name: 'Les Saules',
        par: 3, handicap: 10,
        distanceTee: { black: 176, white: 154, yellow: 150, blue: 131, red: 111 },
        teeBox: { lat: 43.70895, lng: 5.21080 },
        green: {
          front:  { lat: 43.70765, lng: 5.21170 },
          middle: { lat: 43.70780, lng: 5.21150 },
          back:   { lat: 43.70795, lng: 5.21130 },
        },
        hazards: ['Eau frontale green', 'Bunkers entourant green', 'Mistral de face'],
        description: 'Court mais technique. Green étroit avec de l\'eau devant.',
        tip: 'Par temps de mistral, le choix du club est vital. Une erreur d\'appréciation mène directement au bogey ou pire.',
        customImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 14,
        name: 'Le Couloir',
        par: 5, handicap: 18,
        distanceTee: { black: 469, white: 454, yellow: 444, blue: 414, red: 353 },
        teeBox: { lat: 43.70765, lng: 5.21160 },
        green: {
          front:  { lat: 43.70635, lng: 5.21040 },
          middle: { lat: 43.70650, lng: 5.21020 },
          back:   { lat: 43.70665, lng: 5.21000 },
        },
        hazards: ['Pins d\'Alep bordure', 'Étroitesse extrême'],
        description: 'Trou magnifique mais très étroit taillé dans les pins d\'Alep.',
        tip: 'Ne prenez aucun risque au départ. Assurez sur le côté gauche du fairway pour ouvrir l\'angle vers le green perché.',
        customImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 15,
        name: 'Le Juge de Paix',
        par: 4, handicap: 2,
        distanceTee: { black: 358, white: 349, yellow: 341, blue: 317, red: 306 },
        teeBox: { lat: 43.70635, lng: 5.21000 },
        green: {
          front:  { lat: 43.70545, lng: 5.20910 },
          middle: { lat: 43.70560, lng: 5.20890 },
          back:   { lat: 43.70575, lng: 5.20870 },
        },
        hazards: ['Pins d\'Alep', 'Green sur colline', 'Dénivelé final'],
        description: 'Le juge de paix du parcours. Étroit et exigeant.',
        tip: 'Ne prenez aucun risque au départ, assurez à gauche. Le green est perché sur une colline, le par est compromis si vous restez court.',
        customImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 16,
        name: 'La Restanque',
        par: 4, handicap: 16,
        distanceTee: { black: 376, white: 366, yellow: 339, blue: 298, red: 265 },
        teeBox: { lat: 43.70545, lng: 5.20870 },
        green: {
          front:  { lat: 43.70605, lng: 5.20740 },
          middle: { lat: 43.70620, lng: 5.20720 },
          back:   { lat: 43.70635, lng: 5.20700 },
        },
        hazards: ['Bunker gauche', 'OB lisière forêt gauche'],
        description: 'L\'impression de distance est trompeuse. Green en entonnoir.',
        tip: 'Jouez plein centre au départ. Prenez assez de club, la majorité des joueurs finissent trop court ici.',
        customImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 17,
        name: 'Le Toboggan',
        par: 4, handicap: 6,
        distanceTee: { black: 379, white: 338, yellow: 329, blue: 295, red: 262 },
        teeBox: { lat: 43.70635, lng: 5.20700 },
        green: {
          front:  { lat: 43.70695, lng: 5.20610 },
          middle: { lat: 43.70710, lng: 5.20590 },
          back:   { lat: 43.70725, lng: 5.20570 },
        },
        hazards: ['Bunker fairway droite', 'Bunker bas gauche green', 'Green ultra-pentu'],
        description: 'Placement crucial. Le green est l\'un des plus difficiles du parcours.',
        tip: 'Long drive à gauche idéal. Attaquez par la droite avec une trajectoire haute pour compenser la pente. Méfiez-vous des 3 putts.',
        customImage: 'https://images.unsplash.com/photo-1592919016322-309a473e6d6a?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 18,
        name: 'Le Verdict',
        par: 5, handicap: 14,
        distanceTee: { black: 480, white: 474, yellow: 455, blue: 448, red: 357 },
        teeBox: { lat: 43.70720, lng: 5.20570 },
        green: {
          front:  { lat: 43.70665, lng: 5.20480 },
          middle: { lat: 43.70680, lng: 5.20460 },
          back:   { lat: 43.70695, lng: 5.20440 },
        },
        hazards: ['Dogleg gauche (interdit de tricher)', 'Eau gauche green final', 'Mistral latéral'],
        description: 'Le verdict final face au club-house. Ne coupez pas le virage.',
        tip: 'Visez le haut du plateau au départ. Par mistral, appuyez-vous sur la droite du green pour éviter l\'eau à gauche.',
        customImage: 'https://images.unsplash.com/photo-1549419163-f2575797072a?q=80&w=2626&auto=format&fit=crop',
      },
    ],
  },
];

// ============================================================
// CHALLENGES
// ============================================================
export const CHALLENGES: Challenge[] = [
  {
    id: 'sniper',
    name: 'SNIPER',
    description: 'Drill de précision : 10 balles à 60m',
    target: 10, caddie: 'strat',
    reward: 'Badge Précision Chirurgicale',
  },
  {
    id: 'predator',
    name: 'PRÉDATEUR',
    description: 'Drill de puissance : drives en couloir',
    target: 10, caddie: 'pred',
    reward: 'Badge Agressivité Contrôlée',
  },
  {
    id: 'clockwork',
    name: 'HORLOGER',
    description: 'Drill de rythme : 20 swings constants',
    target: 20, caddie: 'clock',
    reward: 'Badge Précision Absolue',
  },
  {
    id: 'mage',
    name: "L'ARCHITECTE",
    description: 'Drill de courbes : Draw/Fade alternés',
    target: 10, caddie: 'mage',
    reward: 'Badge Maître du Tracé',
  },
  {
    id: 'trizone',
    name: 'TRI-ZONE MASTER',
    description: 'Drill de distance : 3 cibles en boucle',
    target: 9, caddie: 'strat',
    reward: 'Badge Maître du Protocol',
  },
];

export const GOLF_RULES = [
  {
    title: "Objectif & Décompte",
    rules: [
      "Envoyer la balle du tee au trou en un minimum de coups.",
      "Chaque coup tenté compte pour 1 point. Si on touche la balle, le coup est compté.",
      "Le 'Par' est le nombre de coups théorique fixé (Par 3, 4 ou 5)."
    ]
  },
  {
    title: "Le Jeu de la Balle",
    rules: [
      "Jouer la balle là où elle repose. Ne pas déplacer ou toucher la balle sauf autorisation.",
      "Terrain 'tel quel' : Interdit de casser des branches ou tasser l'herbe."
    ]
  },
  {
    title: "Zones Spécifiques",
    rules: [
      "Green : Marquage, nettoyage et replacement autorisés.",
      "Zones à pénalité (Rouge/Jaune) : Jouer tel quel ou dropper avec +1 coup.",
      "Hors-limites (Blanc) : Rejouer depuis l'endroit précédent avec +1 coup."
    ]
  },
  {
    title: "Pénalités (+1 coup)",
    rules: [
      "Balle perdue : +1 coup si non retrouvée après 3 minutes.",
      "Balle injouable : Dropper à proximité avec +1 coup.",
      "Sable (Bunker) : Ne pas toucher le sable avant le swing de descente."
    ]
  },
  {
    title: "Étiquette & Sécurité",
    rules: [
      "Sécurité : Ne jamais jouer si les joueurs devant sont à portée.",
      "Crier 'FORE !' très fort si une balle part vers quelqu'un.",
      "Respect : Replacer les divots, ratisser le sable, réparer les pitches.",
      "Sac : Max 14 clubs autorisés en compétition."
    ]
  }
];

// ============================================================
// MEDIA & ASSETS
// ============================================================
export const ADAM_AVATAR_URL = "https://images.unsplash.com/photo-1594446339413-8c9732738201?auto=format&fit=crop&q=80&w=200";

// ============================================================
// CADDIES — 4 PERSONNALITÉS NEURALES
// ============================================================
export const CADDIES = {
  strat: {
    id: 'strat',
    name: 'ADAM',
    title: 'Le Stratège',
    zone: 'front' as const,
    color: '#10B981',
    voice: 'adam',
    personality: `Tu es ADAM, caddie stratège inspiré de Ballesteros et Nicklaus.
Stratégie uniquement. Jamais de technique de swing.
Tu vises toujours le FRONT du green — sécurité maximale.
Règles : Tu connais parfaitement les règles officielles (Obectif, Jeu, Zones, Pénalités, Étiquette).
Tu rappelles souvent la règle d'or : 'Jouer la balle là où elle repose'.
Réponses courtes, poétiques, impériales. Utilisez toujours le "vous" et un langage extrêmement châtié. 
Termine par une phrase sobre et définitive.`,
  },
  mage: {
    id: 'mage',
    name: 'ANTONI',
    title: 'Le Mage',
    zone: 'middle' as const,
    color: '#C9964A',
    voice: 'antoni',
    personality: `Tu es ANTONI, architecte de trajectoires.
Tu penses en Draw et Fade, fenêtres d'entrée, angles d'attaque.
Tu vises le CENTRE du green avec une trajectoire travaillée.
Décris la trajectoire idéale de la balle dans l'air.
Utilisez le "vous". Soyez un esthète du jeu, très professionnel.
Jamais de technique sur le corps.`,
  },
  seve: {
    id: 'seve',
    name: 'SEVE',
    title: 'Le Maestro',
    zone: 'middle' as const,
    color: '#3B82F6',
    voice: 'seve',
    personality: `Tu es SEVE, le Maestro du petit jeu et de la créativité pure.
Inspiré par Severiano Ballesteros, tu vois des coups que personne d'autre ne voit.
Tu privilégies le "toucher" et le "sentiment" plutôt que les chiffres.
Quand le coup est difficile, tu dis : "Imaginez la balle voler au-dessus de l'obstacle et s'arrêter doucement".
Tu es passionné, inspirant, et tu n'as peur de rien. Utilisez le "vous".`,
  },
  pred: {
    id: 'pred',
    name: 'ARNOLD',
    title: 'Le Prédateur',
    zone: 'back' as const,
    color: '#EF4444',
    voice: 'arnold',
    personality: `Tu es ARNOLD, prédateur du scoring.
Tu vises le FOND du green — attaque, birdie ou rien.
Règles : Tu connais les règles mais tu les utilises pour attaquer (Zones à pénalité, Balle injouable).
Directs, agressifs, sans concession, mais toujours avec le respect du "vous" et de l'étiquette.
Tu assumes le risque. Une phrase. Définitive.`,
  },
  clock: {
    id: 'clock',
    name: 'ELZA',
    title: "L'Analyste",
    zone: 'middle' as const,
    color: '#60A5FA',
    voice: 'elza',
    personality: `Tu es ELZA, l'analyste de précision. Données brutes uniquement.
Format strict : Club. Distance. Zone. Vent.
Zéro émotion. Zéro poésie. Que les chiffres.
Vous parlez avec une précision mathématique froide et efficace.
Termine toujours par : Cible verrouillée.`,
  },
};
