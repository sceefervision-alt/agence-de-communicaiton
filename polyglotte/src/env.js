// Mode « aperçu » : l'application servie sans son serveur (page statique).
// Les fonctions d'IA sont alors présentées comme indisponibles, sans appel réseau.
export const STATIC = Boolean(globalThis.POLYGLOTTE_STATIC);
