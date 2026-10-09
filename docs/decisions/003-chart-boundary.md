# Frontière avec Chart.js

Statut : appliqué — 9 octobre 2026.

Le composant graphique reçoit une collection d'éléments `{ label, value }`, le type
`pie` ou `line` et l'identifiant de sa description accessible. La sélection d'une
part est émise par index, la page retrouve l'identifiant dans ses lignes métier.
Les noms et valeurs restent ainsi associés même quand les données sont triées.

`ChartRenderer` est l'adaptateur de Chart.js : il crée l'instance et fournit seulement
`destroy` et `focusPoint`. Deux fonctions construisent les configurations du
camembert et de la courbe. Les plugins de dessin sont regroupés séparément.
Les variantes graphiques sans consommateur et l'option `dashboard` sont retirées.

Le composant utilise `afterRenderEffect` pour disposer du canvas. Son nettoyage
détruit l'ancienne instance avant remplacement et libère les ressources en quittant
la page. La navigation appartient aux pages, jamais aux plugins de dessin.

Le chargement différé, les préchargements existants et les interactions clavier
sont conservés. Le contrôle au lecteur d'écran reste une vérification humaine à
réaliser avant toute affirmation d'accessibilité complète.
