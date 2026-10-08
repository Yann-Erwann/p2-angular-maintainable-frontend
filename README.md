# OlympicGamesStarter

Application Angular 21 standalone de consultation des statistiques olympiques,
avec graphiques Chart.js et données locales dans `src/assets/mock/olympic.json`.

Les conventions de contribution et de commits atomiques sont décrites dans
[CONTRIBUTING.md](CONTRIBUTING.md). Les vérifications de migration sont consignées
dans [MIGRATION.md](MIGRATION.md).

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
modification des sources. `pnpm-lock.yaml` est le lockfile du projet ; ne pas
le modifier à la main. Une installation figée échoue si le manifeste et le
lockfile ne correspondent pas.

Pour exposer le serveur depuis un environnement distant :

```bash
pnpm start --host 0.0.0.0 --port 4200
```

Ajouter une dépendance avec `pnpm add <package>` ou une dépendance de développement
avec `pnpm add -D <package>`, puis versionner ensemble `package.json` et
`pnpm-lock.yaml`. Les autorisations de scripts de dépendances sont définies dans
`pnpm-workspace.yaml` ; toute nouvelle autorisation doit être examinée.

## Compiler, tester et vérifier le code

```bash
pnpm run lint
pnpm exec ng test --watch=false
pnpm run build
```

Le build utilise la configuration de production par défaut et écrit les fichiers
statiques dans `dist/olympic-games-starter/browser/`. Pour un build de développement :

```bash
pnpm run build --configuration development
```

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
pnpm exec tsc --noEmit -p tsconfig.app.json
pnpm exec tsc --noEmit -p tsconfig.spec.json
```

## Prévisualiser le build de production

```bash
pnpm run build
pnpm run preview
```

Ouvrir l'adresse affichée par le serveur. Le script de prévisualisation utilise
`pnpm dlx serve -s dist/olympic-games-starter/browser` : il peut télécharger
`serve` et applique un repli SPA pour les URL comme `/country/1`.
Cet outil sert à vérifier le build localement ; la conteneurisation et les
réglages d'hébergement de production relèvent d'I19.

## États des pages

Les pages affichent un message pendant le chargement, les indicateurs et le
graphique après succès, un message en l'absence de données et une erreur
compréhensible en cas d'échec réseau ou HTTP. Un pays sans participations conserve
son titre et ses compteurs à zéro, avec un message de série vide.

`DataService` traduit les erreurs en `DataLoadError` et conserve l'erreur technique
comme cause pour le diagnostic ; les templates affichent uniquement le message
utilisateur. Un pays absent est distingué d'une panne HTTP.

Avant de transmettre une réponse aux pages, `DataService` reçoit un contenu
`unknown` et le valide à l'exécution : collection de pays, champs obligatoires,
textes non vides, compteurs numériques finis et non négatifs, identifiants et
années entiers positifs sûrs. Les identifiants de pays sont uniques dans la
collection ; ceux des participations sont uniques au sein de chaque pays.
Une collection vide ou un pays sans participations reste valide. Les champs
supplémentaires sont conservés et aucune conversion implicite n'est appliquée.
Un contenu invalide fait échouer toute la réponse et affiche une erreur de données.

Chaque page possède un signal d'état unique contenant les données ou le message
d'erreur ; les statistiques sont dérivées avec `computed`. RxJS compose le
chargement et, pour le pays, les paramètres de route avec `switchMap`.
`ActivatedRoute` fournit l’ID ; `DataService.getCountryById` charge et sélectionne
le pays. Un changement d’ID annule la requête précédente et relance le chargement. Les
abonnements utilisent `takeUntilDestroyed` : quitter la page annule une requête
HTTP encore en cours et arrête l'écoute des paramètres.

`OlympicChartComponent` possède son canvas et reçoit uniquement le type du
graphique, ses libellés et ses valeurs. `afterRenderEffect` crée le graphique
une fois le canvas disponible, détruit l'instance précédente avant remplacement
des données et libère l'instance au retrait du composant. `ChartRenderer`
encapsule Chart.js ; la sélection d'un pays remonte à la page, qui gère la
navigation. Aucun graphique ne dépend d'un identifiant global de canvas.

Les URL publiques utilisent `/country/:id`, avec un identifiant entier positif
sûr (par exemple `/country/1`). Les anciennes URL par nom ne sont plus valides.
Un ID mal formé est rejeté sans requête HTTP ; un ID absent de la collection
validée affiche `Country not found.`. `/country` et les URL hors des routes
définies affichent la page inconnue. Tous les liens de retour ciblent `/`.
Le titre du document reprend le nom du pays chargé. Le clic du graphique et
les liens du tableau utilisent les mêmes ID, indépendamment des libellés.
Les tests couvrent les accès directs, l’historique simulé et l’annulation des
requêtes lors de changements rapides de pays.
Le repli serveur nécessaire au rechargement des URL profondes en production
reste à configurer et vérifier dans I19.

## Interface responsive

Les pages utilisent une grille de 4 colonnes sur mobile (≤ 767 px), 8 sur
tablette (768–1199 px) et 12 sur desktop (≥ 1200 px). Le graphique et
le tableau sont côte à côte sur desktop ; ils sont empilés aux autres tailles.
Les indicateurs sont empilés sur mobile.

La mise en page et les graphiques sont vérifiés à 320, 480, 768, 1024 et
1280 pixels. Les constats, mesures, états et limites sont consignés dans
[UI-VALIDATION.md](UI-VALIDATION.md).

Chaque pays dispose d'un lien natif utilisable au clavier et les données
des graphiques sont aussi présentées dans des tableaux. Un lien d'évitement,
des titres de page et un focus visible accompagnent la navigation. Les
contrastes et les régions d'annonce ont été vérifiés sur le périmètre décrit
dans [ACCESSIBILITY.md](ACCESSIBILITY.md). L'écoute avec un lecteur d'écran
et l'audit RGAA complet restent à réaliser.

## Éditeur et architecture

Ouvrir la racine du dépôt dans VS Code dans l'environnement où les dépendances
sont installées. Les extensions recommandées sont dans `.vscode/extensions.json` ;
ESLint est configuré par `eslint.config.js` et se lance avec `pnpm run lint`.
Les types Jasmine sont chargés par `tsconfig.spec.json` ; le `tsconfig.json`
racine référence les configurations de l'application et des tests.

La structure actuelle est la suivante :

- `src/main.ts` démarre `AppComponent` avec `bootstrapApplication` et signale les erreurs.
- `src/app/app.config.ts` fournit le routeur, HTTP et la détection des changements avec Zone.js.
- `src/app/app.routes.ts` définit `/`, `/country/:id`, `/not-found` et le repli vers la page inconnue.
- `src/app/pages/` contient les pages standalone et leurs tests.
- `src/app/olympics/header/` contient `HeaderComponent`, qui affiche le titre et les indicateurs fournis par les pages d'accueil et de pays.
- `src/app/services/data.service.ts` centralise l'URL et le chargement HTTP ; les pages injectent `DataService`.
- `src/app/models/olympic.ts` décrit les pays et participations ; il ne valide pas les réponses HTTP à l'exécution.
- `src/assets/mock/olympic.json` contient les données de démonstration.
- `src/test.ts` initialise les tests Angular avec `@angular/platform-browser-dynamic`.

Les étapes Angular 18 → 19 → 20 → 21 sont déjà présentes dans l'historique.
Le développement courant utilise Angular 21 ; les plages du manifeste restent
sur cette majeure. Les documents [architecture.md](architecture.md) et
[notes-architecture.md](notes-architecture.md) décrivent également des travaux
prévus et des constats historiques.
