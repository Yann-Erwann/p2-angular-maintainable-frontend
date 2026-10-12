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
l’application en développement et en production. Le workflow prépare une copie
locale de l’artefact pour les tests Playwright des navigations directes d’une SPA.
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
cache de Cloudflare Pages sont déterminés par le déploiement et ne sont pas définis
par `serve.json`.
`build:analyze` ajoute les source maps et `stats.json` pour examiner les bundles.
Relancer `pnpm run build` pour retrouver un build sans source maps.

Le routage utilise des URL sans `#`.
Le build publié sur Cloudflare Pages utilise `/` comme chemin de base. Le pipeline
vérifie cet artefact, puis contrôle les routes Angular et les ressources après
publication.

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
Le canvas est un unique stop de tabulation. Les flèches explorent ses points,
Home et End atteignent le premier ou le dernier point, puis Tab ou Maj+Tab sort
du graphique. Entrée ou Espace ouvre le pays sélectionné dans le camembert.
Les valeurs sont aussi fournies comme alternative textuelle accessible.

Dans le filtre, Entrée ou Espace ouvre ou sélectionne, Tab parcourt les options,
Échap ou un clic extérieur ferme le popover. Le bouton est désactivé au chargement.
Ces parcours sont testés automatiquement, la lecture avec des technologies
d’assistance reste à vérifier humainement.

## Tests navigateur et performances

Le workflow prépare une copie locale de l’artefact de production et démarre le
serveur à la racine (`/`) sur le port 4187 avec Playwright pour les tests navigateur
du build avant publication.
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

Pour ouvrir le rapport HTML en local après une exécution :

```bash
pnpm exec playwright show-report playwright-report
```

Le rapport est alors disponible sur <http://localhost:9323>. Arrêter le serveur
avec `Ctrl+C`.

Les tests `e2e/lighthouse.spec.ts` lancent Chromium avec Playwright et exécutent
Lighthouse sur l’accueil et chaque pays du JSON livré, en mobile et desktop.
Localement, trois passages sont exécutés par défaut ; chaque catégorie
(performance, accessibilité, bonnes pratiques et SEO) doit atteindre au moins 97
à chaque passage. En CI, un seul passage est utilisé pour réduire la durée du
pipeline ; une exécution manuelle avec l’option `full_lighthouse` réactive les
trois passages. Chaque score inférieur à 97, score absent ou erreur fait échouer
les tests et bloque le déploiement. Les rapports JSON et HTML sont joints au
rapport Playwright. Les rapports des tests du build sont conservés dans
`validation-reports`. Le Lighthouse est exécuté sur l’artefact candidat avant
son upload et son déploiement.
Les routes inconnues et la page `not-found` restent couvertes par les tests
fonctionnels.

Pour exécuter uniquement Lighthouse sur le build local :

```bash
pnpm run test:e2e --project=lighthouse
```

Playwright démarre automatiquement le serveur local si `PRODUCTION_SERVER_URL`
n’est pas renseigné. Les rapports locaux sont disponibles dans
`playwright-report/` et `test-results/`.

La CI vérifie le code, génère Compodoc, teste le build de production à la racine
avec Playwright et exécute Lighthouse sur l’artefact candidat avant de le livrer
sur Cloudflare Pages depuis `main`. Un échec Lighthouse empêche donc l’upload de
l’artefact et le job de déploiement. Le site publié est accessible sur
<https://p2-angular-maintainable-frontend.pages.dev/>. Après publication, elle
rejoue uniquement la vérification de navigation, du HTML, des données, des
ressources et des erreurs JavaScript, puis parcourt l’accueil et la France avec
rechargement direct et retour à l’accueil. Les diagnostics sont conservés 14
jours. Un contrôle post-publication échoué fait échouer le job, mais le site déjà
publié reste en ligne : corriger ou rétablir la version précédente par un nouveau
commit.

## Repères et documentation

| Emplacement                  | Contenu                                               |
| ---------------------------- | ----------------------------------------------------- |
| `src/app/olympics/pages/`    | Pages et leurs calculs/modèles d’affichage            |
| `src/app/olympics/services/` | Chargement, validation et cache des données           |
| `src/app/olympics/`          | Domaine, routes, UI et intégration Chart.js           |
| `e2e/`                       | Tests navigateur                                      |
| `.github/workflows/`         | Étapes de validation et de déploiement GitHub Actions |
| `docs/`                      | Architecture et décisions techniques                  |

Le dossier `src/app/olympics/ui/` est un UI kit local à la fonctionnalité, et non
un design system indépendant. Son périmètre et ses limites sont décrits dans
la [documentation d’architecture](docs/architecture/architecture.md).

```bash
pnpm run docs
pnpm run docs:serve
```

Compodoc génère `documentation/`, ignoré par Git et conservé comme artefact CI.
`docs:serve` régénère le site et le sert sur <http://127.0.0.1:8080>. Les commentaires
expliquent les contrats et décisions utiles, sans objectif de couverture par symbole.

Voir l’[architecture](docs/architecture/architecture.md),
la [note d’architecture](docs/architecture/notes-architecture.md),
les [décisions d’architecture](docs/decisions/001-page-state.md),
le [cache HTTP](docs/decisions/002-http-cache.md),
la [frontière Chart.js](docs/decisions/003-chart-boundary.md) et les règles de
[contribution et de commits](CONTRIBUTING.md).
