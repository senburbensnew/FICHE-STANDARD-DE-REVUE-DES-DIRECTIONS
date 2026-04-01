require('dotenv').config()
const mongoose = require('mongoose')
const Fiche = require('./models/Fiche')

// ── Helpers ────────────────────────────────────────────────────────────────
const pick = (...args) => args[Math.floor(Math.random() * args.length)]
const pickN = (n, ...args) => Array.from({ length: n }, () => pick(...args)).join('\n- ')
const num = (min, max) => String(Math.floor(Math.random() * (max - min + 1)) + min)

// ── Directions avec données de base ────────────────────────────────────────
const DIRECTIONS = [
  { nom: 'Direction du Budget',                                    responsable: 'Jean-Baptiste Pierre',    effectifTheo: 85,  effectifDisp: 72 },
  { nom: 'Direction Générale des Impôts (DGI)',                   responsable: 'Marie Claire Joseph',     effectifTheo: 210, effectifDisp: 188 },
  { nom: 'Direction Générale des Douanes (AGD)',                  responsable: 'Réginald Préval',         effectifTheo: 175, effectifDisp: 142 },
  { nom: 'Direction du Trésor',                                   responsable: 'Sophonie Dubuisson',      effectifTheo: 60,  effectifDisp: 55 },
  { nom: 'Direction de la Comptabilité Publique et du Contrôle Budgétaire (DPCB)', responsable: 'Edwige Moreau', effectifTheo: 48, effectifDisp: 41 },
  { nom: 'Direction des Ressources Humaines',                     responsable: 'Carline Augustin',        effectifTheo: 35,  effectifDisp: 30 },
  { nom: 'Direction Administrative',                              responsable: 'Frantz Métellus',         effectifTheo: 42,  effectifDisp: 38 },
  { nom: 'Direction des Technologies de l\'Information et de la Communication (DTIC)', responsable: 'Samuel Dorismond', effectifTheo: 28, effectifDisp: 22 },
  { nom: 'Unité d\'Études et de Programmation (UEP)',             responsable: 'Claudette Beaumont',      effectifTheo: 20,  effectifDisp: 18 },
  { nom: 'Direction des Investissements Publics (DIP)',           responsable: 'Hervé Saint-Louis',       effectifTheo: 38,  effectifDisp: 31 },
  { nom: 'Direction de la Coopération Externe (DCE)',             responsable: 'Nadège Hyppolite',        effectifTheo: 25,  effectifDisp: 21 },
  { nom: 'Direction des Affaires Juridiques',                     responsable: 'Micheline Ollivier',      effectifTheo: 18,  effectifDisp: 16 },
]

// ── Périodes (12 derniers mois) ─────────────────────────────────────────────
const PERIODES = [
  { label: 'Mai 2025',    date: new Date('2025-05-28'), created: new Date('2025-05-26') },
  { label: 'Juin 2025',   date: new Date('2025-06-25'), created: new Date('2025-06-23') },
  { label: 'Juillet 2025',date: new Date('2025-07-23'), created: new Date('2025-07-21') },
  { label: 'Août 2025',   date: new Date('2025-08-27'), created: new Date('2025-08-25') },
  { label: 'Septembre 2025', date: new Date('2025-09-24'), created: new Date('2025-09-22') },
  { label: 'Octobre 2025',date: new Date('2025-10-22'), created: new Date('2025-10-20') },
  { label: 'Novembre 2025',date: new Date('2025-11-26'), created: new Date('2025-11-24') },
  { label: 'Décembre 2025',date: new Date('2025-12-17'), created: new Date('2025-12-15') },
  { label: 'Janvier 2026',date: new Date('2026-01-29'), created: new Date('2026-01-27') },
  { label: 'Février 2026',date: new Date('2026-02-25'), created: new Date('2026-02-23') },
  { label: 'Mars 2026',   date: new Date('2026-03-26'), created: new Date('2026-03-24') },
]

function buildFiche(dir, periode) {
  const locauxOk  = dir.effectifDisp > 50 ? pick('Oui','Oui','Non') : pick('Oui','Non','Non')
  const rapOk     = dir.effectifTheo > 40 ? pick('Oui','Oui','Non') : pick('Oui','Non')
  const dispoVariance = Math.floor(dir.effectifDisp * (0.9 + Math.random() * 0.15))

  return {
    // I. Identification
    intituleDirection: dir.nom,
    responsable:       dir.responsable,
    fonction:          'Directeur(trice)',
    dateReunion:       periode.date.toISOString().split('T')[0],
    periodeCoverte:    periode.label,
    localisation:      pick('Port-au-Prince, Champ-de-Mars', 'Port-au-Prince, Bicentenaire', 'Port-au-Prince, Lalue', 'Port-au-Prince, Centre-Ville'),
    coordonneesTel:    `+509 ${num(2,4)}${num(800,999)}-${num(1000,9999)}`,
    adresseEmail:      `${dir.nom.split(' ')[1]?.toLowerCase() ?? 'contact'}@mef.gouv.ht`,

    // II. Mission
    missionPrincipale:       `Assurer la gestion, le contrôle et l'optimisation des ressources relevant de la ${dir.nom} conformément aux orientations stratégiques du MEF.`,
    principalesAttributions:  `- Élaboration et suivi du plan d'action annuel\n- Coordination avec les autres directions du MEF\n- Production des rapports périodiques\n- Gestion des ressources humaines et matérielles`,
    principauxServices:       `- Traitement des dossiers administratifs\n- Appui technique aux structures partenaires\n- Formation et renforcement de capacités\n- Contrôle et audit interne`,

    // III. Ressources humaines
    effectifTheorique:    String(dir.effectifTheo),
    effectifPoste:        String(Math.floor(dir.effectifTheo * 0.92)),
    effectifDisponible:   String(dispoVariance),
    repartitionPersonnel: `Cadres supérieurs : ${num(3,8)} | Cadres intermédiaires : ${num(5,15)} | Agents d'exécution : ${num(10,30)} | Personnel d'appui : ${num(2,6)}`,
    postesVacants:        String(dir.effectifTheo - Math.floor(dir.effectifTheo * 0.92)),
    besoinsPrioPersonnel: pick('Recrutement de 3 analystes financiers', 'Renforcement du service informatique', 'Recrutement d\'un juriste senior', 'Besoin urgent en comptables'),
    besoinsFormation:     pick('Gestion axée sur les résultats', 'Formation en gestion de projet', 'Renforcement en outils numériques', 'Formation en passation de marchés'),
    difficultesRH:        pick('Taux d\'absentéisme élevé en raison de l\'insécurité', 'Manque de motivation lié aux retards de salaire', 'Départ de personnel qualifié vers le secteur privé', 'Absence de plan de formation structuré'),

    // IV. Fonctionnement
    activitesRealisees:     `- Traitement de ${num(120,400)} dossiers au cours de la période\n- Organisation de ${num(2,5)} séances de travail internes\n- Participation aux réunions interministérielles`,
    activitesEnCours:       `- Révision du manuel de procédures\n- Mise à jour de la base de données\n- Préparation du rapport semestriel`,
    activitesNonRealisees:  pick('Audit interne reporté faute de ressources', 'Formation non tenue en raison de l\'instabilité', 'Aucune activité non réalisée ce trimestre', 'Atelier de planification reporté'),
    resultatsObtenus:       `${num(75,95)}% des objectifs du trimestre atteints. Amélioration notable du délai de traitement des dossiers.`,
    difficultesExecution:   pick('Coupures d\'électricité fréquentes', 'Instabilité politique affectant la mobilité du personnel', 'Rupture de stock de fournitures de bureau', 'Problèmes de connectivité internet récurrents'),

    // V. Locaux
    locauxAdaptes:       locauxOk,
    etatBatiments:       pick('Bon état général', 'État passable, quelques fissures à réparer', 'Bon état, nécessite des travaux de peinture', 'État dégradé, rénovation urgente requise'),
    niveauExiguite:       pick('Suffisant', 'Légèrement exigu', 'Exigu — partage de bureaux nécessaire', 'Très exigu, locaux inadaptés'),
    etatProprete:        pick('Propre et bien entretenu', 'Acceptable', 'Nettoyage insuffisant', 'Bon état de propreté'),
    signaletique:        pick('Signalétique claire et visible', 'Signalétique partielle', 'Absence de signalétique adéquate', 'Signalétique récemment mise à jour'),
    conditionsAccueil:   pick('Salle d\'attente disponible et fonctionnelle', 'Accueil correct mais manque de chaises', 'Conditions d\'accueil insuffisantes', 'Bon accueil, rénovation récente'),
    travauxPrioritaires: pick('Réfection de la toiture', 'Installation d\'un système de climatisation', 'Réparation des sanitaires', 'Aucun travaux prioritaire identifié'),

    // VI. Équipements
    mobilierBureau:         pick('Suffisant et en bon état', 'Partiellement dégradé, renouvellement nécessaire', 'Insuffisant pour l\'effectif actuel', 'Bon état général'),
    materielInformatique:   pick(`${num(10,40)} ordinateurs dont ${num(5,20)} fonctionnels`, `${num(5,15)} laptops et ${num(3,10)} imprimantes`, `Parc informatique vieillissant, majorité hors service`),
    etatOrdinateurs:        pick('Bon', 'Moyen — plusieurs appareils en panne', 'Mauvais — renouvellement urgent', 'Satisfaisant'),
    electricite:            pick('Réseau EDH stable + groupe électrogène', 'Réseau EDH défaillant, groupe électrogène disponible', 'Coupures fréquentes, pas de groupe électrogène', 'Groupe électrogène permanent'),
    internet:               pick('Connexion fibre optique stable', 'Connexion ADSL lente et instable', 'Pas de connexion internet fixe, usage de données mobiles', 'Connexion satisfaisante avec quelques interruptions'),
    vehicules:              pick(`${num(1,4)} véhicules de service opérationnels`, `${num(1,2)} véhicule(s) disponible(s), ${num(1,2)} en réparation`, 'Aucun véhicule attribué', `${num(2,5)} véhicules dont ${num(1,3)} fonctionnels`),
    autresEquipements:      pick('Photocopieur, scanner, projecteur disponibles', 'Équipements de bureau standard disponibles', 'Manque de matériel de reprographie', 'Climatiseurs dans les principaux bureaux'),
    insuffisancesMaterielles: pick('Manque de cartouches d\'encre et papier', 'Besoin urgent de renouvellement informatique', 'Absence de salle de réunion équipée', 'Insuffisance du réseau électrique'),

    // VII. Communication
    circulationInfo:            pick('Réunions hebdomadaires de coordination', 'Circulation via WhatsApp et courrier interne', 'Manque de canaux formels de communication', 'Intranet en cours de déploiement'),
    relationsAutresStructures:  pick('Bonne collaboration avec toutes les directions', 'Relations satisfaisantes avec la DRH et la DAF', 'Difficultés de coordination avec certaines unités', 'Partenariat actif avec structures externes'),
    outilsNumeriques:           pick('SIGFP, SYSDEP et outils Office', 'Suite Office, logiciels métier spécifiques', 'Usage limité aux outils Office de base', 'Déploiement en cours du système intégré'),
    proceduresDematerialisees:  pick('Suivi des dossiers via plateforme en ligne', 'Soumission électronique des rapports', 'Archivage numérique partiel', 'Aucune procédure dématérialisée à ce jour'),
    proceduresManuelles:        pick('Registres papier pour les archives', 'Traitement manuel des dossiers RH', 'Validation des bons de caisse en format papier', 'Courrier et circulation des notes en format papier'),
    besoinsDig:                 pick('Acquisition de logiciels de gestion documentaire', 'Déploiement d\'un ERP adapté', 'Formation en cybersécurité', 'Mise à niveau de l\'infrastructure réseau'),
    difficultesInternet:        pick('Bande passante insuffisante', 'Coupures fréquentes perturbant le travail', 'Coût élevé de la connectivité', 'Aucune difficulté majeure ce trimestre'),

    // VIII. Rapports
    rapportsPeriodiques:    rapOk,
    frequenceProduction:    pick('Mensuelle', 'Trimestrielle', 'Semestrielle', 'Mensuelle'),
    derniersRapports:       `Rapport ${pick('mensuel','trimestriel','semestriel')} de ${periode.label} soumis le ${num(1,28)}/${num(1,12)}/2025`,
    tableauxBord:           pick('Tableau de bord mensuel des indicateurs clés', 'Tableau de suivi des dossiers en cours', 'Pas de tableau de bord formalisé', 'Tableau de bord partagé avec la Direction Générale'),
    statistiquesDisponibles:pick('Statistiques de traitement des dossiers disponibles', 'Données de performance partiellement collectées', 'Base de données statistiques en cours de constitution', 'Rapports statistiques mensuels disponibles'),
    principauxLivrables:    `Rapport ${pick('mensuel','trimestriel')} d\'activités, note de synthèse, plan d\'action actualisé`,
    retardsRapports:        pick('Oui', 'Non', 'Non', 'Oui'),
    causesRapports:         pick('Manque de personnel pour la rédaction', 'Instabilité et insécurité', 'Aucun retard constaté', 'Difficultés de collecte des données'),

    // IX. Contraintes et besoins
    contrainte1: pick('Insécurité limitant les déplacements du personnel', 'Insuffisance des ressources financières', 'Retard dans le déblocage des fonds opérationnels'),
    contrainte2: pick('Coupures fréquentes d\'électricité et d\'internet', 'Départ de personnel qualifié non remplacé', 'Locaux insuffisants et dégradés'),
    contrainte3: pick('Absence d\'outils numériques adaptés', 'Lourdeurs administratives dans les procédures', 'Interférence politique dans la gestion'),
    besoin1: pick('Renforcement du budget de fonctionnement', 'Recrutement de ressources humaines qualifiées', 'Acquisition de matériel informatique'),
    besoin2: pick('Formation continue du personnel', 'Amélioration de la connectivité internet', 'Réhabilitation des locaux'),
    besoin3: pick('Appui à la dématérialisation des procédures', 'Acquisition de véhicules de service', 'Mise à disposition d\'un groupe électrogène'),
    besoin4: pick('Révision du cadre législatif et réglementaire', 'Appui technique d\'experts externes', 'Amélioration des conditions de travail'),
    besoin5: pick('Renforcement de la collaboration interministérielle', 'Mise en place d\'un système de gestion de la performance', 'Dotation en mobilier de bureau'),

    // X. Mesures correctives
    mesuresStructure:    pick('Réorganisation interne et redistribution des tâches', 'Mise en place de réunions de suivi hebdomadaires', 'Révision du plan d\'action trimestriel'),
    mesuresDG:           pick('Approbation du plan de recrutement urgent', 'Déblocage des fonds pour l\'acquisition de matériel', 'Arbitrage en faveur d\'une dotation budgétaire supplémentaire'),
    mesuresMinistre:     pick('Instruction pour la régularisation des postes vacants', 'Appui pour la négociation d\'un accord de formation', 'Décision sur la réhabilitation des locaux'),
    decisionsOuhaitees:  pick('Validation du plan de recrutement', 'Autorisation de démarrer les travaux de réhabilitation', 'Signature d\'un protocole de collaboration'),
    appuisAdmin:         pick('Appui pour l\'accélération des procédures de passation de marchés', 'Appui pour la simplification des procédures internes', 'Aucun appui administratif particulier requis'),
    appuisLogistiques:   pick('Mise à disposition de véhicules supplémentaires', 'Fourniture de matériel de bureau', 'Appui pour l\'installation du groupe électrogène'),
    appuisRH:            pick('Appui pour le recrutement de contractuels', 'Autorisation de détachement de personnel', 'Formation d\'urgence en gestion budgétaire'),
    appuisNumerique:     pick('Acquisition de licences logicielles', 'Déploiement d\'un réseau Wi-Fi sécurisé', 'Formation en cybersécurité et protection des données'),

    // XI. Signature
    observationsComplementaires: pick('Aucune observation complémentaire', 'La direction reste engagée malgré les difficultés conjoncturelles', 'Des progrès notables ont été réalisés au cours de cette période', 'La situation sécuritaire continue d\'impacter les activités'),
    nomResponsable:    dir.responsable,
    fonctionSignature: 'Directeur(trice)',
    date:              periode.date.toISOString().split('T')[0],
  }
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connecté à MongoDB')

  await Fiche.deleteMany({})
  console.log('Fiches existantes supprimées')

  const fiches = []

  for (const dir of DIRECTIONS) {
    // Not every direction submits every month — vary coverage
    const periodesDir = PERIODES.filter((_, i) => Math.random() > 0.2)
    for (const periode of periodesDir) {
      const fiche = buildFiche(dir, periode)
      fiches.push({ ...fiche, createdAt: periode.created, updatedAt: periode.created })
    }
  }

  // Use insertMany with timestamps disabled so we can set createdAt manually
  await Fiche.collection.insertMany(
    fiches.map(f => ({ ...f, createdAt: f.createdAt, updatedAt: f.updatedAt }))
  )
  console.log(`${fiches.length} fiches insérées pour ${DIRECTIONS.length} directions sur ${PERIODES.length} périodes`)
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
