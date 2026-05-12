export interface AcademyDrill {
  id: string;
  title: string;
  category: 'BIOMÉCANIQUE' | 'SCORING ZONE' | 'STRATÉGIE' | 'MENTAL' | 'ESSENTIELS' | 'WARMUP' | 'FUN';
  focus: string;
  description: string;
  theory: string;
  steps: string[];
  duration: number;
  difficulty: 'NEW GEN' | 'GRINDER' | 'CHALLENGER' | 'TOUR PRO';
  videoUrl?: string;
  mentorTip?: string;
  masteryPoints?: string[]; // 3 points to validate mastery
}

export const ACADEMY_CATALOG: AcademyDrill[] = [
  // WARMUP
  { 
    id: 'warm-1', title: 'Réveil Musculaire ONYX', category: 'WARMUP', focus: 'Mobilité', 
    description: 'Séquence rapide de 5 minutes avant le Tee 1.', 
    theory: 'Le muscle froid est un muscle lent. Activez votre système nerveux avant d\'exiger de la vitesse.',
    steps: ['Rotations cervicales (10x)', 'Moulinets de bras amples (20x)', 'Squats avec club au-dessus de la tête (10x)'],
    duration: 300, difficulty: 'NEW GEN',
    mentorTip: 'Adam : Ne cherchez pas la performance ici, cherchez le réveil. Un corps réveillé évite 80% des blessures de début de partie.'
  },
  { 
    id: 'warm-2', title: 'Proprioception Pieds Nus', category: 'WARMUP', focus: 'Équilibre', 
    description: 'Sentez vos appuis au sol pour une base solide.', 
    theory: 'Le swing de golf commence par le sol. Si vous ne sentez pas vos appuis, vous perdez le contrôle du centre de gravité.',
    steps: ['Debout on une jambe (30s par jambe)', 'Transfert de poids lent sans chaussures', 'Sautillement léger sur place'],
    duration: 300, difficulty: 'GRINDER',
    mentorTip: 'Adam : Un golfeur sans ancrage est un golfeur sans direction. Vos pieds sont vos yeux au sol.'
  },
  { 
    id: 'warm-3', title: 'Tempo 1-2-3', category: 'WARMUP', focus: 'Rythme', 
    description: 'Synchronisez votre respiration avec votre mouvement.', 
    theory: 'Le tempo est la colle qui maintient votre swing. 1 pour la montée, 2 pour la transition, 3 pour l\'impact.',
    steps: ['Comptez à voix haute', 'Demi-swings souples', 'Augmentez la vitesse progressivement'],
    duration: 300, difficulty: 'NEW GEN',
    mentorTip: 'Adam : Le rythme bat la force. Toujours.'
  },
  { 
    id: 'warm-4', title: 'Étirement de la Chaîne Postérieure', category: 'WARMUP', focus: 'Flexibilité', 
    description: 'Libérez la tension dans les lombaires et les ischios.', 
    theory: 'La rotation nécessite une colonne vertébrale libérée. Ne forcez jamais le pivot sur un dos verrouillé.',
    steps: ['Mains sur le grip, penchez-vous à 90°', 'Poussez les fesses vers l\'arrière', 'Maintenez 20 secondes'],
    duration: 240, difficulty: 'NEW GEN',
    mentorTip: 'Adam : La souplesse est la clé de la longévité. Un swing sans douleur est un swing éternel.'
  },

  // ESSENTIELS
  { 
    id: 'ess-1', title: 'L\'Alignement Laser', category: 'ESSENTIELS', focus: 'Fondamentaux', 
    description: 'Alignez votre corps parallèlement à votre ligne de jeu.', 
    theory: '90% des mauvais coups commencent au setup. Vos hanches, épaules et pieds doivent être des rails de train.',
    steps: ['Posez un club au sol pointant vers la cible', 'Posez un deuxième club parallèle à vos pieds', 'Vérifiez l\'équerrage des épaules'],
    duration: 300, difficulty: 'NEW GEN' 
  },
  { 
    id: 'ess-2', title: 'Le Grip de Diamant', category: 'ESSENTIELS', focus: 'Connexion', 
    description: 'Une pression de mains constante pour un tempo parfait.', 
    theory: 'Un grip trop serré bloque les poignets. Un grip trop lâche perd le contrôle. Tenez le club comme un oiseau : fermement pour ne pas qu\'il s\'échappe, assez doucement pour ne pas l\'écraser.',
    steps: ['Vérifiez le V formé par le pouce et l\'index', 'Relâchez la tension dans les avant-bras', 'Maintenez la pression 3/10 tout au long du swing'],
    duration: 450, difficulty: 'NEW GEN',
    mentorTip: 'Adam : Vos mains sont les capteurs de votre système. Ne les étouffez pas.'
  },
  { 
    id: 'ess-3', title: 'Posture Athlétique', category: 'ESSENTIELS', focus: 'Stabilité', 
    description: 'Trouvez l\'angle de colonne vertébrale optimal.', 
    theory: 'Le golf est une rotation autour d\'un axe incliné. Si votre dos est rond, votre rotation sera plate.',
    steps: ['Dos droit, penchez-vous à partir des hanches', 'Laissez les bras pendre naturellement', 'Légère flexion des genoux'],
    duration: 300, difficulty: 'NEW GEN' 
  },
  { 
    id: 'ess-4', title: 'Position de Balle par Club', category: 'ESSENTIELS', focus: 'Précision', 
    description: 'Ajustez le point d\'impact selon le club utilisé.', 
    theory: 'Le driver exige un angle ascendant, les fers un angle descendant. La balle doit se déplacer dans votre stance en conséquence.',
    steps: ['Fers courts au centre', 'Fers longs vers le talon gauche', 'Driver à l\'intérieur du talon gauche'],
    duration: 450, difficulty: 'GRINDER' 
  },

  // BIOMÉCANIQUE
  { 
    id: 'bio-1', title: 'Le Pivot de Puissance', category: 'BIOMÉCANIQUE', focus: 'Rotation', 
    description: 'Optimisez la rotation du buste par rapport aux hanches.', 
    theory: 'La puissance vient de la torsion. Imaginez un élastique que l\'on tend : plus vos hanches résistent à la rotation de vos épaules, plus l\'énergie est grande.',
    steps: ['Club derrière les épaules', 'Tournez le buste à 90°', 'Gardez les genoux flexibles', 'Sentez la tension flanc droit'],
    duration: 600, difficulty: 'GRINDER' 
  },
  { 
    id: 'bio-2', title: 'Ground Force Explosion', category: 'BIOMÉCANIQUE', focus: 'Transfert', 
    description: 'Utilisez le sol pour générer de la vitesse de club.', 
    theory: 'Les meilleurs joueurs "écrasent" le sol juste avant l\'impact. L\'énergie remonte du sol vers vos mains.',
    steps: ['Squat léger au sommet de la montée', 'Poussez fort sur la jambe gauche à la descente', 'Étendez la jambe à l\'impact'],
    duration: 900, difficulty: 'TOUR PRO' 
  },
  { 
    id: 'bio-3', title: 'Compression Maximale', category: 'BIOMÉCANIQUE', focus: 'Impact', 
    description: 'Apprenez à frapper la balle en descendant.', 
    theory: 'L\'impact compressé crée du spin et de la portée. Le point bas doit être APRÈS la balle.',
    steps: ['Placez une pièce 10cm devant la balle', 'Touchez la balle PUIS la pièce', 'Gardez les mains devant la tête du club'],
    duration: 900, difficulty: 'CHALLENGER' 
  },
  { 
    id: 'bio-4', title: 'Lag & Release', category: 'BIOMÉCANIQUE', focus: 'Vitesse', 
    description: 'Conservez l\'angle des poignets le plus longtemps possible.', 
    theory: 'Le Lag est le secret de la vitesse sans effort. Comme un fouet, le club doit accélérer au dernier moment.',
    steps: ['Hinge tardif', 'Release explosif'],
    duration: 900, difficulty: 'TOUR PRO' 
  },
  { 
    id: 'bio-5', title: 'Onyx Power Move', category: 'BIOMÉCANIQUE', focus: 'Hanches', 
    description: 'Démarrage foudroyant du bas du corps.', 
    theory: 'La puissance est une réaction en chaîne.',
    steps: ['Flexion downswing', 'Rotation bassin isolée'],
    duration: 1200, difficulty: 'TOUR PRO' 
  },
  
  // SCORING ZONE
  {
    id: 'scoring-1', title: 'Lecture de Green Onyx', category: 'SCORING ZONE', focus: 'Lecture',
    description: 'Visualisez la ligne idéale.', theory: 'Le green se lit avec les yeux et les pieds.',
    steps: ['Trouver le point haut', 'Apex de la pente'],
    duration: 600, difficulty: 'GRINDER'
  },

  // FUN
  { 
    id: 'fun-3', title: 'Trick Shot : Under the Tree', category: 'FUN', focus: 'Créativité', 
    description: 'Apprenez à garder la balle sous les branches.', 
    theory: 'La créativité sauve des pars. Le secret est un finish bas et court.',
    steps: ['Prenez un fer 4 ou 5', 'Balle très en arrière dans le stance', 'Finish sous les épaules'],
    duration: 600, difficulty: 'CHALLENGER' 
  },
  { 
    id: 'strat-3', title: 'Routine Pré-Coup Infaillible', category: 'STRATÉGIE', focus: 'Consistance', 
    description: 'Ancrez votre confiance avant chaque frappe.', 
    theory: 'La routine est votre armure contre la pression. Elle doit être IDENTIQUE, du driver au putt.',
    steps: ['Ciblage derrière la balle', 'Deux demi-coups d\'essai', 'Entrée dans la balle', 'Impact immédiat'],
    duration: 600, difficulty: 'NEW GEN' 
  },
  { 
    id: 'strat-4', title: 'Gestion des Lies Difficiles', category: 'STRATÉGIE', focus: 'Adaptation', 
    description: 'Balle plus haute/basse que les pieds.', 
    theory: 'La pente dicte la trajectoire. Balle au-dessus des pieds = Hook. Balle sous les pieds = Fade.',
    steps: ['Balle en haut : tenez le club plus court', 'Balle en bas : fléchissez plus les genoux', 'Visez en conséquence de la déviation'],
    duration: 900, difficulty: 'GRINDER' 
  },

  // MENTAL
  { 
    id: 'ment-1', title: 'Le Box de Performance', category: 'MENTAL', focus: 'Concentration', 
    description: 'Séparez la réflexion de l\'exécution.', 
    theory: 'Pensez dans la "Think Box", jouez dans la "Play Box". Ne laissez jamais le doute entrer dans la Play Box.',
    steps: ['Tracez une ligne imaginaire', 'Réfléchissez derrière la ligne', 'Franchissez la ligne = Silence mental'],
    duration: 600, difficulty: 'CHALLENGER' 
  },
  { 
    id: 'ment-2', title: 'Visualisation 3D Onyx', category: 'MENTAL', focus: 'Imagination', 
    description: 'Voyez la trajectoire avant qu\'elle n\'existe.', 
    theory: 'Le cerveau ne fait pas la différence entre un coup imaginé et un coup réel. Plus l\'image est nette, plus le corps suit.',
    steps: ['Fermez les yeux', 'Voyez la balle voler vers le drapeau', 'Ressentez l\'impact parfait'],
    duration: 450, difficulty: 'GRINDER' 
  },
  { 
    id: 'ment-3', title: 'Acceptation & Relâchement', category: 'MENTAL', focus: 'Émotion', 
    description: 'Gérez la frustration après un mauvais coup.', 
    theory: 'Le coup le plus important au golf est le PROCHAIN. Le passé est une donnée morte.',
    steps: ['10 secondes pour être fâché', 'Une grande inspiration', 'Nettoyez votre club = Nettoyez votre esprit'],
    duration: 300, difficulty: 'NEW GEN' 
  },

  // FUN
  { 
    id: 'fun-1', title: 'Le Défi de la Balle Rebelle', category: 'FUN', focus: 'Créativité', 
    description: 'Donnez un maximum d\'effet volontaire.', 
    theory: 'Comprendre comment faire un hook aide à corriger un slice. Maîtrisez les extrêmes pour trouver le centre.',
    steps: ['Effet gauche-droite maximum', 'Effet droite-gauche maximum', 'Trajectoire ras-du-sol'],
    duration: 900, difficulty: 'TOUR PRO' 
  },
  { 
    id: 'fun-2', title: 'Concours de Point de Chute', category: 'FUN', focus: 'Précision', 
    description: 'Visez de petites cibles au practice.', 
    theory: 'Visez petit, ratez petit. Ne visez pas le practice, visez un seau à 30m.',
    steps: ['Visez une cible précise', 'Touchez-la en 3 essais maximum', 'Variez les distances'],
    duration: 600, difficulty: 'GRINDER' 
  },

  // --- ONYX BIBLE ADDITIONS (50+ DRILLS) ---
  { id: 'warm-onyx-1', title: 'Onyx Matrix : Activation Poignets', category: 'WARMUP', focus: 'Mobilité', description: 'Libération chirurgicale de la face de club.', theory: 'La vitesse de sortie dépend de la fluidité des tendons fléchisseurs.', steps: ['Rotations dynamiques', 'Extensions actives', 'Shadow releases'], duration: 300, difficulty: 'GRINDER' },
  { id: 'warm-onyx-2', title: 'Séquence Thoracique 360', category: 'WARMUP', focus: 'X-Factor', description: 'Dissociation haut/bas du corps.', theory: 'Le X-Factor est créé par l angle entre les hanches et les épaules.', steps: ['Hanches fixes', 'Rotation épaule maximale', 'Respiration ventrale'], duration: 420, difficulty: 'TOUR PRO' },
  { id: 'ess-onyx-1', title: 'Grip de Précision Onyx', category: 'ESSENTIELS', focus: 'Face Control', description: 'Alignement neutre haute performance.', theory: 'Le grip est votre seul lien avec le club. Il doit être parfait.', steps: ['V de la main gauche', 'Verrouillage interlock/overlap', 'Pression 4/10'], duration: 600, difficulty: 'NEW GEN' },
  { id: 'bio-onyx-1', title: 'Vertical Force Ignition', category: 'BIOMÉCANIQUE', focus: 'Puissance', description: 'Utilisation du sol comme levier.', theory: 'Le sol est votre moteur de distance. Apprenez à pousser.', steps: ['Flexion downswing', 'Extension impact explosive', 'Transfert total'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-1', title: 'Matrice de Dosage Putting', category: 'SCORING ZONE', focus: 'Toucher', description: 'Étalonnage de la distance sur 3m/6m/9m.', theory: 'La régularité du pendule garantit la répétitivité.', steps: ['Métronome actif', 'Étalonnage amplitude', 'Visualisation vitesse'], duration: 1200, difficulty: 'GRINDER' },
  { id: 'mental-onyx-1', title: 'Onyx Reset : Post-Shot', category: 'MENTAL', focus: 'Résilience', description: 'Oublier le dernier coup en 5 secondes.', theory: 'Le cerveau ne peut être performant qu au présent.', steps: ['Geste de reset physique', 'Respiration box', 'Focus cible suivante'], duration: 300, difficulty: 'GRINDER' },
  { id: 'strat-onyx-1', title: 'Course Mapping Elite', category: 'STRATÉGIE', focus: 'Gestion', description: 'Zonage du fairway et du green.', theory: 'Gérez le parcours, ne le subissez pas.', steps: ['Identification zones danger', 'Calcul vent/lie', 'Décision irrévocable'], duration: 1500, difficulty: 'TOUR PRO' },
  { id: 'warm-onyx-3', title: 'Ignition Glute Power', category: 'WARMUP', focus: 'Ancrage', description: 'Activation des fessiers.', theory: 'Stabilité pelvienne pour une poussée maximale.', steps: ['Squats lents', 'Fentes latérales'], duration: 300, difficulty: 'GRINDER' },
  { id: 'ess-onyx-2', title: 'Posturale Elite 101', category: 'ESSENTIELS', focus: 'Alignement', description: 'Posture athlétique Onyx.', theory: 'Une base saine pour un swing répétitif.', steps: ['Dos plat', 'Bras ballants'], duration: 600, difficulty: 'NEW GEN' },
  { id: 'bio-onyx-2', title: 'Dynamic Weight Flow', category: 'BIOMÉCANIQUE', focus: 'Compression', description: 'Transfert de masse fluide.', theory: 'Frapper en descendant pour comprimer la balle.', steps: ['Charge droite', 'Push gauche'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-2', title: 'Splash Bunker Secret', category: 'SCORING ZONE', focus: 'Bunker', description: 'Sortie de sable haute.', theory: 'Lame de sable sous la balle.', steps: ['Face ouverte', 'Entrée 2cm derrière'], duration: 1500, difficulty: 'GRINDER' },
  { id: 'mental-onyx-2', title: 'HD Pre-shot Vision', category: 'MENTAL', focus: 'Visualisation', description: 'Film interne du coup.', theory: 'Voir pour pouvoir exécuter.', steps: ['Fermer les yeux', 'Trajectoire 3D'], duration: 600, difficulty: 'GRINDER' },
  { id: 'strat-onyx-2', title: 'Wind Matrix Control', category: 'STRATÉGIE', focus: 'Adaptation', description: 'Gestion du vent.', theory: 'Calculer la déviance aérodynamique.', steps: ['Force vent', 'Direction', 'Clubbing'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'fun-onyx-1', title: 'Himalayan Putting Challenge', category: 'FUN', focus: 'Sensation', description: 'Pentes extrêmes.', theory: 'Libérer l instinct graphique.', steps: ['Pente max', 'Visée décalée'], duration: 900, difficulty: 'NEW GEN' },
  { id: 'warm-onyx-4', title: 'Neck Release Protocol', category: 'WARMUP', focus: 'Relâchement', description: 'Détente cervicale.', theory: 'Rotation libre des épaules.', steps: ['Cercles doux', 'Étirements'], duration: 180, difficulty: 'NEW GEN' },
  { id: 'ess-onyx-3', title: 'T-Square Face Check', category: 'ESSENTIELS', focus: 'Setup', description: 'Vérifier la face square.', theory: 'Éviter le slice dès l adresse.', steps: ['Ligne au sol', 'Leading edge'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'bio-onyx-3', title: 'Shoulder Plane Precision', category: 'BIOMÉCANIQUE', focus: 'Plan', description: 'Plan d épaules pro.', theory: 'Éviter le swing flat.', steps: ['Club sur épaules', 'Rotation 90°'], duration: 900, difficulty: 'GRINDER' },
  { id: 'scoring-onyx-3', title: 'Chip & Run Safetey', category: 'SCORING ZONE', focus: 'Approche', description: 'Coup de sécurité.', theory: 'Le sol est votre allié.', steps: ['Fer 8/9', 'Balancier'], duration: 900, difficulty: 'NEW GEN' },
  { id: 'mental-onyx-3', title: 'Vagus Breath Sync', category: 'MENTAL', focus: 'Calme', description: 'Respiration synchronisée.', theory: 'Calmer le cœur avant le drive.', steps: ['Inspir 4s', 'Expir 8s'], duration: 120, difficulty: 'TOUR PRO' },
  { id: 'strat-onyx-3', title: 'Lie Detection 101', category: 'STRATÉGIE', focus: 'Technique', description: 'Analyse du lie dans le rough.', theory: 'Le lie dicte les possibles.', steps: ['Poil de l herbe', 'Profondeur'], duration: 600, difficulty: 'GRINDER' },
  { id: 'fun-onyx-2', title: 'One-Leg Stability Shot', category: 'FUN', focus: 'Équilibre', description: 'Swing sur une jambe.', theory: 'Maîtrise totale du centre.', steps: ['Appui gauche', 'Swing complet'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'warm-onyx-5', title: 'Wrist Mobility Matrix', category: 'WARMUP', focus: 'Mobilité', description: 'Activation tendons.', theory: 'Prévient blessures, augmente vitesse.', steps: ['Flexions', 'Rotations'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'ess-onyx-4', title: 'Width Focus Drill', category: 'ESSENTIELS', focus: 'Rayon', description: 'Maintenir la largeur.', theory: 'L espace crée la puissance.', steps: ['Bras allongés', 'Takeaway large'], duration: 600, difficulty: 'GRINDER' },
  { id: 'bio-onyx-4', title: 'Hip Dissociation Pro', category: 'BIOMÉCANIQUE', focus: 'Séquence', description: 'Séquençage hanches.', theory: 'Démarre par le bas.', steps: ['Bassin stable', 'Rotation isolée'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-4', title: 'Impact Alignment Check', category: 'SCORING ZONE', focus: 'Impact', description: 'Position d impact pro.', theory: 'Hanches ouvertes, mains devant.', steps: ['Arrivée lente', 'Check angles'], duration: 900, difficulty: 'GRINDER' },
  { id: 'mental-onyx-4', title: 'Anchor Trigger Onyx', category: 'MENTAL', focus: 'Action', description: 'Déclencheur physique.', theory: 'Bascule en exécution.', steps: ['Double tap sol', 'Expiration'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'strat-onyx-4', title: 'Lay-up Efficiency', category: 'STRATÉGIE', focus: 'Scoring', description: 'Placer la balle à 80m.', theory: 'Jouer sa distance favorite.', steps: ['Calcul safe', 'Cible zone'], duration: 600, difficulty: 'GRINDER' },
  { id: 'fun-onyx-3', title: 'Blindfold Putting Feel', category: 'FUN', focus: 'Dosage', description: 'Putts yeux fermés.', theory: 'Ressenti kinesthésique pur.', steps: ['Visée', 'Yeux clos'], duration: 600, difficulty: 'GRINDER' },
  { id: 'warm-onyx-6', title: 'Ankle Stability Onyx', category: 'WARMUP', focus: 'Ancrage', description: 'Ancrage sol.', theory: 'Évite le sway latéral.', steps: ['Équilibre unijambiste', 'Cercle cheville'], duration: 300, difficulty: 'GRINDER' },
  { id: 'ess-onyx-5', title: 'Pre-Shot Blueprint', category: 'ESSENTIELS', focus: 'Routine', description: 'Routine structurelle.', theory: 'Protège le swing sous pression.', steps: ['Visualisation', 'Engagement'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'bio-onyx-5', title: 'Lag & Snap Drill', category: 'BIOMÉCANIQUE', focus: 'Fouet', description: 'Vitesse de tête.', theory: 'Conservation d angle max.', steps: ['Hinge tardif', 'Release snap'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-5', title: 'Putt Gate Matrix', category: 'SCORING ZONE', focus: 'Sortie', description: 'Drill des portes.', theory: 'Sortie de balle square.', steps: ['Portes en tees', 'Écart réduit'], duration: 900, difficulty: 'NEW GEN' },
  { id: 'mental-onyx-5', title: 'Zone Entry Protocol', category: 'MENTAL', focus: 'Focus', description: 'Entrée en flow.', theory: 'Performance maximale sans effort.', steps: ['Silence mental', 'Confiance'], duration: 1800, difficulty: 'TOUR PRO' },
  { id: 'strat-onyx-5', title: 'Decision 3-Steps', category: 'STRATÉGIE', focus: 'Tactique', description: 'Vitesse décisionnelle.', theory: 'L hésitation tue le swing.', steps: ['Info', 'Option', 'Action'], duration: 600, difficulty: 'GRINDER' },
  { id: 'fun-onyx-4', title: 'Cross-Club Master', category: 'FUN', focus: 'Adaptation', description: 'Un seul club, tout le trou.', theory: 'Crée de l inventivité.', steps: ['Choix unique', 'Variations'], duration: 1800, difficulty: 'TOUR PRO' },
  { id: 'warm-onyx-7', title: 'Shoulder Blade Flow', category: 'WARMUP', focus: 'Largeur', description: 'Mobilité omoplates.', theory: 'Évite le chicken wing.', steps: ['Protraction', 'Rétraction'], duration: 300, difficulty: 'GRINDER' },
  { id: 'ess-onyx-6', title: 'Grip Pressure Scale', category: 'ESSENTIELS', focus: 'Sensation', description: 'Échelle de pression.', theory: '7/10 au drive, 3/10 au putt.', steps: ['Serrer fort', 'Relâcher palier par palier'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'bio-onyx-6', title: 'Trail Elbow Tucking', category: 'BIOMÉCANIQUE', focus: 'Chemin', description: 'Connexion bras droit.', theory: 'Attaque de l intérieur.', steps: ['Serviette aisselle', 'Maintien'], duration: 900, difficulty: 'GRINDER' },
  { id: 'scoring-onyx-6', title: 'Land Spot Focus', category: 'SCORING ZONE', focus: 'Landing', description: 'Précision d atterrissage.', theory: 'Visez un point, pas le trou.', steps: ['Repère green', 'Atterrissage précis'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'mental-onyx-6', title: 'Pressure Simulation', category: 'MENTAL', focus: 'Public', description: 'Simuler le public.', theory: 'Endurcir le système nerveux.', steps: ['Public imaginaire', 'Coup décisif'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'strat-onyx-6', title: 'Fairway Segmentation', category: 'STRATÉGIE', focus: 'Cible', description: 'Découpe spatiale.', theory: 'Plus la cible est petite...', steps: ['Cible laser', 'Couloir vol'], duration: 600, difficulty: 'NEW GEN' },
  { id: 'fun-onyx-5', title: 'Slow-Motion Mastery', category: 'FUN', focus: 'Conscience', description: 'Swing en 60 secondes.', theory: 'Micro-perception du mouvement.', steps: ['Extrême lenteur', 'Contrôle total'], duration: 600, difficulty: 'GRINDER' },
  { id: 'warm-onyx-8', title: 'Pelvic Tilt Mastery', category: 'WARMUP', focus: 'Posturale', description: 'Bascule du bassin.', theory: 'Maintien des angles de colonne.', steps: ['Antéversion', 'Rétroversion'], duration: 300, difficulty: 'GRINDER' },
  { id: 'ess-onyx-7', title: 'Ball Position Gauge', category: 'ESSENTIELS', focus: 'Setup', description: 'Placement millimétré.', theory: 'Adaptation selon l inclinaison.', steps: ['Repères pieds', 'Centrage club'], duration: 600, difficulty: 'GRINDER' },
  { id: 'bio-onyx-7', title: 'Radial Deviation Lock', category: 'BIOMÉCANIQUE', focus: 'Angle', description: 'Levier de poignet.', theory: 'Angle shaft/bras constant.', steps: ['Hinge vertical', 'Maintien descente'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-7', title: 'Flop Shot Onyx', category: 'SCORING ZONE', focus: 'Lob', description: 'Technique extrême.', theory: 'Vitesse haute, vol court.', steps: ['Face ciel', 'Swing complet rapide'], duration: 1500, difficulty: 'TOUR PRO' },
  { id: 'mental-onyx-7', title: 'Internal Dialogue Onyx', category: 'MENTAL', focus: 'Pensées', description: 'Mantra de performance.', theory: 'Un seul mot directif.', steps: ['Choix mot clé', 'Répétition'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'strat-onyx-7', title: 'Par-Save Logic', category: 'STRATÉGIE', focus: 'Saving', description: 'Logique de récupération.', theory: 'Éviter le double à tout prix.', steps: ['Sécurité max', 'Un putt chance'], duration: 900, difficulty: 'GRINDER' },
  { id: 'fun-onyx-6', title: 'Wind-Ball Curve', category: 'FUN', focus: 'Effet', description: 'Travailler les courbes.', theory: 'Balle vers le vent.', steps: ['Draw prononcé', 'Fade tranchant'], duration: 900, difficulty: 'TOUR PRO' },
  
  // --- ADDITIONAL ONYX ELITE EXPANSION (50+ MORE) ---
  { id: 'warm-onyx-9', title: 'Onyx Nerve Activation', category: 'WARMUP', focus: 'Vitesse', description: 'Sursauts nerveux pour le driver.', theory: 'Vitesse de réaction = Vitesse de tête.', steps: ['Sprints courts', 'Mouvements explosifs sans club'], duration: 240, difficulty: 'TOUR PRO' },
  { id: 'warm-onyx-10', title: 'Lateral Stability Sync', category: 'WARMUP', focus: 'Stabilité', description: 'Sauts latéraux contrôlés.', theory: 'Évitez le glissement latéral (Sway).', steps: ['Sauts alternés', 'Réception stable'], duration: 300, difficulty: 'GRINDER' },
  { id: 'warm-onyx-11', title: 'Upper Body Release', category: 'WARMUP', focus: 'Mobilité', description: 'Rotation épaules large.', theory: 'Largeur égale puissance.', steps: ['Coudes hauts', 'Rotation d axe'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'warm-onyx-12', title: 'Foot Pressure Flow', category: 'WARMUP', focus: 'Proprioception', description: 'Sentir les 4 coins du pied.', theory: 'L équilibre commence au sol.', steps: ['Pression talon', 'Pression pointe'], duration: 180, difficulty: 'NEW GEN' },
  { id: 'warm-onyx-13', title: 'Core Ignition Drill', category: 'WARMUP', focus: 'Puissance', description: 'Activation abdos profonds.', theory: 'Le core protège le dos et génère la torsion.', steps: ['Planche dynamique', 'Rotation buste assistée'], duration: 300, difficulty: 'GRINDER' },
  { id: 'ess-onyx-8', title: 'Onyx Target Blueprint', category: 'ESSENTIELS', focus: 'Visualisation', description: 'Ciblage militaire du fairway.', theory: 'Visez petit, ratez petit.', steps: ['Identification laser', 'Plot de départ'], duration: 600, difficulty: 'CHALLENGER' },
  { id: 'ess-onyx-9', title: 'Grip Neutrality Check', category: 'ESSENTIELS', focus: 'Direction', description: 'Vérification millimétrée du grip.', theory: 'Le grip tourne la face.', steps: ['2 phalanges visibles', 'V vers l épaule'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'ess-onyx-10', title: 'Posture Angle Lock', category: 'ESSENTIELS', focus: 'Consistance', description: 'Maintien de l angle de buste.', theory: 'Ne vous relevez pas à l impact.', steps: ['Check miroir', 'Maintien posture finsih'], duration: 900, difficulty: 'GRINDER' },
  { id: 'ess-onyx-11', title: 'Stance Width Precision', category: 'ESSENTIELS', focus: 'Base', description: 'Largeur pieds selon le club.', theory: 'Trop large = bloqué, trop étroit = instable.', steps: ['Épaules alignées pieds', 'Test stabilité'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'ess-onyx-12', title: 'Face-Path Awareness', category: 'ESSENTIELS', focus: 'Balistique', description: 'Sentir le rapport face/chemin.', theory: 'Comprendre pourquoi la balle tourne.', steps: ['Frappe chemin intérieur', 'Frappe face ouverte'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'bio-onyx-8', title: 'Kinetik Chain Sequence', category: 'BIOMÉCANIQUE', focus: 'Séquence', description: 'Ordre de descente parfait.', theory: 'Hanches, puis buste, puis bras.', steps: ['Pause au sommet', 'Démarrage hanches'], duration: 1500, difficulty: 'TOUR PRO' },
  { id: 'bio-onyx-9', title: 'Lead Side Loading', category: 'BIOMÉCANIQUE', focus: 'Impact', description: 'Charge sur la jambe avant.', theory: '90% du poids à gauche à l impact.', steps: ['Step-in drill', 'Impact bloqué'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'bio-onyx-10', title: 'Thoracic Expansion', category: 'BIOMÉCANIQUE', focus: 'Amplitude', description: 'Augmentation du rayon de swing.', theory: 'Plus long levier = plus de vitesse.', steps: ['Extension bras gauche', 'Rotation max'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'bio-onyx-11', title: 'Wrist Cock Stability', category: 'BIOMÉCANIQUE', focus: 'Levier', description: 'Maintien du levier poignets.', theory: 'Lag = Puissance gratuite.', steps: ['90 degres armage', 'Retard impact'], duration: 1200, difficulty: 'CHALLENGER' },
  { id: 'bio-onyx-12', title: 'Ground Reaction Force', category: 'BIOMÉCANIQUE', focus: 'Vitesse', description: 'Poussée verticale pro.', theory: 'Décollez à l impact pour la vitesse.', steps: ['Jump drill', 'Poussée jambe avant'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-8', title: 'Putt Distance Control', category: 'SCORING ZONE', focus: 'Dosage', description: 'Matrice de dosage 5/10/15m.', theory: 'Le score meurt sur les 3-putts.', steps: ['Pendulaire constant', 'Cible zone 1m'], duration: 1200, difficulty: 'GRINDER' },
  { id: 'scoring-onyx-9', title: 'Chippage de Précision', category: 'SCORING ZONE', focus: 'Toucher', description: 'Atterrissage sur serviette.', theory: 'Maîtrisez votre point de chute.', steps: ['Serviette a 5m', 'Atterrissage net'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'scoring-onyx-10', title: 'Bunker Blast Mastery', category: 'SCORING ZONE', focus: 'Sable', description: 'Sable avant la balle.', theory: 'Explosion contrôlée du sable.', steps: ['Ligne dans le sable', 'Frappe sur la ligne'], duration: 1200, difficulty: 'GRINDER' },
  { id: 'scoring-onyx-11', title: 'Lob Shot High Risk', category: 'SCORING ZONE', focus: 'Lob', description: 'Balle haute, arrêt court.', theory: 'Vitesse de club extrême, mains passives.', steps: ['Face ciel', 'Swing complet'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-12', title: 'Dead-Eye Alignment', category: 'SCORING ZONE', focus: 'Putting', description: 'Alignement face/ligne.', theory: 'Si vous visez mal, vous ratez mal.', steps: ['Miroir alignement', 'Ligne de balle'], duration: 600, difficulty: 'NEW GEN' },
  { id: 'mental-onyx-8', title: 'Onyx Focus Shield', category: 'MENTAL', focus: 'Concentration', description: 'Isolation phonique mentale.', theory: 'Le bruit extérieur ne doit pas exister.', steps: ['Routine sous bruit', 'Focus respiration'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'mental-onyx-9', title: 'Emotional Reset Key', category: 'MENTAL', focus: 'Calme', description: 'Gérer le double bogey.', theory: 'Acceptation immédiate des faits.', steps: ['Analyse 10s', 'Reset trigger'], duration: 300, difficulty: 'GRINDER' },
  { id: 'mental-onyx-10', title: 'Performance Visualization', category: 'MENTAL', focus: 'Confiance', description: 'Voir le putt tomber.', theory: 'Le cerveau commande le corps par l image.', steps: ['Visualisation 4K', 'Engagement total'], duration: 450, difficulty: 'CHALLENGER' },
  { id: 'mental-onyx-11', title: 'Belly Breathing Flow', category: 'MENTAL', focus: 'Stress', description: 'Contrôle du rythme cardiaque.', theory: 'Trop d adrénaline tue le toucher.', steps: ['3 cycles profonds', 'Relâchement mâchoire'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'mental-onyx-12', title: 'Mindful Impact', category: 'MENTAL', focus: 'Conscience', description: 'Sentir l impact pur.', theory: 'Connexion totale avec la sensation.', steps: ['Focus points de contact', 'Audit sonore'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'strat-onyx-8', title: 'Caddie Logic : Clubbing', category: 'STRATÉGIE', focus: 'Décision', description: 'Calcul du club réel.', theory: 'Vent, dénivelé et température.', steps: ['Audit conditions', 'Choix conservateur'], duration: 900, difficulty: 'GRINDER' },
  { id: 'strat-onyx-9', title: 'Par-5 Birdie Attack', category: 'STRATÉGIE', focus: 'Scoring', description: 'Stratégie de placement.', theory: 'Le second coup prépare le birdie.', steps: ['Zone de lay-up', 'Angle d attaque'], duration: 1200, difficulty: 'CHALLENGER' },
  { id: 'strat-onyx-10', title: 'Tee Shot Placement', category: 'STRATÉGIE', focus: 'Précision', description: 'Ouvrir l angle du green.', theory: 'Le drive ne cherche pas le milieu.', steps: ['Côté opposé danger', 'Angle optimal'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'strat-onyx-11', title: 'Recovery Logic 101', category: 'STRATÉGIE', focus: 'Sauvetage', description: 'Le coup de replacement.', theory: 'Ne tentez pas le coup miracle.', steps: ['Sortie de rough safe', 'Objectif Par'], duration: 600, difficulty: 'GRINDER' },
  { id: 'strat-onyx-12', title: 'Yardage Matrix Mastery', category: 'STRATÉGIE', focus: 'Distances', description: 'Connaître ses distances.', theory: 'L ignorance est le père du bogey.', steps: ['Étalonnage fer par fer', 'Marge d erreur'], duration: 1800, difficulty: 'TOUR PRO' },
  { id: 'fun-onyx-7', title: 'One Club Challenge', category: 'FUN', focus: 'Créativité', description: 'Tout faire au fer 7.', theory: 'Apprenez à varier les trajectoires.', steps: ['Putt au fer 7', 'Approche au fer 7'], duration: 1200, difficulty: 'CHALLENGER' },
  { id: 'fun-onyx-8', title: 'The Stinger Move', category: 'FUN', focus: 'Trajectoire', description: 'Balle basse pénétrante.', theory: 'Style et efficacité contre le vent.', steps: ['Face square', 'Finish bas coupé'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'fun-onyx-9', title: 'Blind Target Challenge', category: 'FUN', focus: 'Instinct', description: 'Viser sans regarder la balle.', theory: 'Focus cible absolue.', steps: ['Regard vers la cible', 'Swing instinctif'], duration: 600, difficulty: 'CHALLENGER' },
  { id: 'fun-onyx-10', title: 'Super-Slow Connection', category: 'FUN', focus: 'Audit', description: 'Swing à 10% de vitesse.', theory: 'Détecter les failles mécaniques.', steps: ['Vitesse minimale', 'Contrôle total'], duration: 900, difficulty: 'GRINDER' },
  { id: 'fun-onyx-11', title: 'Power Fade Workshop', category: 'FUN', focus: 'Contrôle', description: 'Le coup des champions.', theory: 'Le fade est plus prévisible.', steps: ['Check chemin extérieur', 'Face légèrement ouverte'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'bio-onyx-13', title: 'Shoulder-Hip Separation', category: 'BIOMÉCANIQUE', focus: 'Torsion', description: 'X-Factor Stretch.', theory: 'Engranger l énergie élastique.', steps: ['Bassin bloqué', 'Épaules 90'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'bio-onyx-14', title: 'Impact Snap Protocol', category: 'BIOMÉCANIQUE', focus: 'Sortie', description: 'Accélération post-impact.', theory: 'Ne ralentissez pas dans la balle.', steps: ['Vitesse max a 2h', 'Finition haute'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'bio-onyx-15', title: 'Balanced Finish Lock', category: 'BIOMÉCANIQUE', focus: 'Contrôle', description: 'Tenir le finish 3 secondes.', theory: 'Preuve d un swing équilibré.', steps: ['Impact fluide', 'Pause finish immobile'], duration: 600, difficulty: 'NEW GEN' },
  { id: 'bio-onyx-16', title: 'Forearm Rotation Drill', category: 'BIOMÉCANIQUE', focus: 'Release', description: 'Rotation des avant-bras.', theory: 'Fermeture de face naturelle.', steps: ['L droit devant', 'L gauche après'], duration: 600, difficulty: 'GRINDER' },
  { id: 'bio-onyx-17', title: 'Spine Angle Monitor', category: 'BIOMÉCANIQUE', focus: 'Axe', description: 'Stabilité de l axe vertébral.', theory: 'Rotation pure, pas de sway.', steps: ['Tête fixe', 'Pivot sur axe'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'scoring-onyx-13', title: 'Apex Reading Vision', category: 'SCORING ZONE', focus: 'Lecture', description: 'Identifier le point culminant.', theory: 'Le point où le break commence.', steps: ['Triangulation green', 'Apex visuel'], duration: 600, difficulty: 'GRINDER' },
  { id: 'scoring-onyx-14', title: 'Speed-Kills Matrix', category: 'SCORING ZONE', focus: 'Putting', description: 'Vitesse de balle sur green.', theory: 'La ligne dépend de la vitesse.', steps: ['Vitesse agressive', 'Vitesse mourante'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-15', title: 'Flop from the Fringe', category: 'SCORING ZONE', focus: 'Lob', description: 'Coup de main expert.', theory: 'Prendre la balle nette sur herbe rase.', steps: ['Leading edge bas', 'Engagement total'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'scoring-onyx-16', title: 'Chip-Putt Hybrid', category: 'SCORING ZONE', focus: 'Sensation', description: 'Coup roulé de sauvetage.', theory: 'Éviter le danger aérien.', steps: ['Mouvement de putt', 'Fer 7/8'], duration: 600, difficulty: 'NEW GEN' },
  { id: 'scoring-onyx-17', title: 'Bunker Distance Tuning', category: 'SCORING ZONE', focus: 'Sable', description: 'Sorties de 5m à 20m.', theory: 'Varier l énergie d impact.', steps: ['Amplitude variable', 'Sortie sable constante'], duration: 1200, difficulty: 'CHALLENGER' },
  { id: 'strat-onyx-13', title: 'Risk/Reward Auditor', category: 'STRATÉGIE', focus: 'Scoring', description: 'Évaluer quand attaquer.', theory: 'Le score se gagne par l intelligence.', steps: ['Distance danger', 'Probabilité succès'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'strat-onyx-14', title: 'Safe Side Landing', category: 'STRATÉGIE', focus: 'Approche', description: 'Viser la zone de secours.', theory: 'Ne visez jamais le drapeau court.', steps: ['Identifier zone ratée safe', 'Visée décalée'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'strat-onyx-15', title: 'Club Selection Matrix', category: 'STRATÉGIE', focus: 'Distances', description: 'Audit de l arsenal Onyx.', theory: 'Votre distance n est pas votre record.', steps: ['Moyenne 10 balles', 'Distance de confiance'], duration: 1800, difficulty: 'GRINDER' },
  { id: 'strat-onyx-16', title: 'Emotional Mapping', category: 'STRATÉGIE', focus: 'Mental', description: 'Zoner ses émotions.', theory: 'Le calme est une arme tactique.', steps: ['Check stress', 'Adaptation cible'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'strat-onyx-17', title: 'Hole Flow Awareness', category: 'STRATÉGIE', focus: 'Parcours', description: 'Sentir le rythme du trou.', theory: 'Chaque trou a une histoire.', steps: ['Lecture paysage', 'Flow tactique'], duration: 900, difficulty: 'CHALLENGER' },

  // --- ARENA LEVEL EXPANSION (Final 15+ per Level) ---
  // NEW GEN
  { 
    id: 'ng-1', title: 'Shadow Swing Sync', category: 'ESSENTIELS', focus: 'Fluidité', description: 'Swing sans club devant un miroir.', theory: 'Visualiser le mouvement pur.', steps: ['Rotation lente', 'Check positions'], duration: 300, difficulty: 'NEW GEN', mentorTip: 'Adam : Le miroir est votre meilleur coach.',
    masteryPoints: ['Rotation complète 90°', 'Équilibre tenu 3s', 'Bras gauche tendu']
  },
  { id: 'ng-2', title: 'Target Switch Practice', category: 'STRATÉGIE', focus: 'Adaptation', description: 'Changer de cible à chaque balle.', theory: 'Le golf n\'est jamais deux fois le même coup.', steps: ['Cible gauche', 'Cible droite', 'Cible centre'], duration: 600, difficulty: 'NEW GEN' },
  { id: 'ng-3', title: 'Putting Gate Pro', category: 'SCORING ZONE', focus: 'Direction', description: 'Passer la balle entre deux pièces.', theory: 'La direction initiale est 80% du putt.', steps: ['Placez 2 pièces à 50cm', 'Roulez entre'], duration: 450, difficulty: 'NEW GEN' },
  // GRINDER
  { id: 'gr-1', title: 'Low-Point Mastery', category: 'BIOMÉCANIQUE', focus: 'Impact', description: 'Toucher le sol après la balle.', theory: 'Compression maximale.', steps: ['Ligne au sol', 'Impact devant'], duration: 900, difficulty: 'GRINDER',
    masteryPoints: ['Divot après la balle', 'Poids sur jambe gauche', 'Mains devant à l\'impact']
  },
  { id: 'gr-2', title: 'Pressure Shift Drill', category: 'BIOMÉCANIQUE', focus: 'Transfert', description: 'Sentir le poids dans les pieds.', theory: 'Dynamic weight transfer.', steps: ['Charge talon droit', 'Poussée pointe gauche'], duration: 600, difficulty: 'GRINDER' },
  { id: 'gr-3', title: 'Par-Save Matrix', category: 'STRATÉGIE', focus: 'Scoring', description: 'Sortir de situations critiques.', theory: 'Accepter le bogey, éviter le double.', steps: ['Zone de sécurité', 'Approche safe'], duration: 1200, difficulty: 'GRINDER' },
  // CHALLENGER
  { id: 'ch-1', title: 'Trajectory Window', category: 'BIOMÉCANIQUE', focus: 'Hauteur', description: 'Passer sous/sur un obstacle imaginaire.', theory: 'Contrôle de l\'angle de décollage.', steps: ['Balle basse', 'Balle haute'], duration: 900, difficulty: 'CHALLENGER',
    masteryPoints: ['3 balles basses/3', '3 balles hautes/3', 'Position de balle variable']
  },
  { id: 'ch-2', title: 'Extreme Draw/Fade', category: 'FUN', focus: 'Courbes', description: 'Faire tourner la balle de 20m.', theory: 'Maîtriser les extrêmes.', steps: ['Setup ouvert/fermé', 'Trajectoire'], duration: 1200, difficulty: 'CHALLENGER' },
  { id: 'ch-3', title: 'Pressure Putting 10', category: 'MENTAL', focus: 'Focus', description: 'Réussir 10 putts de 1m de suite.', theory: 'Résilience au stress.', steps: ['Cercle de tees', 'Succession nette'], duration: 1800, difficulty: 'CHALLENGER' },
  // TOUR PRO
  { id: 'tp-1', title: 'Stinger Masterclass', category: 'FUN', focus: 'Contrôle', description: 'Balle laser à 2m du sol.', theory: 'Le coup ultime face au vent.', steps: ['Mains en avant', 'Finish coupé'], duration: 1200, difficulty: 'TOUR PRO',
    masteryPoints: ['Hauteur constante < 2m', 'Vitesse balle > 140mph', 'Dispersion < 10m']
  },
  { id: 'tp-2', title: 'Full Speed Calibration', category: 'WARMUP', focus: 'Vitesse', description: 'Atteindre sa Vmax sans balle.', theory: 'Activation neuronale.', steps: ['3 swings max', 'Repos 1min'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'tp-3', title: 'Green Topology Audit', category: 'SCORING ZONE', focus: 'Lecture', description: 'Lire les micro-reliefs du green.', theory: 'La vision radar.', steps: ['Scan pieds', 'Scan visuel'], duration: 900, difficulty: 'TOUR PRO' },

  // --- ARENA LEVEL EXPANSION 2 ---
  // NEW GEN (Goal: ~20 total)
  { id: 'ng-4', title: 'Balance Breath Sync', category: 'MENTAL', focus: 'Calme', description: 'Respirer au rythme du swing.', theory: 'Inspir-Montée, Expir-Frappe.', steps: ['Respiration ventrale', 'Rythme lent'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'ng-5', title: 'The Wall Drill', category: 'BIOMÉCANIQUE', focus: 'Plan', description: 'Swing sans club contre un mur.', theory: 'Sentir les limites spatiales.', steps: ['Fesses contre le mur', 'Rotation sans toucher'], duration: 450, difficulty: 'NEW GEN' },
  { id: 'ng-6', title: 'Tee-Height Consistency', category: 'ESSENTIELS', focus: 'Setup', description: 'Placer son tee toujours à la même hauteur.', theory: 'La répétitivité commence ici.', steps: ['Marquage de tee', 'Test impact'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'ng-7', title: 'Visual Target Lock', category: 'STRATÉGIE', focus: 'Concentration', description: 'Fixer la cible avant de jouer.', theory: 'Ancrage de l\'objectif.', steps: ['Regard intense 3s', 'Exécution'], duration: 240, difficulty: 'NEW GEN' },
  { id: 'ng-8', title: 'Grip Pressure Cycle', category: 'ESSENTIELS', focus: 'Sensation', description: 'Varier la pression consciemment.', theory: 'Trouver son 4/10.', steps: ['Serrer 10/10', 'Relâcher 1/10'], duration: 300, difficulty: 'NEW GEN' },

  // GRINDER (Goal: ~20 total)
  { id: 'gr-4', title: 'Impact Tape Audit', category: 'ESSENTIELS', focus: 'Centrage', description: 'Vérifier où la balle touche la face.', theory: 'Le centrage est la clé du smash factor.', steps: ['Sticker face', 'Série de 5 balles'], duration: 900, difficulty: 'GRINDER' },
  { id: 'gr-5', title: 'Divot Direction Check', category: 'BIOMÉCANIQUE', focus: 'Chemin', description: 'Analyser son passage de club au sol.', theory: 'Le divot ne ment jamais.', steps: ['Lecture direction', 'Correction angle'], duration: 600, difficulty: 'GRINDER' },
  { id: 'gr-6', title: 'Slope Recovery Mastery', category: 'STRATÉGIE', focus: 'Technique', description: 'Gérer les dénivelés.', theory: 'Épaules parallèles à la pente.', steps: ['Setup pente', 'Swing 3/4'], duration: 900, difficulty: 'GRINDER' },
  { id: 'gr-7', title: '7-Iron Distance Control', category: 'SCORING ZONE', focus: 'Dosage', description: 'Faire des distances variées avec le même club.', theory: 'L\'élasticité du swing.', steps: ['50m', '80m', '120m'], duration: 1200, difficulty: 'GRINDER' },
  { id: 'gr-8', title: 'Breath Control Pressure', category: 'MENTAL', focus: 'Stress', description: 'Swing après effort cardio.', theory: 'Gérer l\'adrénaline.', steps: ['10 secondes sprint', 'Swing immédiat'], duration: 600, difficulty: 'GRINDER' },

  // CHALLENGER (Goal: ~20 total)
  { id: 'ch-4', title: 'Inside-Out Path Lock', category: 'BIOMÉCANIQUE', focus: 'Draw', description: 'Forcer un chemin intérieur-extérieur.', theory: 'Éliminer le slice.', steps: ['Obstacle extérieur', 'Traversée propre'], duration: 1200, difficulty: 'CHALLENGER' },
  { id: 'ch-5', title: 'Apex Height Challenge', category: 'BIOMÉCANIQUE', focus: 'Trajectoire', description: 'Contrôler le point culminant.', theory: 'Gérer le vent par la hauteur.', steps: ['3 balles basses', '3 balles hautes'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'ch-6', title: 'Blind Target Putting', category: 'SCORING ZONE', focus: 'Sensation', description: 'Putter en regardant le trou.', theory: 'Reconnexion instinct/corps.', steps: ['Focus sur le trou', 'Balance fluide'], duration: 600, difficulty: 'CHALLENGER' },
  { id: 'ch-7', title: 'Strategic Club Choice', category: 'STRATÉGIE', focus: 'Gestion', description: 'Jouer un trou virtuellement.', theory: 'L\'attaque par zones.', steps: ['Choix club A/B', 'Justification'], duration: 600, difficulty: 'CHALLENGER' },
  { id: 'ch-8', title: 'Mental Reset Trigger', category: 'MENTAL', focus: 'Résilience', description: 'Ancre physique de calme.', theory: 'Conditionnement pavlovien.', steps: ['Geste unique', 'Focus immédiat'], duration: 300, difficulty: 'CHALLENGER' },

  // TOUR PRO (Goal: ~20 total)
  { id: 'tp-4', title: 'Ball Speed Max-Out', category: 'BIOMÉCANIQUE', focus: 'Vitesse', description: 'Optimisation de la rotation hanches.', theory: 'Séquençage cinétique élite.', steps: ['Dissociation max', 'Release explosif'], duration: 1500, difficulty: 'TOUR PRO' },
  { id: 'tp-5', title: 'Fade Precision Control', category: 'FUN', focus: 'Courbe', description: 'Fade de 2m constant.', theory: 'Le coup le plus stable sous pression.', steps: ['Face square', 'Chemin légèrement out-in'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'tp-6', title: 'Micro-Green Mapping', category: 'SCORING ZONE', focus: 'Lecture', description: 'Identifier le grain de l\'herbe.', theory: 'Frottement et influence grain.', steps: ['Audit brillance herbe', 'Test roule'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'tp-7', title: 'High-Pressure Simulation', category: 'MENTAL', focus: 'Compétition', description: 'Un seul coup, une seule chance.', theory: 'La pression du dimanche.', steps: ['Repos long', 'Focus laser', 'Un seul drive'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'tp-8', title: 'Wind Vector Mapping', category: 'STRATÉGIE', focus: 'Balistique', description: 'Calculer le vent en couches.', theory: 'Aérodynamisme avancé.', steps: ['Analyse vent sol/air', 'Clubbing ajusté'], duration: 900, difficulty: 'TOUR PRO' },

  // --- ARENA LEVEL EXPANSION 3 (Finalizing 20+ per level) ---
  // NEW GEN
  { id: 'ng-9', title: 'Club Face Mirror', category: 'ESSENTIELS', focus: 'Alignement', description: 'Vérifier l angle de face au miroir.', theory: 'La face square garantit la ligne.', steps: ['Adresse miroir', 'Check angle face'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'ng-10', title: 'Tempo Rhythm 1:3', category: 'WARMUP', focus: 'Tempo', description: '1 pour la montée, 3 pour la redescente.', theory: 'Le ratio d or du swing.', steps: ['Compte lent', 'Shadow swing'], duration: 300, difficulty: 'NEW GEN' },
  { id: 'ng-11', title: 'Ball Mark Precision', category: 'SCORING ZONE', focus: 'Putting', description: 'Marquer sa balle toujours de la même façon.', theory: 'La routine commence au marquage.', steps: ['Outil marquage', 'Alignement cible'], duration: 180, difficulty: 'NEW GEN' },
  { id: 'ng-12', title: 'Posture Stability Hold', category: 'ESSENTIELS', focus: 'Stabilité', description: 'Maintenir la posture sans club pendant 1min.', theory: 'Musclage de la base.', steps: ['Flexion hanches', 'Maintien statique'], duration: 120, difficulty: 'NEW GEN' },
  { id: 'ng-13', title: 'Target Awareness', category: 'STRATÉGIE', focus: 'Vision', description: 'Identifier 3 dangers sur le practice.', theory: 'Connaissance spatiale.', steps: ['Scan visuel', 'Nommer les dangers'], duration: 240, difficulty: 'NEW GEN' },

  // GRINDER
  { id: 'gr-9', title: 'X-Factor Tension', category: 'BIOMÉCANIQUE', focus: 'Puissance', description: 'Isoler la rotation du buste.', theory: 'Le moteur de la distance.', steps: ['Bassin bloqué', 'Rotation max buste'], duration: 600, difficulty: 'GRINDER' },
  { id: 'gr-10', title: 'Impact Spray Audit', category: 'ESSENTIELS', focus: 'Centrage', description: 'Utiliser du spray pour vérifier l impact.', theory: 'Le smash factor commence au centre.', steps: ['Spray face', 'Frappe centre'], duration: 600, difficulty: 'GRINDER' },
  { id: 'gr-11', title: 'Slope Putting Read', category: 'SCORING ZONE', focus: 'Lecture', description: 'Putter sur un green à forte pente.', theory: 'Gérer la gravité.', steps: ['Lecture apex', 'Visée déportée'], duration: 900, difficulty: 'GRINDER' },
  { id: 'gr-12', title: 'Pre-Shot Routine Lock', category: 'MENTAL', focus: 'Consistance', description: 'Chronometrer sa routine.', theory: 'La répétitivité temporelle.', steps: ['Déclenchement chrono', 'Exécution'], duration: 450, difficulty: 'GRINDER' },
  { id: 'gr-13', title: 'Fairway Bunker Safety', category: 'STRATÉGIE', focus: 'Sortie', description: 'Sortir de bunker long sans danger.', theory: 'Prendre plus de club, swing plus court.', steps: ['Club +1', 'Swing 3/4'], duration: 900, difficulty: 'GRINDER' },

  // CHALLENGER
  { id: 'ch-9', title: 'Shaping Challenge : Low Fade', category: 'FUN', focus: 'Trajectoire', description: 'Fade à hauteur de genou.', theory: 'Maîtrise du vent de face.', steps: ['Balle arrière', 'Check out-in'], duration: 1200, difficulty: 'CHALLENGER' },
  { id: 'ch-10', title: 'Pressure Bunker 5', category: 'SCORING ZONE', focus: 'Sable', description: 'Sortir 5 balles à moins de 2m.', theory: 'Précision sous tension.', steps: ['Cible réduite', 'Succession'], duration: 1500, difficulty: 'CHALLENGER' },
  { id: 'ch-11', title: 'Swing Transition Click', category: 'BIOMÉCANIQUE', focus: 'Tempo', description: 'Sentir le "clic" en haut.', theory: 'Transition fluide sans précipitation.', steps: ['Pause 1s au sommet', 'Démarrage bas'], duration: 900, difficulty: 'CHALLENGER' },
  { id: 'ch-12', title: 'Wind Vector Calculation', category: 'STRATÉGIE', focus: 'Balistique', description: 'Calculer l effet du vent latéral.', theory: 'Vecteurs et portées.', steps: ['Observation feuilles', 'Ajustement visée'], duration: 600, difficulty: 'CHALLENGER' },
  { id: 'ch-13', title: 'Mental Resilience Audit', category: 'MENTAL', focus: 'Acceptation', description: 'Jouer après avoir simulé un triple.', theory: 'Gestion émotionnelle radicale.', steps: ['Ancrage reset', 'Focus coup suivant'], duration: 300, difficulty: 'CHALLENGER' },

  // TOUR PRO
  { id: 'tp-9', title: 'Smash Factor Max-Out', category: 'BIOMÉCANIQUE', focus: 'Efficacité', description: 'Atteindre 1.50 au driver.', theory: 'Efficience de transfert totale.', steps: ['Vitesse club', 'Vitesse balle'], duration: 1800, difficulty: 'TOUR PRO' },
  { id: 'tp-10', title: 'Stinger Draw mastery', category: 'FUN', focus: 'Effet', description: 'Balle basse avec effet gauche.', theory: 'Le coup le plus technique du sac.', steps: ['Fermeture face dynamique', 'Plan flat'], duration: 1200, difficulty: 'TOUR PRO' },
  { id: 'tp-11', title: 'Micro-Step Putting', category: 'SCORING ZONE', focus: 'Toucher', description: 'Putts de 50cm à 50cm.', theory: 'Maîtrise millimétrée de l énergie.', steps: ['Série de 10 paliers', 'Distance exacte'], duration: 900, difficulty: 'TOUR PRO' },
  { id: 'tp-12', title: 'Competitive Stress Flow', category: 'MENTAL', focus: 'Zone', description: 'Swing avec rythme cardiaque 140 bpm.', theory: 'Flow sous adrénaline.', steps: ['Burpees', 'Swing immédiat'], duration: 600, difficulty: 'TOUR PRO' },
  { id: 'tp-13', title: 'Strategic Green Entry', category: 'STRATÉGIE', focus: 'Scoring', description: 'Viser la zone de putt la plus facile.', theory: 'Pas le drapeau, mais le putt en montée.', steps: ['Analyse pentes', 'Cible de chute'], duration: 900, difficulty: 'TOUR PRO' }
];

export const BASE_CATALOG = ACADEMY_CATALOG;
