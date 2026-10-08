# Polyglotte

Une application web pour apprendre **n'importe quelle langue**, du niveau **débutant (A1)** au niveau **senior (C2)**. Elle part des failles de Duolingo et les corrige une par une. On y apprend avec **Bao**, un petit panda qui est à la fois mascotte et **professeur IA à l'oral**.

> Analyse détaillée des failles de Duolingo et des choix produit : [`docs/ANALYSE-DUOLINGO.md`](docs/ANALYSE-DUOLINGO.md)

## Les grandes fonctions

- **Toutes les langues** : 45 langues au catalogue (européennes, asiatiques, africaines, créole, latin, espéranto…), plus n'importe quelle autre ajoutée par son nom.
- **Du débutant au senior** : un programme commun de 6 niveaux (A1 Débutant → C2 Senior) et 30 compétences « Je peux… ».
- **Leçons écrites à la main** pour le niveau A1 en anglais, espagnol, allemand, italien et portugais. Elles fonctionnent hors ligne.
- **Leçons générées par l'IA** pour tout le reste. La langue et le niveau sont imposés par le programme, puis le contenu est vérifié automatiquement. Une fois générée, une leçon est mise en cache et partagée par tous les apprenants.
- **Bao, professeur IA à l'oral** : on parle au micro (ou on écrit) dans la langue apprise. Bao répond à voix haute, corrige avec bienveillance (« Plus naturel : … ») et propose des idées de réponse. Un mode **mains libres** permet de converser sans toucher l'écran.
- **Bao, communication non verbale** : il apparaît sur chaque écran avec 12 expressions et gestes. Il fait coucou à l'accueil, réfléchit pendant une question, applaudit une bonne réponse, console après une erreur, lit pendant la grammaire, écoute pendant la dictée et dort quand il n'y a rien à faire.
- **Une interface qui progresse avec l'apprenant** :
  - Bao reçoit une nouvelle tenue à chaque niveau : pousse de bambou, écharpe, lunettes, béret, nœud papillon, chapeau de diplômé.
  - Le ciel de l'accueil et du jardin passe de l'aube à la nuit étoilée.
  - Les statistiques et les prévisions apparaissent quand elles deviennent utiles.
- **Bonus** :
  - Des bambous gagnés en apprenant vraiment : éléments ancrés, compétences validées, niveau terminé, objectif de la semaine, défi du jour.
  - Un coffre surprise chaque semaine.
  - Une boutique pour habiller Bao et décorer son jardin.
  - 18 trophées.
  - Des anecdotes culturelles débloquées en validant une compétence.

## Ce qui change par rapport à Duolingo

| Duolingo | Polyglotte |
|---|---|
| Vies / cœurs qui punissent les erreurs | Pas de vies : un élément raté revient un peu plus loin dans la session |
| Série quotidienne anxiogène | Objectif **hebdomadaire** : les jours de repos ne font rien perdre |
| Peu de pratique orale réelle | **Conversation orale avec un professeur IA** qui corrige et relance |
| Surtout de la reconnaissance (banque de mots) | Progression par élément : découverte → QCM → écoute → **rappel écrit** → dictée / oral |
| « Mauvaise réponse » sans explication | Diagnostic : accent, faute de frappe, article, ordre des mots, mot manquant ou en trop |
| Impossible de contester une correction | Bouton « Ma réponse était correcte » : la réponse est ajoutée aux réponses acceptées |
| Grammaire cachée | Fiche « Comprendre » par unité et note de grammaire affichée en cas d'erreur |
| Plafonne vers A2 / B1 | Programme complet jusqu'au **C2** |
| XP et ligues | Bambous liés à l'apprentissage réel, compétences « Je peux… », trophées |
| Parcours verrouillé | Toutes les unités sont ouvertes, avec un test « Je connais déjà » |
| Révisions opaques | Répétition espacée visible : éléments dus, prévision sur 7 jours |
| Compte obligatoire | Sans compte, hors ligne (PWA), progression exportable en JSON |

## Identité visuelle

Bleu nuit et blanc, dans l'esprit de Sceefer Vision : titres en serif (Cormorant Garamond), texte en Inter, filets fins, icônes au trait, carte d'accueil en dégradé bleu nuit. Les couleurs sont définies une seule fois dans `styles.css` (variables `--primary`, `--primary-deep`, `--accent`…) : il suffit d'y reporter les codes exacts de la charte. Un mode sombre bleu nuit s'active automatiquement selon le réglage de l'appareil.

## Lancer l'application

```bash
cd polyglotte
npm install
npm start                       # http://localhost:8080 (sans IA)
ANTHROPIC_API_KEY=sk-... npm start   # avec leçons générées et professeur IA
npm test                        # tests (Node ≥ 20)
```

**Sans clé d'API**, tout fonctionne sauf deux choses : les leçons non écrites à la main et la conversation avec Bao. Les langues marquées « A1 hors ligne » restent entièrement utilisables. L'interface explique clairement ce qui manque.

**Avec une clé d'API** (`ANTHROPIC_API_KEY`), le serveur appelle Claude (modèle `claude-opus-5-5`) :

- **Préparer une leçon** : un appel unique par langue et par unité. Le résultat est mis en cache dans `.cache/` et partagé par tous les apprenants. Il faut donc conserver ce dossier entre deux déploiements.
- **Converser avec Bao** : un appel court par réplique.
- **Limites par adresse IP** : 20 leçons par heure et 150 répliques par heure, réglables dans `server/index.mjs`.

**Mise en ligne** : il faut un hébergement Node.js qui garde un processus allumé (Render, Railway, Fly.io, un VPS…). La génération d'une leçon prend 30 à 90 secondes, ce qui dépasse les limites de durée des fonctions serverless classiques.

**Audio** : la voix de Bao et la dictée utilisent la synthèse vocale du navigateur. Le micro (exercices oraux, conversation) utilise la reconnaissance vocale, disponible dans Chrome et Edge. Sans elle, la conversation se fait à l'écrit.

## Structure

```
polyglotte/
├── index.html, styles.css, sw.js, manifest.webmanifest
├── server/
│   ├── index.mjs        # serveur HTTP : fichiers, /api/generate-unit, /api/tutor, cache, limites
│   └── claude.mjs       # prompts et appels à Claude (sorties JSON structurées)
├── src/
│   ├── main.js          # routeur et écrans : accueil, parcours, unité, langues, réglages
│   ├── session-view.js  # déroulé des exercices, réactions de Bao, bilan
│   ├── chat-view.js     # conversation orale avec Bao, le professeur IA
│   ├── bao-view.js      # boutique, jardin, évolution, trophées
│   ├── app-state.js     # état partagé, composants, calcul des bonus en fin d'activité
│   ├── panda.js         # Bao en SVG : 12 humeurs, 6 tenues, accessoires, jardin
│   ├── curriculum.js    # programme A1 → C2 (30 compétences)
│   ├── languages.js     # catalogue des langues
│   ├── course.js        # assemble programme + contenu écrit + contenu généré
│   ├── generator.js     # appel et validation des leçons générées
│   ├── tutor.js         # appel et validation des répliques du professeur
│   ├── rewards.js       # bambous, boutique, trophées, défi du jour
│   ├── answer.js        # vérification des réponses et diagnostic
│   ├── srs.js           # répétition espacée
│   ├── session.js       # construction des sessions
│   ├── progress.js      # objectif hebdomadaire, niveaux, statistiques
│   ├── storage.js, speech.js
│   └── data/            # A1 écrit à la main : es, en, de, it, pt
├── tests/               # 52 tests (node --test)
└── docs/ANALYSE-DUOLINGO.md
```

## Ajouter du contenu

Le programme commun est dans `src/curriculum.js`. Le contenu écrit à la main est dans `src/data/<langue>.js`, rangé par identifiant d'unité (`a1-1`, `b2-3`…). Une unité contient :

- `canDo` : la compétence visée (« Je peux… »)
- `grammar` : une fiche courte
- `items` : des phrases, avec leurs réponses alternatives (`alts`) et une `note` facultative affichée en cas d'erreur
- `dialogue` : les répliques du jeu de rôle (`who: 'you'` pour celles de l'apprenant)
- `fact` : l'anecdote culturelle débloquée en bonus

Pour ajouter une langue au catalogue, ajoutez une ligne dans `src/languages.js`. Pour lui écrire du contenu à la main, créez son fichier de données et déclarez-le dans `src/data/index.js` : le contenu écrit à la main est toujours prioritaire sur celui de l'IA. Le test `contenu : ids uniques…` vérifie que chaque réponse attendue est bien acceptée par le correcteur.
