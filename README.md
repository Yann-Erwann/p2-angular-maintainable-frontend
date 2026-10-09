# TéléSport — Olympic Games

Application Angular 21 standalone permettant de comparer les médailles olympiques
et de consulter les résultats d’un pays. Les données locales sont dans
`src/assets/mock/olympic.json`, les graphiques utilisent Chart.js.

## Démarrer

Prérequis : Node.js 24, pnpm 12.10.1 et Chrome ou Chromium pour les tests.
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
Karma détecte les navigateurs Linux usuels, `CHROME_BIN` permet d’en choisir un autre.

Le build de production est écrit dans `dist/olympic-games-starter/browser/`.
Le build local utilise directement Angular CLI : minification JS/CSS,
tree-shaking et AOT sont activés. La configuration commune `index.preloadInitial` laisse Angular générer les liens
de préchargement des modules initiaux. Le graphique d’accueil est chargé avec
l’application en développement et en production.
Le JSON et le fond de bannière sont préchargés depuis le HTML initial. Le graphique d’accueil apparaît dès que les données sont disponibles.

```bash
pnpm run preview
pnpm run build:analyze
```

`preview` sert le dernier build avec `serve.json` et peut télécharger `serve`.
Les fichiers JS/CSS hashés sont mis en cache un an, les ressources sans hash sont
revalidées. Ces règles doivent être adaptées à l’hébergement utilisé.
`build:analyze` ajoute les source maps et `stats.json` pour examiner les bundles.
Relancer `pnpm run build` pour retrouver un build sans source maps.

## Pages et clavier

- **Accueil** (`/#/`) : nombre de pays et d’éditions, camembert et tableau
  Country / Medals / Percentage. Les liens du tableau ouvrent les pays.
- **Pays** (`/#/country/:id`) : participations, médailles, effectifs cumulés et
  courbe chronologique. Le filtre est un popover HTML contenant des boutons,
  sans `<select>`. Il exclut le pays courant et n’a pas de défilement interne.
- Les chargements, données vides, pays absents et erreurs ont des états distincts.
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

Playwright démarre le serveur sous `/p2-angular-maintainable-frontend/` sur le port
4187 et vérifie navigation, cache, erreurs, clavier et affichage responsive.

```bash
pnpm exec playwright install chromium
pnpm run build:e2e
pnpm run test:e2e
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` permet d’utiliser un navigateur
système. Les rapports sont dans `playwright-report/` et `test-results/`.
Pour mesurer les performances, lancer `pnpm run preview:production`, puis :

```bash
pnpm run perf:measure http://127.0.0.1:4187/p2-angular-maintainable-frontend/ validation-artifacts/after
pnpm run perf:compare validation-artifacts/before validation-artifacts/after
```

Comparer des mesures réalisées dans les mêmes conditions. Voir
[Validation](docs/validation/VALIDATION.md) pour le protocole et ses limites.
La CI vérifie le code, génère Compodoc et teste le build de production avant de
livrer le même artefact sur GitHub Pages depuis `main`. Après publication, elle
contrôle le HTML, les données et le rendu de l’accueil et de la France.

## Repères et documentation

| Emplacement          | Contenu                                         |
| -------------------- | ----------------------------------------------- |
| `src/app/pages/`     | Deux pages et leurs calculs/modèles d’affichage |
| `src/app/services/`  | Chargement, validation et cache des données     |
| `src/app/olympics/`  | Indicateurs, feedback et intégration Chart.js   |
| `e2e/`               | Tests navigateur                                |
| `scripts/`           | Build, prévisualisation et mesures              |
| `.github/workflows/` | Validation et déploiement GitHub Actions        |
| `docs/`              | Guides et rapports de validation                |
| `doc/`               | Maquettes et rapports locaux                    |

```bash
pnpm run docs
pnpm run docs:serve
```

Compodoc génère `documentation/`, ignoré par Git. `docs:serve` régénère le site
et le sert sur <http://127.0.0.1:8080>. Les commentaires expliquent les contrats
et décisions utiles, sans objectif de couverture par symbole.

Voir l’[architecture](docs/architecture/architecture.md),
les [conventions de commentaires](docs/compodoc-conventions.md),
l’[index documentaire](docs/README.md) et les règles de
[contribution et de commits](CONTRIBUTING.md).
