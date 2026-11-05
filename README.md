# ConsultIng : site web

Site statique (HTML, CSS, JavaScript). Aucune étape de build.

## Réglages à compléter

Tout se règle en haut de `script.js`, dans l'objet `SITE`.

### Vidéo de présentation (60 s)
Déposer le fichier dans `assets/` sous le nom `intro.mp4` (et, en option, `intro-poster.jpg` pour l'image de couverture).
La section n'apparaît que si la vidéo est présente. Pour une vidéo hébergée sur YouTube ou Vimeo, renseigner `videoEmbedUrl`.

### L'Œil de la Consultante (LinkedIn)
Trois options, à renseigner dans `SITE.linkedin` :
1. `elfsightId` : identifiant d'un widget Elfsight « LinkedIn Feed ».
2. `juicerFeed` : nom d'un flux Juicer.
3. `postUrls` : liens d'intégration de 1 à 3 publications LinkedIn (sur la publication : « Intégrer ce post »).

Tant qu'aucune option n'est renseignée, la section affiche un bouton vers le profil LinkedIn, sans service tiers.
Les widgets automatiques fonctionnent bien avec une **page LinkedIn d'entreprise** ; avec un profil personnel, leur fonctionnement n'est pas garanti.

### Formulaire de demande de diagnostic
Le formulaire utilise Netlify Forms : il fonctionne dès que le site est publié sur Netlify.
Pour recevoir chaque demande par e-mail : Netlify > Forms > demande-diagnostic > Settings & usage > Form notifications > Email notification.
Hors Netlify, l'envoi échoue et le visiteur voit les liens WhatsApp et e-mail.

## Documents
Le dossier `documents/` contient le papier à en-tête, le contrat, la plaquette des packs, la fiche de consultation et le rapport de prescription (sources HTML, PDF, modèle Word).
Pour régénérer les PDF : `node documents/build-pdf.js <chemin absolu du dossier documents> <nom-du-document>` (Playwright requis).
