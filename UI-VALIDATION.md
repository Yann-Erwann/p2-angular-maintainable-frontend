# Validation de l'interface responsive

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
