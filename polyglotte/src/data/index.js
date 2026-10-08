// Contenus écrits à la main pour les francophones, indexés par langue puis
// par unité du programme : niveau A1 (quotidien + pro) pour cinq langues,
// niveaux A2 et B1 pour l'anglais, l'espagnol et le portugais.
import es from './es.js';
import en from './en.js';
import de from './de.js';
import it from './it.js';
import pt from './pt.js';
import pro from './pro-a1.js';
import enMore from './en-a2-b1.js';
import esMore from './es-a2-b1.js';
import ptMore from './pt-a2-b1.js';

const MORE = { en: enMore, es: esMore, pt: ptMore };

const merge = (lang, base) => ({ units: [...base.units, ...(pro[lang] ?? []), ...(MORE[lang] ?? [])] });

export const CURATED = { es: merge('es', es), en: merge('en', en), de: merge('de', de), it: merge('it', it), pt: merge('pt', pt) };
