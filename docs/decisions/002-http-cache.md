# Contrat de chargement et de cache

Statut : conservé et testé — 9 octobre 2026.

`DataService` charge un JSON statique en tant que contenu `unknown`, le valide,
traduit les erreurs en `DataLoadError` puis partage la réponse avec
`shareReplay({ bufferSize: 1, refCount: true })`.

Les consommateurs simultanés partagent une requête. Une réponse terminée avec
succès, y compris vide, reste disponible pendant la session Angular. Une erreur
HTTP ou de validation n'est pas mémorisée : une nouvelle souscription peut
réessayer. Si le dernier consommateur quitte une requête non terminée, elle est
annulée, une souscription ultérieure recommence le chargement.

Le cache ne constitue ni un stockage persistant ni une politique de fraîcheur
pour une API actualisable. Le rechargement de l'application crée une nouvelle
session. Les données sont déclarées en lecture seule et les fonctions de calcul
travaillent sur des copies lorsque l'ordre doit changer.

La sélection d'un pays est faite à partir de la collection pour alimenter aussi
le sélecteur. L'ancienne méthode `getCountryById` a donc été supprimée.
