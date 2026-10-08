// Contenus écrits à la main, indexés par langue puis par unité du programme.
import es from './es.js';
import en from './en.js';
import de from './de.js';
import it from './it.js';
import pt from './pt.js';
import pro from './pro-a1.js';

const withPro = (lang, base) => ({ units: [...base.units, ...(pro[lang] ?? [])] });

export const CURATED = { es: withPro('es', es), en: withPro('en', en), de: withPro('de', de), it: withPro('it', it), pt: withPro('pt', pt) };
