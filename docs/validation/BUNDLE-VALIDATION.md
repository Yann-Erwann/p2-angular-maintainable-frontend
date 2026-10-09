# Réduction du bundle Chart.js

## Consolidation et mesures comparables

Les vérifications de la refactorisation, les captures et les mesures sont
consignées dans [VALIDATION.md](VALIDATION.md). Les résultats plus anciens ci-dessous
restent des constats datés, ils ne remplacent pas cette validation.

## Nouveau détail pays — version actuelle

La page pays réutilise les WebP de l’accueil et leur préchargement adapté
à la route et au viewport. Le thème est inclus dans la feuille minifiée,
chargée avant le premier rendu. Le module Chart.js reste différé et préchargé
par son nom hashé, l’ajout du remplissage utilise uniquement le plugin Filler
de Chart.js déjà installé.

Build initial : 299,61 kB bruts, 81,89 kB estimés au transfert. Module graphique :
189,62 kB bruts, 58,05 kB estimés. Page pays : 6,96 kB bruts, 2,59 kB estimés.
Build sans avertissement de budget, lint et 172 tests réussis. Le sélecteur
réutilise la réponse olympique validée, les tests de routes vérifient toujours
l’annulation des requêtes pendant une navigation rapide.

## Nouvel accueil suivant la maquette — mesure avant les derniers ajustements

La bannière WebP panoramique pèse 25 262 octets (1339 px), avec une version
670 px de 10 954 octets. Le mobile réutilise la bannière compacte existante.
Le thème, chargé dès le premier rendu, est limité à la classe de l’accueil.
La disposition initiale et la bannière suivent la route hash avant Angular.

Le total initial du build est 288,98 kB, avec une estimation de transfert de
79,85 kB. Chart.js reste différé : 180,22 kB bruts, 55,32 kB estimés.
Les libellés et valeurs sont dessinés par un plugin local, aucun paquet de
visualisation supplémentaire n’est ajouté. Le tableau est alimenté par les
participations réelles, avec une protection du calcul lorsque le total est nul.

Build sans avertissement de budget, lint et 169 tests passent. Les quatre
mesures Lighthouse (accueil et pays 1, mobile / desktop) donnent 100 en
accessibilité, bonnes pratiques et SEO. Performance 100 desktop, 98 mobile,
CLS nul. [Rapports locaux](../../doc/lighthouse-home-ui-2026-10-09/README.md).

## Parcours Chart.js avec Tab — validation précédente

Tab / Maj+Tab sélectionnent successivement les pays ou années dans le canvas.
Le surlignage, l'infobulle et l'annonce changent sans recréer le graphique.
Aux limites, le navigateur reprend son parcours normal. Aucun bouton ajouté,
le chargement différé et la hauteur réservée sont conservés.
Build, lint et 167 tests passent. Le navigateur vérifie le parcours complet
des cinq pays dans les deux sens, les sorties, Entrée vers le pays et ses années.
Les scores Lighthouse suivants concernent les validations précédentes.

## Navigation directe au clavier — validation précédente

Le canvas permet de parcourir les pays ou les années. La sélection active Chart.js et son infobulle changent sans
recréer le graphique. Le chargement différé est conservé, la navigation
clavier fait partie du module graphique. En cas d'échec de ce module, les indicateurs,
la description complète et le message d'erreur restent disponibles.
Le lien d'évitement est supprimé et le parcours Tab inclut les titres et
indicateurs. La hauteur réservée du graphique est conservée.

Build, lint et 164 tests passent. Le navigateur confirme le parcours Tab /
Maj+Tab, les flèches, l'ouverture du pays avec Entrée et la sortie du graphique.

Lighthouse sur l’accueil et les pays 1 et 3, mobile et desktop :
accessibilité, bonnes pratiques et SEO à 100. Performance : 98–99 sur
mobile et 100 sur desktop. Rapports locaux :
[doc/lighthouse-keyboard-2026-10-09/README.md](../../doc/lighthouse-keyboard-2026-10-09/README.md).

## Graphiques sans tableaux — validation précédente

Les tableaux de l'accueil et du détail pays sont retirés, ainsi que leurs
styles et imports inutilisés. Les graphiques occupent désormais la largeur
disponible, centrés jusqu'à 64 rem. Les données restent décrites pour les
lecteurs d'écran via `aria-describedby`, la sélection des pays au clavier
apparaît au focus dans le graphique et reste disponible avant son chargement
ou en cas d'échec du module. Les messages d'erreur ne mentionnent plus de tableau.

Build, lint et 160 tests passent. Parcours des 11 écrans : aucun tableau,
aucune erreur JavaScript ni débordement horizontal, graphiques fonctionnels
sur les six pages valides. Navigation par les commandes clavier vérifiée.
Six audits Lighthouse ciblés sur l'accueil, `/country/1` et `/country/3`,
avec les URL à fragment : desktop 100 dans les quatre catégories, mobile
performance 98–99, autres catégories à 100. Aucun avertissement Lighthouse.
Rapports, captures et mesures réseau : `doc/lighthouse-no-tables-2026-10-09/`.
Les validations suivantes décrivent les versions précédentes.

## Bannière TéléSport optimisée — version actuelle

La bannière est placée dans l'en-tête commun et renvoie à l'accueil, les
liens « Go back » sont supprimés sur toutes les pages. Le PNG de 171 780 octets
reste dans les sources. Seuls les WebP optimisés de 10 484 octets (874 × 251)
et 4 968 octets (438 × 126) sont copiés dans le build. `srcset` et `sizes`
adaptent l'image au viewport et à sa densité. Les dimensions réservées,
`aspect-ratio: 874 / 251` et le même en-tête dans le HTML initial évitent
un déplacement lors du démarrage d'Angular.

À 412 × 823 px, le graphique de l'accueil reste entièrement visible : son
bas se trouve à 797,734 px. Contrôle à froid des 11 écrans avec les URL à
fragment de la configuration actuelle (`/#/country/1`, etc.) : bannière
chargée partout, navigation vers l'accueil par son lien confirmée, aucun
Go back, aucune erreur JavaScript ni débordement horizontal. Le chargement
à la demande du JSON, des routes et de Chart.js est conservé.

Build, lint et 160 tests passent. Les 22 audits Lighthouse donnent 100 dans
les quatre catégories sur desktop, sur mobile, performance de 98 à 100 et
autres catégories à 100 partout. CLS maximal : 0,00566 sur mobile et 0,00402
sur desktop. Aucun avertissement d'exécution. Les rapports HTML/JSON, mesures
réseau et captures sont dans `doc/lighthouse-telesport-2026-10-09/`.
Les sections suivantes documentent les validations précédentes.

## Optimisation finale du chargement — 9 octobre 2026

Le build utilise Angular CLI directement. Minification JS/CSS, tree-shaking
et AOT sont explicitement activés en production. Le script injectant un lien
`modulepreload` pour chaque chunk a été retiré, ainsi que `PreloadAllModules`
et le préchargement HTML du JSON. Angular conserve ses liens pour les imports
initiaux, la page pays se charge à la navigation.

Les blocs graphiques sont créés uniquement après une réponse valide et
utilisent `@defer (on viewport; prefetch on idle)`. Les pages d'erreur ne
demandent plus Chart.js. Les URL inconnues et les identifiants invalides ne
demandent plus le JSON. Les placeholders préservent la hauteur du graphique.
Le build copie seulement `robots.txt` et `olympic.json` : l'image de
démonstration et la copie externe du favicon intégré ne sont plus publiées,
soit 172 728 octets d'assets en moins. Les fichiers source sont conservés.

Validation : build, lint et 160 tests réussis, parcours Chromium des 11 URL
sans erreur JavaScript ni débordement horizontal. Les six pages valides
affichent leur graphique et leur tableau. Avec la réponse JSON suspendue sur
l'accueil et `/country/1`, aucun module graphique n'est demandé avant reprise.
Le serveur local livre les JS/CSS en Brotli (`Content-Encoding: br`) avec le
cache immutable prévu pour les fichiers hashés.

Les 22 audits Lighthouse donnent 100 dans les quatre catégories sur desktop.
Sur mobile : performance de 99 à 100, autres catégories à 100 partout.
CLS maximal : 0,01415 sur mobile et 0,00393 sur desktop. Sur `/unknown` mobile,
le transfert JS mesuré passe de 154 619 à 88 757 octets (−42,6 %), sur les
identifiants invalides/inconnus, de 154 619 à 91 259 octets (−41,0 %).
Sur l'accueil, il passe de 154 619 à 151 767 octets : le chunk pays n'est plus
demandé, mais Chart.js reste nécessaire au graphique visible. Les mesures
incluent les en-têtes HTTP et varient avec les conditions d'exécution.

Rapports et vérification réseau : `doc/lighthouse-optimized-2026-10-09/`.
Les sections suivantes documentent les validations antérieures.

## Stabilisation des pages pays — 9 octobre 2026

Le document réserve la largeur de la barre de défilement avec
`scrollbar-gutter: stable`. Son apparition pendant le chargement puis sa
disparition ne décalent plus horizontalement l'application centrée. Le lien
« Go back » des pages pays est placé sous le titre, avant le contenu
asynchrone, pour éviter son déplacement lorsque le pays est introuvable.
L'espacement de 8 px sous la ligne de l'accueil est conservé.

Validation : build de production, lint et 160 tests réussis. Les 22 audits
Lighthouse 13.5.0 couvrent l'accueil, les cinq pays, `/country/invalid`,
`/country/999`, `/country`, `/not-found` et `/unknown`, sur mobile et desktop,
cache réinitialisé et audits successifs. Desktop : 100 dans les quatre
catégories sur les 11 URL. Mobile : performance de 98 à 100, accessibilité,
bonnes pratiques et SEO à 100 partout. CLS maximal : 0,01415 sur mobile et
0,00393 sur desktop. Sur `/country/999` desktop, performance 81 → 100 et
CLS 0,40170 → 0,00024, sur `/country/3`, CLS 0,10350 → 0,00392.
Les scores décrivent ces mesures locales et peuvent varier.

Les rapports HTML/JSON sont conservés dans
`doc/lighthouse-all-pages-corrected-2026-10-09/` (dossier `doc` ignoré par Git).

## Préchargement exhaustif des chunks (historique, avant optimisation)

Cette stratégie a été remplacée par le chargement Angular natif : les
paragraphes suivants conservent la validation de la version précédente.

`pnpm run build` exécute Angular CLI puis insère dans le `<head>` un lien
`modulepreload` pour chacun des fichiers JavaScript émis dans `browser/`.
Les noms sont lus après le build : les chunks du routeur, du graphique et les
chunks partagés sont tous couverts, sans liste de hashes maintenue à la main.
Les liens partiels générés par Angular sont remplacés pour éviter les doublons.
Le téléchargement ne dépend plus du premier rendu d’`AppComponent` et
n’exécute pas les modules différés. Le build échoue si son HTML ou ses modules
ne sont pas disponibles. Un appel direct à `ng build` contourne cette étape.

Validation du 9 octobre 2026 : le build de production émet cinq modules
JavaScript, tous déclarés une seule fois dans le `<head>`. Chromium 154,
cache vidé avant chaque navigation, télécharge les cinq modules sur `/`,
`/country/1`, `/country/invalid`, `/unknown`, `/not-found` et `/country`.
La réponse JSON est suspendue pendant le contrôle : tous les modules répondent
avec le statut 200 avant les données, sans canvas prématuré. Après reprise,
les deux pages valides affichent leur graphique, les pages d’erreur n’en
créent aucun. Aucune erreur JavaScript ni requête de module en double.
Lint, compilation TypeScript des specs et 159 tests passent.

Le favicon de 948 octets est désormais intégré en base64 dans `rel="icon"`
dans `src/index.html`, le lien de préchargement externe est supprimé.
Validation dans Chromium 154 sur `/`, `/country/1` et `/unknown`, cache vidé :
icône décodable (28 × 30 pixels), aucune requête HTTP pour le favicon et aucun
avertissement de préchargement inutilisé. Le contenu décodé dans le HTML source
et le HTML de production est identique à `src/favicon.ico`. Build et lint passent.

Les mesures Lighthouse ci-dessous précèdent ce préchargement exhaustif et
ne constituent pas une mesure de cette nouvelle version.

## Chargement Angular natif et mesures Lighthouse

Le 9 octobre 2026, la solution finale utilise Angular CLI directement, une
page d’accueil incluse au démarrage et un détail chargé avec `loadComponent`.
Les graphiques utilisent `@defer (on viewport; prefetch when state.status === 'loading' || state.status === 'success')`.
Le téléchargement de Chart.js commence pendant la requête des données, le
graphique est créé après une réponse valide et lorsqu’il devient visible.
Les scripts personnalisés de post-traitement du build ont été retirés, le
préchargement utilise Angular et les liens HTML décrits dans le README.
La légende et les infobulles Chart.js restent enregistrées. Les composants
utilisent `OnPush`, l’application est zoneless et les animations initiales des
graphiques sont désactivées. Zone.js reste disponible pour les tests.

Les mesures utilisent le build de production servi par `pnpm run preview`,
Lighthouse 13.5.0 et Chromium 154, profil mobile et ralentissement simulé par
défaut. Lighthouse réinitialise le cache avant la navigation.

| Mesure      | Accueil | `/country/1` |
| ----------- | ------: | -----------: |
| Performance |  98/100 |      100/100 |
| FCP         |   1,4 s |        0,8 s |
| LCP         |   2,2 s |        0,9 s |
| TBT         |  100 ms |        40 ms |

La chaîne critique maximale du détail est de 163 ms sur ce poste. Les scores
varient avec la machine et le déroulement de la mesure. Les précédents scores
à 100 obtenus avec des scripts de préchargement ne décrivent pas cette version.
Lighthouse signale encore environ 38 Kio de JavaScript inutilisé sur l’accueil
et 27 Kio sur le détail, dans le module Chart.js : ces diagnostics ne sont pas
notés. La couverture d’une seule page ne justifie pas de retirer les contrôleurs
ou plugins nécessaires aux autres usages.

Validation de production : réponse JSON volontairement suspendue, module du
graphique téléchargé avant la réponse, aucun canvas créé avant les données,
puis graphique affiché après reprise, avec une seule requête JSON et aucune
erreur JavaScript. Un accès à `/country/invalid` affiche l’erreur sans appel
HTTP de DataService, le préchargement HTML du JSON reste actif.
Le signalement des erreurs de bootstrap reste présent dans `main.ts`.
Lint, compilation TypeScript des specs, 159 tests et build vérifient également
la légende, les infobulles, les données immuables et la destruction des graphiques.

Les mesures historiques ci-dessous décrivent les versions antérieures.

Comparaison du 9 octobre 2026 à partir de `fecc2fb`, avant et après
remplacement de `chart.js/auto` par un enregistrement sélectif. Les versions,
les budgets Angular et les autres paramètres du build restent identiques.

Commande : `pnpm exec ng build --stats-json`, configuration production par défaut.
Les contributions proviennent de `stats.json`, champ `bytesInOutput` des
modules Chart.js dans le fichier main, les tailles sont des octets bruts.

| Mesure                                             |          Avant |          Après |
| -------------------------------------------------- | -------------: | -------------: |
| Bundle initial, sortie Angular                     |      501,40 kB |      470,08 kB |
| Transfert estimé du bundle initial, sortie Angular |      142,01 kB |      133,91 kB |
| Fichier main                                       | 464 658 octets | 433 338 octets |
| Contribution Chart.js au fichier main              | 197 022 octets | 165 707 octets |

Gain brut initial : 31,32 kB, environ 6,25 %. Le build ne déclenche plus
l’avertissement de 500 kB. Les légendes, infobulles, interactions, responsive
et destruction des instances sont conservés. Aucun chargement différé ni cache
HTTP n’est ajouté par cette modification.

Validation : 152 tests ChromeHeadless réussis, lint et compilation TypeScript
des specs sans erreur. Les tests importent désormais `Chart` depuis `chart.js`
pour éviter que l’enregistrement automatique masque un composant manquant.
Ces mesures portent sur le build, elles ne mesurent pas une durée réelle en 3G.

## Mutualisation des données et évaluation du découpage des routes

Après l’enregistrement sélectif, un parcours Chromium de production, cache
navigateur désactivé, effectue `/` → détail → `/` → détail → `/` en cliquant
les liens. Avant mutualisation : 5 requêtes JSON, après : 1. Aucun autre
provider de DataService ne recrée le service fourni à la racine.

`shareReplay({ bufferSize: 1, refCount: true })` partage la requête en cours
et conserve la réponse validée terminée pour la durée de vie de l’application.
Le cache est uniquement en mémoire : un rechargement de page demande le JSON
à nouveau. Si tous les consommateurs se désabonnent avant la réponse, la
requête est annulée, une prochaine souscription relance le chargement.
Une erreur HTTP ou de validation n’est pas conservée. Aucun TTL, polling ou
stockage persistant n’est introduit pour cet asset statique.

Le chargement différé du détail a été évalué puis retiré : 469,12 kB initiaux,
mais 134,70 kB de transfert estimé et un chunk de 3,87 kB à la première visite.
Il ajoutait une requête sans gain suffisant sur ce petit projet et ses dépendances
partagées. Le build final, cache inclus et routes directes conservées, mesure
471,97 kB initiaux et 134,42 kB de transfert estimé, sans avertissement de budget.

Validation finale : 158 tests ChromeHeadless passent, dont partage concurrent,
annulation au départ du dernier consommateur, cache des collections vides,
reprise après erreurs HTTP et de validation, navigation, titres et focus.
Le parcours de production conserve les deux requêtes JavaScript initiales et
ne déclenche aucune exception navigateur. Le serveur local utilisé ne compresse
pas les réponses, les mesures réseau ne représentent pas un hébergement réel.

Contrôle réseau simulé du build final : 400 kbit/s et 400 ms de latence,
cache navigateur désactivé, serveur local sans compression. Le canvas initial
est présent après 10,83 s, dont 9,89 s pour le fichier main, le JSON prend
0,45 s et n’est chargé qu’une fois sur le parcours de cinq pages. Aucune
exception navigateur. Il s’agit d’une seule exécution et de la présence du
canvas, pas d’un score Lighthouse ni d’une mesure de dessin final.
Ces résultats confirment la limite du débit au premier chargement, la
compression gzip/Brotli et le cache des assets versionnés devront être
vérifiés sur l’hébergement cible pour mesurer le temps réellement livré.

## Chargement des graphiques à leur entrée dans la zone visible

Après `bf14693`, les deux pages placent le composant graphique dans
`@defer (on viewport)`. Les données, indicateurs et liens du tableau se
chargent indépendamment de Chart.js. Un emplacement gris conserve la hauteur
attendue, un statut annonce le chargement du chunk et une erreur visible
renvoie aux données du tableau si celui-ci échoue. Aucun changement d’URL.

Build : 471,97 → 307,13 kB initiaux, transfert estimé initial
134,42 → 86,19 kB. Le chunk graphique partagé mesure 174,94 kB bruts
(53,56 kB de transfert estimé) et se charge une seule fois à sa première
utilisation. Le total initial + différé augmente légèrement à cause du
découpage et du mécanisme de déclenchement, le bénéfice porte sur le chemin
critique d’affichage, pas sur une suppression de la bibliothèque.

Lighthouse 13.5.0, profil mobile par défaut, Chromium local, serveur de
production sans compression, une mesure avant et une mesure finale :

| Mesure                            |   Avant |   Après |
| --------------------------------- | ------: | ------: |
| Score performance                 |      79 |      83 |
| Premier affichage (FCP)           |   3,2 s |   2,5 s |
| Plus grand affichage (LCP)        |   3,7 s |   3,7 s |
| Blocage total (TBT)               |  230 ms |  200 ms |
| Déplacement de mise en page (CLS) |       0 |       0 |
| JavaScript inutilisé estimé       | 178 KiB | 178 KiB |

L’alerte ne disparaît pas si le graphique est visible pendant l’audit : le
chunk est alors chargé et son code non exécuté au cours de ce scénario est
comptabilisé. La valeur locale diffère des 149 KiB signalés par l’utilisateur,
le serveur local ne compresse pas ses réponses. Ces mesures uniques ne
constituent pas un gain garanti sur chaque exécution ou hébergement.

À 320 × 400 px, un contrôle Chromium confirme que les cinq lignes et les liens
du tableau sont présents sans canvas ni requête du chunk graphique. Le
défilement jusqu’à son emplacement charge le chunk et affiche le canvas sans
débordement horizontal. Les tests rendent explicitement les blocs différés
pour vérifier les calculs, la navigation et la destruction des graphiques,
un test supplémentaire couvre le tableau avant le graphique et le message
d’erreur de chargement. 159 tests, lint et TypeScript des specs passent.

## Cache HTTP des visites répétées

`serve.json` configure le serveur de prévisualisation :

- JS/CSS Angular nommés `main`, `polyfills`, `styles` ou `chunk`, avec un hash
  de huit caractères : `public, max-age=31536000, immutable`.
- HTML, JSON et autres fichiers sans version dans leur nom : `no-cache`,
  avec revalidation ETag. Les réponses peuvent être conservées mais doivent
  être validées avant réutilisation, le HTML ne reste pas figé pendant un an.

Le script `pnpm run preview` charge explicitement cette configuration et garde
le repli SPA. Contrôles HTTP réels sur les cinq JS/CSS produits par le build,
`/`, `/index.html`, `/country/1`, le JSON et le favicon : en-têtes attendus sur
les réponses 200, ETag présents et réponse 304 aux requêtes conditionnelles.
Le repli `/country/1` retourne bien le HTML de l’application.

Chromium, cache activé, deux visites complètes `/` puis `/country/1` : les
cinq JS/CSS de la deuxième page affichent `transferSize = 0`, avec un graphique
rendu. Le JSON est revalidé. Décocher **Disable cache** pour reproduire cette
mesure, elle est distincte du cache en mémoire de DataService.

Ces règles sont celles de `serve`, pas une configuration du serveur Angular
de développement ou d’un hébergement externe. Le serveur/CDN de production
doit appliquer la même politique aux ressources effectivement servies.
Référence : [configuration des en-têtes de serve-handler](https://github.com/vercel/serve-handler#headers-array).

## Préchargement du graphique et des données — 9 octobre 2026

Le préchargement utilise désormais `index.preloadInitial` dans `angular.json`.
Le graphique d’accueil appartient au graphe initial, Angular génère les liens
sans rechercher ni injecter manuellement un nom hashé. Cette configuration
s’applique aussi aux commandes locales. Les mesures historiques qui suivent
concernaient l’ancienne injection après build.
`olympic.json` possède un `preload` de type `fetch` avec `crossorigin="anonymous"`.

Contrôle Chromium à cache froid, avec `main` volontairement retardé : le JSON
et le module graphique sont découverts par le parseur HTML avant l'exécution
de `main`. Une seule ressource transférée pour chacun, le graphique est rendu
sans erreur JavaScript. Les départs mesurés sont 15,7 ms pour le JSON et 16,2 ms
pour le graphique. Ces temps locaux ne constituent pas une garantie réseau.

Après les ajustements du tooltip et de la navigation du tableau, le build
initial mesure 289,39 kB bruts (79,97 kB estimés au transfert), et le module
graphique 181,25 kB bruts (55,70 kB estimés). Lint et 170 tests passent.
Le CLS mobile reproduit à 0,456 avec la feuille globale retardée de deux secondes
passe à zéro après désactivation de `inlineCritical` : la feuille complète
minifiée est chargée avant le premier rendu. Les scores Lighthouse précédents
ne constituent pas une nouvelle mesure complète de cette révision.

## Réactivation du CSS critique — 9 octobre 2026

La correction actuelle remplace la désactivation décrite ci-dessus :
`inlineCritical` est activé, les styles communs de mise en page sont inclus avec
les composants des pages et le titre de repli reprend la classe masquée de
l’accueil. Activer uniquement `inlineCritical` reproduisait un CLS de 0,23.
Après correction, une feuille globale retardée de deux secondes produit un CLS
de zéro sur l’accueil et la France, à 320, 768 et 1280 px. Le détail des contrôles
actuels figure dans [VALIDATION.md](VALIDATION.md).
