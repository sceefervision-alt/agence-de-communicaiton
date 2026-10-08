// Programme commun à toutes les langues, du niveau débutant (A1) au niveau
// « senior » (C2), aligné sur le Cadre européen commun de référence (CECR).
// Chaque niveau combine trois pistes : la vie quotidienne, « Pro & voyages »
// (les situations du voyageur d'affaires) et « Mon métier » (le vocabulaire
// du secteur de l'apprenant).
// Chaque unité décrit une compétence concrète (« Je peux… ») et un point de
// langue ; le contenu (phrases, dialogue) est soit écrit à la main
// (src/data/), soit généré par l'IA pour les autres langues.

export const LEVELS = [
  {
    id: 'a1',
    cefr: 'A1',
    name: 'Débutant',
    tagline: 'Se débrouiller dans les situations du quotidien',
    units: [
      { id: 'a1-1', title: 'Premiers contacts', canDo: 'Je peux saluer quelqu’un et me présenter.', focus: 'salutations, se présenter, le verbe être, tutoiement / vouvoiement' },
      { id: 'a1-2', title: 'Au café', canDo: 'Je peux commander à boire, à manger, et demander l’addition.', focus: 'commander poliment, genre des noms, articles' },
      { id: 'a1-3', title: 'En ville', canDo: 'Je peux demander mon chemin et comprendre une indication simple.', focus: 'demander où se trouve un lieu, il y a, directions' },
      { id: 'a1-4', title: 'Ma journée', canDo: 'Je peux décrire ma routine quotidienne.', focus: 'présent des verbes courants, l’heure, verbes pronominaux' },
      { id: 'a1-5', title: 'Au marché', canDo: 'Je peux acheter des produits et comprendre un prix.', focus: 'nombres 1-100, pluriel, quantités, demander un prix' },
      { id: 'a1-p1', track: 'pro', title: 'À l’aéroport', canDo: 'Je peux m’enregistrer, passer les contrôles et trouver ma porte d’embarquement.', focus: 'enregistrement, passeport, carte d’embarquement, bagage, porte, motif du voyage (affaires)' },
      { id: 'a1-p2', track: 'pro', title: 'Check-in à l’hôtel', canDo: 'Je peux arriver à l’hôtel pour un voyage d’affaires et demander l’essentiel.', focus: 'réservation au nom de, facture au nom de l’entreprise, wifi, petit-déjeuner, heure de départ' },
      { id: 'a1-p3', track: 'pro', title: 'Se présenter au travail', canDo: 'Je peux dire mon nom, mon poste, mon entreprise et mon secteur.', focus: 'poste, entreprise, secteur, carte de visite, « je travaille pour / dans »' },
      { id: 'a1-m', track: 'metier', title: 'Mon métier', canDo: 'Je peux nommer les objets, lieux et actions de base de mon métier.', focus: 'vocabulaire professionnel du secteur de l’apprenant, niveau adapté' },
    ],
  },
  {
    id: 'a2',
    cefr: 'A2',
    name: 'Élémentaire',
    tagline: 'Voyager, raconter simplement, parler de soi',
    units: [
      { id: 'a2-1', title: 'En voyage', canDo: 'Je peux réserver un hôtel et acheter un billet de transport.', focus: 'réservations, dates, transports, questions polies' },
      { id: 'a2-2', title: 'Mon week-end', canDo: 'Je peux raconter ce que j’ai fait le week-end dernier.', focus: 'passé simple / passé composé selon la langue, marqueurs de temps' },
      { id: 'a2-3', title: 'Chez le médecin', canDo: 'Je peux expliquer où j’ai mal et comprendre un conseil.', focus: 'parties du corps, symptômes, avoir mal, impératif simple' },
      { id: 'a2-4', title: 'Chez moi', canDo: 'Je peux décrire mon logement et mon quartier.', focus: 'pièces, meubles, prépositions de lieu, adjectifs' },
      { id: 'a2-5', title: 'Mes projets', canDo: 'Je peux parler de mes projets pour les prochains jours.', focus: 'futur proche, intentions, invitations, accepter / refuser' },
      { id: 'a2-p1', track: 'pro', title: 'Taxi et rendez-vous client', canDo: 'Je peux me rendre chez un client, prévenir d’un retard et demander un reçu.', focus: 'adresse, durée du trajet, retard, reçu / note de frais, paiement' },
      { id: 'a2-p2', track: 'pro', title: 'Au téléphone', canDo: 'Je peux prendre un rendez-vous, laisser un message et épeler mon nom.', focus: 'appeler, rappeler, laisser un message, épeler, disponibilités, date et heure' },
      { id: 'a2-p3', track: 'pro', title: 'Accueillir un visiteur', canDo: 'Je peux accueillir quelqu’un dans mes locaux et lui présenter l’équipe.', focus: 'badge, salle de réunion, présentations, proposer un café, faire visiter' },
      { id: 'a2-m', track: 'metier', title: 'Mon métier', canDo: 'Je peux décrire mes tâches quotidiennes et mes outils de travail.', focus: 'vocabulaire professionnel du secteur de l’apprenant, niveau adapté' },
    ],
  },
  {
    id: 'b1',
    cefr: 'B1',
    name: 'Intermédiaire',
    tagline: 'Raconter, donner son avis, gérer l’imprévu',
    units: [
      { id: 'b1-1', title: 'Raconter une histoire', canDo: 'Je peux raconter une expérience passée avec des détails.', focus: 'temps du passé (récit vs description), connecteurs chronologiques' },
      { id: 'b1-2', title: 'Donner son avis', canDo: 'Je peux exprimer et justifier mon opinion.', focus: 'expressions d’opinion, accord / désaccord, parce que, donc' },
      { id: 'b1-3', title: 'Au travail', canDo: 'Je peux me présenter en entretien et parler de mon expérience.', focus: 'vocabulaire professionnel, compétences, depuis / pendant' },
      { id: 'b1-4', title: 'Culture et loisirs', canDo: 'Je peux parler d’un film, d’un livre ou d’un concert.', focus: 'goûts, recommandations, comparatifs et superlatifs' },
      { id: 'b1-5', title: 'Résoudre un problème', canDo: 'Je peux faire une réclamation et trouver une solution.', focus: 'se plaindre poliment, conditionnel de politesse, demandes' },
      { id: 'b1-p1', track: 'pro', title: 'Salon et réseautage', canDo: 'Je peux engager la conversation sur un salon professionnel et créer un contact.', focus: 'small talk, présenter son activité, échanger ses coordonnées, proposer un suivi' },
      { id: 'b1-p2', track: 'pro', title: 'E-mails professionnels', canDo: 'Je peux écrire un e-mail clair pour confirmer, relancer ou demander une information.', focus: 'formules d’ouverture et de clôture, pièce jointe, relance polie, confirmation' },
      { id: 'b1-p3', track: 'pro', title: 'Dîner d’affaires', canDo: 'Je peux inviter, commander et animer la conversation lors d’un repas d’affaires.', focus: 'inviter, recommander un plat, sujets de conversation, remercier, régler l’addition' },
      { id: 'b1-m', track: 'metier', title: 'Mon métier', canDo: 'Je peux expliquer un processus ou un projet de mon domaine.', focus: 'vocabulaire professionnel du secteur de l’apprenant, niveau adapté' },
    ],
  },
  {
    id: 'b2',
    cefr: 'B2',
    name: 'Avancé',
    tagline: 'Argumenter, négocier, comprendre l’actualité',
    units: [
      { id: 'b2-1', title: 'Débattre', canDo: 'Je peux défendre un point de vue et répondre à des objections.', focus: 'concession, opposition, nuance (bien que, cependant)' },
      { id: 'b2-2', title: 'L’actualité', canDo: 'Je peux résumer et commenter une information.', focus: 'discours rapporté, voix passive, vocabulaire des médias' },
      { id: 'b2-3', title: 'Négocier', canDo: 'Je peux négocier un prix, un délai ou un compromis.', focus: 'propositions, conditions, subjonctif / formes de souhait' },
      { id: 'b2-4', title: 'Et si… ?', canDo: 'Je peux formuler des hypothèses et imaginer des scénarios.', focus: 'phrases conditionnelles (réel, potentiel, irréel)' },
      { id: 'b2-5', title: 'En réunion', canDo: 'Je peux participer activement à une réunion professionnelle.', focus: 'prendre la parole, reformuler, proposer, conclure' },
      { id: 'b2-p1', track: 'pro', title: 'Présenter son entreprise', canDo: 'Je peux présenter mon entreprise, ses chiffres clés et sa valeur ajoutée.', focus: 'chiffres, croissance, clients, produits et services, avantage concurrentiel' },
      { id: 'b2-p2', track: 'pro', title: 'Visioconférence', canDo: 'Je peux animer une réunion à distance et gérer les problèmes techniques.', focus: 'ordre du jour, partage d’écran, micro coupé, connexion, tour de table, compte rendu' },
      { id: 'b2-p3', track: 'pro', title: 'Imprévus en voyage', canDo: 'Je peux gérer un vol annulé, un bagage perdu ou un changement de réservation.', focus: 'annulation, correspondance, réclamation, indemnisation, assurance, solution alternative' },
      { id: 'b2-m', track: 'metier', title: 'Mon métier', canDo: 'Je peux discuter des enjeux et des tendances de mon secteur.', focus: 'vocabulaire professionnel du secteur de l’apprenant, niveau adapté' },
    ],
  },
  {
    id: 'c1',
    cefr: 'C1',
    name: 'Expert',
    tagline: 'S’exprimer avec aisance et précision',
    units: [
      { id: 'c1-1', title: 'L’art de la nuance', canDo: 'Je peux exprimer des idées complexes avec précision et nuance.', focus: 'modalisateurs, atténuation, vocabulaire abstrait' },
      { id: 'c1-2', title: 'Les registres', canDo: 'Je peux passer du registre familier au registre soutenu.', focus: 'familier / courant / soutenu, formules écrites et orales' },
      { id: 'c1-3', title: 'Argumenter par écrit', canDo: 'Je peux rédiger un texte argumenté et structuré.', focus: 'articulateurs logiques, structure d’un argumentaire' },
      { id: 'c1-4', title: 'Expressions idiomatiques', canDo: 'Je peux comprendre et utiliser des expressions imagées courantes.', focus: 'idiomes, proverbes, sens figuré' },
      { id: 'c1-5', title: 'Présenter un projet', canDo: 'Je peux présenter un projet de façon convaincante.', focus: 'présentation orale, persuasion, gérer les questions' },
      { id: 'c1-p1', track: 'pro', title: 'Pitch et persuasion', canDo: 'Je peux faire un pitch convaincant et répondre aux objections.', focus: 'accroche, problème / solution, preuves, objections, appel à l’action' },
      { id: 'c1-p2', track: 'pro', title: 'Contrats et conditions', canDo: 'Je peux discuter des termes d’un contrat avec précision.', focus: 'délais, pénalités, clauses, conditions de paiement, résiliation, signature' },
      { id: 'c1-p3', track: 'pro', title: 'Codes interculturels', canDo: 'Je peux adapter ma communication aux codes professionnels du pays.', focus: 'politesse, hiérarchie, ponctualité, gestes, sujets à éviter, façons de dire non' },
      { id: 'c1-m', track: 'metier', title: 'Mon métier', canDo: 'Je peux débattre de sujets techniques de mon domaine avec des experts.', focus: 'vocabulaire professionnel du secteur de l’apprenant, niveau adapté' },
    ],
  },
  {
    id: 'c2',
    cefr: 'C2',
    name: 'Senior',
    tagline: 'Parler comme un natif cultivé',
    units: [
      { id: 'c2-1', title: 'Humour et sous-entendus', canDo: 'Je peux saisir l’ironie, l’humour et les sous-entendus.', focus: 'ironie, jeux de mots, implicite culturel' },
      { id: 'c2-2', title: 'Littérature', canDo: 'Je peux apprécier et commenter un extrait littéraire.', focus: 'style, figures de style, temps littéraires' },
      { id: 'c2-3', title: 'Rhétorique', canDo: 'Je peux construire un discours percutant.', focus: 'procédés rhétoriques, rythme, formules marquantes' },
      { id: 'c2-4', title: 'Langue de spécialité', canDo: 'Je peux discuter d’un sujet technique dans mon domaine.', focus: 'terminologie spécialisée, définitions, précision' },
      { id: 'c2-5', title: 'Comme un natif', canDo: 'Je peux utiliser l’argot, les expressions régionales et les tournures naturelles.', focus: 'argot, variantes régionales, langue parlée authentique' },
      { id: 'c2-p1', track: 'pro', title: 'Négociation de haut niveau', canDo: 'Je peux mener une négociation complexe et obtenir un accord.', focus: 'ancrage, concessions, contreparties, reformulation, sortie de crise' },
      { id: 'c2-p2', track: 'pro', title: 'Conférence et keynote', canDo: 'Je peux intervenir en conférence et répondre aux questions du public.', focus: 'structure d’un discours, transitions, humour, questions-réponses' },
      { id: 'c2-p3', track: 'pro', title: 'Diriger une équipe internationale', canDo: 'Je peux motiver, donner du feedback et gérer un conflit dans une équipe internationale.', focus: 'feedback, délégation, motivation, désaccord, médiation' },
      { id: 'c2-m', track: 'metier', title: 'Mon métier', canDo: 'Je peux maîtriser le jargon et les nuances de mon métier comme un natif.', focus: 'vocabulaire professionnel du secteur de l’apprenant, niveau adapté' },
    ],
  },
];

export const ALL_UNITS = LEVELS.flatMap((level, li) => level.units.map((u, ui) => ({ ...u, levelId: level.id, levelIndex: li, index: ui })));

export function findUnit(unitId) {
  return ALL_UNITS.find((u) => u.id === unitId) ?? null;
}

export function findLevel(levelId) {
  return LEVELS.find((l) => l.id === levelId) ?? null;
}

export const TRACKS = {
  daily: { name: 'Vie quotidienne' },
  pro: { name: 'Pro & voyages' },
  metier: { name: 'Mon métier' },
};

export const trackOf = (unit) => unit.track ?? 'daily';

// Un niveau est terminé quand les trois quarts de ses compétences sont validées.
export const levelThreshold = (count) => Math.ceil(count * 0.75);

export const SECTORS = [
  { id: 'commerce', name: 'Commerce et vente' },
  { id: 'tech', name: 'Tech et numérique' },
  { id: 'sante', name: 'Santé' },
  { id: 'finance', name: 'Finance et banque' },
  { id: 'industrie', name: 'Industrie et ingénierie' },
  { id: 'tourisme', name: 'Tourisme et hôtellerie' },
  { id: 'juridique', name: 'Juridique' },
  { id: 'marketing', name: 'Marketing et communication' },
  { id: 'immobilier', name: 'BTP et immobilier' },
  { id: 'logistique', name: 'Logistique et transport' },
  { id: 'education', name: 'Éducation et formation' },
  { id: 'agro', name: 'Agriculture et agroalimentaire' },
  { id: 'energie', name: 'Énergie et environnement' },
  { id: 'rh', name: 'Ressources humaines' },
  { id: 'art', name: 'Arts, mode et design' },
  { id: 'public', name: 'Secteur public et ONG' },
];

export const GOALS = [
  { id: 'travel', name: 'Voyager pour le travail' },
  { id: 'clients', name: 'Échanger avec des clients et partenaires' },
  { id: 'expat', name: 'M’installer à l’étranger' },
  { id: 'career', name: 'Booster ma carrière' },
  { id: 'culture', name: 'Le plaisir et la culture' },
];

export const findSector = (id) => SECTORS.find((s) => s.id === id) ?? null;
export const findGoal = (id) => GOALS.find((g) => g.id === id) ?? null;
