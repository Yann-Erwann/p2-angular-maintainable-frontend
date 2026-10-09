# Contrat du graphique

Le composant reçoit une collection de paires `{ label, value }`. Leur ordre définit
les index de sélection, la page retrouve le pays dans ses lignes du même ordre.
Le composant émet cet index et la page décide de la navigation.

## Utilisation

```html
<app-olympic-chart
  type="line"
  [items]="vm.chartItems"
  dataDescriptionId="participation-description"
/>
```

L'élément portant l'ID `participation-description` doit exister dans la page et
décrire les données. Les valeurs textuelles et les annonces complètent le canvas.

## Cycle de vie

`afterRenderEffect` crée le graphique lorsque le canvas est disponible. Son
nettoyage détruit l'instance précédente avant remplacement des entrées et libère
la dernière instance au retrait du composant. `ChartRenderer` masque l'API Chart.js.

## Clavier

| Touche          | Comportement                                                      |
| --------------- | ----------------------------------------------------------------- |
| Tab / Maj+Tab   | Parcourt les éléments, puis laisse sortir le focus aux extrémités |
| Flèches         | Parcourt les éléments avec retour à l'autre extrémité             |
| Home / End      | Sélectionne le premier ou le dernier élément                      |
| Entrée / Espace | Active le secteur choisi du camembert                             |
| Échap           | Retire la mise en évidence et l'infobulle                         |

L'entrée par Maj+Tab commence au dernier élément. La courbe ne déclenche aucune
navigation. Les raccourcis avec Alt, Ctrl ou Meta restent disponibles au navigateur.
