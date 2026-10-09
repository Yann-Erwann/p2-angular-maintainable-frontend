# Réduction du bundle Chart.js

## Chargement Angular natif et mesures Lighthouse

Le 9 octobre 2026, la solution finale utilise Angular CLI directement, une
page d’accueil incluse au démarrage et un détail chargé avec `loadComponent`.
Les graphiques utilisent `@defer (on viewport; prefetch when state.status === 'loading' || state.status === 'success')`.
Le téléchargement de Chart.js commence pendant la requête des données ; le
graphique est créé après une réponse valide et lorsqu’il devient visible.
Les scripts personnalisés de post-traitement du build ont été retirés ; le
préchargement utilise Angular et les liens HTML décrits dans le README.
La légende et les infobulles Chart.js restent enregistrées. Les composants
utilisent `OnPush`, l’application est zoneless et les animations initiales des
graphiques sont désactivées. Zone.js reste disponible pour les tests.

Les mesures utilisent le build de production servi par `pnpm run preview`,
Lighthouse 13.5.0 et Chromium 154, profil mobile et ralentissement simulé par
défaut. Lighthouse réinitialise le cache avant la navigation.

| Mesure | Accueil | `/country/1` |
| --- | ---: | ---: |
| Performance | 98/100 | 100/100 |
| FCP | 1,4 s | 0,8 s |
| LCP | 2,2 s | 0,9 s |
| TBT | 100 ms | 40 ms |

La chaîne critique maximale du détail est de 163 ms sur ce poste. Les scores
varient avec la machine et le déroulement de la mesure. Les précédents scores
à 100 obtenus avec des scripts de préchargement ne décrivent pas cette version.
Lighthouse signale encore environ 38 Kio de JavaScript inutilisé sur l’accueil
et 27 Kio sur le détail, dans le module Chart.js : ces diagnostics ne sont pas
notés. La couverture d’une seule page ne justifie pas de retirer les contrôleurs
ou plugins nécessaires aux autres usages.

Validation de production : réponse JSON volontairement suspendue, module du
graphique téléchargé avant la réponse, aucun canvas créé avant les données,
puis graphique affiché après reprise, avec une seule requête JSON et aucune
erreur JavaScript. Un accès à `/country/invalid` affiche l’erreur sans appel
HTTP de DataService ; le préchargement HTML du JSON reste actif.
Le signalement des erreurs de bootstrap reste présent dans `main.ts`.
Lint, compilation TypeScript des specs, 159 tests et build vérifient également
la légende, les infobulles, les données immuables et la destruction des graphiques.

Les mesures historiques ci-dessous décrivent les versions antérieures.

Comparaison du 9 octobre 2026 à partir de `fecc2fb`, avant et après
remplacement de `chart.js/auto` par un enregistrement sélectif. Les versions,
les budgets Angular et les autres paramètres du build restent identiques.

Commande : `pnpm exec ng build --stats-json`, configuration production par défaut.
Les contributions proviennent de `stats.json`, champ `bytesInOutput` des
modules Chart.js dans le fichier main ; les tailles sont des octets bruts.

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Bundle initial, sortie Angular | 501,40 kB | 470,08 kB |
| Transfert estimé du bundle initial, sortie Angular | 142,01 kB | 133,91 kB |
| Fichier main | 464 658 octets | 433 338 octets |
| Contribution Chart.js au fichier main | 197 022 octets | 165 707 octets |

Gain brut initial : 31,32 kB, environ 6,25 %. Le build ne déclenche plus
l’avertissement de 500 kB. Les légendes, infobulles, interactions, responsive
et destruction des instances sont conservés. Aucun chargement différé ni cache
HTTP n’est ajouté par cette modification.

Validation : 152 tests ChromeHeadless réussis, lint et compilation TypeScript
des specs sans erreur. Les tests importent désormais `Chart` depuis `chart.js`
pour éviter que l’enregistrement automatique masque un composant manquant.
Ces mesures portent sur le build ; elles ne mesurent pas une durée réelle en 3G.

## Mutualisation des données et évaluation du découpage des routes

Après l’enregistrement sélectif, un parcours Chromium de production, cache
navigateur désactivé, effectue `/` → détail → `/` → détail → `/` en cliquant
les liens. Avant mutualisation : 5 requêtes JSON ; après : 1. Aucun autre
provider de DataService ne recrée le service fourni à la racine.

`shareReplay({ bufferSize: 1, refCount: true })` partage la requête en cours
et conserve la réponse validée terminée pour la durée de vie de l’application.
Le cache est uniquement en mémoire : un rechargement de page demande le JSON
à nouveau. Si tous les consommateurs se désabonnent avant la réponse, la
requête est annulée ; une prochaine souscription relance le chargement.
Une erreur HTTP ou de validation n’est pas conservée. Aucun TTL, polling ou
stockage persistant n’est introduit pour cet asset statique.

Le chargement différé du détail a été évalué puis retiré : 469,12 kB initiaux,
mais 134,70 kB de transfert estimé et un chunk de 3,87 kB à la première visite.
Il ajoutait une requête sans gain suffisant sur ce petit projet et ses dépendances
partagées. Le build final, cache inclus et routes directes conservées, mesure
471,97 kB initiaux et 134,42 kB de transfert estimé, sans avertissement de budget.

Validation finale : 158 tests ChromeHeadless passent, dont partage concurrent,
annulation au départ du dernier consommateur, cache des collections vides,
reprise après erreurs HTTP et de validation, navigation, titres et focus.
Le parcours de production conserve les deux requêtes JavaScript initiales et
ne déclenche aucune exception navigateur. Le serveur local utilisé ne compresse
pas les réponses ; les mesures réseau ne représentent pas un hébergement réel.

Contrôle réseau simulé du build final : 400 kbit/s et 400 ms de latence,
cache navigateur désactivé, serveur local sans compression. Le canvas initial
est présent après 10,83 s, dont 9,89 s pour le fichier main ; le JSON prend
0,45 s et n’est chargé qu’une fois sur le parcours de cinq pages. Aucune
exception navigateur. Il s’agit d’une seule exécution et de la présence du
canvas, pas d’un score Lighthouse ni d’une mesure de dessin final.
Ces résultats confirment la limite du débit au premier chargement ; la
compression gzip/Brotli et le cache des assets versionnés devront être
vérifiés sur l’hébergement cible pour mesurer le temps réellement livré.

## Chargement des graphiques à leur entrée dans la zone visible

Après `bf14693`, les deux pages placent le composant graphique dans
`@defer (on viewport)`. Les données, indicateurs et liens du tableau se
chargent indépendamment de Chart.js. Un emplacement gris conserve la hauteur
attendue ; un statut annonce le chargement du chunk et une erreur visible
renvoie aux données du tableau si celui-ci échoue. Aucun changement d’URL.

Build : 471,97 → 307,13 kB initiaux ; transfert estimé initial
134,42 → 86,19 kB. Le chunk graphique partagé mesure 174,94 kB bruts
(53,56 kB de transfert estimé) et se charge une seule fois à sa première
utilisation. Le total initial + différé augmente légèrement à cause du
découpage et du mécanisme de déclenchement ; le bénéfice porte sur le chemin
critique d’affichage, pas sur une suppression de la bibliothèque.

Lighthouse 13.5.0, profil mobile par défaut, Chromium local, serveur de
production sans compression, une mesure avant et une mesure finale :

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Score performance | 79 | 83 |
| Premier affichage (FCP) | 3,2 s | 2,5 s |
| Plus grand affichage (LCP) | 3,7 s | 3,7 s |
| Blocage total (TBT) | 230 ms | 200 ms |
| Déplacement de mise en page (CLS) | 0 | 0 |
| JavaScript inutilisé estimé | 178 KiB | 178 KiB |

L’alerte ne disparaît pas si le graphique est visible pendant l’audit : le
chunk est alors chargé et son code non exécuté au cours de ce scénario est
comptabilisé. La valeur locale diffère des 149 KiB signalés par l’utilisateur ;
le serveur local ne compresse pas ses réponses. Ces mesures uniques ne
constituent pas un gain garanti sur chaque exécution ou hébergement.

À 320 × 400 px, un contrôle Chromium confirme que les cinq lignes et les liens
du tableau sont présents sans canvas ni requête du chunk graphique. Le
défilement jusqu’à son emplacement charge le chunk et affiche le canvas sans
débordement horizontal. Les tests rendent explicitement les blocs différés
pour vérifier les calculs, la navigation et la destruction des graphiques ;
un test supplémentaire couvre le tableau avant le graphique et le message
d’erreur de chargement. 159 tests, lint et TypeScript des specs passent.

## Cache HTTP des visites répétées

`serve.json` configure le serveur de prévisualisation :

- JS/CSS Angular nommés `main`, `polyfills`, `styles` ou `chunk`, avec un hash
  de huit caractères : `public, max-age=31536000, immutable`.
- HTML, JSON et autres fichiers sans version dans leur nom : `no-cache`,
  avec revalidation ETag. Les réponses peuvent être conservées mais doivent
  être validées avant réutilisation ; le HTML ne reste pas figé pendant un an.

Le script `pnpm run preview` charge explicitement cette configuration et garde
le repli SPA. Contrôles HTTP réels sur les cinq JS/CSS produits par le build,
`/`, `/index.html`, `/country/1`, le JSON et le favicon : en-têtes attendus sur
les réponses 200, ETag présents et réponse 304 aux requêtes conditionnelles.
Le repli `/country/1` retourne bien le HTML de l’application.

Chromium, cache activé, deux visites complètes `/` puis `/country/1` : les
cinq JS/CSS de la deuxième page affichent `transferSize = 0`, avec un graphique
rendu. Le JSON est revalidé. Décocher **Disable cache** pour reproduire cette
mesure ; elle est distincte du cache en mémoire de DataService.

Ces règles sont celles de `serve`, pas une configuration du serveur Angular
de développement ou d’un hébergement externe. Le serveur/CDN de production
doit appliquer la même politique aux ressources effectivement servies.
Référence : [configuration des en-têtes de serve-handler](https://github.com/vercel/serve-handler#headers-array).
