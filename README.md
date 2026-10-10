# TéléSport — Olympic Games

Application Angular 21 standalone permettant de comparer les médailles olympiques
et de consulter les résultats d’un pays. Les données locales sont dans
`src/assets/mock/olympic.json`, les graphiques utilisent Chart.js.

## Démarrer

Prérequis : Node.js 24 et pnpm 12.10.1. Les tests unitaires utilisent Vitest et
jsdom dans Node.js ; Chrome ou Chromium n’est requis que pour les tests E2E et
les audits Lighthouse.
Les versions sont fixées dans `mise.toml` et `package.json`.
Cloner le dépôt puis entrer dans son dossier :

```bash
git clone https://github.com/Yann-Erwann/p2-angular-maintainable-frontend.git
cd p2-angular-maintainable-frontend
```

Avec mise, exécuter `mise install` puis activer mise dans le shell ou préfixer
les commandes par `mise exec --`.

```bash
pnpm install --frozen-lockfile
pnpm start
```

Ouvrir <http://localhost:4200>. Pour un environnement distant :
`pnpm start --host 0.0.0.0 --port 4200`.

## Vérifier et compiler

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test --watch=false
pnpm run build
```

`pnpm run format` applique le formatage. `pnpm test` surveille les changements.
Les tests unitaires s’exécutent avec Vitest dans Node.js, sans lancer de navigateur.

Le build de production est écrit dans `dist/olympic-games-starter/browser/`.
Le build local utilise directement Angular CLI : minification JS/CSS,
tree-shaking et AOT sont activés. La configuration commune `index.preloadInitial` laisse Angular générer les liens
de préchargement des modules initiaux. Le graphique d’accueil est chargé avec
l’application en développement et en production. Avant les audits, le workflow
copie `index.html` en `404.html` afin que GitHub Pages serve le shell Angular
pour les navigations directes d’une SPA.
Le JSON et le fond de bannière sont préchargés depuis le HTML initial. Le graphique d’accueil apparaît dès que les données sont disponibles.
En production, Angular intègre le CSS critique au HTML et charge la feuille globale
sans bloquer le rendu. Les styles de mise en page sont chargés avec chaque page
pour éviter les déplacements lors de l’arrivée de cette feuille.

```bash
pnpm run preview
pnpm run build:analyze
```

`preview` sert le dernier build avec `serve.json`; `serve` est installé et verrouillé
dans les dépendances de développement.
Les fichiers JS/CSS hashés sont mis en cache un an, les ressources sans hash sont
revalidées. Ces règles concernent uniquement ce serveur local. Les en-têtes de
cache de GitHub Pages sont déterminés par le déploiement et ne sont pas définis
par `serve.json`.
`build:analyze` ajoute les source maps et `stats.json` pour examiner les bundles.
Relancer `pnpm run build` pour retrouver un build sans source maps.

Le routage utilise des URL sans `#`.
Les anciennes adresses `/#/country/:id` sont converties vers `/country/:id`
avant le démarrage ou lors de leur ouverture dans l’application déjà chargée.
Pour GitHub Pages, le workflow génère une entrée HTML par pays et un repli
`404.html`, avec le même chemin de base que
l’application. Un autre serveur doit renvoyer `index.html` pour les routes Angular.

## Pages et clavier

- **Accueil** (`/`) : nombre de pays et d’éditions, camembert et tableau
  Country / Medals / Percentage. Les liens du tableau ouvrent les pays.
- **Pays** (`/country/:id`) : participations, médailles, effectifs cumulés et
  courbe chronologique. Le filtre est un popover HTML contenant des boutons,
  sans `<select>`. Il exclut le pays courant et n’a pas de défilement interne.
- Un identifiant de pays invalide ou absent redirige vers `/not-found`.
  Les chargements, données vides et erreurs ont des états distincts.
  Un pays sans participation conserve son identité et ses compteurs à zéro.

La bannière conserve son fond décoratif WebP préchargé et ses textes HTML.
Sur la page pays, toute la bannière renvoie à l’accueil.
Tab et Maj+Tab parcourent ses textes, les indicateurs et les points du canvas,
puis sortent du graphique aux extrémités. Entrée ou Espace ouvre le pays sélectionné.
Les flèches, Home et End restent disponibles. Les valeurs sont aussi fournies
comme alternative textuelle accessible.

Dans le filtre, Entrée ou Espace ouvre ou sélectionne, Tab parcourt les options,
Échap ou un clic extérieur ferme le popover. Le bouton est désactivé au chargement.
Ces parcours sont testés automatiquement, la lecture avec des technologies
d’assistance reste à vérifier humainement.

## Tests navigateur et performances

Le workflow démarre le serveur de production sous
`/p2-angular-maintainable-frontend/` sur le port 4187 avec Playwright pour les tests navigateur et les audits Lighthouse.
Les tests Playwright vérifient navigation, cache, erreurs, clavier et affichage responsive.
Pour tester localement un build servi à la racine :

```bash
pnpm exec playwright install chromium
pnpm run build
pnpm run preview
```

Dans un autre terminal, avec l’adresse affichée par `preview` :

```bash
PRODUCTION_SERVER_URL=http://localhost:3000/ pnpm run test:e2e
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` permet d’utiliser un navigateur
système. Les rapports sont dans `playwright-report/` et `test-results/`.

Les tests `e2e/lighthouse.spec.ts` lancent Chromium avec Playwright et exécutent
Lighthouse sur l’accueil et chaque pays du JSON livré, en mobile et desktop,
avec trois passages. Chaque catégorie (performance, accessibilité, bonnes
pratiques et SEO) doit atteindre au moins 80 à chaque passage. Les audits
n’ont aucun retry : un score inférieur à 80, absent ou une erreur fait échouer
les tests et bloque le déploiement. Les rapports JSON et HTML sont joints au rapport
Playwright. En CI, ils sont conservés dans l’artefact `validation-reports`, avec
`playwright-report/` et `test-results/`, même en cas d’échec.
Les routes d’erreur HTTP 404 restent couvertes par les tests fonctionnels.

Pour exécuter uniquement Lighthouse sur le build préfixé :

```bash
pnpm run build:e2e
cp dist/olympic-games-starter/browser/index.html dist/olympic-games-starter/browser/404.html
pnpm run test:e2e --project=lighthouse
```

Playwright démarre automatiquement le serveur local si `PRODUCTION_SERVER_URL`
n’est pas renseigné. Les rapports locaux sont disponibles dans
`playwright-report/` et `test-results/`.

La CI vérifie le code, génère Compodoc et audite le build de production préfixé
avant de livrer ce même artefact sur GitHub Pages depuis `main`.
Après publication, elle contrôle le HTML de la livraison, les
données, les ressources et les erreurs JavaScript, puis parcourt l’accueil et
la France avec rechargement direct et retour à l’accueil. Les diagnostics sont
conservés 14 jours. Un contrôle échoué fait échouer le job, le site déjà publié
reste en ligne : corriger ou rétablir la version précédente par un nouveau commit.

## Repères et documentation

| Emplacement                  | Contenu                                               |
| ---------------------------- | ----------------------------------------------------- |
| `src/app/olympics/pages/`    | Pages et leurs calculs/modèles d’affichage            |
| `src/app/olympics/services/` | Chargement, validation et cache des données           |
| `src/app/olympics/`          | Domaine, routes, UI et intégration Chart.js           |
| `e2e/`                       | Tests navigateur                                      |
| `.github/workflows/`         | Étapes de validation et de déploiement GitHub Actions |
| `.github/scripts/`           | Serveur local                                         |
| `docs/`                      | Architecture et décisions techniques                  |
| `doc/`                       | Maquettes, captures et rapports Lighthouse locaux     |

```bash
pnpm run docs
pnpm run docs:serve
```

Compodoc génère `documentation/`, versionné dans le dépôt. `docs:serve` régénère le site
et le sert sur <http://127.0.0.1:8080>. Les commentaires expliquent les contrats
et décisions utiles, sans objectif de couverture par symbole.

Voir l’[architecture](docs/architecture/architecture.md),
les [décisions d’architecture](docs/decisions/001-page-state.md),
le [cache HTTP](docs/decisions/002-http-cache.md),
la [frontière Chart.js](docs/decisions/003-chart-boundary.md) et les règles de
[contribution et de commits](CONTRIBUTING.md).
