# OlympicGamesStarter

Application Angular 21 standalone de consultation des statistiques olympiques,
avec graphiques Chart.js et données locales dans `src/assets/mock/olympic.json`.

Les conventions de contribution et de commits atomiques sont décrites dans
[CONTRIBUTING.md](CONTRIBUTING.md). Les vérifications de migration sont consignées
dans [MIGRATION.md](docs/migration/MIGRATION.md).

## Repères dans le dépôt

| Emplacement               | Contenu                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `src/`                    | Application Angular et tests unitaires                        |
| `e2e/`                    | Tests navigateur Playwright                                   |
| `scripts/`                | Build, prévisualisation et mesures de performance             |
| [`docs/`](docs/README.md) | Architecture, migration, décisions et validations             |
| `doc/`                    | Maquettes et rapports locaux                                  |
| `documentation/`          | Documentation Compodoc générée                                |
| Racine                    | README, contribution, manifestes et configurations des outils |

L’[index de documentation](docs/README.md) permet de retrouver les documents par sujet.

## Prérequis

- Node.js 24.x, sélectionné dans `mise.toml`.
- pnpm **12.10.1**, fixé dans `package.json` et `mise.toml`.
- Chrome ou Chromium pour les tests Karma.

Angular 21 accepte Node.js `^20.19.0`, `^22.12.0` ou `^24.0.0`, TypeScript
`>=5.9.0 <6.0.0` et RxJS `^6.5.3` ou `^7.4.0`, selon la
[matrice officielle Angular](https://angular.dev/reference/versions).
Le projet utilise Node.js 24 et les versions résolues dans `pnpm-lock.yaml`.

Si mise est installé, depuis la racine du dépôt :

```bash
mise install
mise exec -- node --version
mise exec -- pnpm --version
```

Pour les commandes ci-dessous, activer mise dans le shell ou les préfixer par
`mise exec --`. Sans mise, installer Node.js 24 et pnpm 12.10.1 suivant les
[instructions pnpm](https://pnpm.io/installation), puis vérifier leurs versions.

## Installation et développement

```bash
pnpm install --frozen-lockfile
pnpm start
```

Ouvrir <http://localhost:4200>. Le serveur recharge l'application après une
modification des sources. `pnpm-lock.yaml` est le lockfile du projet, ne pas
le modifier à la main. Une installation figée échoue si le manifeste et le
lockfile ne correspondent pas.

Pour exposer le serveur depuis un environnement distant :

```bash
pnpm start --host 0.0.0.0 --port 4200
```

Ajouter une dépendance avec `pnpm add <package>` ou une dépendance de développement
avec `pnpm add -D <package>`, puis versionner ensemble `package.json` et
`pnpm-lock.yaml`. Les autorisations de scripts de dépendances sont définies dans
`pnpm-workspace.yaml`, toute nouvelle autorisation doit être examinée.

## Compiler, tester et vérifier le code

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test --watch=false
pnpm run build
```

Le build utilise la configuration de production par défaut et écrit les fichiers
statiques dans `dist/olympic-games-starter/browser/`. Pour un build de développement :

```bash
pnpm run build --configuration development
```

`pnpm run build` utilise Angular CLI puis ajoute le préchargement du module
graphique dans le HTML, à partir du nom hashé trouvé dans `stats.json`.
`optimization` et `aot` restent activés en production : minification JS/CSS et
tree-shaking. La feuille de styles complète est chargée avant le premier rendu
pour éviter les déplacements de mise en page liés aux styles différés.
Angular génère les liens `modulepreload` de son graphe initial. La page d’accueil
est incluse dans le bundle initial, la page pays utilise `loadComponent` et se
télécharge lorsqu’elle est visitée. Les graphiques utilisent `@defer` après une
réponse valide : affichage à l’entrée dans le viewport et préchargement sur idle.
Le module graphique et `olympic.json` sont préchargés depuis le HTML initial,
en parallèle des ressources initiales. Le module reste différé pour son
exécution, DataService valide les données et partage la réponse.
Un appel direct à `ng build` contourne l'ajout du `modulepreload` du graphique.
Le build copie uniquement `robots.txt`, les données JSON et les versions
WebP des bannières TéléSport compacte et panoramique. Le PNG original reste dans les sources.
La bannière commune renvoie à l’accueil et remplace les liens « Go back ».
Elle utilise `srcset`, des dimensions réservées et un ratio fixe pour limiter
le transfert et éviter les déplacements de mise en page : 10,5 kB à 874 px et
5 kB à 438 px, contre 172 kB pour le PNG.
Le favicon est intégré en base64 dans le lien `rel="icon"` : aucune
requête réseau n’est nécessaire pour l’icône de l’onglet. Si `src/favicon.ico`
change, mettre également à jour sa copie base64 dans `src/index.html`.
Angular gère le nom hashé des modules à chaque build.

Les tests utilisent Karma/Jasmine, des réponses HTTP simulées pour le service
et des doubles de `DataService` pour les pages. Ils couvrent
les routes, les statistiques affichées et les graphiques des pages connues.
`karma.conf.cfg` détecte les exécutables Linux usuels de Chrome ou Chromium.
Une variable `CHROME_BIN` déjà définie reste prioritaire. Si nécessaire,
la définir avec le chemin du navigateur installé. La configuration sélectionne
un lanceur adapté lorsque les tests s'exécutent comme root.

Pour surveiller les tests pendant le développement :

```bash
pnpm test
```

Pour vérifier séparément les configurations TypeScript :

```bash
pnpm tsc --noEmit -p tsconfig.app.json
pnpm tsc --noEmit -p tsconfig.spec.json
```

## Générer la documentation Angular

La documentation HTML séparée est générée avec [Compodoc](https://compodoc.app/).
Les commentaires `/** ... */` dans les sources documentent les contrats métier,
les états de présentation, le cache HTTP et le cycle de vie des graphiques.
Les balises Compodoc précisent uniquement les contrats qui en ont besoin.
Les exemples détaillés du graphique sont dans son fichier `chart.component.md`,
affiché dans un onglet de la documentation générée.
Les [conventions du projet](docs/compodoc-conventions.md)
précisent la portée des commentaires et les références officielles consultées.
Les commentaires `//` expliquent localement le code et ne remplacent pas les
descriptions JSDoc des symboles.

```bash
pnpm run docs
pnpm run docs:check
pnpm run docs:serve
```

`docs` génère le site dans `documentation/`. `docs:check` impose une couverture
documentaire de 100 %, globalement et par fichier. `docs:serve` régénère le site
et le sert sur <http://127.0.0.1:8080>. Depuis le menu **Composants**,
ouvrir **CountryComponent** pour consulter sa description, ses propriétés et
ses méthodes. Les fonctions sont accessibles dans la section des éléments divers.
Préfixer les commandes par `mise exec --` si mise n'est pas activé dans le shell.

`tsconfig.doc.json` limite l'analyse à `src/app/**/*.ts` et exclut les tests.
Le dossier HTML généré est ignoré par Git, les commentaires, la configuration
et le lockfile permettent de le reconstruire. Après un changement de commentaire,
relancer la génération. Cet outil documente la structure Angular existante,
les symboles sans description métier auront seulement leur documentation structurelle.

## Analyser le JavaScript de production

```bash
pnpm run build:analyze
pnpm run preview
```

La commande combine les configurations `production,analysis` : elle conserve
les optimisations de production et génère les source maps JavaScript, avec
le contenu des sources et les maps disponibles des dépendances, ainsi que
`dist/olympic-games-starter/stats.json`. Les fichiers `.js.map` et leurs liens
`sourceMappingURL` permettent à Chrome DevTools de retrouver les fichiers
originaux. Utiliser l’onglet Coverage pendant la navigation et les interactions
pour identifier le code non exécuté. Importer `stats.json` dans
[l’analyseur officiel esbuild](https://esbuild.github.io/analyze/) pour examiner
la composition des bundles. Les source maps facilitent l’analyse, elles ne
réduisent pas elles-mêmes le JavaScript.

`pnpm run build` régénère le build de production habituel sans source maps.
Voir la [configuration des source maps Angular](https://angular.dev/reference/configs/workspace-config#source-map-configuration).

## Prévisualiser le build de production

```bash
pnpm run build
pnpm run preview
```

Ouvrir l’adresse affichée par le serveur. `pnpm dlx serve -s --config serve.json`
peut télécharger `serve` et utilise la configuration suivie dans le dépôt.
Elle sert le build avec un repli SPA pour les URL comme `/country/1`.

Les fichiers JavaScript et CSS versionnés par le hash Angular sont servis avec
`Cache-Control: public, max-age=31536000, immutable` (un an). Chaque nouveau
contenu produit un nouveau nom de fichier. Le HTML, le JSON et les assets sans
hash utilisent `Cache-Control: no-cache` : le navigateur peut les conserver,
mais doit les revalider avant réutilisation. `serve` fournit les ETag permettant
une réponse 304 lorsque le contenu n’a pas changé.

Pour contrôler une visite répétée, décocher **Disable cache** dans les outils
réseau puis revisiter la page, les fichiers versionnés peuvent être repris du
cache. Le rechargement forcé peut contourner le cache. Les données en mémoire
partagées par DataService s’appliquent uniquement pendant la session Angular.

Cette configuration s’applique à `pnpm run preview`. Sur un autre hébergement,
reprendre les mêmes règles HTTP et vérifier les en-têtes réellement retournés.
Le déploiement GitHub Pages est décrit dans la section de livraison ci-dessous.
Le serveur de tests préfixé utilise `no-cache` pour toutes les ressources afin de
comparer les premières visites, il ne remplace pas les règles de cache de l’hébergement.

## États des pages

Les pages affichent un message pendant le chargement, les indicateurs et le
graphique après succès, un message en l'absence de données et une erreur
compréhensible en cas d'échec réseau ou HTTP. Un pays sans participations conserve
son titre et ses compteurs à zéro, avec un message de série vide.

`DataService` traduit les erreurs en `DataLoadError` et conserve l'erreur technique
comme cause pour le diagnostic, les templates affichent uniquement le message
utilisateur. Un pays absent est distingué d'une panne HTTP.

Avant de transmettre une réponse aux pages, `DataService` reçoit un contenu
`unknown` et le valide à l'exécution : collection de pays, champs obligatoires,
textes non vides, compteurs entiers sûrs et non négatifs, identifiants et
années entiers positifs sûrs. Les identifiants de pays sont uniques dans la
collection, ceux des participations sont uniques au sein de chaque pays.
Une collection vide ou un pays sans participations reste valide. Les champs
supplémentaires sont conservés et aucune conversion implicite n'est appliquée.
Un contenu invalide fait échouer toute la réponse et affiche une erreur de données.

Chaque page possède un signal privé d’état unique, exposé en lecture seule.
Les variantes chargées contiennent un modèle d’affichage préparé par des fonctions
pures, le feedback reçoit uniquement le statut et le message éventuel. RxJS compose le
chargement et, pour le pays, les paramètres de route avec `switchMap`.
`ActivatedRoute` fournit l’ID, la page charge la collection avec
`DataService.getOlympics` et une fonction pure sélectionne le pays. Un chargement validé est partagé et conservé en mémoire jusqu’au
rechargement de l’application. Les navigations réutilisent ces données statiques,
les erreurs ne sont pas mémorisées et une nouvelle tentative reste possible. Les
abonnements utilisent `takeUntilDestroyed` : quitter la page annule une requête
HTTP encore en cours si aucun autre consommateur ne l’utilise et arrête
l’écoute des paramètres.

`OlympicChartComponent` utilise
`@defer (on viewport; prefetch on idle)` à l’intérieur de l’état de succès :
les indicateurs et la description accessible
restent disponibles avant le graphique. Un
emplacement de même hauteur limite les déplacements de mise en page, et un
message explicite signale un échec du chargement JavaScript du graphique.
Le bloc est créé après une réponse valide, les états d’erreur et vide ne
créent aucune instance Chart.js. Les préchargements de modules dans le HTML sont
conservés et peuvent néanmoins transférer le code du graphique. Le graphique est
créé lorsque son emplacement devient visible. Les états d’erreur et vide gardent
le panneau masqué. Les infobulles Chart.js sont conservées, les pays et leurs
couleurs sont identifiés dans le tableau de l’accueil.
Voir la [documentation Angular sur le préchargement des blocs différés](https://angular.dev/guide/templates/defer#prefetching-data-with-prefetch).
Le composant possède son canvas et reçoit uniquement le type du
graphique, ses éléments `{ label, value }` et la description accessible. `afterRenderEffect` crée le graphique
une fois le canvas disponible, détruit l'instance précédente avant remplacement
des données et libère l'instance au retrait du composant. `ChartRenderer`
enregistre uniquement les contrôleurs pie/line, leurs éléments et échelles,
ainsi que la légende et les infobulles de Chart.js, la sélection d'un pays remonte à la page, qui gère la
navigation. Aucun graphique ne dépend d'un identifiant global de canvas.

L’application utilise la détection des changements zoneless et des composants
`OnPush` : les signaux et les entrées déclenchent leurs mises à jour. Zone.js
reste disponible pour les tests, mais est absent du build de l’application.
Les graphiques affichent directement leur résultat, sans animation initiale.
Le HTML fournit un message de chargement avant le démarrage d’Angular et une
indication lorsque JavaScript est désactivé.

Les URL publiques utilisent `/country/:id`, avec un identifiant entier positif
sûr (par exemple `/country/1`). Les anciennes URL par nom ne sont plus valides.
La configuration actuelle utilise `withHashLocation` : dans le navigateur,
les liens sont de la forme `/#/country/1`.
Un ID mal formé est rejeté sans requête JSON. Un ID absent de la collection
validée affiche `Country not found.`. `/country` et les URL hors des routes
définies affichent la page inconnue. La bannière TéléSport renvoie à `/`.
Le titre du document reprend le nom du pays chargé. Le clic du graphique et
la sélection directe dans Chart.js utilise les mêmes ID, indépendamment des libellés.
Les tests couvrent les accès directs, l’historique simulé et l’annulation des
requêtes lors de changements rapides de pays.
Les routes avec hash ne demandent aucun repli serveur pour les fiches : le serveur
reçoit toujours la racine du site préfixé. Le rechargement direct de la France est
vérifié sur le build de production par Playwright et par le contrôle post-déploiement.

## Métadonnées et indexation

Le document HTML fournit une description, le nom de l’application, une couleur
de thème et les métadonnées Open Graph de base pour les aperçus de liens. La
langue reste anglaise, comme l’interface, et les titres de pages sont gérés
par le routeur et les données du pays.

`src/robots.txt` est copié à la racine du build et accessible à `/robots.txt`.
Il autorise l’exploration de toutes les pages. Aucune balise `noindex` ou
`nofollow` ni aucun en-tête `X-Robots-Tag` n’est envoyé par la configuration
locale, afin de permettre le contrôle d’indexabilité de Lighthouse. Le site
peut donc être indexé s’il est publié, l’indexation effective dépend des
moteurs de recherche. Aucun sitemap n’est publié.

## Interface responsive

Pendant le chargement, un squelette statique représente le titre, les deux
indicateurs de l’accueil ou les trois du détail, puis le graphique. Les blocs
sont masqués aux lecteurs d’écran, la région de statut annonce le chargement.
Le squelette est retiré dès la réception des données ou d’une erreur.

L’accueil suit la maquette `doc/UI/desktop/home.png` : bannière TéléSport
panoramique, deux cartes d’indicateurs et panneau réunissant le camembert
et le tableau Country / Medals / Percentage. Les valeurs et pourcentages
proviennent des participations réelles. Les libellés et les valeurs sont
également dessinés sur le camembert. Sur mobile, le tableau passe sous
le graphique et la bannière compacte conserve la lisibilité du titre.
Les textes de la bannière sont des éléments HTML distincts de son fond décoratif
préchargé. Sur la page pays, toute la bannière permet de revenir à l’accueil.
Le détail pays suit `doc/UI/desktop/detail_country.png` : même bannière
panoramique, filtre avec drapeaux dans un popover natif, trois cartes d’indicateurs
et courbe remplie avec les valeurs des participations. La liste reprend le style
du bouton, exclut le pays sélectionné et affiche les autres pays sans défilement
interne. Tab parcourt les options, Entrée choisit un pays, Échap ou un clic extérieur
ferme la liste. Les cartes sont empilées sur mobile, Tab parcourt
les trois années directement dans le canvas. Le graphique se charge aussi
sur idle pour rester accessible au clavier lorsqu’il est sous le viewport.

La mise en page et les graphiques sont vérifiés à 320, 480, 768, 1024 et
1280 pixels. Les constats, mesures, états et limites sont consignés dans
[UI-VALIDATION.md](docs/validation/UI-VALIDATION.md).

La structure utilise `header`, `nav` et un unique `main`. Chaque page forme
une `section` reliée à son titre, les graphiques sont des `figure` avec
`figcaption`, et les statistiques utilisent `dl`, `dt` et `dd`.

Les données des graphiques sont décrites dans un texte destiné aux lecteurs
d'écran, relié au canvas par `aria-describedby`. La sélection des pays au
clavier se fait directement dans le canvas : Tab passe au pays ou à l’année
suivante et Maj+Tab revient à la précédente. Aux extrémités, le focus sort
normalement du graphique. Les flèches, Home et End restent disponibles.
Entrée ou Espace ouvre le pays sélectionné. La sélection est surlignée et annoncée.
Le canvas contient aussi les valeurs comme texte de remplacement et son
fond blanc est peint directement à chaque dessin.
Tab et Maj+Tab parcourent le lien TéléSport, le titre et la description de la
bannière, les titres de page, chaque indicateur,
le graphique sans piège de focus. Le lien « Skip to main
content » est supprimé à la demande du projet. Après une navigation,
le titre de la nouvelle page reçoit le focus. À l’accueil, le focus vise
« Medals per Country » sans faire apparaître de titre masqué par-dessus. Les
contrastes et les régions d'annonce ont été vérifiés sur le périmètre décrit
dans [ACCESSIBILITY.md](docs/validation/ACCESSIBILITY.md). L'écoute avec un lecteur d'écran
et l'audit RGAA complet restent à réaliser.

## Éditeur et architecture

Ouvrir la racine du dépôt dans VS Code dans l'environnement où les dépendances
sont installées. Les extensions recommandées sont dans `.vscode/extensions.json`,
ESLint est configuré par `eslint.config.js` et se lance avec `pnpm run lint`.
Les types Jasmine sont chargés par `tsconfig.spec.json`, le `tsconfig.json`
racine référence les configurations de l'application et des tests.

La structure actuelle est la suivante :

- `src/main.ts` démarre `AppComponent` avec `bootstrapApplication` et signale les erreurs.
- `src/app/app.config.ts` fournit le routeur, HTTP et la détection des changements zoneless.
- `src/app/app.routes.ts` définit `/`, `/country/:id`, `/not-found` et le repli vers la page inconnue.
- `src/app/pages/` contient les pages standalone, les calculs purs, les modèles d’affichage et leurs tests.
- `src/app/olympics/header/` contient `HeaderComponent`, qui affiche le titre et les indicateurs fournis par les pages d'accueil et de pays.
- `src/app/services/data.service.ts` centralise l'URL et le chargement HTTP, les pages injectent `DataService`.
- `src/app/models/olympic.ts` décrit les pays et participations, il ne valide pas les réponses HTTP à l'exécution.
- `src/assets/mock/olympic.json` contient les données de démonstration.
- `src/test.ts` initialise les tests Angular avec `@angular/platform-browser-dynamic`.

Les étapes Angular 18 → 19 → 20 → 21 sont déjà présentes dans l'historique.
Le développement courant utilise Angular 21, les plages du manifeste restent
sur cette majeure. [architecture.md](docs/architecture/architecture.md) décrit l’implémentation actuelle,
[notes-architecture.md](docs/architecture/notes-architecture.md) conserve les constats historiques.

## Parcours navigateur sur le build de production

```bash
pnpm exec playwright install chromium
pnpm run build:e2e
pnpm run test:e2e
```

Playwright démarre le serveur statique du dépôt sur
<http://127.0.0.1:4187/p2-angular-maintainable-frontend/>. Le serveur prend en charge
ce préfixe et les types MIME JavaScript, il n'utilise aucun téléchargement à
l'exécution. Le port doit être libre. Les tests couvrent les parcours, le cache,
les accès directs, les erreurs et le clavier, les captures à 320, 768 et 1280 px
sont jointes au rapport dans `playwright-report/` et `test-results/` (ignorés par Git).

Pour utiliser un Chromium système déjà installé :

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm run test:e2e
```

Cette variable s'applique aussi aux scripts de mesure et de vérification après
livraison. La CI installe Chromium et ses dépendances système conformément à la
[documentation Playwright](https://playwright.dev/docs/ci). Pour consulter
manuellement le build préfixé, utiliser `pnpm run preview:production`.

## Formatage, mesures et livraison

`pnpm run format` applique [Prettier](https://prettier.io/docs/install) et
`pnpm run format:check` contrôle les fichiers.
Les artefacts, rapports, images et le lockfile sont exclus. Les règles métier
additionnent les effectifs par édition et trient une copie des participations par
année, les années égales restent dans leur ordre initial.

Avec le serveur de production lancé, mesurer trois fois l'accueil et la France :

```bash
pnpm run perf:measure http://127.0.0.1:4187/p2-angular-maintainable-frontend/ validation-artifacts/after
pnpm run perf:compare validation-artifacts/before validation-artifacts/after
```

La comparaison produit les médianes du LCP, du CLS, du transfert total et du
JavaScript chargé pendant la visite initiale, y compris le graphique préchargé.
Elle échoue si le JavaScript augmente de plus de 5 % ou le LCP de plus de 10 %.
Les deux dossiers doivent provenir du même navigateur, serveur et profil mobile
Lighthouse. Voir [VALIDATION.md](docs/validation/VALIDATION.md) pour les résultats et limites.

Le workflow vérifie les PR et `main`, puis déploie uniquement depuis `main` après
réussite des contrôles. Il réutilise le build validé et vérifie ensuite le HTML,
les données et les pages dans Chromium. Les notes de décision décrivent
[les états](docs/decisions/001-page-state.md), [le cache](docs/decisions/002-http-cache.md)
et [Chart.js](docs/decisions/003-chart-boundary.md).

Pour revenir à une version précédente, créer un commit qui rétablit la révision
fonctionnelle (ou annule les commits responsables), le faire vérifier puis fusionner
sur `main`. Le pipeline valide et livre cet état, aucune réécriture de l'historique
n'est nécessaire. Un lancement manuel du workflow doit également cibler `main`.
