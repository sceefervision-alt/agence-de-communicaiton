# Analyse : les failles de Duolingo et nos réponses

Ce document sert de cahier des charges produit pour **Polyglotte**. Chaque
faiblesse reprochée régulièrement à Duolingo (avis d'utilisateurs, retours
d'enseignants, critiques pédagogiques) est associée à un choix concret dans
l'application.

| # | Faille de Duolingo | Conséquence pour l'apprenant | Réponse de Polyglotte | Où dans le code |
|---|---|---|---|---|
| 1 | **Gamification qui prend le dessus** (XP, ligues, séries quotidiennes) | On optimise ses points plutôt que son apprentissage ; on refait des leçons faciles pour l'XP | Pas d'XP ni de ligues. La progression se mesure en **mots maîtrisés** et en **objectifs « Je peux… »** (compétences réelles) | `src/progress.js`, écran d'accueil |
| 2 | **Série quotidienne anxiogène** (streak, notifications culpabilisantes) | Stress, « je fais 1 leçon bâclée pour ne pas perdre ma série », abandon quand la série casse | **Objectif hebdomadaire** (ex. 4 jours / semaine) : les jours de repos sont prévus et ne font rien perdre. Aucune notification | `src/progress.js` (`weeklyStatus`) |
| 3 | **Système de cœurs / énergie** qui punit les erreurs (et pousse vers l'abonnement) | Peur de se tromper, alors que l'erreur fait partie de l'apprentissage | **Aucune vie.** Une erreur remet simplement l'élément plus loin dans la session pour le retravailler | `src/session.js` (`requeue`) |
| 4 | **Reconnaissance plutôt que production** (banque de mots à taper) | On reconnaît un mot mais on ne sait pas le produire | Difficulté **progressive par élément** : découverte → QCM → écoute → **rappel actif écrit** → expression orale | `src/session.js` (`exerciseTypeFor`) |
| 5 | **Peu d'explications de grammaire** (conseils cachés, absents sur mobile) | On devine les règles par essai-erreur | Chaque unité commence par une **fiche « Comprendre »** courte, et chaque erreur affiche la **note de grammaire** liée à la phrase | `src/data/*.js` (`grammar`, `note`) |
| 6 | **Correction opaque** (« Mauvaise réponse » sans dire pourquoi, accents tantôt acceptés tantôt non) | Frustration, impression d'injustice | **Diagnostic précis** : accent manquant, faute de frappe, ordre des mots, mot oublié ou en trop — avec le mot concerné. Les accents sont signalés mais acceptés par défaut (mode strict en option) | `src/answer.js` |
| 7 | **Phrases absurdes et hors contexte** | Difficile de réutiliser ce qu'on apprend dans la vraie vie | Unités construites autour de **situations réelles** (café, ville, courses…) avec un **dialogue** et un **jeu de rôle** où l'on tape ses répliques | `src/data/*.js` (`dialogue`), vue Dialogue |
| 8 | **Parcours linéaire verrouillé** | Les faux débutants s'ennuient, on ne peut pas aller à ce qui nous intéresse | **Toutes les unités sont ouvertes.** Test « Je connais déjà » pour valider une unité en 1 minute | vue Unité, `src/session.js` (`buildTestOut`) |
| 9 | **Répétition espacée invisible** | On ne sait pas ce qu'il faut réviser ni quand ; les révisions ne ciblent pas ses faiblesses | **Répétition espacée transparente** (algorithme type SM-2) : nombre de révisions dues, prévision, révisions prioritaires sur les éléments ratés | `src/srs.js` |
| 10 | **Pas de vocabulaire personnel** | Impossible d'apprendre les mots dont *on* a besoin (travail, voyage…) | **Mon vocabulaire** : on ajoute ses propres mots, intégrés à la répétition espacée | vue Vocabulaire |
| 11 | **Données captives, compte obligatoire** | Dépendance à la plateforme | **Sans compte, hors ligne (PWA)**, progression stockée localement et **exportable / importable** en JSON | `src/storage.js`, `sw.js` |
| 12 | **Écoute et oral secondaires** | On lit bien mais on ne comprend pas à l'oral | Exercices de **dictée** et de **prononciation**, et surtout **conversation orale avec Bao, professeur IA**, qui corrige et relance | `src/speech.js`, `src/chat-view.js`, `server/claude.mjs` |
| 13 | **Plafond vers A2 / B1, peu de langues bien couvertes** | Les apprenants avancés n'ont plus rien à apprendre | Programme commun **A1 → C2** (jusqu'au niveau « Senior »), **45 langues** et n'importe quelle autre, leçons générées par l'IA puis vérifiées | `src/curriculum.js`, `src/languages.js`, `src/generator.js` |
| 14 | **Mascotte qui culpabilise** (le hibou et ses rappels insistants) | Rapport anxiogène à l'application | **Bao**, un panda qui encourage par ses gestes et ses expressions, sans jamais menacer ; il grandit avec l'apprenant | `src/panda.js` |
| 15 | **Récompenses déconnectées de l'apprentissage** (XP pour refaire des leçons faciles) | On joue au lieu d'apprendre | **Bambous** gagnés uniquement par l'apprentissage réel, boutique cosmétique, trophées, défi du jour facultatif | `src/rewards.js` |

## Principes pédagogiques retenus

1. **Rappel actif** : produire une réponse ancre mieux que la reconnaître.
2. **Répétition espacée** : revoir juste avant d'oublier.
3. **Erreurs comme signal** : une erreur ajuste le planning, elle ne sanctionne pas.
4. **Apprentissage en contexte** : chaque phrase appartient à une situation.
5. **Motivation durable** : objectifs atteignables, repos autorisé, progrès concrets.

## Ce qui reste à faire (pistes v2)

- Comptes optionnels et synchronisation multi-appareils.
- Contenus authentiques gradués (articles, podcasts courts) en complément des unités.
- Relecture humaine des leçons générées pour les langues les plus demandées, éditeur de contenu pour les enseignants.
- Interface traduite pour les apprenants non francophones.
- Voix de synthèse premium côté serveur pour les langues mal couvertes par les navigateurs.
- Algorithme FSRS à la place de SM-2 une fois assez de données collectées.
