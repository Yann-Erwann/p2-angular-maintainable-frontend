# Documentation du projet

## Guides actuels

- [README](../README.md) : installation, commandes et comportement des pages.
- [Architecture](architecture/architecture.md) : responsabilités et contrats.
- [Commentaires Compodoc](compodoc-conventions.md) : règles de rédaction.
- [Contribution](../CONTRIBUTING.md) : conventions de code et de commits.

Les décisions détaillées expliquent les [états des pages](decisions/001-page-state.md),
le [cache HTTP](decisions/002-http-cache.md) et la [frontière Chart.js](decisions/003-chart-boundary.md).

## Rapports et historique

Ces documents conservent les constats de leurs dates de rédaction, les résultats
mesurés ne constituent pas une garantie pour toute révision ultérieure.

- [Validation](validation/VALIDATION.md), [accessibilité](validation/ACCESSIBILITY.md),
  [bundles](validation/BUNDLE-VALIDATION.md) et [interface](validation/UI-VALIDATION.md).
- [Migration Angular](migration/MIGRATION.md) et [notes d’architecture](architecture/notes-architecture.md).
- [Schéma modifiable](architecture/arborescence-cible.drawio), à comparer à l’architecture actuelle.

Les maquettes et rapports locaux sont dans `doc/`. Compodoc génère
`documentation/` avec `pnpm docs`, ce dossier n’est pas versionné.
