// Programme commun à toutes les langues, du niveau débutant (A1) au niveau
// « senior » (C2), aligné sur le Cadre européen commun de référence (CECR).
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
