# Architecture actuelle

Angular 21 standalone, zoneless et OnPush. Deux pages de statistiques partagent
les données et la présentation graphique, une route dédiée traite les URL inconnues.

## Données et états

`DataService` charge le JSON comme `unknown`, le valide puis partage la réponse.
Une réussite reste en mémoire pendant la session Angular, une erreur permet
une nouvelle tentative. Quitter une requête en cours l’annule si aucun autre
consommateur ne l’utilise. Le cache ne définit pas la fraîcheur d’une API évolutive.

La validation impose des identifiants uniques entre pays et, pour les participations,
au sein de chaque pays. Elle exige des entiers sûrs positifs pour
les ID/années et non négatifs pour les compteurs. Plusieurs participations de la
même année sont autorisées, sans conversion implicite des données.

Chaque fichier `*-view-model.ts` réunit les calculs purs, les données d’affichage
et l’union discriminée de sa page. Un signal privé publie un état en lecture seule.
Les variantes chargées portent leurs données, les erreurs et chargements n’en ont pas.
L’accueil compte les années distinctes et conserve l’ordre des pays, avec des
pourcentages arrondis à une décimale sans redistribution. Le détail trie une copie
stable des participations et cumule les effectifs sans dédupliquer les personnes.

## Navigation et présentation

Les URL utilisent le routage par chemin : `/` et `/country/:id`.
Les scripts de livraison génèrent une entrée HTML par pays du JSON et `404.html`
pour GitHub Pages, en conservant le chemin de base du build. Les fiches existantes
sont ainsi accessibles directement et après rechargement. La page de repli affiche
l’application pour les chemins absents avec un statut HTTP 404.
La route est la source du pays sélectionné. Un ID invalide est rejeté avant HTTP.
Un ID invalide ou un pays absent redirige vers `/not-found` en remplaçant l’entrée
d’historique. Un pays existant sans participation conserve sa fiche et ses compteurs
à zéro. `switchMap` conserve la dernière sélection et
les erreurs restent dans son flux interne pour permettre une nouvelle sélection.
Le titre du document suit l’état. Après les navigations suivantes, le composant
racine place le focus sur le titre de page une fois le rendu terminé, sans déplacer
le focus au premier affichage ni lors d’une navigation vers un fragment. Le titre
de la page 404 reste accessible avec Tab, sans recevoir le focus automatiquement.

Les pages orchestrent le chargement et la navigation. Les indicateurs utilisent
`kind` pour leur pictogramme et leur couleur. Le graphique reçoit seulement des
paires `{ label, value }` et, pour le camembert, émet un index que la page traduit en ID.
`ChartRenderer` isole Chart.js, les configurations et plugins gardent leurs fichiers
pour séparer rendu, dessin et interactions clavier. L’instance est détruite avant
remplacement et au retrait du composant.

Les styles suivent BEM. Le mixin `layout` de `_app-shell.scss` partage les dimensions
entre Angular et le HTML de chargement. Angular intègre le CSS critique au HTML,
les styles communs des pages sont inclus avec leurs composants pour éviter les
déplacements à l’arrivée de la feuille globale. L’accueil et son graphique sont
initiaux, la route pays est chargée à la demande et le rendu de son graphique reste différé.
Karma vérifie les contrats, Playwright les parcours sur le build de production.

Le workflow GitHub Actions orchestre les scripts de `.github/scripts/` pour préparer
l’artefact et vérifier la révision et les pages après publication. Playwright
sert le build testé et exécute les audits Lighthouse avec un seuil de 100 dans
les quatre catégories, à chaque passage en mobile et desktop. Le contrôle distant fait échouer le job en cas d’erreur,
sans annuler automatiquement la publication.

Les décisions détaillées concernent les [états](../decisions/001-page-state.md),
le [cache](../decisions/002-http-cache.md) et [Chart.js](../decisions/003-chart-boundary.md).
Voir [Validation](../validation/VALIDATION.md) pour les résultats datés et leurs limites.
