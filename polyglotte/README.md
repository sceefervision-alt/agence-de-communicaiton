# Polyglotte

Une application web pour apprendre **n'importe quelle langue**, du niveau **débutant (A1)** au niveau **senior (C2)**. Elle est pensée pour les **professionnels qui voyagent** et part des failles de Duolingo pour les corriger une par une. On y apprend avec **Bao**, un panda en 3D façon dessin animé, qui est à la fois mascotte et **professeur IA à l'oral**.

> Analyse détaillée des failles de Duolingo et des choix produit : [`docs/ANALYSE-DUOLINGO.md`](docs/ANALYSE-DUOLINGO.md)

## Les grandes fonctions

- **Toutes les langues** : 46 langues au catalogue (européennes dont le français, asiatiques, africaines, créole, latin, espéranto…), plus n'importe quelle autre ajoutée par son nom.
- **Dans la langue de l'apprenant, selon son pays** : au premier lancement, la langue de base (interface, traductions, explications de grammaire, corrections de Bao) est choisie automatiquement d'après le pays de l'apprenant. Un Ivoirien ou un Belge francophone a l'application en français, un Nigérian en anglais, un Brésilien en portugais, un Marocain en arabe (de droite à gauche). Elle reste modifiable à l'accueil (« Je parle ») et dans les réglages.
- **Du débutant au senior** : un programme commun de 6 niveaux (A1 Débutant → C2 Senior) et 54 compétences « Je peux… », réparties en trois pistes à chaque niveau :
  - **Vie quotidienne** : se présenter, café, ville, journée, marché…
  - **Pro & voyages** : aéroport, hôtel en déplacement, se présenter au travail, téléphone, salons, e-mails, dîners d'affaires, visioconférence, contrats, négociation, conférence…
  - **Mon métier** : le vocabulaire du secteur choisi par l'apprenant (16 secteurs : tech, santé, finance, commerce, industrie, juridique…).
- **Accueil personnalisé** : à la première ouverture, Bao demande la langue, le secteur professionnel et l'objectif de l'apprenant. Le secteur personnalise les leçons « Mon métier » et les conversations.
- **Leçons écrites à la main** pour les francophones (vie quotidienne et Pro & voyages) : niveaux A1, A2 et B1 en anglais, espagnol et portugais du Brésil ; niveau A1 en allemand et italien. Elles fonctionnent hors ligne et sans IA.
- **Conversation guidée avec Bao, sans IA** : dans la version gratuite (ou sans clé d'API), Bao joue le dialogue de la leçon, comprend les réponses libres proches de l'attendu, corrige et souffle des idées.
- **Leçons générées par l'IA** pour tout le reste, rédigées dans la langue de base de l'apprenant. La langue, le niveau et la langue de base sont imposés par le programme, puis le contenu est vérifié automatiquement. Une fois générée, une leçon est mise en cache et partagée par tous les apprenants de même langue de base.
- **Bao, professeur IA à l'oral** : on parle au micro (ou on écrit) dans la langue apprise. Bao répond à voix haute, corrige avec bienveillance (« Plus naturel : … ») et propose des idées de réponse. Un mode **mains libres** permet de converser sans toucher l'écran.
- **3D façon dessin animé (cel-shading)** : Bao, son jardin, les coffres et les cadeaux sont en 3D temps réel (Three.js), avec un ombrage en aplats et des contours encrés, comme dans les jeux Naruto Storm ou les animations de Duolingo. Bao respire, cligne des yeux, suit le curseur du regard et sautille quand on le touche.
- **Animation d'ouverture** : les bambous poussent, Bao tombe du ciel, rebondit et salue, puis le logo apparaît.
- **Bao, communication non verbale** : il apparaît sur chaque écran avec 12 expressions et gestes. Il fait coucou à l'accueil, réfléchit pendant une question, applaudit une bonne réponse, console après une erreur, lit pendant la grammaire, écoute pendant la dictée et dort quand il n'y a rien à faire.
- **Une interface qui progresse avec l'apprenant** :
  - Bao reçoit une nouvelle tenue à chaque niveau : pousse de bambou, écharpe, lunettes, béret, nœud papillon, chapeau de diplômé.
  - Le ciel de l'accueil et du jardin passe de l'aube à la nuit étoilée.
  - Les statistiques et les prévisions apparaissent quand elles deviennent utiles.
- **Bonus** :
  - Des bambous gagnés en apprenant vraiment : éléments ancrés, compétences validées, niveau terminé, objectif de la semaine, défi du jour.
  - Un coffre surprise chaque semaine et un cadeau pour chaque défi du jour, à ouvrir en 3D, avec pluie de confettis.
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

Un bleu franc partout et du blanc, dans l'esprit des applications d'apprentissage ludiques : police ronde et grasse (Nunito), boutons en relief qui s'enfoncent quand on les touche, cartes aux bords épais, parcours en zigzag d'étapes rondes, onglets en bas sur téléphone et menu latéral sur ordinateur. L'icône est la tête de Bao sur fond bleu.

**Le ciel de l'en-tête suit l'heure** (`src/sky.js`) : soleil du matin bas sur un ciel pêche (6 h-11 h), soleil de midi au zénith (11 h-17 h), soleil du soir orangé qui se couche (17 h-21 h), puis lune et étoiles. L'astre avance sur son arc toutes les minutes, avec des nuages qui flottent et un salut adapté (« Bonjour », « Bonsoir »…).

Les couleurs sont définies une seule fois dans `styles.css` (`--blue`, `--blue-deep`, `--navy`…), avec un mode sombre bleu nuit.

## Lancer l'application

```bash
cd polyglotte
npm install
npm start                       # http://localhost:8080 (sans IA)
ANTHROPIC_API_KEY=sk-... npm start   # avec leçons générées et professeur IA
npm test                        # tests (Node ≥ 20)
```

**Sans clé d'API**, tout fonctionne sauf les leçons non écrites à la main, la conversation avec Bao et l'interface dans les langues autres que le français et l'anglais (elle s'affiche alors en anglais). Les langues marquées « A1 hors ligne » restent entièrement utilisables par les francophones. L'interface explique clairement ce qui manque.

**Avec une clé d'API** (`ANTHROPIC_API_KEY`), le serveur appelle Claude (modèle `claude-opus-5-5`) :

- **Préparer une leçon** : un appel unique par langue et par unité. Le résultat est mis en cache dans `.cache/` et partagé par tous les apprenants. Il faut donc conserver ce dossier entre deux déploiements.
- **Converser avec Bao** : un appel court par réplique.
- **Traduire l'interface** : une seule fois par langue de base (hors français et anglais, traduits à la main), à la première visite d'un apprenant de cette langue. Le résultat est mis en cache dans `.cache/ui/` et refait automatiquement quand une phrase de l'interface change.
- **Limites par adresse IP** : 20 leçons, 150 répliques et 5 traductions d'interface par heure, réglables dans `server/index.mjs`.

**Mise en ligne gratuite (sans IA en direct)** : `npm run build:static` produit une version statique dans `dist/`, sans serveur ni appel à une IA payante. Elle fonctionne avec le contenu intégré (leçons écrites à l'avance, conversation scénarisée avec Bao, interface traduite) et hors ligne. Le dépôt contient un déploiement automatique sur GitHub Pages (`.github/workflows/polyglotte-pages.yml`) : il suffit, une fois, de choisir « GitHub Actions » dans Settings → Pages ; chaque mise à jour de la branche `main` met ensuite le site à jour, à l'adresse `https://<compte>.github.io/<dépôt>/`.

**Mise en ligne avec l'IA en direct** : il faut un hébergement Node.js qui garde un processus allumé (Render, Railway, Fly.io, un VPS…). La génération d'une leçon prend 30 à 90 secondes, ce qui dépasse les limites de durée des fonctions serverless classiques.

**Choix de la langue de base** (`src/locale.js`) : le pays est lu d'abord dans les réglages régionaux du navigateur (« fr-CI », « pt-BR » : le pays d'origine, même en déplacement), sinon dans le pays de connexion transmis par l'hébergeur (en-têtes `CF-IPCountry`, `X-Vercel-IP-Country`, `CloudFront-Viewer-Country`… exposés par `GET /api/geo`), sinon dans le fuseau horaire. Pour un pays multilingue (Canada, Suisse, Belgique, Cameroun, Maroc…), la langue du navigateur départage. Un apprenant en voyage dont le navigateur est réglé dans une langue connue garde sa langue. Les apprenants déjà inscrits avant cette fonction restent en français.

**3D** : Three.js est embarqué dans `vendor/three.js` (191 Ko compressé), donc aucune connexion à un CDN n'est nécessaire. Pour le regénérer : `npm run build:vendor`. Sans WebGL, l'application affiche automatiquement les versions 2D de Bao et du jardin. Un seul contexte WebGL dessine toutes les scènes, et celles qui sont hors écran sont mises en pause. Le mode « réduire les animations » du système est respecté.

**Audio** : la voix de Bao et la dictée utilisent la synthèse vocale du navigateur. Le micro (exercices oraux, conversation) utilise la reconnaissance vocale, disponible dans Chrome et Edge. Sans elle, la conversation se fait à l'écrit.

## Structure

```
polyglotte/
├── index.html, styles.css, sw.js, manifest.webmanifest
├── server/
│   ├── index.mjs        # serveur HTTP : fichiers, /api/generate-unit, /api/tutor, /api/ui, /api/geo, cache, limites
│   └── claude.mjs       # prompts et appels à Claude (sorties JSON structurées)
├── src/
│   ├── main.js          # routeur et écrans : accueil, parcours, unité, langues, réglages
│   ├── session-view.js  # déroulé des exercices, réactions de Bao, bilan
│   ├── chat-view.js     # conversation orale avec Bao, le professeur IA
│   ├── bao-view.js      # boutique, jardin, évolution, trophées
│   ├── app-state.js     # état partagé, composants, calcul des bonus en fin d'activité
│   ├── panda.js         # Bao en 2D (secours sans WebGL)
│   ├── three/           # 3D cel-shading : moteur partagé, Bao, jardin, coffres, ouverture
│   ├── visual.js        # place Bao et le jardin 3D dans l'interface (avec secours 2D)
│   ├── splash.js        # animation d'ouverture
│   ├── onboarding.js    # questionnaire de bienvenue (langue de base, langue, secteur, objectif)
│   ├── locale.js        # langue de base d'après le pays (réglages, connexion, fuseau)
│   ├── base-language.js # applique la langue de base à l'interface et au cours
│   ├── i18n.js          # traduction de l'interface : t(), pluriels, noms de langues
│   ├── i18n/en.js       # interface en anglais (référence des autres traductions)
│   ├── reveal.js        # ouverture des coffres et cadeaux, nouveau niveau
│   ├── confetti.js
│   ├── curriculum.js    # programme A1 → C2 (54 compétences)
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
│   ├── scripted-tutor.js # conversation guidée avec Bao, sans IA
│   └── data/            # écrit à la main : A1 (es, en, de, it, pt), A2-B1 (en, es, pt)
├── scripts/i18n-keys.mjs # liste les phrases de l'interface sans traduction anglaise
├── vendor/three.js      # Three.js embarqué (npm run build:vendor)
├── tests/               # tests (node --test)
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

## Traduire l'interface

Le texte de l'interface est écrit en français directement dans le code, entouré de `t('…')` (ou `tn(n, '… singulier', '… pluriel')`, ou `N('…')` pour une constante traduite à l'affichage). Les variables s'écrivent entre accolades : `t('Unité {n}', { n: 3 })`.

Après avoir ajouté ou modifié une phrase, ajoutez sa traduction dans `src/i18n/en.js` : `node scripts/i18n-keys.mjs` liste celles qui manquent, et un test échoue tant qu'il en manque une. Les autres langues sont traduites automatiquement par le serveur à partir du français et de l'anglais ; une traduction qui perd une variable ou une balise est écartée et remplacée par l'anglais.
