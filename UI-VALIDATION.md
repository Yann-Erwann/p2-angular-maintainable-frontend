# Validation de l'interface responsive

## Accueil suivant la nouvelle maquette — 9 octobre 2026

Les derniers ajustements retirent les chevrons des indicateurs et les ronds
des traits de légende ; les traits rejoignent le bord du camembert.
Le tooltip blanc présente une médaille dessinée à gauche et le pays, son total
et son pourcentage à droite. Les pays du tableau sont des liens accessibles
avec Tab et Entrée. Build, lint et 170 tests passent sur cette version.
Les captures et scores Lighthouse suivants précèdent ces ajustements.

Référence : `doc/UI/desktop/home.png`. L’accueil utilise la nouvelle bannière
panoramique, le titre de section en dégradé, deux cartes d’indicateurs et
une carte réunissant le camembert et un tableau de répartition. Les pictogrammes
sont des SVG décoratifs ; les libellés, valeurs et pourcentages restent du texte.
Les valeurs de la maquette sont remplacées par les totaux réellement livrés.

La bannière desktop est encodée en WebP : 25 262 octets à 1339 px,
10 954 octets à 670 px. Le mobile utilise la bannière compacte existante
et affiche le titre et l’introduction en HTML. Le thème est limité à l’accueil ;
la bannière des pages pays et introuvable reste celle de la version précédente.

Captures examinées à 1454 × 1082, 412 × 823 et 320 × 740 : aucune erreur
JavaScript ni débordement horizontal. Les indicateurs restent côte à côte ;
le tableau passe sous le graphique à 1000 px. À 320 px, les noms longs
peuvent revenir à la ligne dans leur cellule. Les cinq pays se parcourent avec
Tab / Maj+Tab, Entrée ouvre le pays et Tab parcourt ses trois années.

Build sans avertissement de budget, lint et 169 tests passent. Les tests
vérifient les pourcentages (dont le total nul), les valeurs et libellés dessinés,
le surlignage et le changement de bannière après navigation.

Lighthouse sur l’accueil et le pays 1, mobile et desktop : performance 100
sur desktop et 98 sur mobile ; accessibilité, bonnes pratiques et SEO à 100.
CLS nul sur les quatre mesures. Le choix de la bannière est appliqué dès
le HTML initial pour éviter un saut de disposition sur les accès directs aux pays.
[Rapports locaux](doc/lighthouse-home-ui-2026-10-09/README.md).

Les constats suivants décrivent les révisions précédentes.

Revue du 8 octobre 2026, sur la modification UI suivant `b3733d0`.
Chromium headless 154 sous Linux, serveur Angular local, hauteur de viewport
900 px, facteur de pixels 1. Les données livrées servent aux pages chargées.

## Constats reproduits avant correction

À 320 px, les graphiques mesuraient seulement 121 px de haut : le camembert
était petit et les trois libellés de compteurs pays se répartissaient sur
plusieurs lignes très courtes. Le graphique pays occupait seulement la moitié
de la largeur disponible au-delà de 1000 px. La page inconnue débordait de
13 px horizontalement aux cinq largeurs contrôlées. Le libellé « Date » ne
précisait pas la signification des années.

## Résultats après correction

Les largeurs 320, 480, 768, 1024 et 1280 px ont été vérifiées sur `/`,
`/country/Italy` et `/unknown/nested`. Les captures aux largeurs 320, 768 et
1280 px ont été examinées : titres, compteurs, légendes, tracés et liens
restent visibles. Les animations ont été figées à leur état final pour ces
captures de contrôle uniquement ; le comportement applicatif reste inchangé.

| Viewport | Hauteur canvas accueil avant | Hauteur canvas pays avant | Hauteur canvas après, deux pages | Débordement horizontal après, trois pages |
| --- | --- | --- | --- | --- |
| 320 px | 121 px | 121 px | 262 px | 0 px |
| 480 px | 185 px | 185 px | 262 px | 0 px |
| 768 px | 300 px | 300 px | 312 px | 0 px |
| 1024 px | 403 px | 201 px | 405 px | 0 px |
| 1280 px | 505 px | 252 px | 398 px | 0 px |

Les mesures portent sur le canvas, à l'intérieur du panneau avec son padding.
La hauteur du panneau varie de 18 à 28 rem ; Chart.js suit le conteneur sans
imposer un ratio fixe. La grille des compteurs dépend de la place disponible,
avec une largeur minimale de carte de 11 rem, réduite à 100 % si nécessaire.
À 320 px les cartes sont empilées ; à 1280 px elles tiennent sur une ligne.

Les 35 contrôles d'états couvrent chargement, collection vide et HTTP 503
sur les deux pages, ainsi qu'un pays connu sans participations, aux cinq
largeurs. Les réponses ont été retardées ou remplacées dans le navigateur,
sans modification du JSON livré. Aucun débordement horizontal ni canvas
inattendu n'a été constaté. Les captures à 320 px confirment que les messages,
les compteurs à zéro et les liens de retour restent lisibles.

Les deux graphiques ont aussi été redimensionnés sans recharger la page
selon 1280 → 320 → 480 → 768 → 1024 → 1280 px : le même canvas est conservé,
ses dimensions suivent le panneau et aucune barre horizontale n'apparaît.

## Reproduire et limites

Lancer `pnpm start`, ouvrir les trois URL ci-dessus et régler le viewport aux
cinq largeurs. Redimensionner une page chargée dans les deux sens. Dans les
outils réseau du navigateur, retarder le JSON pour le chargement et substituer
`[]`, une réponse 503 ou un pays sans participations pour revoir les états.
Vérifier que `document.documentElement.scrollWidth <= window.innerWidth`.

Les 122 tests Karma, le lint, la compilation TypeScript des specs et le build
de production passent. Le bundle initial mesure 494,47 kB, sous le seuil
d'avertissement de 500 kB.

Cette revue concerne la mise en page sous Chromium. Les appareils physiques,
Safari et Firefox n'ont pas été testés. Les contrastes, le clavier, les
lecteurs d'écran et les alternatives textuelles des graphiques restent dans
l'audit d'accessibilité I15 ; aucune conformité RGAA n'est annoncée ici.

Les corrections et contrôles d'accessibilité ultérieurs, dont le reflow des
tableaux et le parcours clavier, sont consignés dans
[ACCESSIBILITY.md](ACCESSIBILITY.md). Cette revue UI conserve les mesures
de son propre périmètre et de sa propre révision.

## Grille du cahier des charges — 9 octobre 2026

Contrôle complémentaire après `c46bf35`, sur `/` et `/country/1` :

- Mobile : 4 colonnes jusqu’à 767 px, indicateurs, graphique et tableau empilés.
- Tablette : 8 colonnes de 768 à 1199 px, graphique pleine largeur.
- Desktop : 12 colonnes à partir de 1200 px, graphique sur 7 colonnes et
  tableau sur 5 colonnes ; titre, indicateurs et retour restent pleine largeur.

Chromium headless : mesures à 320, 767, 768, 1199, 1200 et 1280 px sur les
deux pages et la page inconnue. Les nombres de colonnes et la position des
panneaux correspondent aux dispositions attendues ; aucun débordement
horizontal. Captures examinées à 320 px (accueil) et 1280 px (détail).
Les liens du tableau et les descriptions textuelles des graphiques sont conservés.

Validation : 151 tests réussis et lint sans erreur. Build de production réussi,
avec un avertissement de budget initial (environ 500,2 kB pour un seuil de
500 kB). Le seuil n’a pas été modifié. Ce contrôle porte sur Chromium ;
les autres navigateurs et appareils physiques restent à vérifier.
