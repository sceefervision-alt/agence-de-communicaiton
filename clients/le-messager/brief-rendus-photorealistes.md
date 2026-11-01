# Restaurant Le Messager : brief pour les rendus photoréalistes

**Client :** Restaurant Le Messager, Douala Grand Mall
**Source :** dossier technique « Plan d'aménagement », février 2025 (37 pages)
**Livrable :** des images d'intérieur et de façade réalistes, fidèles aux plans

---

## 1. Données du projet (tirées des plans)

| Élément | Valeur |
|---|---|
| Salle | 63,88 m² |
| Comptoir | 11,64 m² |
| Cuisine | 13,97 m² |
| Hauteur sous faux plafond | environ 3,50 m (4,00 m d'un étage à l'autre) |
| Largeur de la façade | environ 7,30 m (1,78 m + 5,22 m) |
| Places assises | rangée de 20 places le long du mur, 12 places au fond, groupes de 6 places en banquettes |
| Enseigne principale | 5,98 m × 0,60 m, fond noir, lettres blanches en relief rétroéclairées par LED |
| Enseigne secondaire | 4,50 m × 0,54 m |

## 2. Matériaux et ambiance (référence commune à toutes les vues)

- **Sol :** grandes dalles de marbre blanc veiné gris, type Calacatta, poli.
- **Murs :** blanc cassé. Mur du fond en marbre gris clair veiné.
- **Panneaux décoratifs :** vert malachite, encadrés de bois foncé, verticaux le long du mur et carrés sur le mur du fond.
- **Cadres en haut des murs :** une rangée de portraits (⚠️ voir la section 5 sur les droits).
- **Faux plafond :** dalles blanches et grille noire bien marquée.
- **Éclairage :** suspensions cylindriques blanches et une lumière chaude (environ 3000 K).
- **Banquettes :** cuir marron cognac, structure en métal noir à angles droits.
- **Tables :** plateau en marbre blanc et pied central chromé.
- **Chaises :** coque bleue mate, pieds en métal.
- **Fauteuils lounge :** blancs, arrondis, tissu bouclé ou similicuir.
- **Comptoir :** façade verte avec des panneaux blancs, plateau en marbre, tabourets de bar en bois et métal.
- **Colonne de rangement :** bois foncé, niches avec LED intégrées.
- **Vitrine à glaces :** réfrigérée, inox et verre.
- **Façade côté galerie :** grande baie vitrée à menuiserie noire, poteaux blancs, plantes en pots blancs.

> **À faire valider par le client :** les fiches mobilier (page 19) montrent un canapé jaune et une banquette bleu clair. Les rendus montrent des banquettes marron, violettes ou orange selon les vues. **Une seule version doit être retenue** avant de lancer la production.

## 3. Méthode de production

**Option A : retravailler les 7 rendus existants à l'IA**
- Partir de chaque rendu existant (pages 3 à 9) en mode image vers image.
- Garder la géométrie : ControlNet de type *depth*, *canny* ou *MLSD*, avec une intensité de transformation d'environ 0,35 à 0,5.
- Retirer les personnages détourés, puis en régénérer de façon réaliste, ou n'en mettre aucun.
- Agrandir la résolution en dernière étape (Magnific, Krea, Topaz ou équivalent).
- Contrôler image par image : nombre de tables, position du comptoir, enseigne.

**Option B : remodéliser en 3D**
- Modéliser à partir du plan coté (page 11) et des coupes (pages 14 et 15) dans SketchUp ou Blender.
- Faire le rendu avec Enscape, D5, Twinmotion ou V-Ray.
- C'est la seule option fidèle à 100 %. Elle permet de nouveaux angles et des versions jour et nuit.

**Option C : approche hybride (recommandée)**
- Faire un modèle 3D simple, puis donner le réalisme final à l'IA.

## 4. Liste des vues et consignes

### Bloc commun (à ajouter à toutes les consignes)

```
photorealistic architectural interior photography, modern upscale restaurant in a shopping mall in Douala, Cameroon, white Calacatta marble floor, black grid suspended ceiling with white tiles, white cylindrical pendant lights, warm 3000K lighting, malachite green wall panels with dark wood frames, cognac leather banquettes with black metal frames, white marble table tops with chrome pedestal bases, matte blue shell chairs, shot on full-frame camera, 24mm lens, eye level 1.6m, natural perspective, realistic materials and reflections, high detail, editorial magazine quality
```

**Consigne négative :**

```
cartoon, CGI look, oversaturated, cutout people, distorted perspective, fisheye, warped lines, extra furniture, text artifacts, blurry, low resolution, plastic textures
```

---

### V1 : baie vitrée côté galerie (source : page 3)
- **Cadrage :** vue de biais sur la baie vitrée ; on devine la salle derrière et l'enseigne de l'entrée à droite.
- **Consigne :** `exterior view from the mall corridor of a restaurant glass storefront with slim black frames, interior visible through the glass: banquettes, marble tables, framed portraits above green panels, polished mall floor, illuminated black sign "Restaurant Le Messager" at the entrance on the right, potted tropical plants`
- **Attention :** reflets réalistes sur la vitre (galerie du centre commercial, pas de ciel bleu).

### V2 : salle, mur des panneaux verts (source : page 4)
- **Cadrage :** depuis l'entrée vers le fond ; le long mur avec ses panneaux verts et ses cadres.
- **Consigne :** `interior view of the dining room, long wall with tall vertical malachite green panels in dark wood frames, row of framed portraits above, banquettes along the wall with blue chairs facing, back wall in grey marble with two square green panels, a few customers dining naturally`

### V3 : entrée vue de trois quarts (source : page 5)
- **Cadrage :** vue d'angle de l'entrée, enseigne lumineuse en haut et salle visible.
- **Consigne :** `three-quarter view of the restaurant entrance from the mall corridor, large black backlit sign with white raised letters "Restaurant Le Messager", open front showing the lounge area with white armchairs, banquettes and bar counter in the back, two large white planters with tropical plants`
- **Attention :** le texte de l'enseigne doit être exact. Si l'IA le déforme, le corriger dans Photoshop.

### V4 : façade de face (source : page 6)
- **Cadrage :** élévation de face : baie vitrée à gauche, entrée ouverte à droite.
- **Consigne :** `straight frontal view of the restaurant facade in a mall, glass storefront on the left, open entrance on the right under a long black backlit sign "Restaurant Le Messager", symmetrical composition, polished floor`

### V5 : entrée dans l'axe, avec la porte de service (source : page 7)
- **Cadrage :** de face dans l'axe de l'entrée, perspective profonde jusqu'au fond de la salle.
- **Consigne :** `centered view through the restaurant entrance, deep perspective of the dining room, row of marble tables with blue chairs in the center, wood storage column with LED niches on the right, ice cream display counter, black grid ceiling with pendants leading to the back marble wall`

### V6 : salle vers le comptoir et la vitrine à glaces (source : page 8)
- **Cadrage :** grand angle sur la salle, avec le comptoir vert et la vitrine à glaces à droite.
- **Consigne :** `wide interior view, bar counter with green front and white panels and marble top, two bar stools, tall dark wood storage column with integrated LED, refrigerated ice cream display case, white rounded lounge armchairs in the foreground, dining area with banquettes in the background`

### V7 : salle depuis l'entrée, coin lounge (source : page 9)
- **Cadrage :** depuis l'entrée ; plante au premier plan, fauteuils blancs au centre.
- **Consigne :** `interior view from the entrance, large potted plant in the foreground, white rounded armchairs in the center, cognac leather sofas with black metal frames, wall of green panels and portraits, bar counter in the back, mall glass storefront visible on the left`

### Vues supplémentaires à proposer au client (en option)
- **V8, gros plan sur le comptoir :** détails du marbre, de la colonne en bois et des LED. Idéal pour les réseaux sociaux.
- **V9, ambiance de soirée :** même cadrage que V2 ou V7, lumière tamisée et plats sur les tables.
- **V10, cuisine :** d'après le plan d'implantation (page 21) : piano gaz, friteuses, plonge, hotte.

## 5. Points à régler avec le client

1. **La version du mobilier :** celle des rendus ou celle des fiches (voir l'encadré de la section 2).
2. **Les portraits au mur :** ce sont de vraies personnalités. Pour une utilisation commerciale, il faut leur autorisation écrite, sinon il faut remplacer ces cadres par des visuels neutres (photos culinaires, motifs africains, art local).
3. **L'usage des images :** réseaux sociaux, dossier pour le centre commercial ou présentation aux investisseurs. Le format et la résolution en dépendent.
4. **Le format de livraison :** par exemple 4K en paysage, plus un recadrage 4:5 pour Instagram.
5. **Avec ou sans personnages.**

---

## 6. Grille de prix indicative

> Ce sont des **ordres de grandeur pour le marché de Douala et de l'Afrique centrale**, en FCFA hors taxes. Ils sont à ajuster selon le positionnement de l'agence et le budget du client. Pour comparaison, en Europe, un rendu 3D professionnel se facture couramment entre 150 et 500 € l'image, soit environ 100 000 à 330 000 FCFA.

| Prestation | Contenu | Prix indicatif (FCFA HT) | Délai |
|---|---|---|---|
| **A. Retouche IA** | Les 7 vues existantes rendues réalistes, 2 séries de corrections | **200 000 à 350 000** (environ 30 000 à 50 000 par image) | 3 à 5 jours |
| **B. 3D complète** | Modélisation, puis 7 à 8 vues, 2 séries de corrections | **600 000 à 1 200 000** | 2 à 3 semaines |
| **C. Hybride (recommandée)** | Modèle 3D simple, réalisme par l'IA, 7 vues, 2 séries de corrections | **400 000 à 700 000** | 1 à 2 semaines |
| Vue supplémentaire | Par image (V8, V9, V10…) | 40 000 à 80 000 | — |
| Version de nuit d'une vue | Par image | 25 000 à 40 000 | — |
| Série de corrections supplémentaire | Au-delà des 2 incluses | 30 000 à 50 000 | — |
| Vidéo de visite (30 à 60 s) | Seulement avec l'option B ou C | 250 000 à 500 000 | +1 semaine |

### Conseils pour le devis
- **Proposer 2 formules** (par exemple A et C) : le client choisit et la négociation porte sur la formule plutôt que sur le prix.
- **Demander 50 % d'acompte** à la commande et le solde à la livraison.
- **Écrire noir sur blanc** le nombre de vues, le nombre de séries de corrections incluses, la résolution et le délai.
- **Préciser que les images sont des illustrations** et non un engagement contractuel sur le rendu final.
- **Exclure les droits sur les portraits** de personnalités : c'est au client de les obtenir.
- Le client occupe un local au Douala Grand Mall et a déjà payé une étude technique complète : il a probablement un budget. **Ne pas se positionner en bas de la fourchette.**
