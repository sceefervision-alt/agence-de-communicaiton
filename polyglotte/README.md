# Polyglotte

Une application web pour apprendre l'**espagnol** et l'**anglais** (pour les francophones). Elle part des failles de Duolingo et les corrige une par une.

> Analyse détaillée des failles de Duolingo et des choix produit : [`docs/ANALYSE-DUOLINGO.md`](docs/ANALYSE-DUOLINGO.md)

## Ce qui change par rapport à Duolingo

| Duolingo | Polyglotte |
|---|---|
| Vies / cœurs qui punissent les erreurs | Pas de vies : un élément raté revient un peu plus loin dans la session |
| Série quotidienne anxiogène | Objectif **hebdomadaire** : les jours de repos ne font rien perdre |
| Surtout de la reconnaissance (banque de mots) | Progression par élément : découverte → QCM → écoute → **rappel écrit** → dictée / oral |
| « Mauvaise réponse » sans explication | Diagnostic : accent, faute de frappe, article, ordre des mots, mot manquant ou en trop |
| Impossible de contester une correction | Bouton « Ma réponse était correcte » : la réponse est ajoutée aux réponses acceptées |
| Grammaire cachée | Fiche « Comprendre » par unité et note de grammaire affichée en cas d'erreur |
| Phrases hors contexte | Unités en situation (café, ville, marché…) avec dialogue et **jeu de rôle** |
| Parcours verrouillé | Toutes les unités sont ouvertes, avec un test « Je connais déjà » |
| Révisions opaques | Répétition espacée visible : éléments dus, prévision sur 7 jours |
| XP et ligues | Mots maîtrisés et compétences « Je peux… » validées |
| Compte obligatoire | Sans compte, hors ligne (PWA), progression exportable en JSON |

## Lancer l'application

Aucune dépendance et aucune étape de build : ce sont des modules ES natifs.

```bash
cd polyglotte
npm start          # sert l'app sur http://localhost:8080
npm test           # tests unitaires (Node ≥ 18, runner intégré)
```

Tout serveur statique fonctionne aussi, par exemple `python3 -m http.server 8080`. L'application peut être déployée telle quelle sur Netlify, GitHub Pages ou Vercel.

L'audio passe par les API du navigateur. La synthèse vocale fonctionne dans la plupart des navigateurs. La reconnaissance vocale (exercices oraux) fonctionne dans Chrome et Edge ; sinon, ces exercices sont simplement désactivés.

## Structure

```
polyglotte/
├── index.html, styles.css, sw.js, manifest.webmanifest
├── src/
│   ├── main.js        # interface : routeur, écrans, déroulé des sessions
│   ├── answer.js      # vérification des réponses et diagnostic des erreurs
│   ├── srs.js         # répétition espacée (variante SM-2)
│   ├── session.js     # construction des sessions, types d'exercices, jeu de rôle, test de niveau
│   ├── progress.js    # objectif hebdomadaire, statistiques, compétences « Je peux… »
│   ├── storage.js     # stockage local, export / import
│   ├── speech.js      # synthèse et reconnaissance vocales
│   └── data/          # contenus de cours (es.js, en.js)
├── tests/             # tests unitaires (node --test)
└── docs/ANALYSE-DUOLINGO.md
```

## Ajouter du contenu

Chaque cours est un simple fichier JS dans `src/data/`. Une unité contient :

- `canDo` : la compétence visée (« Je peux… »)
- `grammar` : une fiche courte
- `items` : des phrases, avec leurs réponses alternatives (`alts`) et une `note` facultative affichée en cas d'erreur
- `dialogue` : les répliques du jeu de rôle (`who: 'you'` pour celles de l'apprenant)

Pour ajouter une langue, créez un fichier sur ce modèle et déclarez-le dans `src/data/index.js`. Le test `contenu : ids uniques…` vérifie que chaque réponse attendue est bien acceptée par le correcteur.
