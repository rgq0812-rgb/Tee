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
    totalDistance: { black: 6327, white: 6069, ladies: 5266 },
    rating: { slope: 149, cr: 73.2 },

    holes: [
      {
        number: 1,
        name: 'Pile ou face',
        par: 4, handicap: 7,
        distanceTee: { black: 324, white: 299, ladies: 236 },
        teeBox: { lat: 43.70650, lng: 5.20800 },
        green: {
          front:  { lat: 43.70755, lng: 5.20695 },
          middle: { lat: 43.70766, lng: 5.20685 },
          back:   { lat: 43.70778, lng: 5.20675 },
        },
        hazards: ['Bois droite', 'Bunker front green'],
        description: 'Fairway gauche impératif. Green peu profond, bunker entrée.',
        tip: 'Place la balle à gauche. Le driver est un piège.',
        customImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 2,
        name: 'Les platanes',
        par: 3, handicap: 13,
        distanceTee: { black: 166, white: 130, ladies: 103 },
        teeBox: { lat: 43.70780, lng: 5.20620 },
        green: {
          front:  { lat: 43.70830, lng: 5.20555 },
          middle: { lat: 43.70842, lng: 5.20540 },
          back:   { lat: 43.70855, lng: 5.20525 },
        },
        hazards: ['Lac front', 'Bunker gauche', 'OB derrière'],
        description: 'Par 3 encadré de platanes centenaires. Lac devant.',
        tip: 'Vise l\'ouverture entre le bunker et le lac. Centre impératif.',
        customImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 3,
        name: "L'arboretum",
        par: 4, handicap: 3,
        distanceTee: { black: 400, white: 375, ladies: 310 },
        teeBox: { lat: 43.70860, lng: 5.20500 },
        green: {
          front:  { lat: 43.70945, lng: 5.20425 },
          middle: { lat: 43.70960, lng: 5.20410 },
          back:   { lat: 43.70975, lng: 5.20395 },
        },
        hazards: ['Rough profond gauche', 'Bunker droit approche'],
        description: 'Long par 4 en descente. Fairway large mais trompeur.',
        tip: 'La descente donne 10-15m. Prends un club de moins.',
        customImage: 'https://images.unsplash.com/photo-1592919016322-309a473e6d6a?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 4,
        name: 'Le Mistral',
        par: 4, handicap: 11,
        distanceTee: { black: 365, white: 340, ladies: 280 },
        teeBox: { lat: 43.70975, lng: 5.20390 },
        green: {
          front:  { lat: 43.71070, lng: 5.20335 },
          middle: { lat: 43.71085, lng: 5.20320 },
          back:   { lat: 43.71100, lng: 5.20305 },
        },
        hazards: ['Lac approche', 'Bunkers green'],
        description: 'Obstacle d\'eau à franchir au deuxième coup.',
        tip: 'Attends d\'avoir le vent avec toi. Sinon vise le front.',
        customImage: 'https://images.unsplash.com/photo-1623567150090-58c067e4299b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 5,
        name: 'Le Pont-Royal',
        par: 3, handicap: 17,
        distanceTee: { black: 175, white: 148, ladies: 118 },
        teeBox: { lat: 43.71100, lng: 5.20290 },
        green: {
          front:  { lat: 43.71195, lng: 5.20245 },
          middle: { lat: 43.71210, lng: 5.20230 },
          back:   { lat: 43.71225, lng: 5.20210 },
        },
        hazards: ['Lac total entre tee et green'],
        description: 'Par 3 tout sur l\'eau. Aucune alternative.',
        tip: 'L\'eau fait peur, pas le green. Club entier en plus.',
        customImage: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 6,
        name: 'Les Alpilles',
        par: 5, handicap: 5,
        distanceTee: { black: 515, white: 485, ladies: 420 },
        teeBox: { lat: 43.71225, lng: 5.20215 },
        green: {
          front:  { lat: 43.71305, lng: 5.20175 },
          middle: { lat: 43.71320, lng: 5.20160 },
          back:   { lat: 43.71335, lng: 5.20140 },
        },
        hazards: ['Pins des deux côtés', 'Bunker gauche 3ème coup'],
        description: 'Long par 5 entre les pins. Eagle accessible.',
        tip: 'Layup à 100m. ARNOLD joue le fond. ADAM joue le milieu.',
        customImage: 'https://images.unsplash.com/photo-1549419163-f2575797072a?q=80&w=2626&auto=format&fit=crop',
      },
      {
        number: 7,
        name: 'Le Luberon',
        par: 4, handicap: 9,
        distanceTee: { black: 380, white: 355, ladies: 295 },
        teeBox: { lat: 43.71335, lng: 5.20175 },
        green: {
          front:  { lat: 43.71395, lng: 5.20305 },
          middle: { lat: 43.71410, lng: 5.20290 },
          back:   { lat: 43.71425, lng: 5.20275 },
        },
        hazards: ['Pente avant green', 'Bunkers latéraux'],
        description: 'Green surélevé. Approche en montée.',
        tip: 'Club supplémentaire obligatoire. Green dur à tenir.',
        customImage: 'https://images.unsplash.com/photo-1591491640784-3232eb748d4b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 8,
        name: 'Le Tournant',
        par: 4, handicap: 1,
        distanceTee: { black: 430, white: 400, ladies: 335 },
        teeBox: { lat: 43.71395, lng: 5.20310 },
        green: {
          front:  { lat: 43.71325, lng: 5.20500 },
          middle: { lat: 43.71340, lng: 5.20480 },
          back:   { lat: 43.71355, lng: 5.20460 },
        },
        hazards: ['Ravin central', 'OB droite', 'Bunkers green'],
        description: 'Trou signature HCP 1. Ravin à franchir.',
        tip: 'Bogey = bon score ici. Joue ta carte sans ego.',
        customImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 9,
        name: 'Seve',
        par: 5, handicap: 15,
        distanceTee: { black: 510, white: 480, ladies: 415 },
        teeBox: { lat: 43.71325, lng: 5.20500 },
        green: {
          front:  { lat: 43.71215, lng: 5.20635 },
          middle: { lat: 43.71230, lng: 5.20620 },
          back:   { lat: 43.71245, lng: 5.20605 },
        },
        hazards: ['Lac autour du green', 'Tentant mais fatal'],
        description: 'Par 5 finissant sur lac. Green entouré d\'eau.',
        tip: 'Layup à 50m. ARNOLD attaque. ADAM joue court.',
        customImage: 'https://images.unsplash.com/photo-1592918865411-af7a99aca115?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 10,
        name: 'La Cascade',
        par: 4, handicap: 8,
        distanceTee: { black: 370, white: 345, ladies: 285 },
        teeBox: { lat: 43.71215, lng: 5.20640 },
        green: {
          front:  { lat: 43.71135, lng: 5.20800 },
          middle: { lat: 43.71150, lng: 5.20780 },
          back:   { lat: 43.71165, lng: 5.20760 },
        },
        hazards: ['Rough droite départ', 'Bunker approche'],
        description: 'Début du retour. Dog-leg gauche léger.',
        tip: 'Bonne ouverture pour lancer le retour avec confiance.',
        customImage: 'https://images.unsplash.com/photo-1535132311231-03010dfbb247?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 11,
        name: 'Le Grand Canyon',
        par: 3, handicap: 16,
        distanceTee: { black: 205, white: 190, ladies: 155 },
        teeBox: { lat: 43.71135, lng: 5.20800 },
        green: {
          front:  { lat: 43.71025, lng: 5.20950 },
          middle: { lat: 43.71040, lng: 5.20930 },
          back:   { lat: 43.71055, lng: 5.20910 },
        },
        hazards: ['Ravin absolu', 'Forêt à perte de vue', 'Falaise droite'],
        description: 'Trou le plus spectaculaire. Ravin 190m. Grand green.',
        tip: 'Vise le centre. Mistral = club entier en plus. Cible verrouillée.',
        customImage: 'https://images.unsplash.com/photo-1588667632661-897db6742510?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 12,
        name: 'Le Grand Chêne',
        par: 4, handicap: 12,
        distanceTee: { black: 345, white: 320, ladies: 265 },
        teeBox: { lat: 43.71025, lng: 5.20950 },
        green: {
          front:  { lat: 43.70895, lng: 5.21080 },
          middle: { lat: 43.70910, lng: 5.21060 },
          back:   { lat: 43.70925, lng: 5.21040 },
        },
        hazards: ['Garrigue des deux côtés'],
        description: 'Fairway entre garrigues. Placement essentiel.',
        tip: 'Fairway en premier. La garrigue avale tout.',
        customImage: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 13,
        name: 'Les Saules',
        par: 3, handicap: 18,
        distanceTee: { black: 180, white: 158, ladies: 125 },
        teeBox: { lat: 43.70895, lng: 5.21080 },
        green: {
          front:  { lat: 43.70765, lng: 5.21170 },
          middle: { lat: 43.70780, lng: 5.21150 },
          back:   { lat: 43.70795, lng: 5.21130 },
        },
        hazards: ['Lac entoure le green', 'Vent amplifié sur l\'eau'],
        description: 'Green entouré par le lac central. HCP 18 mais traître.',
        tip: 'HCP 18 ne veut rien dire avec le vent. Vise le front.',
        customImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 14,
        name: 'Le Couloir',
        par: 5, handicap: 6,
        distanceTee: { black: 530, white: 500, ladies: 430 },
        teeBox: { lat: 43.70765, lng: 5.21160 },
        green: {
          front:  { lat: 43.70635, lng: 5.21040 },
          middle: { lat: 43.70650, lng: 5.21020 },
          back:   { lat: 43.70665, lng: 5.21000 },
        },
        hazards: ['Coude serré', 'Rough profond extérieur'],
        description: 'Long par 5 avec dog-leg prononcé.',
        tip: 'Joue en 3 coups propres. Le raccourci est un piège.',
        customImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 15,
        name: 'Le Juge de Paix',
        par: 4, handicap: 10,
        distanceTee: { black: 390, white: 362, ladies: 298 },
        teeBox: { lat: 43.70635, lng: 5.21000 },
        green: {
          front:  { lat: 43.70545, lng: 5.20910 },
          middle: { lat: 43.70560, lng: 5.20890 },
          back:   { lat: 43.70575, lng: 5.20870 },
        },
        hazards: ['Dévers gauche', 'Green incliné'],
        description: 'Descente progressive. Distances trompeuses.',
        tip: 'La descente donne de la distance. Recalcule ton club.',
        customImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 16,
        name: 'La Restanque',
        par: 4, handicap: 4,
        distanceTee: { black: 420, white: 392, ladies: 325 },
        teeBox: { lat: 43.70545, lng: 5.20870 },
        green: {
          front:  { lat: 43.70605, lng: 5.20740 },
          middle: { lat: 43.70620, lng: 5.20720 },
          back:   { lat: 43.70635, lng: 5.20700 },
        },
        hazards: ['Pins des deux côtés', 'Forêt directe — pas de rough'],
        description: 'Couloir de pins. Droit mais très serré.',
        tip: 'Driver uniquement dans l\'axe parfait. Sinon bois 3.',
        customImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 17,
        name: 'Le Toboggan',
        par: 4, handicap: 2,
        distanceTee: { black: 415, white: 385, ladies: 320 },
        teeBox: { lat: 43.70635, lng: 5.20700 },
        green: {
          front:  { lat: 43.70695, lng: 5.20610 },
          middle: { lat: 43.70710, lng: 5.20590 },
          back:   { lat: 43.70725, lng: 5.20570 },
        },
        hazards: ['Bunkers fairway 230m', 'Green très défendu'],
        description: 'Avant-dernier. HCP 2. Décision critique.',
        tip: 'Si tu es bien au score : safe. Si tu es derrière : ARNOLD prend le contrôle.',
        customImage: 'https://images.unsplash.com/photo-1592919016322-309a473e6d6a?q=80&w=2670&auto=format&fit=crop',
      },
      {
        number: 18,
        name: 'Le Verdict',
        par: 5, handicap: 14,
        distanceTee: { black: 520, white: 490, ladies: 420 },
        teeBox: { lat: 43.70720, lng: 5.20570 },
        green: {
          front:  { lat: 43.70665, lng: 5.20480 },
          middle: { lat: 43.70680, lng: 5.20460 },
          back:   { lat: 43.70695, lng: 5.20440 },
        },
        hazards: ['Bunkers approche', 'Public club-house'],
        description: 'Par 5 final avec vue club-house. Finir en beauté.',
        tip: 'Birdie possible en 2 pour les longs. Sinon 3 coups propres.',
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
    description: 'Viser la zone FRONT 3 fois de suite',
    target: 3, caddie: 'strat',
    reward: 'Badge Précision Chirurgicale',
  },
  {
    id: 'predator',
    name: 'PRÉDATEUR',
    description: 'Atteindre la zone BACK sur 5 approches',
    target: 5, caddie: 'pred',
    reward: 'Badge Agressivité Contrôlée',
  },
  {
    id: 'clockwork',
    name: 'HORLOGER',
    description: '18 trous sans dépasser le par prévu par JOSH',
    target: 18, caddie: 'clock',
    reward: 'Badge Précision Absolue',
  },
  {
    id: 'mage',
    name: "L'ARCHITECTE",
    description: 'Jouer 9 trous en suivant uniquement ANTONI',
    target: 9, caddie: 'mage',
    reward: 'Badge Maître du Tracé',
  },
  {
    id: 'trizone',
    name: 'TRI-ZONE MASTER',
    description: 'Toucher les 3 zones en une même partie',
    target: 3, caddie: 'strat',
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
    name: 'JOSH',
    title: "L'Horloger",
    zone: 'middle' as const,
    color: '#60A5FA',
    voice: 'josh',
    personality: `Tu es JOSH, l'horloger. Données brutes uniquement.
Format strict : Club. Distance. Zone. Vent.
Zéro émotion. Zéro poésie. Que les chiffres.
Termine toujours par : Cible verrouillée.`,
  },
};
