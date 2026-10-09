# Architecture implémentée — Olympic Games / TéléSport

État courant : 9 octobre 2026. Application Angular 21 standalone, zoneless et
OnPush, données locales, deux pages de statistiques et une page inconnue.

## Parcours des données

```text
JSON HTTP → validation → cache DataService
                        ↓
              calculs métier purs
                        ↓
              modèle d'affichage
                        ↓
          état de page → template
                        ↓
         composant graphique → ChartRenderer → Chart.js
```

`models/olympic.ts` décrit des pays et participations en lecture seule.
`services/olympic-data.validator.ts` vérifie le contenu externe à l'exécution.
Les identifiants et années sont des entiers positifs sûrs, les médailles et
effectifs sont des entiers sûrs non négatifs. Les identifiants de pays sont uniques
et ceux des participations sont uniques au sein du pays. Plusieurs participations
de la même année sont autorisées, aucune conversion implicite n'est effectuée.

## Calculs et présentation

`summarizeCountry` trie une copie par année de manière stable et calcule le nombre
de participations, les médailles et les effectifs cumulés. `summarizeOlympics`
conserve l'ordre des pays, compte les années distinctes et fournit les lignes
`{ id, name, medals, percentage }`. Les pourcentages portent sur les pays du fichier,
sont arrondis à une décimale et restent à zéro lorsque le total est nul.

Les fichiers `*-view-model.ts` ajoutent les couleurs, drapeaux, indicateurs et
éléments `{ label, value }` attendus par la présentation. Ils définissent les états
propres à chaque page. Chaque état chargé porte toutes les données nécessaires.
Le feedback utilise un contrat sans données métier. `Indicator.kind` détermine
le pictogramme et la couleur, indépendamment de la position de la carte.

## Pages et navigation

`HomeComponent` charge la collection et transforme les sélections par index en
navigation par ID. `CountryComponent` observe les paramètres de route et sélectionne
le pays dans la collection, qui alimente aussi le sélecteur. Un ID invalide est
rejeté avant toute demande de données. Un pays absent diffère d'un chargement échoué.
Un pays sans participations conserve son identité et ses compteurs à zéro.

Les URL sont `/#/`, `/#/country/:id` et `/#/not-found`, les routes inconnues ont
leur page dédiée. `switchMap` conserve le dernier pays demandé et
`takeUntilDestroyed` libère les abonnements. Le titre du document suit le même état
que le contenu. Le composant racine gère le shell et le focus après navigation.

## Graphiques et styles

`OlympicChartComponent` possède son canvas et ses interactions. `ChartRenderer`
isole Chart.js et fournit la destruction ainsi que la mise en évidence d'un point.
Les configurations pie/line et les plugins de dessin sont séparés. Le graphique
reste différé et son instance est libérée avant remplacement ou retrait.

Les pages, indicateurs et graphiques possèdent leurs styles. Les règles globales
concernent les bases, utilitaires partagés et variables CSS. Le mixin `app-shell`
partage les dimensions du shell entre le composant racine et le HTML de chargement
avant le démarrage Angular, afin de préserver le premier rendu.

## Vérification et livraison

Karma/Jasmine vérifie les contrats, les calculs, les pages et les graphiques.
Playwright vérifie les parcours sur le build de production servi sous le préfixe
GitHub Pages. La CI contrôle formatage, lint, types, tests, documentation et build
avant de déployer le même artefact depuis `main`.

Les décisions sont décrites dans [docs/decisions](../decisions/001-page-state.md).
Le protocole et les résultats locaux figurent dans [VALIDATION.md](../validation/VALIDATION.md).
Les anciens constats de migration restent dans `docs/architecture/notes-architecture.md` avec un
statut historique, ils ne décrivent pas l'implémentation actuelle.
