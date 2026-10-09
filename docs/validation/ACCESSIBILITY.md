# Contrôles d'accessibilité et limites

## Consolidation du 9 octobre 2026

Les vérifications de la refactorisation, les captures et les mesures sont
consignées dans [VALIDATION.md](VALIDATION.md). Les résultats plus anciens ci-dessous
restent des constats datés, ils ne remplacent pas cette validation.

## Nouveau détail pays — version actuelle

Le sélecteur utilise un élément `select` avec son label « Country ». Les
drapeaux et pictogrammes sont décoratifs. Les trois cartes conservent leurs
termes et définitions, la figure est nommée par « Medals over time ».
Les données complètes et les commandes clavier du canvas restent disponibles.
Tab atteint les trois années du graphique puis en sort, même quand le
graphique commence sous le viewport. Le choix d’un pays ouvre sa route et
replace le focus sur « Olympic results ».
Build, lint et 172 tests passent, le parcours clavier a également été vérifié
dans Chromium. L’écoute avec un lecteur d’écran reste à réaliser.
Lighthouse donne 100 en accessibilité sur l’accueil et le détail France,
dans les profils mobile et desktop.

## Nouvel accueil — version actuelle

Les noms des pays du tableau sont des liens natifs : Tab et Maj+Tab les
parcourent, Entrée ouvre les résultats. Le focus souligne le lien et met la
ligne en évidence. `aria-describedby` associe les médailles et le pourcentage
au pays sélectionné. Les tests du tableau et du tooltip passent dans la suite
complète de 170 tests, les audits Lighthouse ci-dessous précèdent ces ajouts.

La maquette du nouvel accueil réintroduit un tableau de répartition à côté
du camembert sur desktop, et sous le graphique sur mobile. Le tableau utilise
une légende accessible et des en-têtes `scope="col"` / `scope="row"`.
Les pourcentages sont du texte, leurs barres, les pastilles de couleur et
les pictogrammes sont décoratifs. Les descriptions complètes, les données de
remplacement du canvas et les annonces du point actif sont conservées.
Le parcours Tab / Maj+Tab des pays et Entrée vers le détail est vérifié.
Le titre HTML de l’accueil évite de répéter visuellement le texte intégré dans
la bannière desktop, et devient visible lorsqu’il reçoit le focus clavier.
Sur mobile, le titre et l’introduction sont affichés en HTML.
Les quatre audits Lighthouse de l’accueil et du pays 1 donnent 100 en
accessibilité. Build, lint et 169 tests passent, l’écoute avec un lecteur
d’écran reste à réaliser. [Rapports locaux](../../doc/lighthouse-home-ui-2026-10-09/README.md).

## Structure sémantique — version actuelle

La bannière contient la navigation principale nommée. Un unique `main`
contient la page active. Les pages accueil, pays et introuvable utilisent
une `section` nommée par leur `h1`. Les titres de section sont dans un `header`
local, les statistiques restent des listes de définitions `dl` / `dt` / `dd`,
et les graphiques utilisent `figure` et `figcaption`.
Le titre pays est « Olympic results », le nom du pays reste le `h2`.
Ces changements conservent le parcours Tab dans les graphiques.
Build, lint et 167 tests passent. Deux audits Lighthouse (accueil et pays 1,
mobile) donnent 100 en accessibilité, bonnes pratiques et SEO.
[Rapports locaux](../../doc/lighthouse-semantics-2026-10-09/README.md).

## Parcours des points avec Tab — version actuelle

Tab et Maj+Tab parcourent les points directement dans Chart.js, sans bouton
supplémentaire. Le canvas garde le focus pendant ce parcours, chaque étape
change le point actif, son infobulle et la région de statut. Tab au dernier
point sort du graphique et Maj+Tab au premier revient à l'indicateur précédent.
En revenant dans le graphique avec Maj+Tab, le dernier point est sélectionné.
Entrée ou Espace ouvre le pays sélectionné. Les flèches restent facultatives.

Build, lint et 167 tests passent. Le navigateur vérifie les cinq pays dans
les deux sens avec Tab / Maj+Tab, la sortie aux extrémités, le retour,
l'ouverture du pays avec Entrée et ses trois années avec Tab.
Cette vérification ne remplace pas l'écoute avec un lecteur d'écran,
les scores Lighthouse ci-dessous proviennent de la version précédente.

## Alternatives du canvas — 9 octobre 2026

Le canvas garde `role="img"`, son nom accessible et la description complète
reliée par `aria-describedby`. Un texte de remplacement interne contient
chaque pays ou année avec le nombre de médailles. Les instructions mentionnent
Entrée et Espace, les flèches et la région de statut restent disponibles.
Aucun bouton ni tableau n’est ajouté.

Un plugin local peint un fond blanc opaque à chaque dessin du canvas,
y compris après surlignage ou redimensionnement. Le texte utilise #23343b.
Cette correction suit la [documentation Chart.js sur le fond du canvas](https://www.chartjs.org/docs/latest/configuration/canvas-background.html).
Build, lint et 166 tests passent. Un test lit réellement le pixel de fond
après dessin, changement de sélection et redimensionnement. Le parcours
clavier réel reste vérifié. Les deux audits Lighthouse (accueil et pays 1,
mobile) donnent 100 en accessibilité, bonnes pratiques et SEO, performance
99 et 98. [Rapports locaux](../../doc/lighthouse-canvas-2026-10-09/README.md).
Windows High Contrast et l'écoute avec un lecteur
d'écran restent à contrôler dans ces environnements.

## Navigation clavier — 9 octobre 2026

Le lien « Skip to main content » est retiré à la demande du projet.
Tab / Maj+Tab parcourent la bannière, le h1, le h2, chaque indicateur et
le canvas. Dans le canvas, les flèches parcourent
les pays ou années, Home / End sélectionnent le premier ou dernier élément.
La sélection active et son infobulle sont rendues par Chart.js, son libellé
et son nombre de médailles sont annoncés dans une région de statut.
Entrée / Espace ouvrent le pays sélectionné sur l'accueil.
Aucun bouton supplémentaire n’est ajouté.
Tab sort normalement du graphique. Après changement de page, le h1 reçoit
le focus. Les descriptions complètes restent reliées au canvas.

Build, lint et 164 tests passent, dont le surlignage réel Chart.js et son
infobulle sur les deux types de graphiques. Le parcours navigateur vérifie
l'ordre de Tab, Maj+Tab, les flèches, Entrée vers un pays et la sortie du
graphique de détail. L'écoute avec un lecteur d'écran reste à réaliser.
Lighthouse sur l’accueil et les pays 1 et 3, mobile et desktop :
accessibilité, bonnes pratiques et SEO à 100. Performance : 98–99 sur
mobile et 100 sur desktop. Rapports locaux :
[doc/lighthouse-keyboard-2026-10-09/README.md](../../doc/lighthouse-keyboard-2026-10-09/README.md).

Les constats ci-dessous décrivent l'ancienne révision du 8 octobre.

Audit partiel du 8 octobre 2026 sur la révision applicative `2b7b3d3`, après
la structure accessible `ca8e704`. Référentiel :
[RGAA 4.1.2, critères et tests officiels](https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/),
version identifiée sur le site officiel à cette date.

**Aucun taux de conformité RGAA n'est annoncé.** Les contrôles ci-dessous
documentent les corrections et les vérifications effectivement exécutées.
I15 reste partiellement ouverte : l'écoute avec un lecteur d'écran et la
validation complète des critères applicables restent à réaliser.

## Périmètre et environnement

Pages : `/`, `/country/Italy`, autres pays, pays inconnu et URL inconnue.
États : chargement, succès, collection vide, pays sans participations,
pays absent et erreur HTTP. Les réponses simulées restent dans le navigateur
de contrôle, le JSON livré n'est pas modifié.

Chromium headless 154 sous Linux, serveur Angular local, langue de contenu
`en`. Les événements Tab, Maj+Tab et Entrée ont été transmis au navigateur
via son protocole de contrôle. Les noms et propriétés accessibles ont été
inspectés dans son arbre d'accessibilité. Aucun lecteur d'écran n'est installé
dans cet environnement : cette inspection ne remplace pas une écoute avec
NVDA, JAWS, VoiceOver ou Orca.

## Corrections et résultats

| Critères concernés                    | Contrôle exécuté                                                                         | Résultat sur ce périmètre                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1.1, 1.3 : graphiques et alternatives | Canvas nommé, description liée au caption et tableaux visibles donnant les mêmes valeurs | Totaux pays et participations vérifiés dans le DOM et les tests, rôle image et nom présents dans l'arbre accessible |
| 3.1 : information et couleur          | Valeurs et destinations disponibles en texte indépendamment du camembert                 | Chaque pays dispose d'un lien natif dans le tableau, aucune navigation n'exige d'identifier une couleur             |
| 3.2, 3.3 : contrastes                 | Calcul de luminance relative des couleurs et contrôle du trait des graphiques            | Corrections et ratios ci-dessous, pas de mesure sur les lecteurs d'écran ou les modes de contraste système          |
| 5.4, 5.6, 5.7 : tableaux simples      | Caption, en-têtes de colonnes et de lignes, correspondance des cellules                  | Rôles table, columnheader et rowheader présents, valeurs identiques aux données des graphiques                      |
| 6.1, 7.3 : liens et clavier           | Tous les pays parcourus avec Tab, retour avec Maj+Tab, sélection avec Entrée             | Cinq liens pays accessibles, navigation pays puis retour accueil fonctionnels                                       |
| 7.1, 7.5 : scripts et messages        | Régions persistantes status/alert, atomicité, transitions testées                        | L'arbre expose polite/assertive et atomic=true, l'annonce parlée et son timing restent à vérifier                   |
| 8.3, 8.6 : langue et titres           | `lang=en`, titres accueil/pays/page inconnue                                             | Titres de document actualisés et cohérents avec l'URL demandée                                                      |
| 9.1, 9.2, 9.3 : structure             | Un h1 et un main par page, h2 de section, listes de définitions                          | Vérifié sur les trois pages, labels et valeurs des compteurs sont associés par dt/dd                                |
| 10.7 : focus                          | Parcours clavier et style calculé du lien actif                                          | Indicateur visible, trait plein de 3 px, couleur #23343b, pas de suppression du focus natif                         |
| 10.11 : reflow                        | Trois pages à 320, 480, 768, 1024 et 1280 px                                             | Aucun débordement horizontal, tableaux, liens et messages restent consultables                                      |
| 12.6, 12.7 : repères et évitement     | Activation du lien d'évitement avec Entrée                                               | Focus sur main, le lien est visible au focus et contourne le début de page                                          |
| 12.8, 12.9 : focus et piège clavier   | Pays, retour accueil, chemin inverse                                                     | Ordre logique, focus sur le h1 après navigation, aucun piège constaté dans ce parcours                              |

Les en-têtes de tableaux sont simples : aucune association complexe par
`headers` n'est nécessaire. Les captions décrivent leurs unités et leur
contexte. Les liens contenant un nom avec espaces sont encodés par le routeur.

## Contrastes mesurés

Rapport calculé avec la luminance relative sRGB : `(Lclair + 0,05) /
(Lsombre + 0,05)`, sans arrondir avant comparaison aux seuils. Les chiffres
ci-dessous sont arrondis uniquement pour l'affichage.

| Élément                                                  | Avant                                                 | Après                            |
| -------------------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| Texte blanc du titre sur turquoise, 20 px et graisse 400 | #0b868f : 4,36:1, insuffisant pour ce texte           | #0b6470 : 6,84:1                 |
| Secteur bleu sur blanc                                   | #adc3de : 1,80:1                                      | #486b94 : 5,52:1                 |
| Secteur orange sur blanc                                 | #ffa500 : 1,97:1                                      | #a45a00 : 5,20:1                 |
| Trait de la courbe sur blanc                             | Gris par défaut équivalent à #e6e6e6 : environ 1,25:1 | Trait explicite #0b6470 : 6,84:1 |
| Liens sur blanc                                          | #0b6470 : 6,84:1                                      | Inchangé                         |
| Indicateur de focus sur blanc                            | Style explicite ajouté                                | #23343b : 12,92:1                |

Les six couleurs du camembert ont un contraste compris entre 5,13:1 et
8,08:1 contre le blanc. Les secteurs sont séparés par un trait blanc de
2 px, les libellés et les valeurs sont aussi disponibles dans le tableau.
Le texte principal #23343b et les libellés Chart.js #666 dépassent 4,5:1
sur leur fond clair. Les traits de grille et bordures décoratives ne sont
pas utilisés pour lire une valeur ou identifier une destination.

## États, redimensionnement et tests

Les régions d'annonce sont présentes dès la création de la page. Le statut
annonce chargement, vide, pays absent ou résumé du succès, les erreurs
utilisent une région alert distincte. Le résumé de succès est masqué
visuellement, mais reste accessible. Les régions vides ne prennent pas de
place. Les tests vérifient leur identité à travers les transitions et
l'absence de message d'erreur lors d'un succès ou d'une collection vide.

35 contrôles de chargement/vide/HTTP 503/pays sans participations ont passé
aux cinq largeurs. 12 redimensionnements des graphiques conservent le canvas
et n'introduisent pas de débordement. Six contrôles de reflow à 640 et 320 px
équivalent à la largeur disponible à 200 % et 400 % depuis 1280 px, il ne
s'agit pas d'un test du zoom texte ni d'une validation du critère 10.4.

Validation technique : **126 tests Karma**, lint avec règles d'accessibilité
des templates, compilation TypeScript des specs et build de production
réussis. Bundle initial : 499,03 kB, sous l'avertissement de 500 kB. Les
contrôles DOM et de l'arbre accessible complètent ces tests, aucun score
automatisé n'est utilisé comme preuve de conformité.

## Non-applicabilités et travail restant

Sur les pages rendues, aucun formulaire, champ de saisie, iframe, média
audio/vidéo, téléchargement bureautique ou image bitmap/SVG n'est présent.
Les sections correspondantes sont non applicables à cet échantillon actuel.
Les canvas et les tableaux ajoutés ont bien été inclus dans les contrôles.

Restent à exécuter : une lecture avec un lecteur d'écran et navigateur
identifiés, notamment titres, tableaux, ordre de lecture et annonces, zoom
texte à 200 %, contrôle sur appareils physiques et autres moteurs, revue
complète des critères applicables, y compris les cas particuliers. Vérifier
aussi le focus après historique navigateur et les préférences système avec
les technologies d'assistance retenues. Ce rapport ne se transpose pas à
une autre révision sans répéter les contrôles.

Pour reprendre : lancer `pnpm start`, parcourir accueil → chaque pays →
accueil sans souris, activer le lien d'évitement, lire les deux tableaux,
puis provoquer les états réseau dans les outils du navigateur. Consigner
les versions du lecteur d'écran, du navigateur et du système, ainsi que les
messages effectivement prononcés et toute correction nécessaire.
