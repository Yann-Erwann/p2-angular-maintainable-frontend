# Documentation du projet

Les chemins des commandes et des exemples de code sont relatifs à la racine du dépôt.

| Sujet                   | Document                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture actuelle   | [Architecture](architecture/architecture.md)                                                                                                           |
| Décisions techniques    | [États des pages](decisions/001-page-state.md), [cache HTTP](decisions/002-http-cache.md), [frontière des graphiques](decisions/003-chart-boundary.md) |
| Schéma modifiable       | [Arborescence cible](architecture/arborescence-cible.drawio)                                                                                           |
| Analyse historique      | [Notes d’architecture](architecture/notes-architecture.md)                                                                                             |
| Migration Angular       | [Migration](migration/MIGRATION.md)                                                                                                                    |
| Vérifications actuelles | [Validation](validation/VALIDATION.md)                                                                                                                 |
| Accessibilité           | [Revue d’accessibilité](validation/ACCESSIBILITY.md)                                                                                                   |
| Bundles et performances | [Validation des bundles](validation/BUNDLE-VALIDATION.md)                                                                                              |
| Interface et responsive | [Validation UI](validation/UI-VALIDATION.md)                                                                                                           |
| Commentaires Compodoc   | [Conventions](compodoc-conventions.md)                                                                                                                 |

Les maquettes et les rapports Lighthouse locaux restent dans `doc/`.
La documentation Compodoc est générée dans `documentation/` avec `pnpm docs`.
Les règles de contribution restent dans [CONTRIBUTING.md](../CONTRIBUTING.md).
