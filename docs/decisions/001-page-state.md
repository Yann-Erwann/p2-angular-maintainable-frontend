# États de page et modèles d'affichage

Statut : appliqué — 9 octobre 2026.

Les pages ont des besoins différents : un accueil peut avoir une collection vide,
un détail peut désigner un pays absent ou un pays existant sans participations.
Chaque page utilise donc une union discriminée propre. Les variantes chargées
portent obligatoirement leur modèle d'affichage, les autres n'ont pas de données.

Un signal privé est la seule source modifiable. Le template reçoit sa vue en lecture
seule et utilise un alias local. Les modèles sont préparés par des fonctions pures.
Les compteurs, options de sélection et éléments graphiques sont remplacés ensemble.
Le composant de feedback reçoit seulement un statut et un éventuel message.

RxJS compose les événements de route et le chargement. `switchMap` abandonne le
chargement précédent, `catchError` reste dans le flux interne pour permettre une
nouvelle sélection après une erreur. Le composant met à jour le titre du document
avec le même état que la vue et libère l'abonnement à sa destruction.

Un store global et une façade supplémentaire n'apportent pas de responsabilité
nécessaire pour ces deux pages. Ils ne sont pas introduits. Une nouvelle page
peut définir son propre contrat sans étendre un état générique pour toutes les vues.
