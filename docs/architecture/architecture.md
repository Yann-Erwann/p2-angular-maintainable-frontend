# Architecture actuelle

Angular 21 standalone, zoneless et OnPush. Deux pages de statistiques partagent
les données et la présentation graphique, une route dédiée traite les URL inconnues.

## Données et états

`DataService` charge le JSON comme `unknown`, le valide puis partage la réponse.
Une réussite reste en mémoire pendant la session Angular, une erreur permet
une nouvelle tentative. Quitter une requête en cours l’annule si aucun autre
consommateur ne l’utilise. Le cache ne définit pas la fraîcheur d’une API évolutive.

La validation impose des identifiants uniques, des entiers sûrs positifs pour
les ID/années et non négatifs pour les compteurs. Plusieurs participations de la
même année sont autorisées, sans conversion implicite des données.

Chaque fichier `*-view-model.ts` réunit les calculs purs, les données d’affichage
et l’union discriminée de sa page. Un signal privé publie un état en lecture seule.
Les variantes chargées portent leurs données, les erreurs et chargements n’en ont pas.
L’accueil compte les années distinctes et conserve l’ordre des pays, avec des
pourcentages arrondis à une décimale sans redistribution. Le détail trie une copie
stable des participations et cumule les effectifs sans dédupliquer les personnes.

## Navigation et présentation

Les URL utilisent le hash : `/#/` et `/#/country/:id`. La route est la source du
pays sélectionné. Un ID invalide est rejeté avant HTTP, un pays absent diffère
d’un pays sans participation. `switchMap` conserve la dernière sélection et
les erreurs restent dans son flux interne pour permettre une nouvelle sélection.
Le titre du document suit l’état, le composant racine gère le focus après navigation.

Les pages orchestrent le chargement et la navigation. Les indicateurs utilisent
`kind` pour leur pictogramme et leur couleur. Le graphique reçoit seulement des
paires `{ label, value }` et émet un index que la page traduit en ID.
`ChartRenderer` isole Chart.js, les configurations et plugins gardent leurs fichiers
pour séparer rendu, dessin et interactions clavier. L’instance est détruite avant
remplacement et au retrait du composant.

Les styles suivent BEM. Le mixin `app-shell` partage les dimensions entre Angular
et le HTML de chargement, le graphique d’accueil est initial et le rendu du détail reste différé.
Karma vérifie les contrats, Playwright les parcours sur le build de production.

Les décisions détaillées concernent les [états](../decisions/001-page-state.md),
le [cache](../decisions/002-http-cache.md) et [Chart.js](../decisions/003-chart-boundary.md).
Voir [Validation](../validation/VALIDATION.md) pour les résultats datés et leurs limites.
